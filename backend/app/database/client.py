"""
TrustChain-5G Database Architecture (Motor / Asynchronous MongoDB Engine).

Manages high-performance asynchronous connection pools to MongoDB, ensuring reliable
persistence for high-throughput 5G packet telemetry, ML threat classification, and Blockchain ledgers.
"""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import logging

logger = logging.getLogger("trustchain.database")

class Database:
    """
    Singleton Manager for Motor asynchronous MongoDB client connections.
    """
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect_to_mongo(cls) -> None:
        """Initialize connection pool to MongoDB server."""
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
        try:
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
                serverSelectionTimeoutMS=2000,
            )
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            # Verify connectivity with a quick admin command ping
            await cls.client.admin.command("ping")
            logger.info("Successfully established enterprise connection pool to MongoDB.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            if cls.client is not None:
                cls.client.close()
            cls.client = None
            cls.db = None
            # In Sprint 0/1 architectural mode without live MongoDB running, we log gracefully and fall back instantly to memory
            logger.warning("Continuing in decoupled foundation mode without active Mongo DB instance; automatically using in-memory repositories.")

    @classmethod
    async def close_mongo_connection(cls) -> None:
        """Close MongoDB connection pool on server teardown."""
        if cls.client is not None:
            logger.info("Closing asynchronous MongoDB connection pool...")
            cls.client.close()
            cls.client = None
            cls.db = None

    @classmethod
    def get_db(cls) -> Optional[AsyncIOMotorDatabase]:
        """Get active database instance."""
        return cls.db


db = Database()
