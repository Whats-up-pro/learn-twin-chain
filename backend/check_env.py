#!/usr/bin/env python3
"""
Environment validation script for LearnTwinChain
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_required_vars():
    """Check if required environment variables are set"""
    
    # Group environment variables by category
    categories = {
        "Database": [
            ("MONGODB_URI", "Database connection"),
            ("REDIS_URL", "Cache and sessions")
        ],
        "Security": [
            ("JWT_SECRET_KEY", "JWT authentication"),
            ("SESSION_SECRET_KEY", "Session management")
        ],
        "AI Services (Optional)": [
            ("GEMINI_API_KEY", "AI Tutor functionality"),
            ("MILVUS_URI", "RAG system"),
            ("MILVUS_USER", "RAG system"),
            ("MILVUS_PASSWORD", "RAG system")
        ],
        "Blockchain (Optional)": [
            ("BLOCKCHAIN_RPC_URL", "Smart contract interaction"),
            ("BLOCKCHAIN_PRIVATE_KEY", "Contract deployment")
        ],
        "IPFS (Optional)": [
            ("PINATA_API_KEY", "Decentralized storage"),
            ("PINATA_SECRET_API_KEY", "Decentralized storage")
        ],
        "Email (Optional)": [
            ("MAIL_USERNAME", "Email notifications"),
            ("MAIL_PASSWORD", "Email notifications")
        ]
    }
    
    all_valid = True
    
    for category, vars_list in categories.items():
        print(f"\n📋 {category}:")
        category_valid = True
        
        for var_name, description in vars_list:
            value = os.getenv(var_name)
            if value:
                # Mask sensitive values
                if 'key' in var_name.lower() or 'password' in var_name.lower():
                    display_value = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
                else:
                    display_value = value[:50] + "..." if len(value) > 50 else value
                
                print(f"   ✅ {var_name}: {display_value}")
            else:
                print(f"   ❌ {var_name}: Not set ({description})")
                if "Optional" not in category:
                    category_valid = False
                    all_valid = False
        
        if not category_valid and "Optional" not in category:
            print(f"   ⚠️  {category} configuration incomplete!")
    
    return all_valid

def check_files():
    """Check if required files exist"""
    print("\n📁 Required Files:")
    
    files = [
        (".env", "Environment configuration"),
        ("requirements.txt", "Python dependencies"),
        ("package.json", "Node.js dependencies"),
        ("docker-compose.yml", "Docker services"),
        ("digital_twin/main.py", "Main application")
    ]
    
    all_exist = True
    
    for file_path, description in files:
        if os.path.exists(file_path):
            print(f"   ✅ {file_path}: Found")
        else:
            print(f"   ❌ {file_path}: Missing ({description})")
            all_exist = False
    
    return all_exist

def check_python_deps():
    """Check if critical Python packages are installed"""
    print("\n📦 Python Dependencies:")
    
    critical_packages = [
        "fastapi",
        "uvicorn", 
        "pymongo",
        "redis",
        "python-dotenv"
    ]
    
    missing_packages = []
    
    for package in critical_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"   ✅ {package}: Installed")
        except ImportError:
            print(f"   ❌ {package}: Not installed")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n💡 Install missing packages: pip install {' '.join(missing_packages)}")
        return False
    
    return True

def check_services():
    """Check if external services are accessible"""
    print("\n🔗 Service Connectivity:")
    
    # Check MongoDB
    try:
        from pymongo import MongoClient
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
        client.server_info()
        print("   ✅ MongoDB: Connected")
        client.close()
    except Exception as e:
        print(f"   ❌ MongoDB: Connection failed ({str(e)[:50]}...)")
    
    # Check Redis
    try:
        import redis
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        r = redis.from_url(redis_url, socket_timeout=3)
        r.ping()
        print("   ✅ Redis: Connected")
    except Exception as e:
        print(f"   ❌ Redis: Connection failed ({str(e)[:50]}...)")
    
    # Check Gemini API (if configured)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            print("   ✅ Gemini AI: API key configured")
        except Exception as e:
            print(f"   ❌ Gemini AI: Configuration failed ({str(e)[:50]}...)")
            else:
        print("   ⚠️  Gemini AI: Not configured (optional)")

def print_summary(env_valid, files_valid, deps_valid):
    """Print validation summary"""
    print("\n" + "="*50)
    print("📊 VALIDATION SUMMARY")
    print("="*50)
    
    total_checks = 3
    passed_checks = sum([env_valid, files_valid, deps_valid])
    
    print(f"✅ Passed: {passed_checks}/{total_checks} checks")
    
    if env_valid and files_valid and deps_valid:
        print("\n🎉 Environment is ready!")
        print("💡 Run: python start_backend.py")
    elif files_valid and deps_valid:
        print("\n⚠️  Environment mostly ready!")
        print("💡 Configure missing environment variables")
        print("💡 Run: python start_backend.py (limited functionality)")
        else:
        print("\n❌ Environment needs setup!")
        print("💡 Run: python quick_setup.py")
        print("💡 Or follow SETUP.MD instructions")

def main():
    """Main validation function"""
    print("🔍 LearnTwinChain Environment Validation")
    print("="*50)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("❌ .env file not found")
        print("💡 Create from template: cp env.example .env")
        print("💡 Or run: python quick_setup.py")
        sys.exit(1)
    
    # Run all checks
    env_valid = check_required_vars()
    files_valid = check_files()
    deps_valid = check_python_deps()
    
    # Check services (non-blocking)
    check_services()
    
    # Print summary
    print_summary(env_valid, files_valid, deps_valid)
    
    # Exit with appropriate code
    if env_valid and files_valid and deps_valid:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()