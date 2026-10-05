import logging
from typing import List, Optional, Dict, Any
from app.database.client import Database
from app.federated.models.federated_models import FederatedJob, FederatedRound, FederatedClient

logger = logging.getLogger("trustchain.federated.repository")

class FederatedRepository:
    def __init__(self):
        self._jobs_memory: Dict[str, dict] = {}
        self._rounds_memory: Dict[str, dict] = {}
        self._clients_memory: Dict[str, dict] = {}

    def _get_jobs_collection(self):
        db = Database.get_db()
        return db["federated_jobs"] if db is not None else None

    def _get_rounds_collection(self):
        db = Database.get_db()
        return db["federated_rounds"] if db is not None else None

    def _get_clients_collection(self):
        db = Database.get_db()
        return db["federated_clients"] if db is not None else None

    # JOBS
    async def save_job(self, job: FederatedJob) -> FederatedJob:
        data = job.model_dump()
        coll = self._get_jobs_collection()
        if coll is not None:
            try:
                await coll.update_one({"jobId": job.jobId}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo save_job error: {e}")
                self._jobs_memory[job.jobId] = data
        else:
            self._jobs_memory[job.jobId] = data
        return job

    async def get_job(self, job_id: str) -> Optional[FederatedJob]:
        coll = self._get_jobs_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"jobId": job_id}, {"_id": 0})
                if doc:
                    return FederatedJob(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_job error: {e}")
        doc = self._jobs_memory.get(job_id)
        return FederatedJob(**doc) if doc else None

    async def get_active_job(self) -> Optional[FederatedJob]:
        coll = self._get_jobs_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"status": {"$in": ["STARTING", "IN_PROGRESS", "RUNNING"]}}, {"_id": 0})
                if doc:
                    return FederatedJob(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_active_job error: {e}")
        for doc in self._jobs_memory.values():
            if doc.get("status") in ["STARTING", "IN_PROGRESS", "RUNNING"]:
                return FederatedJob(**doc)
        return None

    # ROUNDS
    async def save_round(self, fl_round: FederatedRound) -> FederatedRound:
        data = fl_round.model_dump()
        coll = self._get_rounds_collection()
        if coll is not None:
            try:
                await coll.update_one({"roundId": fl_round.roundId}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo save_round error: {e}")
                self._rounds_memory[fl_round.roundId] = data
        else:
            self._rounds_memory[fl_round.roundId] = data
        return fl_round

    async def list_rounds_for_job(self, job_id: str) -> List[FederatedRound]:
        coll = self._get_rounds_collection()
        if coll is not None:
            try:
                cursor = coll.find({"jobId": job_id}, {"_id": 0}).sort("roundNumber", 1)
                docs = await cursor.to_list(length=1000)
                return [FederatedRound(**doc) for doc in docs]
            except Exception as e:
                logger.warning(f"Mongo list_rounds error: {e}")
        
        rounds = [FederatedRound(**doc) for doc in self._rounds_memory.values() if doc.get("jobId") == job_id]
        return sorted(rounds, key=lambda x: x.roundNumber)

    # CLIENTS
    async def save_client(self, client: FederatedClient) -> FederatedClient:
        data = client.model_dump()
        coll = self._get_clients_collection()
        if coll is not None:
            try:
                await coll.update_one({"clientId": client.clientId}, {"$set": data}, upsert=True)
            except Exception as e:
                logger.warning(f"Mongo save_client error: {e}")
                self._clients_memory[client.clientId] = data
        else:
            self._clients_memory[client.clientId] = data
        return client

    async def list_clients(self) -> List[FederatedClient]:
        coll = self._get_clients_collection()
        if coll is not None:
            try:
                cursor = coll.find({}, {"_id": 0})
                docs = await cursor.to_list(length=1000)
                return [FederatedClient(**doc) for doc in docs]
            except Exception as e:
                logger.warning(f"Mongo list_clients error: {e}")
        return [FederatedClient(**doc) for doc in self._clients_memory.values()]

    async def get_client(self, client_id: str) -> Optional[FederatedClient]:
        coll = self._get_clients_collection()
        if coll is not None:
            try:
                doc = await coll.find_one({"clientId": client_id}, {"_id": 0})
                if doc:
                    return FederatedClient(**doc)
            except Exception as e:
                logger.warning(f"Mongo get_client error: {e}")
        doc = self._clients_memory.get(client_id)
        return FederatedClient(**doc) if doc else None

    async def clear_clients(self):
        coll = self._get_clients_collection()
        if coll is not None:
            try:
                await coll.delete_many({})
            except Exception:
                pass
        self._clients_memory.clear()

federated_repository = FederatedRepository()
