# backend/test_ipfs.py
from digital_twin.services.ipfs_service import IPFSService
import json
import time

def test_ipfs():
    """Test IPFS functionality"""
    ipfs = IPFSService()
    
    # Test data
    test_data = {
        "student_id": "student_001",
        "module_id": "python_basics",
        "progress": 85,
        "timestamp": "2024-01-01T00:00:00Z"
    }
    
    try:
        # Upload JSON
        print("📤 Uploading test data to IPFS...")
        cid = ipfs.upload_json(test_data, "test_learning_data")
        print(f"✅ Uploaded with CID: {cid}")
        
        # Get URL
        url = ipfs.get_file_url(cid)
        print(f"�� IPFS URL: {url}")
        
        # Download and verify
        print("📥 Downloading data from IPFS...")
        downloaded_data = ipfs.download_json(cid)
        print(f"✅ Downloaded data: {downloaded_data}")
        
        # Verify data integrity
        assert downloaded_data == test_data
        print("🎉 Data integrity verified!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    test_ipfs()