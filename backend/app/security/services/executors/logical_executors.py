from typing import Dict, Any, Tuple, Optional
from app.security.models.mitigation_action import MitigationAction
from app.security.services.executors.base_executor import BaseExecutor

class AllowExecutor(BaseExecutor):
    def __init__(self):
        super().__init__("AllowExecutor (Logical)")
        
    async def execute(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, "ACTIVE", "Logical state updated to ACTIVE. No restrictive mitigation applied."
        
    async def rollback(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return False, current_node_state.get("currentState", "ACTIVE"), "Rollback not applicable for ALLOW actions."

class MonitorExecutor(BaseExecutor):
    def __init__(self):
        super().__init__("MonitorExecutor (Logical)")
        
    async def execute(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, "MONITORED", "Logical state updated to MONITORED. Node is under observation."
        
    async def rollback(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, action.previousState or "ACTIVE", "Node monitoring removed."

class WarnExecutor(BaseExecutor):
    def __init__(self):
        super().__init__("WarnExecutor (Logical)")
        
    async def execute(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, "WARNED", "Logical state updated to WARNED. Security warning recorded."
        
    async def rollback(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, action.previousState or "ACTIVE", "Warning state cleared."

class RateLimitExecutor(BaseExecutor):
    def __init__(self):
        super().__init__("RateLimitExecutor (Logical/Prototype)")
        
    async def execute(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, "RATE_LIMITED", "PROTOTYPE ENFORCEMENT: Node logically rate-limited."
        
    async def rollback(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, action.previousState or "ACTIVE", "Node logical rate-limit removed."

class QuarantineExecutor(BaseExecutor):
    def __init__(self):
        super().__init__("QuarantineExecutor (Logical/Prototype)")
        
    async def execute(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, "QUARANTINED", "PROTOTYPE ENFORCEMENT: Node placed in logical quarantine state."
        
    async def rollback(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, action.previousState or "ACTIVE", "Node released from logical quarantine."

class BlockExecutor(BaseExecutor):
    def __init__(self):
        super().__init__("BlockExecutor (Logical/Prototype)")
        
    async def execute(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        # Validation: Cannot block if already blocked
        if current_node_state.get("currentState") == "BLOCKED":
            return False, "BLOCKED", "Node is already in BLOCKED state."
            
        return True, "BLOCKED", "PROTOTYPE ENFORCEMENT: Node logically BLOCKED from network."
        
    async def rollback(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        return True, action.previousState or "ACTIVE", "Node UNBLOCKED logically."

# Registry map for easy lookup
EXECUTOR_REGISTRY = {
    "ALLOW": AllowExecutor(),
    "MONITOR": MonitorExecutor(),
    "WARN": WarnExecutor(),
    "RATE_LIMIT": RateLimitExecutor(),
    "QUARANTINE": QuarantineExecutor(),
    "BLOCK": BlockExecutor()
}
