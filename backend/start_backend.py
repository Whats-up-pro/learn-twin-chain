#!/usr/bin/env python3
"""
Start the backend server
"""

import uvicorn
import os
import sys
from dotenv import load_dotenv

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Run this first venv\Scripts\activate
# Load environment variables
load_dotenv('.env')

def check_milvus_connection():
    """Check Milvus connection during startup"""
    print("🔍 Checking Milvus connection...")
    
    try:
        # Check if required environment variables are set
        milvus_uri = os.getenv("MILVUS_URI")
        milvus_user = os.getenv("MILVUS_USER") 
        milvus_password = os.getenv("MILVUS_PASSWORD")
        
        if not milvus_uri:
            print("⚠️  MILVUS_URI not set - RAG system will be unavailable")
            return False
        if not milvus_user:
            print("⚠️  MILVUS_USER not set - RAG system will be unavailable")
            return False
        if not milvus_password:
            print("⚠️  MILVUS_PASSWORD not set - RAG system will be unavailable")
            return False
        
        # Try to connect to Milvus
        from pymilvus import connections, utility
        
        # Disconnect any existing connections
        try:
            connections.disconnect("startup_test")
        except:
            pass
        
        # Test connection
        connections.connect(
            alias="startup_test",
            uri=milvus_uri,
            user=milvus_user,
            password=milvus_password,
            secure=True
        )
        
        # Test basic functionality
        collections = utility.list_collections(using="startup_test")
        
        # Disconnect test connection
        connections.disconnect("startup_test")
        
        print("✅ Milvus connection successful!")
        print(f"   📍 URI: {milvus_uri}")
        print(f"   👤 User: {milvus_user}")
        print(f"   📚 Collections found: {len(collections)}")
        if collections:
            print(f"   📋 Available collections: {', '.join(collections)}")
        
        return True
        
    except ImportError:
        print("⚠️  pymilvus not installed - RAG system will be unavailable")
        print("   💡 Install with: pip install pymilvus")
        return False
    except Exception as e:
        print(f"❌ Milvus connection failed: {e}")
        print("   💡 Check your Milvus credentials and network connection")
        return False

def check_gemini_api():
    """Check Gemini API configuration"""
    print("🤖 Checking Gemini API configuration...")
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_api_key:
        print("⚠️  GEMINI_API_KEY not set - AI Tutor will be unavailable")
        return False
    
    try:
        import google.generativeai as genai
        
        # Basic API key validation
        genai.configure(api_key=gemini_api_key)
        
        print("✅ Gemini API configured successfully!")
        print(f"   🔑 API Key: {gemini_api_key[:8]}...{gemini_api_key[-4:]}")
        
        return True
        
    except ImportError:
        print("⚠️  google-generativeai not installed - AI Tutor will be unavailable")
        print("   💡 Install with: pip install google-generativeai")
        return False
    except Exception as e:
        print(f"❌ Gemini API configuration failed: {e}")
        return False

def check_rag_system():
    """Check RAG system availability"""
    print("🧠 Checking RAG system...")
    
    try:
        from rag.rag import LearnTwinRAGAgent
        print("✅ RAG system code available!")
        
        # Quick initialization test (without actually connecting)
        milvus_ok = check_milvus_connection()
        gemini_ok = check_gemini_api()
        
        if milvus_ok and gemini_ok:
            print("🎉 Full RAG system ready!")
            return True
        else:
            print("⚠️  RAG system partially available (missing some dependencies)")
            return False
            
    except ImportError as e:
        print(f"❌ RAG system not available: {e}")
        print("   💡 Check if rag.py is in the correct location")
        return False

if __name__ == "__main__":
    print("🚀 Starting LearnTwinChain Backend Server...")
    print("=" * 50)
    
    # System checks
    print("\n📋 Pre-flight checks:")
    print("-" * 25)
    
    # Check RAG system
    rag_available = check_rag_system()
    
    print("\n" + "=" * 50)
    
    if rag_available:
        print("🟢 All systems ready - Starting server with full AI capabilities...")
    else:
        print("🟡 Starting server with limited capabilities...")
        print("   ℹ️  Some AI features may not be available")
    
    print("=" * 50)
    
    # Start the server
    uvicorn.run(
        "digital_twin.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 