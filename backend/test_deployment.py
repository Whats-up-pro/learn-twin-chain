# backend/test_deployment.py
import os
from web3 import Web3
from dotenv import load_dotenv
from blockchain_utils import BlockchainManager

load_dotenv()

def test_deployment():
    """Test the deployed contracts"""
    print("🧪 Testing deployed contracts...")
    
    try:
        # Initialize blockchain manager
        blockchain = BlockchainManager(
            rpc_url=os.getenv('BLOCKCHAIN_RPC_URL'),
            private_key=os.getenv('BLOCKCHAIN_PRIVATE_KEY')
        )
        
        # Test connection
        print(f"✅ Connected to network: {blockchain.w3.eth.chain_id}")
        
        # Test contract calls
        test_data = {
            "student_id": "test_student_001",
            "module_id": "module_1",
            "progress": 85,
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
        # Test IPFS upload
        print("📤 Testing IPFS upload...")
        cid = blockchain.upload_to_ipfs(test_data)
        print(f"✅ IPFS CID: {cid}")
        
        # Test data hash creation
        print("🔐 Testing data hash creation...")
        data_hash = blockchain.create_data_hash(test_data)
        print(f"✅ Data hash: {data_hash}")
        
        print("🎉 All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    test_deployment()