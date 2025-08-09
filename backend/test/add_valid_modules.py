#!/usr/bin/env python3
"""
Simple script to add valid module IDs to the contract
"""

import json
import os
import sys
from pathlib import Path
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables from backend directory
load_dotenv(Path(__file__).parent.parent / '.env')

def add_valid_modules():
    """Add valid module IDs to the contract"""
    try:
        print("🔧 Setting up blockchain connection...")
        
        # Setup Web3
        rpc_url = os.getenv('BLOCKCHAIN_RPC_URL')
        private_key = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
        
        if not rpc_url or not private_key:
            print("❌ Missing blockchain configuration")
            return False
        
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not w3.is_connected():
            print("❌ Failed to connect to blockchain")
            return False
        
        account = w3.eth.account.from_key(private_key)
        print(f"✅ Connected to blockchain at {rpc_url}")
        print(f"📝 Using deployer account: {account.address}")
        
        # Load contract address
        deployment_file = Path(__file__).parent.parent / "deployment_addresses.json"
        with open(deployment_file, 'r') as f:
            data = json.load(f)
            contract_address = data.get('contracts', {}).get('module_progress_nft')
        
        if not contract_address:
            print("❌ ModuleProgressNFT address not found")
            return False
        
        # Load contract ABI
        artifact_path = Path("artifacts/contracts/ModuleProgressNFT.sol/ModuleProgressNFT.json")
        with open(artifact_path, 'r') as f:
            contract_data = json.load(f)
        abi = contract_data['abi']
        
        contract = w3.eth.contract(address=contract_address, abi=abi)
        print(f"✅ ModuleProgressNFT contract loaded at {contract_address}")
        
        # Add common module IDs
        module_ids = [
            "python_basics_001",
            "python_basics_002", 
            "python_basics_003",
            "python_advanced_001",
            "javascript_basics_001",
            "blockchain_basics_001",
            "web3_basics_001"
        ]
        
        success_count = 0
        total_count = len(module_ids)
        
        for module_id in module_ids:
            print(f"\n🔧 Adding module ID: {module_id}")
            
            # Check if already valid
            try:
                is_valid = contract.functions.validModuleIds(module_id).call()
                if is_valid:
                    print(f"   ✅ Module ID '{module_id}' is already valid")
                    success_count += 1
                    continue
            except Exception as e:
                print(f"   ⚠️  Could not check if module is valid: {e}")
            
            # Add module ID
            try:
                nonce = w3.eth.get_transaction_count(account.address)
                gas_price = w3.eth.gas_price
                adjusted_gas_price = int(gas_price * 2.0)  # Increased gas price multiplier
                
                tx = contract.functions.addValidModule(module_id).build_transaction({
                    'from': account.address,
                    'nonce': nonce,
                    'gas': 500000,  # Increased gas limit
                    'gasPrice': adjusted_gas_price
                })
                
                signed_tx = w3.eth.account.sign_transaction(tx, private_key=account.key.hex())
                tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                
                print(f"   📤 Transaction sent: {tx_hash.hex()}")
                
                tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                
                if tx_receipt.status == 1:
                    print(f"   ✅ Module ID '{module_id}' added successfully!")
                    success_count += 1
                else:
                    print(f"   ❌ Failed to add module ID '{module_id}'")
                    
            except Exception as e:
                print(f"   ❌ Error adding module ID '{module_id}': {e}")
        
        # Summary
        print(f"\n📊 Results: {success_count}/{total_count} modules added successfully")
        
        if success_count == total_count:
            print("🎉 All module IDs added successfully!")
            return True
        else:
            print(f"⚠️  {total_count - success_count} module IDs failed to add.")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = add_valid_modules()
    if success:
        print("\n🎉 Module setup completed! You can now run the NFT minting tests.")
    else:
        print("\n❌ Module setup failed.") 