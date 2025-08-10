#!/usr/bin/env python3
"""
Script to fix timezone issues in the database
Ensures all datetime fields have timezone information
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
from digital_twin.models.digital_twin import DigitalTwin
from digital_twin.models.course import Course, Module
from digital_twin.models.nft import NFTRecord
from digital_twin.models.session import UserSession, RefreshToken
from digital_twin.models.wallet import WalletLink
from digital_twin.models.permission import Role, Permission

async def fix_timezone_data():
    """Fix timezone issues in all collections"""
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
                DigitalTwin, 
                Course,
                Module,
                NFTRecord,
                UserSession,
                RefreshToken,
                WalletLink,
                Role,
                Permission
            ]
        )
        
        print("Connected to database successfully")
        
        # Fix UserSession timezone issues
        print("Fixing UserSession timezone issues...")
        sessions = await UserSession.find().to_list()
        fixed_sessions = 0
        
        for session in sessions:
            updated = False
            
            # Fix created_at
            if session.created_at and session.created_at.tzinfo is None:
                session.created_at = session.created_at.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix expires_at
            if session.expires_at and session.expires_at.tzinfo is None:
                session.expires_at = session.expires_at.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix last_accessed
            if session.last_accessed and session.last_accessed.tzinfo is None:
                session.last_accessed = session.last_accessed.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix revoked_at
            if session.revoked_at and session.revoked_at.tzinfo is None:
                session.revoked_at = session.revoked_at.replace(tzinfo=timezone.utc)
                updated = True
            
            if updated:
                await session.save()
                fixed_sessions += 1
        
        print(f"Fixed {fixed_sessions} UserSession records")
        
        # Fix RefreshToken timezone issues
        print("Fixing RefreshToken timezone issues...")
        tokens = await RefreshToken.find().to_list()
        fixed_tokens = 0
        
        for token in tokens:
            updated = False
            
            # Fix created_at
            if token.created_at and token.created_at.tzinfo is None:
                token.created_at = token.created_at.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix expires_at
            if token.expires_at and token.expires_at.tzinfo is None:
                token.expires_at = token.expires_at.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix last_used
            if token.last_used and token.last_used.tzinfo is None:
                token.last_used = token.last_used.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix revoked_at
            if token.revoked_at and token.revoked_at.tzinfo is None:
                token.revoked_at = token.revoked_at.replace(tzinfo=timezone.utc)
                updated = True
            
            if updated:
                await token.save()
                fixed_tokens += 1
        
        print(f"Fixed {fixed_tokens} RefreshToken records")
        
        # Fix User timezone issues
        print("Fixing User timezone issues...")
        users = await User.find().to_list()
        fixed_users = 0
        
        for user in users:
            updated = False
            
            # Fix created_at
            if user.created_at and user.created_at.tzinfo is None:
                user.created_at = user.created_at.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix updated_at
            if user.updated_at and user.updated_at.tzinfo is None:
                user.updated_at = user.updated_at.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix email_verified_at
            if user.email_verified_at and user.email_verified_at.tzinfo is None:
                user.email_verified_at = user.email_verified_at.replace(tzinfo=timezone.utc)
                updated = True
            
            # Fix last_login_at
            if user.last_login_at and user.last_login_at.tzinfo is None:
                user.last_login_at = user.last_login_at.replace(tzinfo=timezone.utc)
                updated = True
            
            if updated:
                await user.save()
                fixed_users += 1
        
        print(f"Fixed {fixed_users} User records")
        
        print("Timezone fix completed successfully!")
        
    except Exception as e:
        print(f"Error fixing timezone data: {e}")
        raise
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(fix_timezone_data())
