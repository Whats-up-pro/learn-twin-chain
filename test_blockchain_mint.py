#!/usr/bin/env python3
"""
Test script to trigger blockchain minting and see debug output
"""
import requests
import json

# Test data similar to what the frontend sends
test_data = {
    "student_address": "0x1234567890123456789012345678901234567890",
    "module_id": "test_module_1",
    "learning_data_hash_hex": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "completion_data": {
        "score": 85,
        "time_spent": 1800,
        "attempts": 1,
        "use_student_wallet": True,
        "course_id": "test_course_1"
    }
}

def test_blockchain_mint():
    """Test the blockchain minting endpoint"""
    try:
        print("🧪 Testing blockchain minting endpoint...")
        print(f"📤 Sending data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(
            "http://localhost:8000/api/v1/blockchain/mint/module/prepare-tx-combined",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"💥 Exception: {str(e)}")

if __name__ == "__main__":
    test_blockchain_mint()
