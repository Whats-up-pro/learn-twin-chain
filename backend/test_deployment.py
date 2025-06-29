#!/usr/bin/env python3
"""
Test deployment script for LearnTwinChain contracts
"""

import os
import json
from deploy_contracts import ContractDeployer

def main():
    print("🧪 Testing contract deployment...")
    
    # Check if .env exists
    if not os.path.exists('.env'):
        print("❌ .env file not found!")
        print("Please create .env file with:")
        print("BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545")
        print("BLOCKCHAIN_PRIVATE_KEY=your_private_key_here")
        return
    
    try:
        # Deploy contracts
        deployer = ContractDeployer()
        deployed_addresses = deployer.deploy_all_contracts()
        
        print("\n📋 Deployment Summary:")
        for contract_name, address in deployed_addresses.items():
            print(f"  {contract_name}: {address}")
        
        # Update .env file with contract addresses
        env_lines = []
        try:
            with open('.env', 'r', encoding='utf-8') as f:
                env_lines = f.readlines()
        except UnicodeDecodeError:
            # Fallback to cp1252 if utf-8 fails
            with open('.env', 'r', encoding='cp1252') as f:
                env_lines = f.readlines()
        
        # Remove existing contract addresses
        env_lines = [line for line in env_lines if not line.startswith(('NFT_CONTRACT_ADDRESS=', 'REGISTRY_CONTRACT_ADDRESS='))]
        
        # Add new contract addresses
        env_lines.append(f"NFT_CONTRACT_ADDRESS={deployed_addresses.get('NFT_CONTRACT_ADDRESS', '')}\n")
        env_lines.append(f"REGISTRY_CONTRACT_ADDRESS={deployed_addresses.get('REGISTRY_CONTRACT_ADDRESS', '')}\n")
        
        # Write back with proper encoding
        with open('.env', 'w', encoding='utf-8') as f:
            f.writelines(env_lines)
        
        print("\n✅ .env file updated with contract addresses!")
        print("🚀 Ready to test NFT minting!")
        
        # Print updated .env content for verification
        print("\n📄 Updated .env content:")
        with open('.env', 'r', encoding='utf-8') as f:
            print(f.read())
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()