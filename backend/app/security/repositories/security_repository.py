import logging
from typing import List, Optional
from app.database.client import Database
from app.security.models.security_decision import SecurityDecision
from app.security.models.mitigation_action import MitigationAction
from app.security.models.security_policy import SecurityPolicy

logger = logging.getLogger("trustchain.security.repository")

class SecurityRepository:
    def __init__(self):
        # We access the collections dynamically to ensure DB is connected
        pass

    @property
    def db(self):
        return Database.get_db()

    @property
    def decisions_collection(self):
        return self.db["security_decisions"]

    @property
    def actions_collection(self):
        return self.db["mitigation_actions"]

    @property
    def policies_collection(self):
        return self.db["security_policies"]
        
    @property
    def node_states_collection(self):
        return self.db["node_security_states"]

    # ==================
    # Decisions
    # ==================
    async def create_decision(self, decision: SecurityDecision) -> str:
        doc = decision.model_dump()
        doc["_id"] = decision.decisionId
        await self.decisions_collection.insert_one(doc)
        return decision.decisionId

    async def get_recent_decisions(self, limit: int = 50) -> List[SecurityDecision]:
        cursor = self.decisions_collection.find({}).sort("createdAt", -1).limit(limit)
        decisions = []
        async for doc in cursor:
            decisions.append(SecurityDecision(**doc))
        return decisions
        
    async def get_decisions_by_node(self, node_id: str, limit: int = 20) -> List[SecurityDecision]:
        cursor = self.decisions_collection.find({"nodeId": node_id}).sort("createdAt", -1).limit(limit)
        decisions = []
        async for doc in cursor:
            decisions.append(SecurityDecision(**doc))
        return decisions

    # ==================
    # Mitigation Actions
    # ==================
    async def create_action(self, action: MitigationAction) -> str:
        doc = action.model_dump()
        doc["_id"] = action.actionId
        await self.actions_collection.insert_one(doc)
        return action.actionId

    async def update_action(self, action: MitigationAction):
        doc = action.model_dump()
        await self.actions_collection.update_one(
            {"_id": action.actionId},
            {"$set": doc}
        )
        
    async def get_action(self, action_id: str) -> Optional[MitigationAction]:
        doc = await self.actions_collection.find_one({"_id": action_id})
        if doc:
            return MitigationAction(**doc)
        return None

    async def get_recent_actions(self, limit: int = 50) -> List[MitigationAction]:
        cursor = self.actions_collection.find({}).sort("requestedAt", -1).limit(limit)
        actions = []
        async for doc in cursor:
            actions.append(MitigationAction(**doc))
        return actions

    async def get_actions_by_node(self, node_id: str, limit: int = 20) -> List[MitigationAction]:
        cursor = self.actions_collection.find({"nodeId": node_id}).sort("requestedAt", -1).limit(limit)
        actions = []
        async for doc in cursor:
            actions.append(MitigationAction(**doc))
        return actions
        
    async def get_action_for_decision(self, decision_id: str) -> Optional[MitigationAction]:
        doc = await self.actions_collection.find_one({"decisionId": decision_id})
        if doc:
            return MitigationAction(**doc)
        return None

    # ==================
    # Node Security States
    # ==================
    async def update_node_state(self, state_dict: dict) -> str:
        """Upsert the current node security state."""
        await self.node_states_collection.update_one(
            {"nodeId": state_dict["nodeId"]},
            {"$set": state_dict},
            upsert=True
        )
        return state_dict["nodeId"]

    async def get_node_state(self, node_id: str) -> Optional[dict]:
        return await self.node_states_collection.find_one({"nodeId": node_id})
        
    async def get_all_node_states(self) -> List[dict]:
        cursor = self.node_states_collection.find({})
        states = []
        async for doc in cursor:
            states.append(doc)
        return states

    # ==================
    # Policies
    # ==================
    async def create_policy(self, policy: SecurityPolicy) -> str:
        doc = policy.model_dump()
        doc["_id"] = policy.policyId
        await self.policies_collection.insert_one(doc)
        return policy.policyId
        
    async def save_policy(self, policy: SecurityPolicy) -> str:
        doc = policy.model_dump()
        doc["_id"] = policy.policyId
        await self.policies_collection.update_one(
            {"_id": policy.policyId},
            {"$set": doc},
            upsert=True
        )
        return policy.policyId

    async def get_policy(self, policy_id: str) -> Optional[SecurityPolicy]:
        doc = await self.policies_collection.find_one({"_id": policy_id})
        if doc:
            return SecurityPolicy(**doc)
        return None

    async def get_all_policies(self) -> List[SecurityPolicy]:
        cursor = self.policies_collection.find({}).sort("createdAt", -1)
        policies = []
        async for doc in cursor:
            policies.append(SecurityPolicy(**doc))
        return policies

    async def get_active_policy(self) -> Optional[SecurityPolicy]:
        doc = await self.policies_collection.find_one({"status": "ACTIVE"})
        if doc:
            return SecurityPolicy(**doc)
        return None
        
    async def get_active_policies(self) -> List[SecurityPolicy]:
        """Backward compatibility for existing code. Returns a list with the single active policy."""
        active = await self.get_active_policy()
        return [active] if active else []
        
    async def delete_all_policies(self):
        # Used for testing / seeding
        await self.policies_collection.delete_many({})

security_repository = SecurityRepository()
