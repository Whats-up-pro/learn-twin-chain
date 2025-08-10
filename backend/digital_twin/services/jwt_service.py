"""
JWT Service for handling access tokens and refresh tokens
"""
import os
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
import jwt
from jwt import InvalidTokenError
import logging

from ..models.user import User
from ..models.session import RefreshToken

logger = logging.getLogger(__name__)

class JWTService:
    """JWT token management service"""
    
    def __init__(self):
        self.jwt_secret = os.getenv("JWT_SECRET_KEY", "your-secret-key")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire, "type": "access"})
        
        try:
            return jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
        except Exception as e:
            logger.error(f"JWT encoding error: {e}")
            logger.error(f"Data to encode: {to_encode}")
            raise
    
    async def create_refresh_token(self, user_id: str, ip_address: str = None, user_agent: str = None) -> Dict[str, Any]:
        """Create refresh token"""
        try:
            token_id = str(uuid.uuid4())
            family_id = str(uuid.uuid4())
            token_value = secrets.token_urlsafe(32)
            token_hash = self._hash_token(token_value)
            expires_at = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
            
            refresh_token = RefreshToken(
                token_id=token_id,
                user_id=user_id,
                token_hash=token_hash,
                expires_at=expires_at,
                family_id=family_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            await refresh_token.insert()
            
            # Return the plain token value (only time it's available)
            return {
                "token_id": token_id, 
                "token": token_value, 
                "expires_at": expires_at,
                "family_id": family_id
            }
            
        except Exception as e:
            logger.error(f"Refresh token creation error: {e}")
            raise Exception("Token creation failed")
    
    def verify_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT access token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            # Check if it's an access token
            if payload.get("type") != "access":
                return None
            return payload
        except (InvalidTokenError, Exception):
            return None
    
    async def verify_refresh_token(self, token_value: str) -> Optional[RefreshToken]:
        """Verify refresh token"""
        try:
            token_hash = self._hash_token(token_value)
            refresh_token = await RefreshToken.find_one({"token_hash": token_hash})
            
            if not refresh_token:
                return None
            
            # Ensure expires_at has timezone info
            expires_at = refresh_token.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            # Check if expired
            if expires_at < datetime.now(timezone.utc):
                return None
            
            return refresh_token
            
        except Exception as e:
            logger.error(f"Refresh token verification error: {e}")
            return None
    
    async def invalidate_refresh_token(self, token_value: str) -> bool:
        """Invalidate refresh token"""
        try:
            token_hash = self._hash_token(token_value)
            refresh_token = await RefreshToken.find_one({"token_hash": token_hash})
            
            if refresh_token:
                await refresh_token.delete()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Refresh token invalidation error: {e}")
            return False
    
    async def invalidate_all_user_tokens(self, user_id: str) -> bool:
        """Invalidate all refresh tokens for a user"""
        try:
            await RefreshToken.delete_many({"user_id": user_id})
            return True
        except Exception as e:
            logger.error(f"User tokens invalidation error: {e}")
            return False
    
    def _hash_token(self, token: str) -> str:
        """Hash token for storage"""
        import hashlib
        return hashlib.sha256(token.encode()).hexdigest()
    
    def get_token_expiry(self) -> int:
        """Get access token expiry time in seconds"""
        return self.access_token_expire_minutes * 60
    
    def get_refresh_token_expiry(self) -> int:
        """Get refresh token expiry time in seconds"""
        return self.refresh_token_expire_days * 24 * 60 * 60

# Global instance
jwt_service = JWTService()
