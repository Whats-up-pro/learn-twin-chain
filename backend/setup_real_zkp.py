#!/usr/bin/env python3
"""
Setup Real ZKP System with Contract and IPFS
"""

import os
import sys
import subprocess
import json
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_env_config():
    """Get configuration from environment variables"""
    config = {
        'blockchain_rpc_url': os.getenv('BLOCKCHAIN_RPC_URL', 'http://localhost:8545'),
        'blockchain_chain_id': os.getenv('BLOCKCHAIN_CHAIN_ID', '31337'),
        'blockchain_private_key': os.getenv('BLOCKCHAIN_PRIVATE_KEY'),
        'pinata_api_key': os.getenv('PINATA_API_KEY'),
        'pinata_secret_key': os.getenv('PINATA_SECRET_KEY'),
        'ipfs_gateway_url': os.getenv('IPFS_GATEWAY_URL', 'https://gateway.pinata.cloud/ipfs/'),
        'api_host': os.getenv('API_HOST', '0.0.0.0'),
        'api_port': os.getenv('API_PORT', '8000'),
        'api_v1_str': os.getenv('API_V1_STR', '/api/v1'),
        'deployer_address': os.getenv('DEPLOYER_ADDRESS', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199')
    }
    
    # Check required environment variables
    missing_vars = []
    if not config['blockchain_private_key']:
        missing_vars.append('BLOCKCHAIN_PRIVATE_KEY')
    if not config['pinata_api_key']:
        missing_vars.append('PINATA_API_KEY')
    if not config['pinata_secret_key']:
        missing_vars.append('PINATA_SECRET_KEY')
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your .env file or environment")
        return None
    
    return config

def deploy_zkp_contract():
    """Deploy ZKP Certificate contract"""
    print("📦 Deploying ZKP Certificate Contract")
    print("-" * 40)
    
    try:
        result = subprocess.run(
            "npx hardhat run scripts/deploy_zkp.js --network localhost",
            shell=True,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ ZKP Certificate contract deployed successfully")
            print(f"Output: {result.stdout}")
            
            # Extract contract address from output
            for line in result.stdout.split('\n'):
                if 'ZKPCertificateRegistry deployed to:' in line:
                    address = line.split(': ')[1].strip()
                    return address
        else:
            print(f"❌ Failed to deploy contract: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Deployment error: {e}")
        return None

def generate_zkp_abi():
    """Generate ZKP Certificate ABI file"""
    print("\n🔧 Generating ZKP Certificate ABI")
    print("-" * 40)
    
    try:
        # Check if ABI file already exists
        abi_path = 'contracts/abi/ZKPCertificateRegistry.json'
        if os.path.exists(abi_path):
            print("✅ ZKP ABI file already exists")
            return True
        
        # Check if contract source exists
        contract_path = 'contracts/ZKPCertificateRegistry.sol'
        if not os.path.exists(contract_path):
            print("❌ ZKPCertificateRegistry.sol not found")
            print("Please ensure the contract file exists")
            return False
        
        print("📦 Compiling contract and generating ABI...")
        
        # Run Hardhat script to generate ABI
        result = subprocess.run(
            "npx hardhat run scripts/generate_zkp_abi.js",
            shell=True,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ ZKP ABI generated successfully")
            print(f"Output: {result.stdout}")
            return True
        else:
            print(f"❌ Failed to generate ABI: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ ABI generation error: {e}")
        return False

def ensure_zkp_abi_exists():
    """Ensure ZKP ABI file exists, generate if needed"""
    abi_path = 'contracts/abi/ZKPCertificateRegistry.json'
    
    if not os.path.exists(abi_path):
        print(f"❌ ZKP ABI file not found: {abi_path}")
        print("Generating ABI file...")
        return generate_zkp_abi()
    
    return True

def update_deployment_addresses(zkp_address):
    """Update deployment addresses file"""
    print("\n📝 Updating deployment addresses")
    print("-" * 40)
    
    try:
        # Read existing addresses
        if os.path.exists('deployment_addresses.json'):
            with open('deployment_addresses.json', 'r') as f:
                addresses = json.load(f)
        else:
            addresses = {
                "network": 1337,
                "deployer": os.getenv('DEPLOYER_ADDRESS', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'),
                "contracts": {}
            }
        
        # Add ZKP contract address
        addresses['contracts']['ZKPCertificateRegistry'] = zkp_address
        addresses['timestamp'] = int(time.time())
        
        # Write back
        with open('deployment_addresses.json', 'w') as f:
            json.dump(addresses, f, indent=2)
        
        print("✅ Deployment addresses updated")
        return True
        
    except Exception as e:
        print(f"❌ Failed to update addresses: {e}")
        return False

def update_env_file(zkp_address):
    """Update .env file with ZKP contract address"""
    print("\n🔧 Updating .env file with ZKP contract address")
    print("-" * 40)
    
    try:
        # Read existing .env file
        env_lines = []
        if os.path.exists('.env'):
            with open('.env', 'r') as f:
                env_lines = f.readlines()
        
        # Update or add ZKP contract address
        zkp_line = f"ZKP_CERTIFICATE_CONTRACT_ADDRESS={zkp_address}\n"
        zkp_found = False
        
        for i, line in enumerate(env_lines):
            if line.startswith('ZKP_CERTIFICATE_CONTRACT_ADDRESS='):
                env_lines[i] = zkp_line
                zkp_found = True
                break
        
        if not zkp_found:
            env_lines.append(zkp_line)
        
        # Write back
        with open('.env', 'w') as f:
            f.writelines(env_lines)
        
        print("✅ .env file updated with ZKP contract address")
        return True
        
    except Exception as e:
        print(f"❌ Failed to update .env: {e}")
        return False

def test_pinata_config():
    """Test Pinata configuration"""
    print("\n🧪 Testing Pinata Configuration")
    print("-" * 40)
    
    api_key = os.getenv('PINATA_API_KEY')
    secret_key = os.getenv('PINATA_SECRET_KEY')
    
    if not api_key:
        print("❌ PINATA_API_KEY not found in environment")
        return False
    
    if not secret_key:
        print("❌ PINATA_SECRET_KEY not found in environment")
        return False
    
    print("✅ Pinata API keys found in environment")
    print(f"   API Key: {api_key[:10]}...{api_key[-4:]}")
    
    # Test Pinata API
    try:
        import requests
        
        headers = {
            'pinata_api_key': api_key,
            'pinata_secret_api_key': secret_key
        }
        
        print("   Testing Pinata API connection...")
        response = requests.get(
            'https://api.pinata.cloud/data/testAuthentication',
            headers=headers,
            timeout=30  # Tăng timeout lên 30 giây
        )
        
        if response.status_code == 200:
            print("✅ Pinata API authentication successful")
            return True
        else:
            print(f"❌ Pinata API authentication failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Pinata API timeout - Network connection issue")
        print("   Please check your internet connection")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Pinata API connection error - Cannot reach api.pinata.cloud")
        print("   Please check your network/firewall settings")
        return False
    except Exception as e:
        print(f"❌ Pinata API test error: {e}")
        return False

def test_blockchain_connection():
    """Test blockchain connection"""
    print("\n🧪 Testing Blockchain Connection")
    print("-" * 40)
    
    rpc_url = os.getenv('BLOCKCHAIN_RPC_URL', 'http://localhost:8545')
    
    try:
        import requests
        
        # Test RPC connection
        response = requests.post(
            rpc_url,
            json={
                "jsonrpc": "2.0",
                "method": "eth_blockNumber",
                "params": [],
                "id": 1
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'result' in result:
                block_number = int(result['result'], 16)
                print(f"✅ Blockchain connection successful (Block: {block_number})")
                return True
            else:
                print(f"❌ Blockchain RPC error: {result}")
                return False
        else:
            print(f"❌ Blockchain connection failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Blockchain connection error: {e}")
        return False

def test_zkp_api():
    """Test ZKP API with real contract"""
    print("\n🧪 Testing ZKP API")
    print("-" * 40)
    
    try:
        import requests
        
        # Test data
        data = {
            "student_address": os.getenv('DEPLOYER_ADDRESS', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'),
            "student_did": "did:learntwin:student001",
            "certificate_type": "SKILL_ACHIEVEMENT",
            "metadata": {
                "skill": "Python Programming",
                "level": "Advanced",
                "score": 95
            },
            "description": "Real ZKP certificate test"
        }
        
        api_url = f"http://{os.getenv('API_HOST', 'localhost')}:{os.getenv('API_PORT', '8000')}/api/v1/zkp/certificate/create"
        
        response = requests.post(
            api_url,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ ZKP API test successful!")
            print(f"   Certificate ID: {result.get('certificate_id')}")
            print(f"   CID: {result.get('cid')}")
            print(f"   TX Hash: {result.get('tx_hash')}")
            return True
        else:
            print(f"❌ ZKP API test failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ZKP API test error: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Real ZKP System Setup")
    print("=" * 50)
    
    # Load configuration from environment
    config = get_env_config()
    if not config:
        print("\n📋 Required environment variables:")
        print("BLOCKCHAIN_PRIVATE_KEY=your_private_key")
        print("PINATA_API_KEY=your_pinata_api_key")
        print("PINATA_SECRET_KEY=your_pinata_secret_key")
        print("\nOptional variables:")
        print("BLOCKCHAIN_RPC_URL=http://localhost:8545")
        print("IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/")
        print("API_HOST=0.0.0.0")
        print("API_PORT=8000")
        return
    
    print("✅ Environment configuration loaded")
    print(f"   RPC URL: {config['blockchain_rpc_url']}")
    print(f"   Chain ID: {config['blockchain_chain_id']}")
    print(f"   Deployer: {config['deployer_address']}")
    print(f"   API Host: {config['api_host']}:{config['api_port']}")
    
    # Step 1: Test blockchain connection
    if not test_blockchain_connection():
        print("❌ Blockchain connection failed. Please start Hardhat node.")
        return
    
    # Step 2: Ensure ZKP ABI exists
    if not ensure_zkp_abi_exists():
        print("❌ Failed to generate ZKP ABI. Exiting.")
        return
    
    # Step 3: Test Pinata configuration (optional)
    pinata_ok = test_pinata_config()
    if not pinata_ok:
        print("\n⚠️  Pinata test failed, but continuing with setup...")
        print("   You can test Pinata later or use alternative IPFS providers")
        print("   Press Enter to continue or Ctrl+C to abort...")
        try:
            input()
        except KeyboardInterrupt:
            print("\n❌ Setup aborted by user")
            return
    
    # Step 4: Deploy contract
    zkp_address = deploy_zkp_contract()
    if not zkp_address:
        print("❌ Contract deployment failed. Exiting.")
        return
    
    # Step 5: Update addresses
    if not update_deployment_addresses(zkp_address):
        print("❌ Failed to update addresses. Exiting.")
        return
    
    # Step 6: Update .env file
    if not update_env_file(zkp_address):
        print("❌ Failed to update .env file. Exiting.")
        return
    
    # Setup completed
    print("\n🎉 Real ZKP system setup completed successfully!")
    print("\n📋 Configuration Summary:")
    print(f"   ZKP Contract: {zkp_address}")
    print(f"   Pinata Gateway: {config['ipfs_gateway_url']}")
    print(f"   API Endpoint: http://{config['api_host']}:{config['api_port']}/api/v1/zkp")
    print("\n✅ Next steps:")
    print("1. Start backend server: python digital_twin/main.py")
    print("2. Test ZKP API with your application")
    print("3. You can now create real ZKP certificates!")
    
    if not pinata_ok:
        print("\n⚠️  Note: Pinata test failed - you may need to:")
        print("   - Verify Pinata API keys are correct")
        print("   - Try again later when network is stable")

if __name__ == "__main__":
    main() 