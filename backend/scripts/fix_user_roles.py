#!/usr/bin/env python3
"""
Script to fix user role assignments for authentication issues
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from digital_twin.models.user import User
from digital_twin.models.permission import Role, Permission, UserRoleAssignment
from digital_twin.models.permission import DEFAULT_PERMISSIONS, DEFAULT_ROLES
from digital_twin.models.digital_twin import DigitalTwin
from digital_twin.models.course import Course, Module, Enrollment
from digital_twin.models.nft import NFTRecord
from digital_twin.models.session import UserSession, RefreshToken
from digital_twin.models.wallet import WalletLink

async def fix_user_roles():
    """Fix user role assignments"""
    try:
        # Connect to MongoDB
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/learntwinchain")
        database_name = os.getenv("MONGODB_DB_NAME", "learntwinchain")
        
        print(f"🔗 Connecting to MongoDB at {mongodb_uri}")
        
        client = AsyncIOMotorClient(mongodb_uri)
        database = client[database_name]
        
        # Initialize Beanie
        await init_beanie(
            database=database,
            document_models=[
                User,
                DigitalTwin,
                Course,
                Module,
                Enrollment,
                NFTRecord,
                UserSession,
                RefreshToken,
                WalletLink,
                Role,
                Permission,
                UserRoleAssignment
            ]
        )
        
        print("✅ Connected to database successfully")
        
        # 1. Ensure all default permissions exist
        print("\n📋 Checking permissions...")
        permissions_created = 0
        for perm_data in DEFAULT_PERMISSIONS:
            existing = await Permission.find_one({"name": perm_data["name"]})
            if not existing:
                permission = Permission(**perm_data)
                await permission.insert()
                permissions_created += 1
                print(f"   ✅ Created permission: {perm_data['name']}")
        
        if permissions_created == 0:
            print("   ✅ All permissions already exist")
        else:
            print(f"   ✅ Created {permissions_created} permissions")
        
        # 2. Ensure all default roles exist
        print("\n👥 Checking roles...")
        roles_created = 0
        for role_data in DEFAULT_ROLES:
            existing = await Role.find_one({"name": role_data["name"]})
            if not existing:
                role = Role(**role_data)
                await role.insert()
                roles_created += 1
                print(f"   ✅ Created role: {role_data['name']}")
            else:
                # Update existing role permissions if they've changed
                if set(existing.permissions) != set(role_data["permissions"]):
                    existing.permissions = role_data["permissions"]
                    existing.updated_at = datetime.now(timezone.utc)
                    await existing.save()
                    print(f"   🔄 Updated role permissions: {role_data['name']}")
        
        if roles_created == 0:
            print("   ✅ All roles already exist")
        else:
            print(f"   ✅ Created {roles_created} roles")
        
        # 3. Check all users and their role assignments
        print("\n🔍 Checking user role assignments...")
        users = await User.find().to_list()
        users_fixed = 0
        
        for user in users:
            # Check if user has active role assignment
            assignment = await UserRoleAssignment.find_one({
                "user_id": user.did,
                "is_active": True,
                "$or": [
                    {"expires_at": None},
                    {"expires_at": {"$gt": datetime.now(timezone.utc)}}
                ]
            })
            
            if not assignment:
                # Assign default student role
                student_assignment = UserRoleAssignment(
                    user_id=user.did,
                    role_name="student",
                    assigned_by="system",
                    assigned_at=datetime.now(timezone.utc),
                    is_active=True,
                    notes="Auto-assigned by fix_user_roles script"
                )
                await student_assignment.insert()
                users_fixed += 1
                print(f"   ✅ Assigned 'student' role to user: {user.email} ({user.did})")
            else:
                print(f"   ✅ User {user.email} already has role: {assignment.role_name}")
        
        print(f"\n📊 Summary:")
        print(f"   - Permissions created: {permissions_created}")
        print(f"   - Roles created: {roles_created}")
        print(f"   - Users fixed: {users_fixed}")
        print(f"   - Total users: {len(users)}")
        
        # 4. Verify student role has required permissions
        student_role = await Role.find_one({"name": "student"})
        if student_role:
            required_permissions = ["read_lessons", "read_courses", "read_modules", "view_progress"]
            missing_permissions = []
            for perm in required_permissions:
                if perm not in student_role.permissions:
                    missing_permissions.append(perm)
            
            if missing_permissions:
                print(f"\n⚠️  Student role is missing permissions: {missing_permissions}")
                student_role.permissions.extend(missing_permissions)
                student_role.updated_at = datetime.now(timezone.utc)
                await student_role.save()
                print("   ✅ Added missing permissions to student role")
            else:
                print("\n✅ Student role has all required permissions")
        
        print("\n🎉 User role fix completed successfully!")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error fixing user roles: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fix_user_roles())
