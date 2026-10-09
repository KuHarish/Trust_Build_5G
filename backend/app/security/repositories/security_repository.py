import logging
from typing import Any, Dict, List, Optional
from app.database.client import Database
from app.security.models.security_decision import SecurityDecision
from app.security.models.mitigation_action import MitigationAction
from app.security.models.security_policy import SecurityPolicy

logger = logging.getLogger("trustchain.security.repository")


class _MemoryCursor:
    def __init__(self, docs: List[Dict[str, Any]], filter_dict: Optional[Dict[str, Any]] = None, sort_field: Optional[str] = None, sort_direction: int = -1):
        self._docs = list(docs)
        self._filter = filter_dict or {}
        self._sort_field = sort_field
        self._sort_direction = sort_direction
        self._skip = 0
        self._limit = None

    def sort(self, field: str, direction: int = -1):
        self._sort_field = field
        self._sort_direction = direction
        return self

    def skip(self, value: int):
        self._skip = value
        return self

    def limit(self, value: int):
        self._limit = value
        return self

    def _matches(self, doc: Dict[str, Any]) -> bool:
        for key, expected in self._filter.items():
            if key == "$or":
                if not any(self._matches_clause(clause, doc) for clause in expected):
                    return False
                continue
            if not self._matches_clause({key: expected}, doc):
                return False
        return True

    def _matches_clause(self, clause: Dict[str, Any], doc: Dict[str, Any]) -> bool:
        for key, expected in clause.items():
            actual = doc.get(key)
            if key == "_id":
                if actual != expected:
                    return False
                continue
            if actual != expected:
                return False
        return True

    def _iter_filtered(self):
        docs = self._docs
        if self._sort_field:
            docs = sorted(docs, key=lambda item: item.get(self._sort_field) or "", reverse=self._sort_direction == -1)
        filtered = []
        for doc in docs:
            if self._matches(doc):
                filtered.append(doc)
        if self._skip:
            filtered = filtered[self._skip:]
        if self._limit is not None:
            filtered = filtered[: self._limit]
        return filtered

    def __aiter__(self):
        return self._iterate()

    async def _iterate(self):
        for doc in self._iter_filtered():
            yield doc

    async def to_list(self, length: Optional[int] = None):
        result = list(self._iter_filtered())
        if length is not None:
            return result[:length]
        return result


class _MemoryCollection:
    def __init__(self, collection_name: str, store: Dict[str, Dict[str, Any]]):
        self._collection_name = collection_name
        self._store = store

    def _find_documents(self, filter_dict: Optional[Dict[str, Any]] = None):
        if filter_dict is None:
            filter_dict = {}
        return [doc for doc in self._store.values() if self._matches(doc, filter_dict)]

    def _matches(self, doc: Dict[str, Any], filter_dict: Dict[str, Any]) -> bool:
        for key, expected in filter_dict.items():
            if key == "$or":
                if not any(self._matches(doc, clause) for clause in expected):
                    return False
                continue
            if doc.get(key) != expected:
                return False
        return True

    async def insert_one(self, document: Dict[str, Any]):
        doc_id = document.get("_id")
        if doc_id is None:
            doc_id = document.get("id")
        if doc_id is None:
            raise ValueError(f"Missing _id for collection {self._collection_name}")
        self._store[str(doc_id)] = document.copy()
        class InsertResult:
            inserted_id = doc_id
        return InsertResult()

    async def update_one(self, filter_dict: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        doc = await self.find_one(filter_dict)
        if doc is None:
            if not upsert:
                class UpdateResult:
                    matched_count = 0
                    modified_count = 0
                return UpdateResult()
            new_doc = {}
            for key, value in filter_dict.items():
                if key != "$or":
                    new_doc[key] = value
            if "$set" in update:
                new_doc.update(update["$set"])
            self._store[str(new_doc.get("_id", new_doc.get("id")))] = new_doc
            class UpdateResult:
                matched_count = 0
                modified_count = 1
                upserted_id = new_doc.get("_id", new_doc.get("id"))
            return UpdateResult()

        if "$set" in update:
            doc.update(update["$set"])
            self._store[str(doc.get("_id", doc.get("id")))] = doc
        class UpdateResult:
            matched_count = 1
            modified_count = 1
        return UpdateResult()

    async def delete_many(self, filter_dict: Optional[Dict[str, Any]] = None):
        filter_dict = filter_dict or {}
        docs_to_delete = self._find_documents(filter_dict)
        for doc in docs_to_delete:
            self._store.pop(str(doc.get("_id", doc.get("id"))), None)
        class DeleteResult:
            deleted_count = len(docs_to_delete)
        return DeleteResult()

    async def delete_one(self, filter_dict: Optional[Dict[str, Any]] = None):
        filter_dict = filter_dict or {}
        for doc in list(self._store.values()):
            if self._matches(doc, filter_dict):
                self._store.pop(str(doc.get("_id", doc.get("id"))), None)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    async def find_one(self, filter_dict: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        matches = self._find_documents(filter_dict)
        if not matches:
            return None
        doc = matches[0]
        if projection and projection.get("_id") == 0:
            doc = doc.copy()
            doc.pop("_id", None)
        return doc

    def find(self, filter_dict: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        return _MemoryCursor(self._find_documents(filter_dict), filter_dict or {}, sort_field=None)

    async def count_documents(self, filter_dict: Optional[Dict[str, Any]] = None):
        return len(self._find_documents(filter_dict))

    async def estimated_document_count(self):
        return len(self._store)


class _MemoryDatabase:
    def __init__(self):
        self._collections: Dict[str, _MemoryCollection] = {}

    def __getitem__(self, name: str):
        if name not in self._collections:
            self._collections[name] = _MemoryCollection(name, {})
        return self._collections[name]


class SecurityRepository:
    def __init__(self):
        self._memory_db = _MemoryDatabase()

    @property
    def db(self):
        active_db = Database.get_db()
        if active_db is not None:
            return active_db
        return self._memory_db

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
