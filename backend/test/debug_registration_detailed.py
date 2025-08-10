"""
Script debug chi tiết registration process để tìm nguyên nhân lỗi 500
"""
import os
import sys
import asyncio
from pathlib import Path
import traceback

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

async def test_mongodb_connection():
    """Test MongoDB connection và database operations"""
    print("\n🗄️ Testing MongoDB connection...")
    
    try:
        # Load environment
        env_file = backend_dir / ".env"
        load_dotenv(env_file)
        
        # Test MongoDB connection
        from motor.motor_asyncio import AsyncIOMotorClient
        
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/learntwinchain")
        print(f"📡 Connecting to MongoDB: {mongodb_uri}")
        
        client = AsyncIOMotorClient(mongodb_uri)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Test database access
        db_name = os.getenv("MONGODB_DB_NAME", "learntwinchain")
        db = client[db_name]
        
        # Test collections
        collections = await db.list_collection_names()
        print(f"✅ Database '{db_name}' accessible, collections: {collections}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        traceback.print_exc()
        return False

async def test_beanie_models():
    """Test Beanie models initialization"""
    print("\n📋 Testing Beanie models...")
    
    try:
        # Import và khởi tạo database connection
        from digital_twin.config.database import connect_to_mongo
        
        await connect_to_mongo()
        print("✅ Beanie models initialized successfully!")
        
        # Test User model
        from digital_twin.models.user import User
        
        # Test find operation
        test_users = await User.find().limit(1).to_list()
        print(f"✅ User model accessible, found {len(test_users)} users")
        
        return True
        
    except Exception as e:
        print(f"❌ Beanie models test failed: {e}")
        traceback.print_exc()
        return False

async def test_user_creation():
    """Test tạo user mới không gửi email"""
    print("\n👤 Testing user creation process...")
    
    try:
        from digital_twin.models.user import User
        from digital_twin.services.auth_service import AuthService
        import secrets
        
        auth_service = AuthService()
        
        # Test data
        test_username = f"debuguser_{secrets.token_hex(4)}"
        test_email = f"debug_{secrets.token_hex(4)}@example.com"
        
        test_user_data = {
            "did": f"did:learntwin:{test_username}",
            "email": test_email,
            "password": "TestPassword123!",
            "name": "Debug User",
            "role": "student",
            "institution": "UIT",
            "program": "Computer Science",
            "birth_year": 2000
        }
        
        print(f"📝 Creating test user: {test_user_data['did']}")
        
        # Test password validation
        if not auth_service.validate_password(test_user_data["password"]):
            print("❌ Password validation failed")
            return False
        print("✅ Password validation passed")
        
        # Test password hashing
        password_hash = auth_service.hash_password(test_user_data["password"])
        print("✅ Password hashing successful")
        
        # Test user model creation (without saving)
        user = User(
            did=test_user_data["did"],
            email=test_user_data["email"],
            password_hash=password_hash,
            name=test_user_data["name"],
            role=test_user_data["role"],
            institution=test_user_data["institution"],
            program=test_user_data["program"],
            birth_year=test_user_data["birth_year"],
            is_email_verified=True  # Skip email verification for test
        )
        
        print("✅ User model created successfully")
        
        # Test user saving to database
        await user.insert()
        print("✅ User saved to database successfully!")
        
        # Clean up - delete test user
        await user.delete()
        print("✅ Test user cleaned up")
        
        return True
        
    except Exception as e:
        print(f"❌ User creation test failed: {e}")
        traceback.print_exc()
        return False

async def test_email_verification_token():
    """Test email verification token generation"""
    print("\n🔐 Testing email verification token...")
    
    try:
        import secrets
        from datetime import datetime, timezone, timedelta
        
        # Test token generation
        verification_token = secrets.token_urlsafe(32)
        verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        
        print(f"✅ Verification token generated: {verification_token[:10]}...")
        print(f"✅ Expiration time: {verification_expires}")
        
        return True
        
    except Exception as e:
        print(f"❌ Token generation failed: {e}")
        return False

async def test_email_sending_isolated():
    """Test email sending riêng biệt"""
    print("\n📬 Testing email sending (isolated)...")
    
    try:
        from digital_twin.services.email_service import EmailService
        
        email_service = EmailService()
        
        if not email_service.fastmail:
            print("❌ EmailService not configured")
            return False
        
        print("✅ EmailService ready for sending")
        
        # Test creating verification URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        test_token = "test_token_123"
        verification_url = f"{frontend_url}/verify-email?token={test_token}"
        
        print(f"✅ Verification URL: {verification_url}")
        
        # NOTE: Không gửi email thật để tránh spam
        print("⚠️ Skipping actual email sending to avoid spam")
        
        return True
        
    except Exception as e:
        print(f"❌ Email sending test failed: {e}")
        traceback.print_exc()
        return False

async def test_full_registration_process():
    """Test toàn bộ registration process với exception handling chi tiết"""
    print("\n🔄 Testing full registration process...")
    
    try:
        from digital_twin.services.auth_service import AuthService
        import secrets
        
        auth_service = AuthService()
        
        # Test data
        test_username = f"fulltest_{secrets.token_hex(4)}"
        test_email = f"fulltest_{secrets.token_hex(4)}@example.com"
        
        test_user_data = {
            "did": f"did:learntwin:{test_username}",
            "email": test_email,
            "password": "TestPassword123!",
            "name": "Full Test User",
            "role": "student",
            "institution": "UIT",
            "program": "Computer Science",
            "birth_year": 2000
        }
        
        print(f"📝 Testing full registration: {test_user_data['did']}")
        
        # Step by step registration
        print("🔍 Step 1: Check if user exists...")
        from digital_twin.models.user import User
        existing_user = await User.find_one({
            "$or": [
                {"email": test_user_data["email"]}, 
                {"did": test_user_data["did"]}
            ]
        })
        
        if existing_user:
            print("⚠️ Test user already exists, deleting...")
            await existing_user.delete()
        
        print("✅ No conflicting user found")
        
        print("🔍 Step 2: Validate password...")
        if not auth_service.validate_password(test_user_data["password"]):
            print("❌ Password validation failed")
            return False
        print("✅ Password validation passed")
        
        print("🔍 Step 3: Hash password...")
        password_hash = auth_service.hash_password(test_user_data["password"])
        print("✅ Password hashed successfully")
        
        print("🔍 Step 4: Generate verification token...")
        import secrets
        from datetime import datetime, timezone, timedelta
        verification_token = secrets.token_urlsafe(32)
        verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        print("✅ Verification token generated")
        
        print("🔍 Step 5: Create user object...")
        user = User(
            did=test_user_data["did"],
            email=test_user_data["email"],
            password_hash=password_hash,
            name=test_user_data["name"],
            role=test_user_data["role"],
            institution=test_user_data["institution"],
            program=test_user_data["program"],
            birth_year=test_user_data["birth_year"],
            email_verification_token=verification_token,
            email_verification_expires=verification_expires,
            is_email_verified=False
        )
        print("✅ User object created")
        
        print("🔍 Step 6: Save user to database...")
        await user.insert()
        print("✅ User saved to database")
        
        print("🔍 Step 7: Create user profile...")
        # SKIP UserProfile creation due to Beanie initialization issue
        print("⚠️ Skipping UserProfile creation (disabled in auth_service)")
        # from digital_twin.models.user import UserProfile
        # profile = UserProfile(user_id=user.did)
        # await profile.insert()
        print("✅ User profile step skipped")
        
        print("🔍 Step 8: Assign default role...")
        await auth_service.assign_default_role(user.did, user.role)
        print("✅ Default role assigned")
        
        print("🔍 Step 9: Test email sending (without actually sending)...")
        # Skip email sending to avoid issues
        print("⚠️ Skipping email sending step")
        
        print("✅ FULL REGISTRATION PROCESS SUCCESSFUL!")
        
        # Clean up
        # await profile.delete()  # Skip since we didn't create profile
        await user.delete()
        print("✅ Test data cleaned up")
        
        return True
        
    except Exception as e:
        print(f"❌ Full registration process failed at step: {e}")
        traceback.print_exc()
        return False

async def main():
    """Main debug function"""
    print("🔍 DETAILED REGISTRATION DEBUG")
    print("=" * 60)
    
    # Load environment
    env_file = backend_dir / ".env"
    load_dotenv(env_file)
    
    # Test sequence
    tests = [
        ("MongoDB Connection", test_mongodb_connection),
        ("Beanie Models", test_beanie_models),
        ("User Creation", test_user_creation),
        ("Email Token Generation", test_email_verification_token),
        ("Email Service (Isolated)", test_email_sending_isolated),
        ("Full Registration Process", test_full_registration_process),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = await test_func()
            results[test_name] = result
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "="*60)
    print("📊 DETAILED DEBUG SUMMARY")
    print("="*60)
    
    for test_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"{status} {test_name}")
    
    # Analysis
    failed_tests = [name for name, result in results.items() if not result]
    
    if not failed_tests:
        print("\n🎉 TẤT CẢ TESTS PASSED!")
        print("💡 Registration lỗi có thể do email sending hoặc exception handling")
        print("💡 Hãy kiểm tra logs chi tiết trong backend khi chạy registration")
    else:
        print(f"\n❌ FAILED TESTS: {', '.join(failed_tests)}")
        print("💡 Cần fix các component này trước khi registration hoạt động")
    
    # Specific recommendations
    if "MongoDB Connection" in failed_tests:
        print("\n🔧 MongoDB Issues:")
        print("   - Kiểm tra MongoDB có đang chạy: net start MongoDB")
        print("   - Kiểm tra MONGODB_URI trong .env")
    
    if "Beanie Models" in failed_tests:
        print("\n🔧 Model Issues:")
        print("   - Có thể do schema conflicts")
        print("   - Thử drop database và recreate")
    
    if "Email Service (Isolated)" in failed_tests:
        print("\n🔧 Email Issues:")
        print("   - Kiểm tra fastapi-mail installation")
        print("   - Kiểm tra email credentials trong .env")

if __name__ == "__main__":
    asyncio.run(main())
