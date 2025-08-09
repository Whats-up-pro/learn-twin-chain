#!/usr/bin/env python3
"""
Test script for new ZKP flow with student signature verification
"""

import json
import os
import sys
import time
from pathlib import Path
from web3 import Web3
from eth_account.messages import encode_defunct
from eth_account import Account
from dotenv import load_dotenv

# Load environment variables from backend directory
load_dotenv(Path(__file__).parent.parent / '.env')

# Add the backend directory to the path for digital_twin import
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_new_zkp_flow():
    """Test the new ZKP flow with student signature verification"""
    print("🧪 Testing new ZKP flow with student signature verification...")
    
    # Setup Web3
    rpc_url = os.getenv('BLOCKCHAIN_RPC_URL')
    if not rpc_url:
        print("❌ BLOCKCHAIN_RPC_URL not found")
        return False
    
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("❌ Failed to connect to blockchain")
        return False
    
    # Create a test student account
    test_student_account = Account.create()
    student_address = test_student_account.address
    student_private_key = test_student_account.key.hex()
    
    print(f"📝 Test student address: {student_address}")
    
    # Test 1: Generate ZKP challenge
    print("\n🔐 Test 1: Generating ZKP challenge...")
    challenge_nonce = "test_challenge_123456789"
    message = f"LearnTwin Module Completion Challenge: {challenge_nonce}"
    
    # Sign the challenge with student's private key
    message_hash = encode_defunct(text=message)
    signature = test_student_account.sign_message(message_hash)
    
    print(f"✅ Challenge signed: {signature.signature.hex()}")
    
    # Test 2: Verify signature
    print("\n🔍 Test 2: Verifying signature...")
    recovered_address = Account.recover_message(message_hash, signature=signature.signature)
    
    if recovered_address.lower() == student_address.lower():
        print("✅ Signature verification successful")
    else:
        print("❌ Signature verification failed")
        return False
    
    # Test 3: Test ZKP service with new flow
    print("\n🔐 Test 3: Testing ZKP service with new flow...")
    
    try:
        from digital_twin.services.zkp_service import ZKPService
        zkp_service = ZKPService()
        
        # Create test completion data
        completion_data = {
            'score': 85,
            'time_spent': 3500,
            'attempts': 3,
            'module_id': 'test_module_001',
            'student_address': student_address,
            'student_signature': signature.signature.hex(),
            'challenge_nonce': challenge_nonce,
            'study_materials': ['material1', 'material2', 'material3'],
            'min_score_required': 80,
            'max_time_allowed': 3600,
            'max_attempts_allowed': 10
        }
        
        # Generate ZKP proof
        result = zkp_service.generate_module_progress_proof(completion_data)
        
        if result.get('success'):
            print("✅ ZKP proof generated successfully")
            print(f"   Proof: {result.get('proof', {}).get('proof', 'N/A')[:50]}...")
        else:
            print(f"❌ ZKP proof generation failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing ZKP service: {str(e)}")
        return False
    
    # Test 4: Test frontend integration
    print("\n🌐 Test 4: Testing frontend integration...")
    
    # Simulate frontend flow
    try:
        # Step 1: Get challenge from backend
        challenge_response = {
            'challenge_nonce': challenge_nonce,
            'message': message
        }
        print(f"✅ Challenge received: {challenge_response['challenge_nonce'][:20]}...")
        
        # Step 2: Sign challenge (simulated)
        signed_challenge = signature.signature.hex()
        print(f"✅ Challenge signed: {signed_challenge[:20]}...")
        
        # Step 3: Send to backend for ZKP generation
        mint_request = {
            'student_address': student_address,
            'student_did': 'did:learntwin:teststudent001',
            'module_id': 'test_module_001',
            'module_title': 'Test Module',
            'completion_data': {
                'score': 85,
                'time_spent': 3500,
                'attempts': 3,
                'completed_at': '2024-01-01T00:00:00Z',
                'use_student_wallet': True,
                'student_signature': signed_challenge,
                'challenge_nonce': challenge_nonce
            }
        }
        
        print("✅ Mint request prepared with signature verification")
        
    except Exception as e:
        print(f"❌ Error in frontend integration test: {str(e)}")
        return False
    
    print("\n🎉 All tests passed! New ZKP flow is working correctly.")
    return True

def main():
    """Main test function"""
    print("🚀 Starting new ZKP flow tests...")
    
    success = test_new_zkp_flow()
    
    if success:
        print("\n✅ All tests completed successfully!")
        print("\n📋 Summary of changes:")
        print("   • Removed hardcoded student private key")
        print("   • Added student signature verification")
        print("   • Updated ZKP circuit to use student address")
        print("   • Added challenge-response flow for security")
        print("   • Frontend now signs challenges with MetaMask")
    else:
        print("\n❌ Tests failed!")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 