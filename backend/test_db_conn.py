import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def check_mongo():
    uri = os.environ.get("MONGODB_URL")
    if not uri:
        print("ERROR: MONGODB_URL not found in .env file.")
        return
        
    print(f"Attempting to connect to MongoDB Atlas...")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        server_info = await client.server_info()
        print("SUCCESS! MongoDB Atlas is running and connected.")
        print(f"MongoDB Version: {server_info.get('version')}")
    except Exception as e:
        print("FAILED! Could not connect to MongoDB Atlas.")
        print("Error details:", str(e))

if __name__ == "__main__":
    asyncio.run(check_mongo())
