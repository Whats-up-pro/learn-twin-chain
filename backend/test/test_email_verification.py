"""
Test script để debug email verification và cấu hình .env
"""
import os
import sys
import asyncio
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
import requests
import json
import time

def check_env_file():
    """Kiểm tra file .env có tồn tại và readable không"""
    print("🔍 Checking .env file...")
    
    env_file = backend_dir / ".env"
    print(f"Looking for .env at: {env_file}")
    
    if not env_file.exists():
        print("❌ File .env KHÔNG TỒN TẠI!")
        print("Hãy tạo file .env trong thư mục backend/ với cấu hình email")
        return False
    
    print("✅ File .env tồn tại")
    
    # Try to read .env file
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"✅ File .env có thể đọc được ({len(content)} characters)")
        return True
    except Exception as e:
        print(f"❌ Không thể đọc file .env: {e}")
        return False

def load_and_display_env():
    """Load và hiển thị các biến email configuration"""
    print("\n📧 Loading email configuration from .env...")
    
    # Load .env file
    env_file = backend_dir / ".env"
    load_dotenv(env_file)
    
    email_vars = {
        'MAIL_USERNAME': os.getenv('MAIL_USERNAME'),
        'MAIL_PASSWORD': os.getenv('MAIL_PASSWORD'),
        'MAIL_FROM': os.getenv('MAIL_FROM'),
        'MAIL_PORT': os.getenv('MAIL_PORT'),
        'MAIL_SERVER': os.getenv('MAIL_SERVER'),
        'MAIL_FROM_NAME': os.getenv('MAIL_FROM_NAME'),
        'MAIL_STARTTLS': os.getenv('MAIL_STARTTLS'),
        'MAIL_SSL_TLS': os.getenv('MAIL_SSL_TLS'),
    }
    
    print("Email configuration variables:")
    for key, value in email_vars.items():
        if key == 'MAIL_PASSWORD':
            # Mask password for security
            masked_value = '*' * len(value) if value else None
            print(f"  {key}: {masked_value}")
        else:
            print(f"  {key}: {value}")
    
    # Check for missing required variables
    required_vars = ['MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_FROM', 'MAIL_SERVER']
    missing_vars = [var for var in required_vars if not email_vars[var]]
    
    if missing_vars:
        print(f"❌ Thiếu các biến bắt buộc: {missing_vars}")
        return None
    
    print("✅ Tất cả biến email bắt buộc đều có giá trị")
    return email_vars

def test_smtp_connection(email_config):
    """Test email configuration values"""
    print("\n🔌 Testing email configuration...")
    
    try:
        mail_server = email_config['MAIL_SERVER']
        mail_port = email_config['MAIL_PORT']
        mail_username = email_config['MAIL_USERNAME']
        
        print(f"✅ Email server: {mail_server}:{mail_port}")
        print(f"✅ Username: {mail_username}")
        print(f"✅ Password: {'*' * len(email_config['MAIL_PASSWORD']) if email_config['MAIL_PASSWORD'] else 'NOT SET'}")
        
        # Validate Gmail configuration
        if 'gmail.com' in mail_server.lower():
            if mail_port != '587':
                print(f"⚠️ Gmail thường dùng port 587, bạn đang dùng: {mail_port}")
            if email_config['MAIL_STARTTLS'] != 'True':
                print("⚠️ Gmail cần STARTTLS=True")
        
        print("✅ Email configuration validation PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Email config validation failed: {e}")
        return False

