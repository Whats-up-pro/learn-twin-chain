#!/usr/bin/env python3
"""
Deploy smart contracts for LearnTwinChain
"""

import os
import json
import sys
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ContractDeployer:
    def __init__(self):
        self.rpc_url = os.getenv('BLOCKCHAIN_RPC_URL')
        self.private_key = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
        
        if not self.rpc_url or not self.private_key:
            print("Error: BLOCKCHAIN_RPC_URL and BLOCKCHAIN_PRIVATE_KEY must be set in .env file")
            sys.exit(1)
        
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.account = Account.from_key(self.private_key)
        
        print(f"Connected to network: {self.w3.eth.chain_id}")
        print(f"Deployer address: {self.account.address}")
        print(f"Balance: {self.w3.from_wei(self.w3.eth.get_balance(self.account.address), 'ether')} ETH")
    
    def compile_contract(self, contract_path: str) -> dict:
        """Compile a Solidity contract"""
        try:
            import solcx
            
            # Install and use 0.8.30 for OpenZeppelin v5
            try:
                solcx.install_solc('0.8.30')
                solcx.set_solc_version('0.8.30')
                print("Using Solidity version: 0.8.30")
            except Exception as e:
                print(f"Warning: Could not set Solidity 0.8.30: {e}")
                # Use latest available
                versions = solcx.get_installed_solc_versions()
                if versions:
                    latest = max(versions)
                    solcx.set_solc_version(latest)
                    print(f"Using Solidity version: {latest}")
            
            # Check if OpenZeppelin is installed
            if not os.path.exists('node_modules/@openzeppelin/contracts'):
                print("❌ OpenZeppelin contracts not found!")
                print("Please run: npm install @openzeppelin/contracts")
                sys.exit(1)
            
            # Use relative paths for Windows compatibility
            current_dir = os.getcwd()
            remappings = [
                f"@openzeppelin/={os.path.join(current_dir, 'node_modules/@openzeppelin/')}",
                f"@openzeppelin/contracts/={os.path.join(current_dir, 'node_modules/@openzeppelin/contracts/')}"
            ]
            
            print(f"Remappings: {remappings}")
            
            # Compile with remappings
            compiled = solcx.compile_files(
                [contract_path],
                import_remappings=remappings,
                output_values=['abi', 'bin']
            )
            
            # Get the contract interface - handle both path separators
            contract_name = os.path.basename(contract_path).replace('.sol', '')
            
            # Find the contract key by searching for contract name
            contract_key = None
            for key in compiled.keys():
                if contract_name in key:
                    contract_key = key
                    break
            
            if contract_key is None:
                print(f"❌ Contract key not found for: {contract_name}")
                print(f"Available keys: {list(compiled.keys())}")
                sys.exit(1)
            
            print(f"✅ Found contract key: {contract_key}")
            contract_interface = compiled[contract_key]
            
            return {
                'abi': contract_interface['abi'],
                'bytecode': contract_interface['bin']
            }
        except ImportError:
            print("Error: solcx not installed. Install with: pip install solcx")
            sys.exit(1)
        except Exception as e:
            print(f"Error compiling contract {contract_path}: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    
    def deploy_contract(self, contract_name: str, contract_path: str, *args) -> str:
        """Deploy a contract and return the address"""
        print(f"\nDeploying {contract_name}...")
        
        try:
            # Compile contract
            contract_data = self.compile_contract(contract_path)
            
            # Create contract instance
            contract = self.w3.eth.contract(abi=contract_data['abi'], bytecode=contract_data['bytecode'])
            
            # Build transaction
            construct_txn = contract.constructor(*args).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 5000000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(construct_txn, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            contract_address = tx_receipt.contractAddress
            print(f"✅ {contract_name} deployed at: {contract_address}")
            print(f"Transaction hash: {tx_hash.hex()}")
            
            # Save ABI to file
            abi_dir = os.path.join('contracts', 'abi')
            os.makedirs(abi_dir, exist_ok=True)
            
            abi_file = os.path.join(abi_dir, f'{contract_name}.json')
            with open(abi_file, 'w') as f:
                json.dump(contract_data['abi'], f, indent=2)
            
            print(f"ABI saved to: {abi_file}")
            
            return contract_address
            
        except Exception as e:
            print(f"❌ Error deploying {contract_name}: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    
    def deploy_all_contracts(self):
        """Deploy all contracts"""
        print("🚀 Starting contract deployment...")
        
        contracts_dir = 'contracts'
        deployed_addresses = {}
        
        # Deploy ModuleProgressNFT (ERC-1155)
        module_progress_path = os.path.join(contracts_dir, 'ModuleProgressNFT.sol')
        if os.path.exists(module_progress_path):
            deployed_addresses['MODULE_PROGRESS_CONTRACT_ADDRESS'] = self.deploy_contract(
                'ModuleProgressNFT',
                module_progress_path
            )
        
        # Deploy LearningAchievementNFT (ERC-721)
        achievement_path = os.path.join(contracts_dir, 'LearningAchievementNFT.sol')
        if os.path.exists(achievement_path):
            deployed_addresses['ACHIEVEMENT_CONTRACT_ADDRESS'] = self.deploy_contract(
                'LearningAchievementNFT',
                achievement_path
            )
        
        # Deploy DigitalTwinRegistry
        registry_path = os.path.join(contracts_dir, 'DigitalTwinRegistry.sol')
        if os.path.exists(registry_path):
            deployed_addresses['REGISTRY_CONTRACT_ADDRESS'] = self.deploy_contract(
                'DigitalTwinRegistry',
                registry_path
            )
        
        # Save deployment addresses
        self.save_deployment_addresses(deployed_addresses)
        
        print("\n🎉 All contracts deployed successfully!")
        return deployed_addresses
    
    def save_deployment_addresses(self, addresses: dict):
        """Save deployment addresses to file"""
        deployment_file = 'deployment_addresses.json'
        
        deployment_data = {
            'network': self.w3.eth.chain_id,
            'deployer': self.account.address,
            'contracts': addresses,
            'timestamp': self.w3.eth.get_block('latest').timestamp
        }
        
        with open(deployment_file, 'w') as f:
            json.dump(deployment_data, f, indent=2)
        
        print(f"\n📝 Deployment addresses saved to: {deployment_file}")
        
        # Generate .env template
        env_template = "# Blockchain Contract Addresses\n"
        for key, address in addresses.items():
            env_template += f"{key}={address}\n"
        
        env_file = 'deployment.env'
        with open(env_file, 'w') as f:
            f.write(env_template)
        
        print(f"📝 Environment template saved to: {env_file}")

def main():
    print("LearnTwinChain Smart Contract Deployment")
    print("=" * 50)
    
    deployer = ContractDeployer()
    deployed_addresses = deployer.deploy_all_contracts()
    
    print("\n🎉 Deployment Summary:")
    for contract_name, address in deployed_addresses.items():
        print(f"  {contract_name}: {address}")

if __name__ == "__main__":
    main()