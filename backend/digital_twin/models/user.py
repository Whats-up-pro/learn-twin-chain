"""
User model with complete authentication and profile management
"""
from datetime import datetime, timezone
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import EmailStr, Field
from pymongo import IndexModel

class User(Document):
    """User document model for MongoDB storage"""
    
    # Core identification
    did: Indexed(str, unique=True) = Field(..., description="Unique decentralized identifier")
    email: Indexed(EmailStr, unique=True) = Field(..., description="User email address")
    
    # Authentication
    password_hash: str = Field(..., description="Argon2 hashed password")
    is_email_verified: bool = Field(default=False, description="Email verification status")
    email_verification_token: Optional[str] = Field(default=None, description="Email verification token")
    email_verification_expires: Optional[datetime] = Field(default=None, description="Email verification expiry")
    
    # Password reset
    password_reset_token: Optional[str] = Field(default=None, description="Password reset token")
    password_reset_expires: Optional[datetime] = Field(default=None, description="Password reset expiry")
    
    # Profile information
    name: str = Field(..., description="Full name")
    avatar_url: Optional[str] = Field(default="", description="Profile avatar URL")
    
    # Role-based access control
    role: str = Field(default="student", description="Primary user role")
    permissions: List[str] = Field(default_factory=list, description="Additional permissions")
    
    # Student-specific fields
    institution: Optional[str] = Field(default="", description="Educational institution")
    program: Optional[str] = Field(default="", description="Study program")
    birth_year: Optional[int] = Field(default=None, description="Birth year")
    enrollment_date: Optional[datetime] = Field(default=None, description="Enrollment date")
    
    # Teacher-specific fields
    department: Optional[str] = Field(default="", description="Department (for teachers)")
    specialization: Optional[List[str]] = Field(default_factory=list, description="Areas of expertise")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = Field(default=None, description="Last login timestamp")
    is_active: bool = Field(default=True, description="Account active status")
    
    # Digital Twin reference
    digital_twin_id: Optional[str] = Field(default=None, description="Associated digital twin ID")
    
    class Settings:
        name = "users"
        indexes = [
            IndexModel("email", unique=True),
            IndexModel("did", unique=True),
            IndexModel("role"),
            IndexModel("created_at"),
            IndexModel("is_active"),
            IndexModel("is_email_verified")
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)
    
    def to_dict(self, exclude_sensitive=True):
        """Convert to dictionary, optionally excluding sensitive data"""
        data = {
            "did": self.did,
            "email": self.email,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "role": self.role,
            "permissions": self.permissions,
            "institution": self.institution,
            "program": self.program,
            "birth_year": self.birth_year,
            "enrollment_date": self.enrollment_date.isoformat() if self.enrollment_date else None,
            "department": self.department,
            "specialization": self.specialization,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "is_active": self.is_active,
            "digital_twin_id": self.digital_twin_id
        }
        
        if not exclude_sensitive:
            data.update({
                "is_email_verified": self.is_email_verified,
                "password_hash": self.password_hash
            })
        
        return data

class UserProfile(Document):
    """Extended user profile for additional information"""
    
    user_id: Indexed(str, unique=True) = Field(..., description="Reference to user DID")
    
    # Extended profile fields
    bio: Optional[str] = Field(default="", description="User biography")
    location: Optional[str] = Field(default="", description="Location")
    website: Optional[str] = Field(default="", description="Personal website")
    social_links: Optional[dict] = Field(default_factory=dict, description="Social media links")
    
    # Learning preferences
    learning_style: Optional[str] = Field(default="balanced", description="Preferred learning style")
    preferred_subjects: List[str] = Field(default_factory=list, description="Preferred subjects")
    difficulty_level: Optional[str] = Field(default="intermediate", description="Current difficulty level")
    
    # Privacy settings
    profile_visibility: str = Field(default="public", description="Profile visibility")
    show_progress: bool = Field(default=True, description="Show learning progress")
    allow_contact: bool = Field(default=True, description="Allow contact from others")
    
    # Statistics
    total_learning_hours: int = Field(default=0, description="Total learning hours")
    completed_modules: int = Field(default=0, description="Number of completed modules")
    earned_nfts: int = Field(default=0, description="Number of earned NFTs")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "user_profiles"
        indexes = [
            IndexModel("user_id", unique=True),
            IndexModel("learning_style"),
            IndexModel("difficulty_level")
        ]