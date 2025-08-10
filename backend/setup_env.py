#!/usr/bin/env python3
"""
Setup environment file for course generator
"""
import os

def create_env_file():
    """Create .env file if it doesn't exist"""
    
    env_path = ".env"
    
    if os.path.exists(env_path):
        print("✅ .env file already exists")
        return
    
    print("🔧 Creating .env file...")
    
    # Environment template
    env_content = """# Environment variables for Course Data Generator
# Update the values below with your actual credentials

# Google Gemini AI Configuration
# Get your key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_google_gemini_api_key_here

# MongoDB Configuration
MONGODB_URI=mongodb+srv://tranduongminhdai:mutoyugi@cluster0.f6gxr5y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=learntwinchain

# YouTube Data API (for real-time video search)
# Get from: https://console.developers.google.com/
# Enable YouTube Data API v3 in your Google Cloud Console
YOUTUBE_API_KEY=your_youtube_api_key_here

# Other configurations (from main env.example)
ENVIRONMENT=development
DEBUG=True
HOST=0.0.0.0
PORT=8000
"""
    
    try:
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print(f"✅ Created {env_path}")
        print("\n⚠️  IMPORTANT: Update the following values in .env:")
        print("   1. GEMINI_API_KEY - Get from https://aistudio.google.com/app/apikey")
        print("   2. Verify MONGODB_URI is correct")
        print("\n📝 Then run: python test_generator_setup.py")
        
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")

def check_gemini_key():
    """Check if Gemini API key looks valid"""
    from dotenv import load_dotenv
    load_dotenv()
    
    key = os.getenv('GEMINI_API_KEY')
    
    if not key:
        print("❌ GEMINI_API_KEY not found")
        return False
    
    if key == 'your_google_gemini_api_key_here':
        print("⚠️  GEMINI_API_KEY still has placeholder value")
        print("   Please update with your actual API key from https://aistudio.google.com/app/apikey")
        return False
    
    if len(key) < 20:
        print("⚠️  GEMINI_API_KEY seems too short")
        return False
    
    print("✅ GEMINI_API_KEY looks valid")
    return True

def main():
    """Main setup function"""
    print("🛠️  Course Generator Environment Setup")
    print("=" * 40)
    
    # Create .env if needed
    create_env_file()
    
    # Check the key
    print("\n🔑 Checking API Key...")
    key_valid = check_gemini_key()
    
    if key_valid:
        print("\n🎯 Setup complete! Next steps:")
        print("1. Run: python test_generator_setup.py")
        print("2. If tests pass, run: python run_course_generator.py")
    else:
        print("\n📝 Please update your .env file with valid credentials")

if __name__ == "__main__":
    main()
