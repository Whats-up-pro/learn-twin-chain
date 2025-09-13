#!/usr/bin/env python3
"""
Debug script to check user authentication and session status
"""
import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from digital_twin.services.auth_service import AuthService
from digital_twin.models.user import User
from digital_twin.models.session import UserSession
from digital_twin.models.permission import UserRoleAssignment
from digital_twin.config.database import connect_to_mongo

async def debug_user_authentication():
    """Debug user authentication issues"""
    try:
        # Set Atlas connection if not already set
        if not os.getenv('MONGODB_URI'):
            os.environ['MONGODB_URI'] = "mongodb+srv://tranduongminhdai:mutoyugi@cluster0.f6gxr5y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        if not os.getenv('MONGODB_DB_NAME'):
            os.environ['MONGODB_DB_NAME'] = "learntwinchain"
        
        print("🔗 Connecting to MongoDB Atlas...")
        print(f"   Database: {os.getenv('MONGODB_DB_NAME', 'learntwinchain')}")
        await connect_to_mongo()
        print("✅ Database connected successfully")
        
        auth_service = AuthService()
        
        # 1. Check all users
        print("\n👥 Checking all users...")
        users = await User.find().to_list()
        print(f"Found {len(users)} users")
        
        if not users:
            print("❌ No users found!")
            return False
            
        # 2. Check the most recent user (likely the one having issues)
        user = users[-1]  # Get the last user (most recent)
        print(f"\n🔍 Checking user: {user.email} ({user.did})")
        print(f"   - Is active: {getattr(user, 'is_active', 'N/A')}")
        print(f"   - Email verified: {user.is_email_verified}")
        print(f"   - Role: {user.role}")
        
        # 3. Check user sessions
        print(f"\n💾 Checking sessions for user...")
        sessions = await UserSession.find({"user_id": user.did}).to_list()
        print(f"   Found {len(sessions)} sessions")
        
        active_sessions = 0
        for session in sessions:
            if session.is_active:
                active_sessions += 1
                print(f"   ✅ Active session: {session.session_id[:10]}...")
                print(f"      Created: {session.created_at}")
                print(f"      Expires: {session.expires_at}")
            else:
                print(f"   ❌ Inactive session: {session.session_id[:10]}...")
        
        print(f"   📊 Active sessions: {active_sessions}")
        
        # 4. Check user permissions
        print(f"\n🔐 Checking user permissions...")
        try:
            permissions = await auth_service.get_user_permissions(user.did)
            print(f"   Total permissions: {len(permissions)}")
            
            essential_permissions = ["read_lessons", "read_courses", "read_modules"]
            for perm in essential_permissions:
                has_perm = perm in permissions
                print(f"   {'✅' if has_perm else '❌'} {perm}")
                
        except Exception as e:
            print(f"   ❌ Error getting permissions: {e}")
        
        # 5. Check role assignments
        print(f"\n👤 Checking role assignments...")
        assignments = await UserRoleAssignment.find({"user_id": user.did}).to_list()
        print(f"   Found {len(assignments)} role assignments")
        
        for assignment in assignments:
            status = "✅ Active" if assignment.is_active else "❌ Inactive"
            print(f"   - {assignment.role_name}: {status}")
            print(f"     Assigned: {assignment.assigned_at}")
            if assignment.expires_at:
                print(f"     Expires: {assignment.expires_at}")
        
        # 6. Test permission check directly
        print(f"\n🧪 Testing permission checks...")
        try:
            can_read_lessons = await auth_service.check_permission(user.did, "read_lessons")
            can_read_courses = await auth_service.check_permission(user.did, "read_courses")
            can_read_modules = await auth_service.check_permission(user.did, "read_modules")
            
            print(f"   Can read lessons: {'✅' if can_read_lessons else '❌'}")
            print(f"   Can read courses: {'✅' if can_read_courses else '❌'}")
            print(f"   Can read modules: {'✅' if can_read_modules else '❌'}")
            
        except Exception as e:
            print(f"   ❌ Error checking permissions: {e}")
        
        # 7. Check Redis sessions
        print(f"\n🔴 Checking Redis sessions...")
        try:
            redis_service = auth_service.redis_service
            client = await redis_service.get_client()
            
            # Look for session keys
            keys = await client.keys("session:*")
            print(f"   Found {len(keys)} Redis session keys")
            
            # Check if any belong to our user
            user_sessions = 0
            for key in keys:
                session_data = await client.get(key)
                if session_data == user.did:
                    user_sessions += 1
                    session_id = key.replace("session:", "")
                    print(f"   ✅ Redis session found: {session_id[:10]}...")
            
            print(f"   📊 User's Redis sessions: {user_sessions}")
            
        except Exception as e:
            print(f"   ❌ Error checking Redis: {e}")
        
        # 8. Summary and recommendations
        print(f"\n📋 AUTHENTICATION DEBUG SUMMARY")
        print(f"   User exists: ✅")
        print(f"   Email verified: {'✅' if user.is_email_verified else '❌'}")
        print(f"   Has active sessions: {'✅' if active_sessions > 0 else '❌'}")
        print(f"   Has role assignments: {'✅' if len(assignments) > 0 else '❌'}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if not user.is_email_verified:
            print(f"   - User needs to verify email")
        if active_sessions == 0:
            print(f"   - User needs to login to create active session")
        if len(assignments) == 0:
            print(f"   - User needs role assignment")
        
        print(f"\n🔧 TO FIX 401 ERRORS:")
        print(f"   1. Make sure user is logged in with valid session")
        print(f"   2. Check browser cookies for session_id")
        print(f"   3. Or use JWT token in Authorization header")
        
        return True
        
    except Exception as e:
        print(f"❌ Debug error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(debug_user_authentication())
    sys.exit(0 if success else 1)
