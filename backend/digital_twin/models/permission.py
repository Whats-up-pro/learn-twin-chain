"""
RBAC (Role-Based Access Control) models
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel

class Permission(Document):
    """Permission model for fine-grained access control"""
    
    name: Indexed(str, unique=True) = Field(..., description="Permission name (e.g., 'create_course')")
    description: str = Field(..., description="Human-readable description")
    resource: str = Field(..., description="Resource type (e.g., 'course', 'user', 'nft')")
    action: str = Field(..., description="Action type (e.g., 'create', 'read', 'update', 'delete')")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = Field(default=True, description="Permission active status")
    
    class Settings:
        name = "permissions"
        indexes = [
            IndexModel("name", unique=True),
            IndexModel("resource"),
            IndexModel("action"),
            IndexModel([("resource", 1), ("action", 1)])
        ]

class Role(Document):
    """Role model for grouping permissions"""
    
    name: Indexed(str, unique=True) = Field(..., description="Role name (e.g., 'student', 'teacher', 'admin')")
    description: str = Field(..., description="Human-readable description")
    permissions: List[str] = Field(default_factory=list, description="List of permission names")
    
    # Hierarchy
    parent_role: Optional[str] = Field(default=None, description="Parent role for inheritance")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = Field(default=True, description="Role active status")
    
    # Additional settings
    is_default: bool = Field(default=False, description="Default role for new users")
    priority: int = Field(default=0, description="Role priority for conflict resolution")
    
    class Settings:
        name = "roles"
        indexes = [
            IndexModel("name", unique=True),
            IndexModel("is_default"),
            IndexModel("priority"),
            IndexModel("parent_role")
        ]

class UserRoleAssignment(Document):
    """Assignment of roles to users with additional context"""
    
    user_id: Indexed(str) = Field(..., description="User DID")
    role_name: Indexed(str) = Field(..., description="Role name")
    
    # Assignment context
    assigned_by: str = Field(..., description="DID of user who assigned the role")
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = Field(default=None, description="Role expiration (optional)")
    
    # Conditions
    conditions: Dict[str, Any] = Field(default_factory=dict, description="Conditional access rules")
    is_active: bool = Field(default=True, description="Assignment active status")
    
    # Metadata
    notes: Optional[str] = Field(default=None, description="Assignment notes")
    
    class Settings:
        name = "user_role_assignments"
        indexes = [
            IndexModel("user_id"),
            IndexModel("role_name"),
            IndexModel([("user_id", 1), ("role_name", 1)], unique=True),
            IndexModel("expires_at"),
            IndexModel("is_active")
        ]

# Default permissions for the learning platform
DEFAULT_PERMISSIONS = [
    # User permissions
    {"name": "read_own_profile", "description": "Read own user profile", "resource": "user", "action": "read"},
    {"name": "update_own_profile", "description": "Update own user profile", "resource": "user", "action": "update"},
    {"name": "delete_own_account", "description": "Delete own user account", "resource": "user", "action": "delete"},
    
    # Digital Twin permissions
    {"name": "read_own_twin", "description": "Read own digital twin", "resource": "digital_twin", "action": "read"},
    {"name": "update_own_twin", "description": "Update own digital twin", "resource": "digital_twin", "action": "update"},
    {"name": "read_all_twins", "description": "Read all digital twins", "resource": "digital_twin", "action": "read_all"},
    
    # Course permissions
    {"name": "read_courses", "description": "Read course information", "resource": "course", "action": "read"},
    {"name": "create_course", "description": "Create new courses", "resource": "course", "action": "create"},
    {"name": "update_course", "description": "Update course information", "resource": "course", "action": "update"},
    {"name": "delete_course", "description": "Delete courses", "resource": "course", "action": "delete"},
    {"name": "publish_course", "description": "Publish/unpublish courses", "resource": "course", "action": "publish"},
    
    # Module permissions
    {"name": "read_modules", "description": "Read module content", "resource": "module", "action": "read"},
    {"name": "create_module", "description": "Create new modules", "resource": "module", "action": "create"},
    {"name": "update_module", "description": "Update module content", "resource": "module", "action": "update"},
    {"name": "delete_module", "description": "Delete modules", "resource": "module", "action": "delete"},
    
    # Learning permissions
    {"name": "enroll_course", "description": "Enroll in courses", "resource": "learning", "action": "enroll"},
    {"name": "complete_module", "description": "Complete learning modules", "resource": "learning", "action": "complete"},
    {"name": "submit_assignment", "description": "Submit assignments", "resource": "learning", "action": "submit"},
    
    # NFT permissions
    {"name": "mint_achievement_nft", "description": "Mint achievement NFTs", "resource": "nft", "action": "mint"},
    {"name": "transfer_nft", "description": "Transfer owned NFTs", "resource": "nft", "action": "transfer"},
    {"name": "verify_nft", "description": "Verify NFT authenticity", "resource": "nft", "action": "verify"},
    
    # Wallet permissions
    {"name": "link_wallet", "description": "Link crypto wallet", "resource": "wallet", "action": "link"},
    {"name": "unlink_wallet", "description": "Unlink crypto wallet", "resource": "wallet", "action": "unlink"},
    
    # Admin permissions
    {"name": "manage_users", "description": "Manage user accounts", "resource": "user", "action": "manage"},
    {"name": "manage_roles", "description": "Manage roles and permissions", "resource": "role", "action": "manage"},
    {"name": "view_analytics", "description": "View system analytics", "resource": "analytics", "action": "read"},
    {"name": "system_config", "description": "Configure system settings", "resource": "system", "action": "configure"},
]

# Default roles for the learning platform
DEFAULT_ROLES = [
    {
        "name": "student",
        "description": "Regular student user",
        "permissions": [
            "read_own_profile", "update_own_profile", "delete_own_account",
            "read_own_twin", "update_own_twin",
            "read_courses", "read_modules",
            "enroll_course", "complete_module", "submit_assignment",
            "mint_achievement_nft", "transfer_nft", "verify_nft",
            "link_wallet", "unlink_wallet"
        ],
        "is_default": True,
        "priority": 1
    },
    {
        "name": "teacher",
        "description": "Course instructor",
        "permissions": [
            "read_own_profile", "update_own_profile", "delete_own_account",
            "read_own_twin", "update_own_twin", "read_all_twins",
            "read_courses", "create_course", "update_course", "publish_course",
            "read_modules", "create_module", "update_module", "delete_module",
            "mint_achievement_nft", "verify_nft",
            "link_wallet", "unlink_wallet",
            "view_analytics"
        ],
        "priority": 2
    },
    {
        "name": "admin",
        "description": "System administrator",
        "permissions": [
            "read_own_profile", "update_own_profile", "delete_own_account",
            "read_own_twin", "update_own_twin", "read_all_twins",
            "read_courses", "create_course", "update_course", "delete_course", "publish_course",
            "read_modules", "create_module", "update_module", "delete_module",
            "mint_achievement_nft", "transfer_nft", "verify_nft",
            "link_wallet", "unlink_wallet",
            "manage_users", "manage_roles", "view_analytics", "system_config"
        ],
        "priority": 3
    },
    {
        "name": "institution_admin",
        "description": "Institution administrator",
        "permissions": [
            "read_own_profile", "update_own_profile", "delete_own_account",
            "read_own_twin", "update_own_twin", "read_all_twins",
            "read_courses", "create_course", "update_course", "publish_course",
            "read_modules", "create_module", "update_module", "delete_module",
            "mint_achievement_nft", "verify_nft",
            "link_wallet", "unlink_wallet",
            "manage_users", "view_analytics"
        ],
        "priority": 2
    }
]