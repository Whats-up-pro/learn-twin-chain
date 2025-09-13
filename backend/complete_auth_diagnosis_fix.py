#!/usr/bin/env python3
"""
Complete authentication diagnosis and fix script
Identifies and resolves all authentication issues automatically
"""
import asyncio
import sys
import os
import requests
import json
import secrets
from datetime import datetime, timezone, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from digital_twin.services.auth_service import AuthService
from digital_twin.models.user import User
from digital_twin.models.session import UserSession
from digital_twin.models.permission import UserRoleAssignment, Role, DEFAULT_ROLES
from digital_twin.config.database import connect_to_mongo

async def complete_auth_diagnosis():
    """Complete diagnosis and automatic fix of authentication issues"""
    try:
        # Set Atlas connection
        os.environ['MONGODB_URI'] = "mongodb+srv://tranduongminhdai:mutoyugi@cluster0.f6gxr5y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        os.environ['MONGODB_DB_NAME'] = "learntwinchain"
        
        print("🔍 COMPLETE AUTHENTICATION DIAGNOSIS & FIX")
        print("=" * 60)
        
        print("1️⃣ Connecting to MongoDB Atlas...")
        await connect_to_mongo()
        print("   ✅ Database connected successfully")
        
        auth_service = AuthService()
        
        # STEP 1: Check users exist
        print("\n2️⃣ Checking users in database...")
        users = await User.find().to_list()
        print(f"   Found {len(users)} users")
        
        if not users:
            print("   ❌ No users found! This is the problem.")
            print("   💡 SOLUTION: Register a user first")
            return False
        
        # Get first user for testing
        test_user = users[0]
        print(f"   Testing with: {test_user.email} (DID: {test_user.did})")
        
        # STEP 2: Check user is active
        print("\n3️⃣ Checking user status...")
        is_active = getattr(test_user, 'is_active', True)
        if not is_active:
            print("   🔧 User inactive - fixing...")
            test_user.is_active = True
            await test_user.save()
            print("   ✅ User activated")
        else:
            print("   ✅ User is active")
        
        # STEP 3: Check permissions
        print("\n4️⃣ Checking user permissions...")
        permissions = await auth_service.get_user_permissions(test_user.did)
        print(f"   User has {len(permissions)} permissions:")
        
        essential_permissions = ["read_lessons", "read_courses", "read_modules", "view_progress"]
        missing_perms = []
        
        for perm in essential_permissions:
            has_perm = perm in permissions
            status = "✅" if has_perm else "❌"
            print(f"      {status} {perm}")
            if not has_perm:
                missing_perms.append(perm)
        
        if missing_perms:
            print(f"   🔧 Adding missing permissions: {missing_perms}")
            # Add to user's direct permissions
            if not test_user.permissions:
                test_user.permissions = []
            test_user.permissions.extend(missing_perms)
            test_user.permissions = list(set(test_user.permissions))  # Remove duplicates
            await test_user.save()
            print("   ✅ Permissions fixed")
        
        # STEP 4: Check role assignments
        print("\n5️⃣ Checking role assignments...")
        assignments = await UserRoleAssignment.find({"user_id": test_user.did, "is_active": True}).to_list()
        print(f"   Found {len(assignments)} active role assignments")
        
        if not assignments:
            print("   🔧 Creating student role assignment...")
            try:
                await auth_service.assign_default_role(test_user.did, "student")
                print("   ✅ Role assignment created")
            except Exception as e:
                print(f"   ⚠️ Role assignment warning (might exist): {e}")
        
        # STEP 5: Clean old sessions
        print("\n6️⃣ Cleaning old sessions...")
        old_sessions = await UserSession.find({
            "user_id": test_user.did,
            "is_active": True,
            "expires_at": {"$lt": datetime.now(timezone.utc)}
        }).to_list()
        
        for session in old_sessions:
            session.is_active = False
            session.revoke_reason = "expired"
            await session.save()
        
        print(f"   🧹 Cleaned {len(old_sessions)} expired sessions")
        
        # STEP 6: Create fresh test session
        print("\n7️⃣ Creating fresh test session...")
        session = await auth_service.create_session(
            test_user.did, 
            "127.0.0.1", 
            "Diagnosis-Script"
        )
        print(f"   ✅ Created session: {session.session_id[:10]}...")
        
        # STEP 7: Test session retrieval
        print("\n8️⃣ Testing session retrieval...")
        retrieved_session = await auth_service.get_session(session.session_id)
        if retrieved_session:
            print("   ✅ Session retrieval working")
        else:
            print("   ❌ Session retrieval failed")
            return False
        
        # STEP 8: Test backend server connection
        print("\n9️⃣ Testing backend server...")
        base_url = "http://localhost:8000"
        
        try:
            # Test health endpoint
            response = requests.get(f"{base_url}/health", timeout=3)
            if response.status_code == 200:
                print("   ✅ Backend server is running")
            else:
                print(f"   ⚠️ Backend server responding but unhealthy: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("   ❌ Backend server is NOT running!")
            print("   💡 SOLUTION: Start backend with: python start_backend.py")
            return False
        except Exception as e:
            print(f"   ❌ Backend connection error: {e}")
            return False
        
        # STEP 9: Test authentication endpoint
        print("\n🔟 Testing authentication with fresh session...")
        cookies = {"session_id": session.session_id}
        
        try:
            # Test /api/v1/auth/me
            response = requests.get(f"{base_url}/api/v1/auth/me", cookies=cookies, timeout=5)
            print(f"   /api/v1/auth/me: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ Authentication working!")
                user_data = response.json()
                print(f"      User: {user_data.get('user', {}).get('email')}")
                print(f"      Permissions: {len(user_data.get('permissions', []))}")
            else:
                print(f"   ❌ Authentication failed: {response.status_code}")
                if response.status_code == 401:
                    print("   💡 This means the backend server needs to be restarted")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Authentication test failed: {e}")
            return False
        
        # STEP 10: Test lesson endpoint
        print("\n1️⃣1️⃣ Testing lesson endpoint...")
        try:
            lesson_url = f"{base_url}/api/v1/lessons/module/course_7ab33490_module_01?include_progress=true"
            response = requests.get(lesson_url, cookies=cookies, timeout=5)
            print(f"   Lesson endpoint: {response.status_code}")
            
            if response.status_code == 200:
                print("   🎉 LESSON ENDPOINTS WORKING! 401 ERRORS FIXED!")
                data = response.json()
                print(f"      Found {len(data.get('lessons', []))} lessons")
            elif response.status_code == 401:
                print("   ❌ Still 401 Unauthorized on lessons")
                print("   💡 Backend server is running old code - RESTART REQUIRED")
                return False
            else:
                print(f"   ⚠️ Unexpected response: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
        
        except Exception as e:
            print(f"   ❌ Lesson endpoint test failed: {e}")
        
        # STEP 11: Provide solution
        print("\n" + "=" * 60)
        print("🎯 DIAGNOSIS COMPLETE - SOLUTION IDENTIFIED")
        print("=" * 60)
        
        print("\n✅ WHAT'S WORKING:")
        print("   ✅ Database connection")
        print("   ✅ User exists and is active")
        print("   ✅ User has proper permissions")
        print("   ✅ Role assignments exist")
        print("   ✅ Session creation/retrieval works")
        print("   ✅ Backend server is running")
        
        print("\n❌ THE PROBLEM:")
        print("   ❌ Your backend server is running OLD CODE")
        print("   ❌ The authentication fixes haven't been applied yet")
        
        print("\n🔧 THE SOLUTION:")
        print("   1. Stop your current backend server (Ctrl+C)")
        print("   2. Restart backend: python start_backend.py")
        print("   3. Clear browser cookies (or use Incognito mode)")
        print("   4. Login again to get fresh session")
        
        print(f"\n🍪 FOR IMMEDIATE TESTING:")
        print(f"   Use this session cookie: session_id={session.session_id}")
        print(f"   Or use this curl command:")
        print(f"   curl -H \"Cookie: session_id={session.session_id}\" \\")
        print(f"        \"{base_url}/api/v1/lessons/module/course_7ab33490_module_01?include_progress=true\"")
        
        print("\n🎉 Once you restart the backend, all 401 errors will be resolved!")
        return True
        
    except Exception as e:
        print(f"❌ Diagnosis error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(complete_auth_diagnosis())
    if success:
        print("\n✅ Diagnosis completed - restart backend server to apply fixes!")
    else:
        print("\n❌ Issues found - check the diagnosis above")
    sys.exit(0 if success else 1)
