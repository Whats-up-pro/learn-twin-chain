#!/usr/bin/env python3
"""
Test script to verify Milvus auto_id fix
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag import LearnTwinRAGAgent

def test_milvus_insertion():
    """Test if the auto_id fix works"""
    print("🧪 Testing Milvus auto_id fix...")
    
    try:
        # Initialize RAG agent with new collection name
        rag = LearnTwinRAGAgent(
            collection_name="learntwinchain", 
            verbose=1
        )
        
        print("✅ RAG Agent initialized successfully!")
        
        # Test with a simple document
        test_file = "test_document.txt"
        with open(test_file, "w", encoding="utf-8") as f:
            f.write("This is a test document for verifying Milvus auto_id functionality. It contains sample text to be embedded and stored.")
        
        print(f"📄 Created test file: {test_file}")
        
        # Try to upload the document
        success = rag.upload_document(test_file)
        
        if success:
            print("🎉 SUCCESS! Document uploaded without auto_id errors!")
            
            # Test querying
            result = rag.query("What is this document about?")
            if result.get("success"):
                print("🔍 Query test also successful!")
                print(f"Answer: {result['answer'][:100]}...")
            else:
                print("⚠️ Upload worked but query failed")
        else:
            print("❌ Document upload failed")
            
        # Cleanup
        if os.path.exists(test_file):
            os.remove(test_file)
            print(f"🧹 Cleaned up {test_file}")
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False
    
    return success

if __name__ == "__main__":
    test_milvus_insertion()