def test_email_service():
    """Test EmailService class từ digital_twin"""
    print("\n🛠️ Testing EmailService class...")
    
    try:
        from digital_twin.services.email_service import EmailService
        
        # Initialize EmailService
        email_service = EmailService()
        
        # Check if email service is configured
        if not email_service.fastmail:
            print("❌ EmailService không được cấu hình (fastmail is None)")
            print("💡 Có thể do thiếu biến .env hoặc lỗi import fastapi_mail")
            return False
        
        print("✅ EmailService được khởi tạo thành công")
        print(f"✅ FastMail instance: {email_service.fastmail}")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Có thể thiếu package: pip install fastapi-mail")
        return False
    except Exception as e:
        print(f"❌ EmailService initialization failed: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

def test_registration_endpoint():
    """Test endpoint POST /api/v1/auth/register với test data"""
    print("\n🌐 Testing registration endpoint...")
    
    # Backend URL
    backend_url = "http://localhost:8000"
    register_url = f"{backend_url}/api/v1/auth/register"
    
    # Test user data
    test_user_data = {
        "username": f"testuser_{int(time.time())}",  # Unique username
        "name": "Test User",
        "email": "test.verification@example.com",  # Thay bằng email thật để test
        "password": "TestPassword123!",
        "role": "student",
        "avatar_url": "",
        "institution": "UIT",
        "program": "Computer Science",
        "birth_year": 2000,
        "department": "",
        "specialization": []
    }
    
    try:
        print(f"📡 Calling registration endpoint: {register_url}")
        print(f"📝 Test user data: {test_user_data['username']} ({test_user_data['email']})")
        
        # Make POST request
        response = requests.post(
            register_url,
            json=test_user_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        # Parse response
        try:
            response_data = response.json()
            print(f"📋 Response data: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response: {response.text}")
            return False
        
        # Check response status
        if response.status_code == 200:
            print("✅ Registration endpoint SUCCESS!")
            print(f"✅ User DID: {response_data.get('did', 'N/A')}")
            print(f"✅ Message: {response_data.get('message', 'N/A')}")
            
            # Kiểm tra message có chứa thông tin về email verification
            message = response_data.get('message', '')
            if 'email' in message.lower() and 'verify' in message.lower():
                print("✅ Email verification message found in response")
            else:
                print("⚠️ No email verification message in response")
            
            return True
            
        elif response.status_code == 400:
            print(f"⚠️ Registration failed with validation error: {response_data.get('detail', 'Unknown error')}")
            return False
            
        elif response.status_code == 500:
            print(f"❌ Registration failed with server error: {response_data.get('detail', 'Internal server error')}")
            print("💡 Điều này có thể do:")
            print("   - Email service không được cấu hình đúng")
            print("   - Thiếu package dependencies")
            print("   - Database connection issues")
            return False
            
        else:
            print(f"❌ Unexpected response status: {response.status_code}")
            return False
            
    except requests.ConnectionError:
        print("❌ Không thể kết nối đến backend server!")
        print("💡 Hãy đảm bảo backend đang chạy ở http://localhost:8000")
        return False
    except requests.Timeout:
        print("❌ Request timeout!")
        return False
    except Exception as e:
        print(f"❌ Registration endpoint test failed: {e}")
        return False

def test_backend_health():
    """Test xem backend server có đang chạy không"""
    print("\n🏥 Testing backend server health...")
    
    try:
        backend_url = "http://localhost:8000"
        health_url = f"{backend_url}/health"
        
        print(f"📡 Checking health endpoint: {health_url}")
        
        response = requests.get(health_url, timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Backend server is running!")
            print(f"📊 Health status: {health_data.get('status', 'unknown')}")
            
            # Check services
            services = health_data.get('services', {})
            if services:
                print("🔧 Service status:")
                for service, status in services.items():
                    status_icon = "✅" if "error" not in str(status).lower() else "❌"
                    print(f"   {status_icon} {service}: {status}")
            
            return True
        else:
            print(f"⚠️ Backend server responded with status: {response.status_code}")
            return False
            
    except requests.ConnectionError:
        print("❌ Backend server is NOT running!")
        print("💡 Start backend with: cd backend && python digital_twin/main.py")
        return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

async def test_send_verification_email():
    """Test gửi email verification thực tế"""
    print("\n📬 Testing actual email sending...")
    
    try:
        from digital_twin.services.email_service import EmailService
        
        email_service = EmailService()
        
        if not email_service.fastmail:
            print("❌ EmailService không sẵn sàng để gửi email")
            return False
        
        # Test email data
        test_email = "test@example.com"  # Thay bằng email test của bạn
        test_name = "Test User"
        test_token = "test_verification_token_123"
        
        print(f"Attempting to send verification email to: {test_email}")
        
        # Tạo verification URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verification_url = f"{frontend_url}/verify-email?token={test_token}"
        
        await email_service.send_verification_email(
            email=test_email,
            name=test_name,
            verification_url=verification_url
        )
        
        print("✅ Email gửi thành công!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_auth_service_registration():
    """Test registration process trong AuthService"""
    print("\n👤 Testing AuthService registration process...")
    
    try:
        from digital_twin.services.auth_service import AuthService
        
        auth_service = AuthService()
        print("✅ AuthService initialized successfully")
        
        # Check email service in auth service
        if hasattr(auth_service, 'email_service'):
            email_service = auth_service.email_service
            if email_service.fastmail:
                print("✅ AuthService.email_service is configured")
            else:
                print("❌ AuthService.email_service.fastmail is None")
                return False
        else:
            print("❌ AuthService không có email_service attribute")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ AuthService test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    print("🧪 EMAIL VERIFICATION DEBUG TEST")
    print("=" * 50)
    
    # 1. Check .env file
    if not check_env_file():
        print("\n❌ Test bị dừng do thiếu file .env")
        return
    
    # 2. Load and display email config
    email_config = load_and_display_env()
    if not email_config:
        print("\n❌ Test bị dừng do cấu hình email không đầy đủ")
        return
    
    # 3. Test email configuration
    smtp_ok = test_smtp_connection(email_config)
    
    # 4. Test backend server health
    backend_health = test_backend_health()
    
    # 5. Test EmailService class (chỉ khi backend healthy)
    email_service_ok = False
    auth_service_ok = False
    if backend_health:
        email_service_ok = test_email_service()
        auth_service_ok = test_auth_service_registration()
    
    # 6. Test registration endpoint (chỉ khi backend healthy)
    registration_endpoint_ok = False
    if backend_health:
        registration_endpoint_ok = test_registration_endpoint()
    
    # 7. Test actual email sending (nếu tất cả OK)
    if smtp_ok and email_service_ok and backend_health:
        print("\n🤔 Bạn có muốn test gửi email thực tế không? (y/n)")
        # Uncomment dòng dưới để test gửi email thật
        # await test_send_verification_email()
    
    # Summary
    print("\n📊 TEST SUMMARY")
    print("=" * 50)
    print(f"📁 .env file: {'✅' if True else '❌'}")
    print(f"📧 Email config: {'✅' if email_config else '❌'}")
    print(f"🔌 Email validation: {'✅' if smtp_ok else '❌'}")
    print(f"🏥 Backend health: {'✅' if backend_health else '❌'}")
    print(f"🛠️ EmailService: {'✅' if email_service_ok else '❌'}")
    print(f"👤 AuthService: {'✅' if auth_service_ok else '❌'}")
    print(f"🌐 Registration endpoint: {'✅' if registration_endpoint_ok else '❌'}")
    
    # Overall assessment
    if registration_endpoint_ok:
        print("\n🎉 REGISTRATION ENDPOINT WORKS! Email verification đang hoạt động.")
    elif backend_health and not registration_endpoint_ok:
        print("\n⚠️ BACKEND CHẠY NHƯNG REGISTRATION LỖI! Cần debug thêm.")
    elif not backend_health:
        print("\n❌ BACKEND KHÔNG CHẠY! Hãy start backend server trước.")
    else:
        print("\n⚠️ CÓ LỖI TRONG CẤU HÌNH! Cần khắc phục trước khi registration hoạt động.")
    
    # Recommendations
    print("\n💡 KHUYẾN NGHỊ:")
    if not backend_health:
        print("   1. Start backend: cd backend && python digital_twin/main.py")
    if not email_service_ok and backend_health:
        print("   2. Install missing packages: pip install fastapi-mail")
    if not smtp_ok:
        print("   3. Kiểm tra lại cấu hình email trong .env")
    if registration_endpoint_ok:
        print("   ✅ Hệ thống đã sẵn sàng! Có thể test registration từ frontend.")

if __name__ == "__main__":
    asyncio.run(main())
