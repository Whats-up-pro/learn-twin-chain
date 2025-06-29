#!/usr/bin/env python3
"""
Test script để update DID data sau khi mint NFT
"""

import requests
import json

def test_did_update():
    """Test update DID data"""
    
    # Test data
    test_data = {
        "student_did": "did:learntwin:student001",
        "student_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "skill": "Python Programming",
        "token_id": "0x1234567890abcdef",  # Token ID từ mint NFT
        "cid_nft": "QmTestNFT123456"  # CID từ mint NFT
    }
    
    try:
        # Gọi API update DID
        response = requests.post(
            "http://localhost:8000/api/v1/learning/did/update",
            headers={"Content-Type": "application/json"},
            json=test_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ DID Update thành công!")
            print(f"Status: {result['status']}")
            print(f"Message: {result['message']}")
            print(f"DID CID: {result['cid_did']}")
            print(f"Blockchain TX: {result['blockchain_tx']}")
            print(f"Version: {result['student_data']['version']}")
            
            # In DID document
            print("\n📄 DID Document:")
            print(json.dumps(result['did_document'], indent=2))
            
        else:
            print(f"❌ DID Update thất bại: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")

def test_full_flow():
    """Test toàn bộ flow: mint NFT + update DID"""
    
    # 1. Mint NFT
    print("🚀 Bước 1: Mint NFT...")
    mint_data = {
        "student_did": "did:learntwin:student002",
        "student_address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "skill": "JavaScript Programming",
        "metadata": {
            "verification_date": "2024-01-16",
            "score": 88
        }
    }
    
    try:
        mint_response = requests.post(
            "http://localhost:8000/api/v1/learning/skills/verify-and-mint",
            headers={"Content-Type": "application/json"},
            json=mint_data
        )
        
        if mint_response.status_code == 200:
            mint_result = mint_response.json()
            print("✅ Mint NFT thành công!")
            print(f"Token ID: {mint_result['token_id']}")
            print(f"CID NFT: {mint_result['cid_nft']}")
            
            # 2. Update DID
            print("\n🚀 Bước 2: Update DID...")
            did_data = {
                "student_did": mint_data["student_did"],
                "student_address": mint_data["student_address"],
                "skill": mint_data["skill"],
                "token_id": mint_result['token_id'],
                "cid_nft": mint_result['cid_nft']
            }
            
            did_response = requests.post(
                "http://localhost:8000/api/v1/learning/did/update",
                headers={"Content-Type": "application/json"},
                json=did_data
            )
            
            if did_response.status_code == 200:
                did_result = did_response.json()
                print("✅ Update DID thành công!")
                print(f"DID CID: {did_result['cid_did']}")
                print(f"Blockchain TX: {did_result['blockchain_tx']}")
                
                print("\n🎉 Toàn bộ flow hoàn thành!")
                print("📋 Summary:")
                print(f"  - Student: {mint_data['student_did']}")
                print(f"  - Skill: {mint_data['skill']}")
                print(f"  - NFT Token: {mint_result['token_id']}")
                print(f"  - NFT CID: {mint_result['cid_nft']}")
                print(f"  - DID CID: {did_result['cid_did']}")
                print(f"  - Blockchain TX: {did_result['blockchain_tx']}")
                
            else:
                print(f"❌ Update DID thất bại: {did_response.status_code}")
                print(f"Error: {did_response.text}")
                
        else:
            print(f"❌ Mint NFT thất bại: {mint_response.status_code}")
            print(f"Error: {mint_response.text}")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    print("🧪 Testing DID Update Flow")
    print("=" * 50)
    
    # Test full flow
    test_full_flow() 