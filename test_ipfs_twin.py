#!/usr/bin/env python3
"""
Test script to verify IPFS digital twin retrieval
"""
import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from digital_twin.services.learning_service import LearningService

def test_ipfs_twin_retrieval():
    """Test fetching digital twin from IPFS"""
    print("🧪 Testing IPFS digital twin retrieval...")
    
    # Initialize learning service
    learning_service = LearningService()
    
    # Test with the known twin ID from the IPFS data
    twin_id = "did:learntwin:tranduongminhdai"
    
    print(f"📤 Fetching twin: {twin_id}")
    
    # Try to get the twin (should fetch from IPFS)
    twin_data = learning_service.get_student_twin(twin_id)
    
    if twin_data:
        print("✅ Successfully retrieved twin from IPFS!")
        print(f"📊 Twin ID: {twin_data.get('twin_id')}")
        print(f"👤 Owner: {twin_data.get('owner_did')}")
        print(f"📚 Program: {twin_data.get('profile', {}).get('program')}")
        print(f"🎯 Completed modules: {len(twin_data.get('learning_state', {}).get('checkpoint_history', []))}")
        print(f"📈 Learning progress entries: {len(twin_data.get('learning_state', {}).get('progress', []))}")
        
        # Test normalization
        normalized = learning_service.get_normalized_student_twin(twin_id)
        if normalized:
            print("✅ Normalization successful!")
            print(f"📊 Normalized skills: {list(normalized.get('skills', {}).keys())}")
            print(f"📈 Overall progress: {normalized.get('overall_progress', 0):.2f}")
        else:
            print("❌ Normalization failed")
    else:
        print("❌ Failed to retrieve twin from IPFS")
    
    # Test with a non-existent twin
    print("\n🧪 Testing with non-existent twin...")
    fake_twin = learning_service.get_student_twin("did:learntwin:nonexistent")
    if fake_twin:
        print("✅ Default twin created for non-existent ID")
    else:
        print("❌ No twin returned for non-existent ID")

if __name__ == "__main__":
    test_ipfs_twin_retrieval()
