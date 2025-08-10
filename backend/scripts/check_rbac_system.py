#!/usr/bin/env python3
"""
Script to check and fix RBAC system
Ensures all users have proper roles and permissions
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
from digital_twin.models.permission import Permission, Role, UserRoleAssignment
from digital_twin.models.session import UserSession, RefreshToken

async def check_rbac_system():
    """Check and fix RBAC system"""
    try:
        # Connect to MongoDB
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/learntwinchain")
        database_name = os.getenv("MONGODB_DB_NAME", "learntwinchain")
        
        print(f"Connecting to MongoDB at {mongodb_uri}")
        
        client = AsyncIOMotorClient(mongodb_uri)
        database = client[database_name]
        
        # Initialize Beanie
        await init_beanie(
            database=database,
            document_models=[
                User,
                Permission,
                Role,
                UserRoleAssignment,
                UserSession,
                RefreshToken
            ]
        )
        
        print("Connected to database successfully")
        
        # Check permissions
        print("Checking permissions...")
        permissions = await Permission.find().to_list()
        print(f"Found {len(permissions)} permissions")
        
        # Check roles
        print("Checking roles...")
        roles = await Role.find().to_list()
        print(f"Found {len(roles)} roles")
        
        # Check users without role assignments
        print("Checking users without role assignments...")
        users = await User.find().to_list()
        users_without_roles = []
        
        for user in users:
            assignment = await UserRoleAssignment.find_one({"user_id": user.did})
            if not assignment:
                users_without_roles.append(user.did)
                print(f"User {user.did} ({user.email}) has no role assignment")
        
        # Fix users without roles
        if users_without_roles:
            print(f"Fixing {len(users_without_roles)} users without roles...")
            
            # Ensure default roles exist
            from digital_twin.models.permission import DEFAULT_PERMISSIONS, DEFAULT_ROLES
            
            # Create permissions if they don't exist
            for perm_data in DEFAULT_PERMISSIONS:
                existing = await Permission.find_one({"name": perm_data["name"]})
                if not existing:
                    permission = Permission(**perm_data)
                    await permission.insert()
                    print(f"Created permission: {perm_data['name']}")
            
            # Create roles if they don't exist
            for role_data in DEFAULT_ROLES:
                existing = await Role.find_one({"name": role_data["name"]})
                if not existing:
                    role = Role(**role_data)
                    await role.insert()
                    print(f"Created role: {role_data['name']}")
            
            # Assign default student role to users without roles
            for user_id in users_without_roles:
                # Check if assignment already exists
                existing = await UserRoleAssignment.find_one({"user_id": user_id, "role_name": "student"})
                if not existing:
                    assignment = UserRoleAssignment(
                        user_id=user_id,
                        role_name="student",
                        assigned_by="system",
                        assigned_at=datetime.now(timezone.utc)
                    )
                    await assignment.insert()
                    print(f"Assigned student role to user: {user_id}")
        
        # Check role assignments
        print("Checking role assignments...")
        assignments = await UserRoleAssignment.find().to_list()
        print(f"Found {len(assignments)} role assignments")
        
        # Check for invalid role assignments
        invalid_assignments = []
        for assignment in assignments:
            role = await Role.find_one({"name": assignment.role_name})
            if not role:
                invalid_assignments.append(assignment)
                print(f"Invalid role assignment: {assignment.role_name} for user {assignment.user_id}")
        
        # Fix invalid assignments
        if invalid_assignments:
            print(f"Fixing {len(invalid_assignments)} invalid role assignments...")
            for assignment in invalid_assignments:
                # Delete invalid assignment
                await assignment.delete()
                print(f"Deleted invalid assignment: {assignment.role_name} for user {assignment.user_id}")
                
                # Create new student assignment
                new_assignment = UserRoleAssignment(
                    user_id=assignment.user_id,
                    role_name="student",
                    assigned_by="system",
                    assigned_at=datetime.now(timezone.utc)
                )
                await new_assignment.insert()
                print(f"Created new student assignment for user: {assignment.user_id}")
        
        # Check permissions for each role
        print("Checking role permissions...")
        for role in roles:
            print(f"Role: {role.name}")
            print(f"  Permissions: {role.permissions}")
            
            # Check if all permissions exist
            for perm_name in role.permissions:
                perm = await Permission.find_one({"name": perm_name})
                if not perm:
                    print(f"    WARNING: Permission '{perm_name}' not found!")
        
        print("RBAC system check completed successfully!")
        
    except Exception as e:
        print(f"Error checking RBAC system: {e}")
        raise
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(check_rbac_system())
