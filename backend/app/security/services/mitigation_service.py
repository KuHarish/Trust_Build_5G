import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.security.models.mitigation_action import MitigationAction
from app.security.models.security_decision import SecurityDecision
from app.security.models.node_security_state import NodeSecurityState
from app.security.repositories.security_repository import security_repository
from app.security.services.audit_service import audit_service
from app.security.services.executors.logical_executors import EXECUTOR_REGISTRY

logger = logging.getLogger("trustchain.security.mitigation")

class MitigationService:
    async def request_mitigation(self, decision: SecurityDecision, correlation_id: str) -> Optional[MitigationAction]:
        """Create a new mitigation action from a security decision."""
        
        # Idempotency check - do we already have an action for this decision?
        existing = await security_repository.get_action_for_decision(decision.decisionId)
        if existing:
            logger.debug(f"Action already requested for decision {decision.decisionId}")
            return existing

        action = MitigationAction(
            nodeId=decision.nodeId,
            decisionId=decision.decisionId,
            decision=decision.decision,
            correlationId=correlation_id,
            status="PENDING",
            executorType=EXECUTOR_REGISTRY.get(decision.decision).__class__.__name__ if EXECUTOR_REGISTRY.get(decision.decision) else "Unknown"
        )
        await security_repository.create_action(action)
        
        # Log to audit service
        try:
            await audit_service.log_security_event({
                "eventType": "MITIGATION_REQUESTED",
                "correlationId": action.correlationId,
                "nodeId": action.nodeId,
                "sourceModule": "MitigationService",
                "actionId": action.actionId,
                "decisionId": action.decisionId,
                "mitigationAction": action.decision,
            })
        except Exception as e:
            logger.error(f"Audit log failed: {e}")

        # Mark decision as mitigated
        decision.isMitigated = True
        doc = decision.model_dump()
        await security_repository.decisions_collection.update_one(
            {"_id": decision.decisionId},
            {"$set": doc}
        )
        
        return action

    async def _update_node_state(self, node_id: str, new_state: str, action: MitigationAction, result_msg: str):
        """Update node state and log audit."""
        current = await security_repository.get_node_state(node_id)
        prev_state = current.get("currentState", "ACTIVE") if current else "ACTIVE"
        
        state_obj = NodeSecurityState(
            nodeId=node_id,
            currentState=new_state,
            previousState=prev_state,
            sourceDecisionId=action.decisionId,
            sourceActionId=action.actionId,
            reason=result_msg
        )
        await security_repository.update_node_state(state_obj.model_dump())
        
        if prev_state != new_state:
            try:
                await audit_service.log_security_event({
                    "eventType": "NODE_SECURITY_STATE_CHANGE",
                    "correlationId": action.correlationId,
                    "nodeId": node_id,
                    "sourceModule": "MitigationService",
                    "previousSecurityState": prev_state,
                    "newSecurityState": new_state,
                    "actionId": action.actionId,
                    "reason": result_msg
                })
            except Exception as e:
                logger.error(f"Audit log failed: {e}")
        
        return prev_state

    async def execute_mitigation(self, action: MitigationAction):
        """Execute mitigation using the executor abstraction with state tracking and retries."""
        if action.status not in ["PENDING", "FAILED"]:
            logger.warning(f"Invalid transition. Cannot execute action {action.actionId} in state {action.status}")
            return

        executor = EXECUTOR_REGISTRY.get(action.decision)
        if not executor:
            action.status = "FAILED"
            action.errorInformation = f"Unsupported decision type: {action.decision}"
            await security_repository.update_action(action)
            return

        # State transition: IN_PROGRESS
        action.status = "IN_PROGRESS"
        action.startedAt = datetime.now(timezone.utc)
        action.executionAttempts += 1
        await security_repository.update_action(action)
        
        try:
            await audit_service.log_security_event({
                "eventType": "MITIGATION_STARTED",
                "correlationId": action.correlationId,
                "nodeId": action.nodeId,
                "sourceModule": "MitigationService",
                "actionId": action.actionId,
                "mitigationAction": action.decision,
                "reason": f"Attempt {action.executionAttempts}"
            })
        except Exception:
            pass

        # Execute with timeout
        try:
            current_state_dict = await security_repository.get_node_state(action.nodeId) or {}
            
            # Using asyncio.wait_for for timeout
            success, new_state, msg = await asyncio.wait_for(
                executor.execute(action, current_state_dict),
                timeout=action.timeoutSeconds
            )
            
            if success:
                # Update node state
                prev_state = await self._update_node_state(action.nodeId, new_state, action, msg)
                
                # Update action
                action.status = "COMPLETED"
                action.result = msg
                action.previousState = prev_state
                action.resultingState = new_state
                action.completedAt = datetime.now(timezone.utc)
                
                try:
                    await audit_service.log_security_event({
                        "eventType": "MITIGATION_COMPLETED",
                        "correlationId": action.correlationId,
                        "nodeId": action.nodeId,
                        "sourceModule": "MitigationService",
                        "actionId": action.actionId,
                        "mitigationAction": action.decision,
                        "result": action.result
                    })
                except Exception: pass
            else:
                raise Exception(msg)
                
        except asyncio.TimeoutError:
            action.status = "FAILED"
            action.errorInformation = f"Execution timed out after {action.timeoutSeconds}s"
            await self._handle_failure(action)
        except Exception as e:
            action.status = "FAILED"
            action.errorInformation = str(e)
            await self._handle_failure(action)

        await security_repository.update_action(action)

    async def _handle_failure(self, action: MitigationAction):
        """Handle retry logic if execution fails."""
        try:
            await audit_service.log_security_event({
                "eventType": "MITIGATION_FAILED",
                "correlationId": action.correlationId,
                "nodeId": action.nodeId,
                "sourceModule": "MitigationService",
                "actionId": action.actionId,
                "mitigationAction": action.decision,
                "errorInformation": action.errorInformation
            })
        except Exception: pass

        if action.executionAttempts < action.maxRetries:
            logger.info(f"Retrying mitigation {action.actionId} (Attempt {action.executionAttempts + 1}/{action.maxRetries})")
            # In a real system, you'd use a background queue with delay. Here we recursively schedule it.
            await asyncio.sleep(2)
            await self.execute_mitigation(action)

    async def request_rollback(self, action_id: str) -> bool:
        """Request and execute a rollback of a completed action."""
        action = await security_repository.get_action(action_id)
        if not action:
            return False
            
        if action.status != "COMPLETED":
            raise ValueError(f"Cannot rollback action in state {action.status}")

        executor = EXECUTOR_REGISTRY.get(action.decision)
        if not executor:
            return False

        action.status = "ROLLBACK_IN_PROGRESS"
        await security_repository.update_action(action)
        
        try:
            await audit_service.log_security_event({
                "eventType": "MITIGATION_ROLLBACK_REQUESTED",
                "correlationId": action.correlationId,
                "nodeId": action.nodeId,
                "sourceModule": "MitigationService",
                "actionId": action.actionId,
                "mitigationAction": action.decision
            })
        except Exception: pass

        try:
            current_state_dict = await security_repository.get_node_state(action.nodeId) or {}
            success, new_state, msg = await asyncio.wait_for(
                executor.rollback(action, current_state_dict),
                timeout=action.timeoutSeconds
            )
            
            if success:
                prev = await self._update_node_state(action.nodeId, new_state, action, msg)
                action.status = "ROLLED_BACK"
                action.rollbackState = new_state
                action.result = f"Rollback successful: {msg}"
                
                try:
                    await audit_service.log_security_event({
                        "eventType": "MITIGATION_ROLLED_BACK",
                        "correlationId": action.correlationId,
                        "nodeId": action.nodeId,
                        "sourceModule": "MitigationService",
                        "actionId": action.actionId,
                        "mitigationAction": action.decision,
                        "result": action.result
                    })
                except Exception: pass
            else:
                raise Exception(msg)
                
        except Exception as e:
            action.status = "ROLLBACK_FAILED"
            action.errorInformation = str(e)

        await security_repository.update_action(action)
        return action.status == "ROLLED_BACK"

mitigation_service = MitigationService()
