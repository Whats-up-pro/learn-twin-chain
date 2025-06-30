#!/usr/bin/env python3
"""
Complete deployment and testing script for ZKP Certificate system
"""

import os
import sys
import subprocess
import time
import json
import requests
from pathlib import Path

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_command(command, cwd=None, check=True):
    """Run shell command"""
    print(f"🔄 Running: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            check=check,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(f"✅ Output: {result.stdout}")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e.stderr}")
        if check:
            raise
        return e

def check_hardhat_node():
    """Check if Hardhat node is running"""
    try:
        response = requests.get("http://localhost:8545", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_hardhat_node():
    """Start Hardhat node"""
    print("🚀 Starting Hardhat node...")
    
    # Check if node is already running
    if check_hardhat_node():
        print("✅ Hardhat node is already running")
        return True
    
    # Start node in background
    try:
        subprocess.Popen(
            "npx hardhat node",
            shell=True,
            cwd=".",
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Wait for node to start
        for i in range(30):
            if check_hardhat_node():
                print("✅ Hardhat node started successfully")
                return True
            time.sleep(1)
        
        print("❌ Failed to start Hardhat node")
        return False
        
    except Exception as e:
        print(f"❌ Error starting Hardhat node: {e}")
        return False

def deploy_contracts():
    """Deploy all contracts"""
    print("\n📦 Deploying contracts...")
    
    # Deploy ZKP Certificate contract
    print("📝 Deploying ZKP Certificate contract...")
    result = run_command("npx hardhat run scripts/deploy_zkp.js --network localhost", check=False)
    
    if result.returncode != 0:
        print("❌ Failed to deploy ZKP contract")
        return False
    
    print("✅ ZKP Certificate contract deployed")
    return True

def update_environment():
    """Update environment variables"""
    print("\n🔧 Updating environment variables...")
    
    # Read deployment addresses
    try:
        with open("deployment_addresses.json", "r") as f:
            addresses = json.load(f)
    except FileNotFoundError:
        print("❌ deployment_addresses.json not found")
        return False
    
    # Update .env file
    env_content = f"""
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_CHAIN_ID=31337
BLOCKCHAIN_PRIVATE_KEY=0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e

# Contract Addresses
DIGITAL_TWIN_REGISTRY_ADDRESS={addresses.get('DigitalTwinRegistry', 'Not deployed')}
LEARNING_ACHIEVEMENT_NFT_ADDRESS={addresses.get('LearningAchievementNFT', 'Not deployed')}
MODULE_PROGRESS_NFT_ADDRESS={addresses.get('ModuleProgressNFT', 'Not deployed')}
ZKP_CERTIFICATE_CONTRACT_ADDRESS={addresses.get('ZKPCertificateRegistry', 'Not deployed')}

# IPFS Configuration
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_V1_STR=/api/v1
"""
    
    with open(".env", "w") as f:
        f.write(env_content.strip())
    
    print("✅ Environment variables updated")
    return True

def start_backend():
    """Start backend server"""
    print("\n🚀 Starting backend server...")
    
    try:
        subprocess.Popen(
            "python digital_twin/main.py",
            shell=True,
            cwd=".",
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Wait for server to start
        for i in range(30):
            try:
                response = requests.get("http://localhost:8000/health", timeout=5)
                if response.status_code == 200:
                    print("✅ Backend server started successfully")
                    return True
            except:
                pass
            time.sleep(1)
        
        print("❌ Failed to start backend server")
        return False
        
    except Exception as e:
        print(f"❌ Error starting backend server: {e}")
        return False

def test_zkp_api():
    """Test ZKP API endpoints"""
    print("\n🧪 Testing ZKP API endpoints...")
    
    try:
        result = run_command("python test_zkp_api.py", check=False)
        
        if result.returncode == 0:
            print("✅ ZKP API tests completed successfully")
            return True
        else:
            print("❌ ZKP API tests failed")
            return False
            
    except Exception as e:
        print(f"❌ Error running ZKP API tests: {e}")
        return False

def main():
    """Main deployment and testing function"""
    print("🎯 Complete ZKP Certificate System Deployment")
    print("=" * 60)
    
    # Step 1: Start Hardhat node
    if not start_hardhat_node():
        print("❌ Failed to start Hardhat node. Exiting.")
        return
    
    # Step 2: Deploy contracts
    if not deploy_contracts():
        print("❌ Failed to deploy contracts. Exiting.")
        return
    
    # Step 3: Update environment
    if not update_environment():
        print("❌ Failed to update environment. Exiting.")
        return
    
    # Step 4: Start backend
    if not start_backend():
        print("❌ Failed to start backend. Exiting.")
        return
    
    # Step 5: Test API
    if not test_zkp_api():
        print("❌ API tests failed.")
        return
    
    print("\n🎉 Complete ZKP Certificate System is ready!")
    print("=" * 60)
    print("📋 Available endpoints:")
    print("   - Create ZKP Certificate: POST /api/v1/zkp/certificate/create")
    print("   - Mint from CID: POST /api/v1/zkp/certificate/mint-from-cid")
    print("   - Get Certificate: GET /api/v1/zkp/certificate/{id}")
    print("   - Get Student Certificates: GET /api/v1/zkp/student/{address}/certificates")
    print("   - Get Metadata: GET /api/v1/zkp/certificate/{id}/metadata")
    print("   - Verify Certificate: POST /api/v1/zkp/certificate/verify")
    print("   - Get Stats: GET /api/v1/zkp/stats")
    print("   - List All: GET /api/v1/zkp/certificates")
    print("\n🌐 Backend URL: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")

if __name__ == "__main__":
    main() 