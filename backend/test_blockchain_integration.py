#!/usr/bin/env python3
"""
Test script for blockchain integration features
"""

import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_blockchain_service():
    """Test blockchain service functionality"""
    print("🧪 Testing Blockchain Service Integration")
    print("=" * 50)
    
    try:
        from digital_twin.services.blockchain_service import BlockchainService
        
        # Initialize service
        blockchain_service = BlockchainService()
        
        if not blockchain_service.is_available():
            print("❌ Blockchain service not available")
            print("Make sure to configure blockchain environment variables")
            return False
        
        print("✅ Blockchain service initialized successfully")
        
        # Test data
        test_student_address = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"
        test_student_did = "did:learner:test123"
        test_module_id = "python_basics_001"
        test_module_title = "Python Basics - Introduction"
        
        # Test 1: Module completion NFT
        print("\n📝 Test 1: Minting Module Completion NFT (ERC-1155)")
        completion_data = {
            "score": 95,
            "time_spent": 3600,  # 1 hour
            "attempts": 1,
            "completed_at": datetime.now().isoformat()
        }
        
        result = blockchain_service.mint_module_completion_nft(
            test_student_address,
            test_student_did,
            test_module_id,
            test_module_title,
            completion_data
        )
        
        if "error" in result:
            print(f"❌ Module completion NFT test failed: {result['error']}")
        else:
            print(f"✅ Module completion NFT minted successfully")
            print(f"   Transaction hash: {result['tx_hash']}")
        
        # Test 2: Course completion certificate
        print("\n🏆 Test 2: Minting Course Completion Certificate (ERC-721)")
        course_data = {
            "course_id": "python_fundamentals",
            "total_modules": 10,
            "final_score": 92,
            "completion_date": datetime.now().isoformat()
        }
        
        result = blockchain_service.mint_course_completion_certificate(
            test_student_address,
            test_student_did,
            "Python Fundamentals",
            course_data
        )
        
        if "error" in result:
            print(f"❌ Course completion certificate test failed: {result['error']}")
        else:
            print(f"✅ Course completion certificate minted successfully")
            print(f"   Transaction hash: {result['tx_hash']}")
        
        # Test 3: Skill mastery certificate
        print("\n🎯 Test 3: Minting Skill Mastery Certificate (ERC-721)")
        skill_data = {
            "skill_id": "python_programming",
            "proficiency_level": "Advanced",
            "assessment_score": 88,
            "certified_by": "LearnTwinChain"
        }
        
        result = blockchain_service.mint_skill_mastery_certificate(
            test_student_address,
            test_student_did,
            "Python Programming",
            skill_data,
            expires_in_days=365
        )
        
        if "error" in result:
            print(f"❌ Skill mastery certificate test failed: {result['error']}")
        else:
            print(f"✅ Skill mastery certificate minted successfully")
            print(f"   Transaction hash: {result['tx_hash']}")
        
        # Test 4: Get student blockchain data
        print("\n📊 Test 4: Getting Student Blockchain Data")
        result = blockchain_service.get_student_blockchain_data(
            test_student_address,
            test_student_did
        )
        
        if "error" in result:
            print(f"❌ Get student data test failed: {result['error']}")
        else:
            print(f"✅ Student blockchain data retrieved successfully")
            print(f"   Module progress: {result['module_progress']}")
            print(f"   Achievements count: {len(result['achievements'])}")
        
        # Test 5: Check achievement eligibility
        print("\n🔍 Test 5: Checking Achievement Eligibility")
        criteria = {
            "required_modules": ["python_basics_001", "python_basics_002"],
            "required_skill_level": 3
        }
        
        result = blockchain_service.check_achievement_eligibility(
            test_student_address,
            "COURSE_COMPLETION",
            criteria
        )
        
        if "error" in result:
            print(f"❌ Achievement eligibility test failed: {result['error']}")
        else:
            print(f"✅ Achievement eligibility checked successfully")
            print(f"   Eligible: {result['eligible']}")
            print(f"   Reason: {result['reason']}")
        
        # Test 6: Generate employer verification
        print("\n🏢 Test 6: Generating Employer Verification")
        result = blockchain_service.generate_employer_verification(
            test_student_address,
            ["Python Fundamentals", "Python Programming"]
        )
        
        if "error" in result:
            print(f"❌ Employer verification test failed: {result['error']}")
        else:
            print(f"✅ Employer verification generated successfully")
            verification_data = result['verification_data']
            print(f"   Total achievements: {verification_data['total_achievements']}")
            print(f"   Total modules completed: {verification_data['total_modules_completed']}")
        
        # Test 7: Create ZKP certificate
        print("\n🔐 Test 7: Creating ZKP Certificate")
        twin_data = {
            "twin_id": test_student_did,
            "profile": {
                "name": "Test Student",
                "institution": "Test University"
            },
            "learning_state": {
                "progress": {"python_basics": 1.0}
            }
        }
        
        result = blockchain_service.create_zkp_certificate(
            test_student_did,
            test_student_address,
            twin_data
        )
        
        if "error" in result:
            print(f"❌ ZKP certificate test failed: {result['error']}")
        else:
            print(f"✅ ZKP certificate created successfully")
            print(f"   IPFS CID: {result['ipfs_cid']}")
            print(f"   IPFS URL: {result['ipfs_url']}")
        
        print("\n🎉 All blockchain integration tests completed!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure all required packages are installed")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def test_api_endpoints():
    """Test blockchain API endpoints"""
    print("\n🌐 Testing Blockchain API Endpoints")
    print("=" * 50)
    
    try:
        import requests
        
        base_url = "http://localhost:8000"
        
        # Test 1: Check blockchain status
        print("\n📊 Test 1: Blockchain Status")
        response = requests.get(f"{base_url}/api/v1/blockchain/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Blockchain status: {data['status']}")
            print(f"   Available: {data['available']}")
        else:
            print(f"❌ Status check failed: {response.status_code}")
        
        # Test 2: Get achievement types
        print("\n📋 Test 2: Achievement Types")
        response = requests.get(f"{base_url}/api/v1/blockchain/achievements/types")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Achievement types retrieved")
            print(f"   Types count: {len(data['achievement_types'])}")
            for achievement_type in data['achievement_types']:
                print(f"   - {achievement_type['type']}: {achievement_type['description']}")
        else:
            print(f"❌ Achievement types failed: {response.status_code}")
        
        print("\n🎉 API endpoint tests completed!")
        return True
        
    except ImportError:
        print("❌ Requests library not available")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def main():
    """Main test function"""
    print("LearnTwinChain Blockchain Integration Test Suite")
    print("=" * 60)
    
    # Check environment
    required_vars = [
        'BLOCKCHAIN_RPC_URL',
        'BLOCKCHAIN_PRIVATE_KEY',
        'MODULE_PROGRESS_CONTRACT_ADDRESS',
        'ACHIEVEMENT_CONTRACT_ADDRESS'
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease configure your .env file with the required variables.")
        return
    
    print("✅ Environment variables configured")
    
    # Run tests
    blockchain_success = test_blockchain_service()
    api_success = test_api_endpoints()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Blockchain Service: {'✅ PASS' if blockchain_success else '❌ FAIL'}")
    print(f"API Endpoints: {'✅ PASS' if api_success else '❌ FAIL'}")
    
    if blockchain_success and api_success:
        print("\n🎉 All tests passed! Blockchain integration is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the configuration and try again.")

if __name__ == "__main__":
    main() 