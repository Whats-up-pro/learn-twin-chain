#!/usr/bin/env python3
"""
Script to check a specific user's permissions for debugging
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from digital_twin.models.user import User
from digital_twin.models.permission import Role, Permission, UserRoleAssignment
from digital_twin.models.digital_twin import DigitalTwin
from digital_twin.models.course import Course, Module, Enrollment
from digital_twin.models.nft import NFTRecord
from digital_twin.models.session import UserSession, RefreshToken
from digital_twin.models.wallet import WalletLink
from digital_twin.services.auth_service import AuthService

async def check_user_permissions(user_email=None):
    """Check specific user's permissions"""
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
        
        # Get user
        if user_email:
            user = await User.find_one({"email": user_email})
        else:
            # Get the most recent user
            user = await User.find().sort([("created_at", -1)]).first()
        
        if not user:
            print("❌ No user found")
            return
        
        print(f"\n👤 Checking permissions for user: {user.email}")
        print(f"   DID: {user.did}")
        print(f"   Role: {user.role}")
        print(f"   Direct permissions: {user.permissions if hasattr(user, 'permissions') else 'None'}")
        
        # Check role assignments
        assignments = await UserRoleAssignment.find({"user_id": user.did}).to_list()
        print(f"\n📝 Role assignments ({len(assignments)}):")
        for assignment in assignments:
            status = "✅ Active" if assignment.is_active else "❌ Inactive"
            print(f"   - {assignment.role_name}: {status}")
            if assignment.expires_at:
                print(f"     Expires: {assignment.expires_at}")
            print(f"     Assigned by: {assignment.assigned_by}")
            print(f"     Assigned at: {assignment.assigned_at}")
        
        # Get effective permissions using AuthService
        auth_service = AuthService()
        permissions = await auth_service.get_user_permissions(user.did)
        
        print(f"\n🔐 Effective permissions ({len(permissions)}):")
        important_permissions = ["read_lessons", "read_courses", "read_modules", "view_progress", "enroll_course"]
        
        for perm in important_permissions:
            status = "✅" if perm in permissions else "❌"
            print(f"   {status} {perm}")
        
        print(f"\n📋 All permissions:")
        for perm in sorted(permissions):
            print(f"   - {perm}")
        
        # Check specific permission
        has_read_lessons = await auth_service.check_permission(user.did, "read_lessons")
        print(f"\n🔍 Can read lessons: {'✅ YES' if has_read_lessons else '❌ NO'}")
        
        # Close connection
        client.close()
        
        return has_read_lessons
        
    except Exception as e:
        print(f"❌ Error checking user permissions: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(check_user_permissions(email))
