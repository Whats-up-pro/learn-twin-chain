"""
Redis service for session management and SIWE nonces
"""
import os
import json
import logging
from typing import Optional, Dict, Any
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class RedisService:
    """Redis service for caching and session management"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = int(os.getenv("REDIS_PORT", "6379"))
        self.redis_db = int(os.getenv("REDIS_DB", "0"))
        self.redis_client: Optional[redis.Redis] = None
        
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True
            )
            
            # Test connection
            await self.redis_client.ping()
            logger.info("Redis connection established")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            # Fallback to direct connection
            try:
                self.redis_client = redis.Redis(
                    host=self.redis_host,
                    port=self.redis_port,
                    db=self.redis_db,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5,
                    retry_on_timeout=True
                )
                await self.redis_client.ping()
                logger.info("Redis connection established (fallback)")
            except Exception as e2:
                logger.error(f"Redis fallback connection failed: {e2}")
                raise e2
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed")
    
    async def get_client(self):
        """Get Redis client, connect if needed"""
        if not self.redis_client:
            await self.connect()
        return self.redis_client
    
    # Session management
    async def set_session(self, session_id: str, user_id: str, ttl: int = 86400):
        """Store session in Redis"""
        try:
            client = await self.get_client()
            key = f"session:{session_id}"
            await client.setex(key, ttl, user_id)
            logger.debug(f"Session stored: {session_id}")
        except Exception as e:
            logger.error(f"Failed to store session {session_id}: {e}")
            raise
    
    async def get_session(self, session_id: str) -> Optional[str]:
        """Get session from Redis"""
        try:
            client = await self.get_client()
            key = f"session:{session_id}"
            user_id = await client.get(key)
            return user_id
        except Exception as e:
            logger.error(f"Failed to get session {session_id}: {e}")
            return None
    
    async def delete_session(self, session_id: str):
        """Delete session from Redis"""
        try:
            client = await self.get_client()
            key = f"session:{session_id}"
            await client.delete(key)
            logger.debug(f"Session deleted: {session_id}")
        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {e}")
    
    async def extend_session(self, session_id: str, ttl: int = 86400):
        """Extend session TTL"""
        try:
            client = await self.get_client()
            key = f"session:{session_id}"
            await client.expire(key, ttl)
            logger.debug(f"Session extended: {session_id}")
        except Exception as e:
            logger.error(f"Failed to extend session {session_id}: {e}")
    
    # SIWE nonce management
    async def set_nonce(self, nonce: str, wallet_address: str, ttl: int = 300):
        """Store SIWE nonce in Redis"""
        try:
            client = await self.get_client()
            key = f"siwe_nonce:{nonce}"
            data = {
                "wallet_address": wallet_address,
                "created_at": str(int(time.time()))
            }
            await client.setex(key, ttl, json.dumps(data))
            logger.debug(f"SIWE nonce stored: {nonce}")
        except Exception as e:
            logger.error(f"Failed to store SIWE nonce {nonce}: {e}")
            raise
    
    async def get_nonce(self, nonce: str) -> Optional[Dict[str, Any]]:
        """Get SIWE nonce from Redis"""
        try:
            client = await self.get_client()
            key = f"siwe_nonce:{nonce}"
            data = await client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to get SIWE nonce {nonce}: {e}")
            return None
    
    async def delete_nonce(self, nonce: str):
        """Delete SIWE nonce from Redis"""
        try:
            client = await self.get_client()
            key = f"siwe_nonce:{nonce}"
            await client.delete(key)
            logger.debug(f"SIWE nonce deleted: {nonce}")
        except Exception as e:
            logger.error(f"Failed to delete SIWE nonce {nonce}: {e}")
    
    # Rate limiting
    async def check_rate_limit(self, key: str, limit: int, window: int) -> bool:
        """Check rate limit using sliding window"""
        try:
            client = await self.get_client()
            current_time = int(time.time())
            window_start = current_time - window
            
            # Remove old entries
            await client.zremrangebyscore(f"rate_limit:{key}", 0, window_start)
            
            # Count current requests
            current_count = await client.zcard(f"rate_limit:{key}")
            
            if current_count >= limit:
                return False
            
            # Add current request
            await client.zadd(f"rate_limit:{key}", {str(current_time): current_time})
            await client.expire(f"rate_limit:{key}", window)
            
            return True
        except Exception as e:
            logger.error(f"Rate limit check failed for {key}: {e}")
            return True  # Allow request if Redis fails
    
    # Caching
    async def set_cache(self, key: str, value: Any, ttl: int = 3600):
        """Set cache value"""
        try:
            client = await self.get_client()
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await client.setex(f"cache:{key}", ttl, value)
            logger.debug(f"Cache set: {key}")
        except Exception as e:
            logger.error(f"Failed to set cache {key}: {e}")
    
    async def get_cache(self, key: str) -> Optional[Any]:
        """Get cache value"""
        try:
            client = await self.get_client()
            value = await client.get(f"cache:{key}")
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Failed to get cache {key}: {e}")
            return None
    
    async def delete_cache(self, key: str):
        """Delete cache value"""
        try:
            client = await self.get_client()
            await client.delete(f"cache:{key}")
            logger.debug(f"Cache deleted: {key}")
        except Exception as e:
            logger.error(f"Failed to delete cache {key}: {e}")
    
    async def clear_cache_pattern(self, pattern: str):
        """Clear cache keys matching pattern"""
        try:
            client = await self.get_client()
            keys = await client.keys(f"cache:{pattern}")
            if keys:
                await client.delete(*keys)
                logger.info(f"Cleared {len(keys)} cache keys matching pattern: {pattern}")
        except Exception as e:
            logger.error(f"Failed to clear cache pattern {pattern}: {e}")
    
    # Pub/Sub for real-time updates
    async def publish(self, channel: str, message: Dict[str, Any]):
        """Publish message to channel"""
        try:
            client = await self.get_client()
            await client.publish(channel, json.dumps(message))
            logger.debug(f"Message published to {channel}")
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
    
    async def subscribe(self, channel: str):
        """Subscribe to channel"""
        try:
            client = await self.get_client()
            pubsub = client.pubsub()
            await pubsub.subscribe(channel)
            return pubsub
        except Exception as e:
            logger.error(f"Failed to subscribe to {channel}: {e}")
            return None
    
    # Health check
    async def health_check(self) -> bool:
        """Check Redis health"""
        try:
            client = await self.get_client()
            await client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False

# Import time here to avoid circular imports
import time