"""
Session management models for authentication
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel

class UserSession(Document):
    """User session document for MongoDB storage"""
    
    session_id: Indexed(str, unique=True) = Field(..., description="Unique session identifier")
    user_id: Indexed(str) = Field(..., description="User DID")
    
    # Session metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Indexed(datetime) = Field(..., description="Session expiration time")
    last_accessed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Client information
    ip_address: Optional[str] = Field(default=None, description="Client IP address")
    user_agent: Optional[str] = Field(default=None, description="Client user agent")
    device_fingerprint: Optional[str] = Field(default=None, description="Device fingerprint")
    
    # Session status
    is_active: bool = Field(default=True, description="Session active status")
    revoked_at: Optional[datetime] = Field(default=None, description="Session revocation time")
    revoked_reason: Optional[str] = Field(default=None, description="Reason for revocation")
    
    # Additional data
    session_data: Dict[str, Any] = Field(default_factory=dict, description="Additional session data")
    
    class Settings:
        name = "user_sessions"
        indexes = [
            IndexModel("session_id", unique=True),
            IndexModel("user_id"),
            IndexModel("expires_at"),
            IndexModel("is_active"),
            IndexModel([("expires_at", 1)], expireAfterSeconds=0)  # TTL index
        ]
    
    def is_expired(self) -> bool:
        """Check if session is expired"""
        return datetime.now(timezone.utc) > self.expires_at
    
    def extend_session(self, hours: int = 24):
        """Extend session expiration"""
        self.expires_at = datetime.now(timezone.utc) + timedelta(hours=hours)
        self.last_accessed = datetime.now(timezone.utc)
    
    def revoke(self, reason: str = "manual"):
        """Revoke the session"""
        self.is_active = False
        self.revoked_at = datetime.now(timezone.utc)
        self.revoked_reason = reason

class RefreshToken(Document):
    """Refresh token document for JWT-based authentication"""
    
    token_id: Indexed(str, unique=True) = Field(..., description="Unique token identifier")
    user_id: Indexed(str) = Field(..., description="User DID")
    token_hash: str = Field(..., description="Hashed refresh token")
    
    # Token metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Indexed(datetime) = Field(..., description="Token expiration time")
    last_used: Optional[datetime] = Field(default=None, description="Last time token was used")
    
    # Client information
    ip_address: Optional[str] = Field(default=None, description="Client IP address")
    user_agent: Optional[str] = Field(default=None, description="Client user agent")
    
    # Token status
    is_active: bool = Field(default=True, description="Token active status")
    revoked_at: Optional[datetime] = Field(default=None, description="Token revocation time")
    revoked_reason: Optional[str] = Field(default=None, description="Reason for revocation")
    
    # Security features
    rotation_count: int = Field(default=0, description="Number of times token was rotated")
    family_id: str = Field(..., description="Token family identifier for rotation")
    
    class Settings:
        name = "refresh_tokens"
        indexes = [
            IndexModel("token_id", unique=True),
            IndexModel("user_id"),
            IndexModel("expires_at"),
            IndexModel("is_active"),
            IndexModel("family_id"),
            IndexModel([("expires_at", 1)], expireAfterSeconds=0)  # TTL index
        ]
    
    def is_expired(self) -> bool:
        """Check if token is expired"""
        return datetime.now(timezone.utc) > self.expires_at
    
    def revoke(self, reason: str = "manual"):
        """Revoke the refresh token"""
        self.is_active = False
        self.revoked_at = datetime.now(timezone.utc)
        self.revoked_reason = reason
        
    def use_token(self):
        """Mark token as used"""
        self.last_used = datetime.now(timezone.utc)