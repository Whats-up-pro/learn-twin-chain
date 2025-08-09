#!/usr/bin/env python3
"""
Test script for Poseidon hash using circomlibjs
"""

import sys
from pathlib import Path

# Add the digital_twin directory to the path
sys.path.append(str(Path(__file__).parent.parent / "digital_twin"))

from services.zkp_service import PoseidonHash

def test_poseidon_hash():
    """Test Poseidon hash functionality"""
    print("🧪 Testing Poseidon Hash with circomlibjs via Node.js")
    
    try:
        # Initialize Poseidon hash
        poseidon = PoseidonHash()
        print("✅ Poseidon hash initialized successfully")
        
        # Test with simple inputs
        test_inputs = [1, 2, 3, 4, 5]
        print(f"   Test inputs: {test_inputs}")
        
        # Hash the inputs
        hash_result = poseidon.hash(test_inputs)
        print(f"   Hash result: {hash_result}")
        
        # Test with different inputs
        test_inputs2 = [10, 20, 30, 40, 50]
        print(f"   Test inputs 2: {test_inputs2}")
        
        hash_result2 = poseidon.hash(test_inputs2)
        print(f"   Hash result 2: {hash_result2}")
        
        # Verify results are different
        if hash_result != hash_result2:
            print("✅ Hash results are different (as expected)")
        else:
            print("❌ Hash results are the same (unexpected)")
            return False
        
        # Test with single input
        single_input = [42]
        print(f"   Single input: {single_input}")
        
        hash_result3 = poseidon.hash(single_input)
        print(f"   Single input hash: {hash_result3}")
        
        print("✅ All Poseidon hash tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Poseidon hash test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_zkp_service_integration():
    """Test ZKP service integration with Poseidon hash"""
    print("\n🧪 Testing ZKP Service Integration")
    
    try:
        from services.zkp_service import ZKPService
        
        # Initialize ZKP service
        zkp_service = ZKPService()
        print("✅ ZKP service initialized successfully")
        
        # Test student hash generation using Poseidon hash
        student_address = "0x1234567890123456789012345678901234567890"
        private_key = 12345
        random_nonce = 67890
        
        # Test Poseidon hash directly
        student_hash = zkp_service.poseidon_hash.hash([private_key, random_nonce])
        print(f"   Student hash: {student_hash}")
        
        # Test commitment hash creation
        private_inputs = [1, 2, 3, 4, 5]
        commitment_hash = zkp_service._create_commitment_hash(private_inputs)
        print(f"   Commitment hash: {commitment_hash}")
        
        print("✅ ZKP service integration tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ ZKP service integration test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 Starting Poseidon Hash Tests")
    print("=" * 50)
    
    # Test Poseidon hash
    poseidon_success = test_poseidon_hash()
    
    # Test ZKP service integration
    zkp_success = test_zkp_service_integration()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   Poseidon Hash: {'✅ PASSED' if poseidon_success else '❌ FAILED'}")
    print(f"   ZKP Integration: {'✅ PASSED' if zkp_success else '❌ FAILED'}")
    
    if poseidon_success and zkp_success:
        print("\n🎉 All tests passed! Poseidon hash is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
    
    return poseidon_success and zkp_success

if __name__ == "__main__":
    main() 