#!/usr/bin/env python3
"""
Script để upload dữ liệu thật từ backend lên IPFS
"""

import requests
import json
import os

# Backend API base URL
BASE_URL = "http://localhost:8000"

def load_digital_twin_data(student_id):
    """Load dữ liệu digital twin từ file JSON"""
    file_path = f"data/digital_twins/dt_did_learntwin_{student_id}.json"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Loaded data from {file_path}")
        return data
    except Exception as e:
        print(f"❌ Error loading file: {e}")
        return None

def transform_data_for_ipfs(digital_twin_data):
    """Transform dữ liệu để phù hợp với format IPFS"""
    
    # Lấy thông tin cơ bản
    twin_id = digital_twin_data.get("twin_id", "")
    profile = digital_twin_data.get("profile", {})
    learning_state = digital_twin_data.get("learning_state", {})
    skill_profile = digital_twin_data.get("skill_profile", {})
    interaction_logs = digital_twin_data.get("interaction_logs", {})
    nft_list = digital_twin_data.get("NFT_list", [])
    
    # Transform thành format phù hợp
    transformed_data = {
        "learnerDid": twin_id,
        "learnerName": profile.get("full_name", ""),
        "student_id": twin_id.split(":")[-1] if ":" in twin_id else twin_id,
        "institution": profile.get("institution", ""),
        "major": profile.get("program", ""),
        "email": f"{twin_id.split(':')[-1]}@uit.edu.vn",
        "phone": "0123456789",  # Mock phone
        "version": 1,
        "knowledge": learning_state.get("progress", {}),
        "skills": skill_profile.get("soft_skills", {}),
        "behavior": {
            "timeSpent": "180h",  # Mock data
            "quizAccuracy": 0.92,  # Mock data
            "preferredLearningStyle": interaction_logs.get("preferred_learning_style", "hands-on"),
            "lastSession": interaction_logs.get("last_llm_session", ""),
            "mostAskedTopics": interaction_logs.get("most_asked_topics", [])
        },
        "checkpoints": [
            {
                "module": checkpoint.get("module", ""),
                "moduleId": checkpoint.get("module", "").lower().replace(" ", "-"),
                "moduleName": checkpoint.get("module", ""),
                "completedAt": checkpoint.get("completed_at", ""),
                "score": 95,  # Mock score
                "tokenized": checkpoint.get("tokenized", False),
                "nftCid": checkpoint.get("nft_cid", ""),
                "nftId": f"nft-{i+1}"
            }
            for i, checkpoint in enumerate(learning_state.get("checkpoint_history", []))
        ],
        "NFT_list": [
            {
                "token_id": nft.get("token_id", ""),
                "skill": nft.get("skill", ""),
                "cid_nft": nft.get("cid_nft", ""),
                "mint_date": nft.get("mint_date", ""),
                "issuer": nft.get("issuer", ""),
                "verified": True,
                "metadata": nft.get("metadata", {})
            }
            for nft in nft_list
        ],
        "lastUpdated": "2024-01-20T10:00:00Z"
    }
    
    return transformed_data

def upload_to_ipfs(data, name):
    """Upload data lên IPFS"""
    try:
        print(f"Uploading {name} to IPFS...")
        
        response = requests.post(
            f"{BASE_URL}/api/v1/ipfs/upload",
            json={
                "data": data,
                "name": name
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            cid = result.get("cid")
            print(f"✅ {name} uploaded successfully!")
            print(f"   CID: {cid}")
            print(f"   URL: {result.get('url')}")
            return cid
        else:
            print(f"❌ Failed to upload {name}: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error uploading {name}: {e}")
        return None

def main():
    """Main function"""
    print("🚀 Starting real data upload to IPFS...")
    print("=" * 60)
    
    students = ["student001", "student002"]
    uploaded_cids = {}
    
    for student_id in students:
        print(f"\n📋 Processing {student_id}...")
        
        # Load dữ liệu thật
        digital_twin_data = load_digital_twin_data(student_id)
        if not digital_twin_data:
            print(f"❌ Failed to load digital twin data for {student_id}")
            continue
        
        # Transform dữ liệu
        transformed_data = transform_data_for_ipfs(digital_twin_data)
        print(f"✅ Data transformed for {student_id}")
        print(f"   Name: {transformed_data['learnerName']}")
        print(f"   Institution: {transformed_data['institution']}")
        print(f"   NFTs: {len(transformed_data['NFT_list'])}")
        
        # Upload lên IPFS
        cid = upload_to_ipfs(transformed_data, f"DigitalTwin_{student_id}")
        
        if cid:
            uploaded_cids[student_id] = cid
            print(f"✅ {student_id} uploaded successfully!")
        else:
            print(f"❌ {student_id} upload failed!")
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ Upload Summary:")
    for student_id, cid in uploaded_cids.items():
        print(f"   {student_id}: {cid}")
    
    if uploaded_cids:
        print(f"\n🔗 Test URL: http://localhost:5173/employer")
        print("   Available DIDs:")
        for student_id in uploaded_cids.keys():
            print(f"   - did:learntwin:{student_id}")
    else:
        print("\n❌ No data uploaded successfully!")

if __name__ == "__main__":
    main() 