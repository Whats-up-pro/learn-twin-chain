#!/usr/bin/env python3
"""
Script để upload dữ liệu test lên IPFS cho Employer Dashboard
"""

import requests
import json
import time

# Backend API base URL
BASE_URL = "http://localhost:8000"

def upload_digital_twin():
    digital_twin_data = {
        "learnerDid": "did:learntwin:student001",
        "learnerName": "Nguyen Van A",
        "student_id": "21520001",
        "institution": "UIT",
        "major": "Computer Science",
        "email": "student001@uit.edu.vn",
        "phone": "0123456789",
        "version": 1,
        "knowledge": {"Python": 0.9, "Data Structures": 1.0},
        "skills": {"problemSolving": 0.8, "logicalThinking": 0.85},
        "behavior": {"timeSpent": "180h", "quizAccuracy": 0.92},
        "checkpoints": [],
        "NFT_list": [
            {
                "token_id": "nft-001",
                "skill": "Python Basics",
                "cid_nft": "QmPythonBasicsNFT001",
                "mint_date": "2024-01-10",
                "issuer": "UIT"
            }
        ],
        "lastUpdated": "2024-01-20T10:00:00Z"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/ipfs/upload",
            json={"data": digital_twin_data, "name": "DigitalTwin_student001"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Uploaded: {result['cid']}")
            return result['cid']
        else:
            print(f"❌ Failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def upload_verifiable_credential():
    """Upload verifiable credential lên IPFS"""
    
    # Verifiable Credential cho Python Basics
    vc_data = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://www.w3.org/2018/credentials/examples/v1"
        ],
        "id": "urn:uuid:12345678-1234-1234-1234-123456789abc",
        "type": ["VerifiableCredential", "LearningAchievement"],
        "issuer": {
            "id": "did:learntwin:uit",
            "name": "University of Information Technology"
        },
        "issuanceDate": "2024-01-10T10:00:00Z",
        "credentialSubject": {
            "id": "did:learntwin:student001",
            "name": "Nguyen Van A",
            "achievement": {
                "type": "LearningAchievement",
                "name": "Python Basics",
                "description": "Successfully completed Python Basics module",
                "criteria": "Achieved score of 95% or higher",
                "score": 95
            }
        },
        "proof": {
            "type": "EcdsaSecp256k1Signature2019",
            "created": "2024-01-10T10:00:00Z",
            "verificationMethod": "did:learntwin:uit#keys-1",
            "proofPurpose": "assertionMethod",
            "jws": "eyJhbGciOiJFUzI1NksiLCJjcml0IjpbImI2NCJdLCJiNjQiOmZhbHNlfQ..mock-signature"
        }
    }
    
    try:
        print("Uploading verifiable credential to IPFS...")
        
        # Upload to IPFS
        response = requests.post(
            f"{BASE_URL}/api/v1/ipfs/upload-vc",
            json={
                "vc_data": vc_data,
                "student_did": "did:learntwin:student001",
                "skill": "Python Basics"
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            cid = result.get("cid")
            print(f"✅ Verifiable credential uploaded successfully!")
            print(f"   CID: {cid}")
            print(f"   URL: {result.get('url')}")
            return cid
        else:
            print(f"❌ Failed to upload verifiable credential: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error uploading verifiable credential: {e}")
        return None

def main():
    """Main function"""
    print("🚀 Starting IPFS data upload for Employer Dashboard...")
    print("=" * 60)
    
    # Upload digital twin data
    digital_twin_cid = upload_digital_twin()
    
    if digital_twin_cid:
        print(f"\n📋 Digital Twin CID for mapping: {digital_twin_cid}")
        print("   Use this CID in the DID mapping for student001")
    
    print("\n" + "=" * 60)
    
    # Upload verifiable credential
    vc_cid = upload_verifiable_credential()
    
    if vc_cid:
        print(f"\n📜 Verifiable Credential CID: {vc_cid}")
    
    print("\n" + "=" * 60)
    print("✅ Upload completed!")
    
    if digital_twin_cid:
        print(f"\n🔗 Test URL: http://localhost:5173/employer")
        print(f"   Use DID: did:learntwin:student001")
        print(f"   Expected CID: {digital_twin_cid}")

if __name__ == "__main__":
    print("Uploading test data...")
    cid = upload_digital_twin()
    if cid:
        print(f"Use CID: {cid} for testing") 