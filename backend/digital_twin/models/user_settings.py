"""
User Settings model for storing user preferences and configurations
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from beanie import Document
from pydantic import Field

class UserSettings(Document):
    """User settings document model for MongoDB storage"""
    
    # User reference
    user_id: str = Field(..., description="Reference to user ID")
    
    # Language and localization
    language: str = Field(default="en", description="Preferred language code")
    timezone: str = Field(default="UTC", description="User timezone")
    
    # Appearance settings
    dark_mode: bool = Field(default=False, description="Dark mode preference")
    theme_color: str = Field(default="#3B82F6", description="Primary theme color")
    
    # Notification preferences
    notifications: Dict[str, bool] = Field(
        default_factory=lambda: {
            "email": True,
            "push": True,
            "nftEarned": True,
            "courseUpdates": True,
            "achievements": True,
        },
        description="Notification preferences"
    )
    
    # Privacy settings
    privacy: Dict[str, Any] = Field(
        default_factory=lambda: {
            "profileVisibility": "public",
            "showProgress": True,
            "showAchievements": True,
        },
        description="Privacy preferences"
    )
    
    # Account settings
    account: Dict[str, Any] = Field(
        default_factory=lambda: {
            "emailNotifications": True,
            "twoFactorAuth": False,
            "dataExport": False,
        },
        description="Account preferences"
    )
    
    # Two-factor authentication
    two_factor_secret: Optional[str] = Field(default=None, description="2FA secret key")
    two_factor_backup_codes: Optional[list] = Field(default=None, description="2FA backup codes")
    two_factor_enabled: bool = Field(default=False, description="2FA enabled status")
    
    # Data export
    last_data_export: Optional[datetime] = Field(default=None, description="Last data export timestamp")
    data_export_requests: list = Field(default_factory=list, description="Data export request history")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "user_settings"
        indexes = [
            "user_id",
            "created_at",
            "updated_at"
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "user_id": self.user_id,
            "language": self.language,
            "timezone": self.timezone,
            "dark_mode": self.dark_mode,
            "theme_color": self.theme_color,
            "notifications": self.notifications,
            "privacy": self.privacy,
            "account": self.account,
            "two_factor_enabled": self.two_factor_enabled,
            "last_data_export": self.last_data_export.isoformat() if self.last_data_export else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
