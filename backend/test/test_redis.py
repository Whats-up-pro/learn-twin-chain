#!/usr/bin/env python3
"""
Test Redis connectivity and session functionality
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

async def test_redis():
    print("🔍 Testing Redis Connection...")
    print("=" * 50)
    
    try:
        import redis.asyncio as redis
        
        # Get Redis config from env
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        redis_host = os.getenv("REDIS_HOST", "localhost") 
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_db = int(os.getenv("REDIS_DB", "0"))
        
        print(f"📋 Configuration:")
        print(f"   REDIS_URL: {redis_url}")
        print(f"   REDIS_HOST: {redis_host}")
        print(f"   REDIS_PORT: {redis_port}")
        print(f"   REDIS_DB: {redis_db}")
        print()
        
        # Test connection via URL
        print("🔗 Testing connection via URL...")
        client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5
        )
        
        # Test ping
        result = await client.ping()
        print(f"✅ Ping result: {result}")
        
        # Test set/get
        print("📝 Testing set/get operations...")
        await client.set("test_key", "test_value", ex=60)
        value = await client.get("test_key")
        print(f"✅ Set/Get test: {value}")
        
        # Test session-like operations
        print("🔐 Testing session operations...")
        session_id = "test_session_123"
        session_data = {
            "user_id": "user123",
            "username": "testuser",
            "role": "student",
            "created_at": "2025-01-09T16:00:00"
        }
        
        import json
        await client.setex(f"session:{session_id}", 3600, json.dumps(session_data))
        retrieved_session = await client.get(f"session:{session_id}")
        print(f"✅ Session test: {retrieved_session}")
        
        # Clean up
        await client.delete("test_key", f"session:{session_id}")
        await client.close()
        
        print("\n" + "=" * 50)
        print("✅ ALL REDIS TESTS PASSED!")
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("💡 Try: pip install redis")
        
    except Exception as e:
        print(f"❌ Redis Connection Error: {e}")
        print("💡 Make sure Redis Docker container is running:")
        print("   docker ps | findstr redis")

if __name__ == "__main__":
    asyncio.run(test_redis())