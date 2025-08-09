#!/usr/bin/env python3
"""
Script to deploy all smart contracts for the LearnTwinChain system
"""

import json
import os
import subprocess
from pathlib import Path
from web3 import Web3
from eth_account import Account
import time
from dotenv import load_dotenv

#Load environment variables
load_dotenv()
class ContractDeployer:
    def __init__(self):
        self.w3 = None
        self.account = None
        self.deployment_addresses = {}
        
    def setup_web3(self, rpc_url, private_key):
        """Setup Web3 connection and account"""
        try:
            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            if not self.w3.is_connected():
                raise Exception("Failed to connect to blockchain")
            
            self.account = Account.from_key(private_key)
            print(f"✅ Connected to blockchain at {rpc_url}")
            print(f"📝 Using account: {self.account.address}")
            
        except Exception as e:
            print(f"❌ Failed to setup Web3: {str(e)}")
            raise
    
    def compile_contracts(self):
        """Compile contracts using Hardhat and load artifacts"""
        try:
            print("🔧 Compiling contracts...")
            
            # Run hardhat compile from backend directory
            result = subprocess.run(
                "npx hardhat compile",
                shell=True,
                cwd=".",
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f"❌ Compilation failed: {result.stderr}")
                return False
            
            print("✅ Contracts compiled successfully")
            
            # Verify artifacts exist
            artifacts_dir = Path("artifacts/contracts")
            if not artifacts_dir.exists():
                print("❌ Contract artifacts not found after compilation.")
                return False
            
            print("✅ Contract artifacts loaded successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error during compilation: {str(e)}")
            return False
    
    def deploy_all_contracts(self):
        """Deploy all contracts in the correct order with proper integration"""
        try:
            print("🚀 Deploying all contracts...")
            
            # 1. Deploy LearningDataRegistry first (needed by ModuleProgressNFT)
            print("\n📝 Deploying LearningDataRegistry...")
            learning_data_registry_address = self._deploy_contract_with_args(
                "LearningDataRegistry",
                [self.account.address]
            )
            
            if not learning_data_registry_address:
                return False
            
            self.deployment_addresses['learning_data_registry'] = learning_data_registry_address
            
            # 2. Deploy verifier contracts first
            print("\n📝 Deploying verifier contracts...")
            module_progress_verifier_address = self._deploy_contract_from_path("verifiers/module_progress_verifier")
            learning_achievement_verifier_address = self._deploy_contract_from_path("verifiers/learning_achievement_verifier")
            
            if not module_progress_verifier_address or not learning_achievement_verifier_address:
                return False
            
            self.deployment_addresses['module_progress_verifier'] = module_progress_verifier_address
            self.deployment_addresses['learning_achievement_verifier'] = learning_achievement_verifier_address
            
            # 3. Deploy ZKLearningVerifier with verifier addresses
            print("\n📝 Deploying ZKLearningVerifier...")
            zk_verifier_address = self._deploy_contract_with_args(
                "ZKLearningVerifier",
                [
                    "0x0000000000000000000000000000000000000000",  # _moduleNFT (will be set later)
                    "0x0000000000000000000000000000000000000000",  # _achievementNFT (will be set later)
                    module_progress_verifier_address,  # _moduleProgressVerifier
                    learning_achievement_verifier_address  # _learningAchievementVerifier
                ]
            )
            
            if not zk_verifier_address:
                return False
            
            self.deployment_addresses['zk_learning_verifier'] = zk_verifier_address
            
            # 4. Deploy ModuleProgressNFT with ZK verifier
            print("\n📝 Deploying ModuleProgressNFT...")
            module_nft_address = self._deploy_contract_with_args(
                "ModuleProgressNFT",
                [
                    "https://api.learntwin.com/metadata/module/",  # baseURI
                    self.account.address,  # initialOwner
                    learning_data_registry_address,  # _learningDataRegistry
                    zk_verifier_address  # _zkLearningVerifier
                ]
            )
            
            if not module_nft_address:
                return False
            
            self.deployment_addresses['module_progress_nft'] = module_nft_address
            
            # 5. Deploy LearningAchievementNFT with ZK verifier
            print("\n📝 Deploying LearningAchievementNFT...")
            achievement_nft_address = self._deploy_contract_with_args(
                "LearningAchievementNFT",
                [
                    "LearnTwin Achievements",  # name
                    "LTA",  # symbol
                    "https://api.learntwin.com/metadata/achievement/",  # _baseTokenURI
                    self.account.address,  # initialOwner
                    zk_verifier_address  # _zkLearningVerifier
                ]
            )
            
            if not achievement_nft_address:
                return False
            
            self.deployment_addresses['learning_achievement_nft'] = achievement_nft_address
            
            # 6. Update ZKLearningVerifier with NFT addresses
            print("\n📝 Updating ZKLearningVerifier with NFT addresses...")
            if not self._update_zk_verifier_addresses(zk_verifier_address, module_nft_address, achievement_nft_address):
                return False
            
            # 7. Deploy other contracts
            print("\n📝 Deploying other contracts...")
            digital_twin_registry_address = self._deploy_contract("DigitalTwinRegistry")
            zkp_certificate_registry_address = self._deploy_contract("ZKPCertificateRegistry")
            
            if digital_twin_registry_address:
                self.deployment_addresses['digital_twin_registry'] = digital_twin_registry_address
            
            if zkp_certificate_registry_address:
                self.deployment_addresses['zkp_certificate_registry'] = zkp_certificate_registry_address
            
            print("✅ All contracts deployed successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to deploy contracts: {str(e)}")
            return False
    
    def _update_zk_verifier_addresses(self, zk_verifier_address, module_nft_address, achievement_nft_address):
        """Update ZKLearningVerifier with NFT addresses"""
        try:
            print("   Updating ZKLearningVerifier with ModuleProgressNFT address...")
            
            # Load ZKLearningVerifier ABI
            artifact_path = "artifacts/contracts/ZKLearningVerifier.sol/ZKLearningVerifier.json"
            with open(artifact_path, 'r') as f:
                contract_data = json.load(f)
            
            # Create contract instance
            zk_verifier = self.w3.eth.contract(
                address=zk_verifier_address,
                abi=contract_data['abi']
            )
            
            def _send_owner_tx(fn):
                # Robust EIP-1559 tx with retries
                for attempt in range(3):
                    try:
                        latest = self.w3.eth.get_block('latest')
                        base_fee = latest.get('baseFeePerGas', 0) or 0
                        try:
                            priority = self.w3.eth.max_priority_fee
                        except Exception:
                            priority = self.w3.to_wei(2, 'gwei')
                        max_priority = int(priority * (1.5 + attempt * 0.5))
                        max_fee = int(base_fee * (3 + attempt) + max_priority)
                        nonce = self.w3.eth.get_transaction_count(self.account.address, 'pending')

                        # Estimate gas and add generous buffer
                        gas_est = fn.estimate_gas({
                            'from': self.account.address,
                            'type': 2,
                            'maxFeePerGas': max_fee,
                            'maxPriorityFeePerGas': max_priority
                        })
                        tx = fn.build_transaction({
                            'from': self.account.address,
                            'nonce': nonce,
                            'gas': int(gas_est * 2),
                            'type': 2,
                            'maxFeePerGas': max_fee,
                            'maxPriorityFeePerGas': max_priority,
                            'chainId': self.w3.eth.chain_id
                        })
                        signed = self.w3.eth.account.sign_transaction(tx, private_key=self.account.key)
                        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
                        print(f"      🔧 Sent tx {tx_hash.hex()} (attempt {attempt+1})")
                        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=600, poll_latency=2)
                        if receipt.status == 1:
                            return receipt
                        print("      ⚠️ Tx reverted, retrying with higher fees...")
                        time.sleep(5)
                    except Exception as e:
                        print(f"      ⚠️ Attempt {attempt+1} failed: {e}")
                        time.sleep(10)
                return None

            # Update ModuleProgressNFT address
            receipt_mod = _send_owner_tx(zk_verifier.functions.updateModuleNFT(module_nft_address))
            if not receipt_mod or receipt_mod.status != 1:
                print(f"❌ Failed to update ModuleProgressNFT address in ZKLearningVerifier")
                return False
            print("   ✅ ModuleProgressNFT address updated in ZKLearningVerifier")
            
            # Update LearningAchievementNFT address
            print("   Updating ZKLearningVerifier with LearningAchievementNFT address...")
            receipt_ach = _send_owner_tx(zk_verifier.functions.updateAchievementNFT(achievement_nft_address))
            if not receipt_ach or receipt_ach.status != 1:
                print(f"❌ Failed to update LearningAchievementNFT address in ZKLearningVerifier")
                return False
            print("   ✅ LearningAchievementNFT address updated in ZKLearningVerifier")
            return True
            
        except Exception as e:
            print(f"❌ Error updating ZKLearningVerifier addresses: {str(e)}")
            return False
    
    def _deploy_contract(self, contract_name):
        """Deploy a single contract without constructor arguments using Web3.py"""
        try:
            print(f"   Deploying {contract_name}...")
            
            # Load contract artifact
            artifact_path = f"artifacts/contracts/{contract_name}.sol/{contract_name}.json"
            if not Path(artifact_path).exists():
                print(f"❌ Contract artifact not found: {artifact_path}")
                return None
            
            with open(artifact_path, 'r') as f:
                contract_data = json.load(f)
            
            # Create contract instance
            contract = self.w3.eth.contract(
                abi=contract_data['abi'],
                bytecode=contract_data['bytecode']
            )
            
            # Build transaction
            construct_txn = contract.constructor().build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 5000000,  # Increased gas limit
                'gasPrice': self.w3.eth.gas_price
            })
            
            print(f"   Gas estimate: {construct_txn['gas']}")
            print(f"   Gas price: {construct_txn['gasPrice']}")
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(construct_txn, private_key=self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            # Wait for transaction receipt
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"   Transaction hash: {tx_hash.hex()}")
            print(f"   Transaction status: {tx_receipt.status}")
            print(f"   Gas used: {tx_receipt.gasUsed}")
            
            if tx_receipt.status == 1:
                address = tx_receipt.contractAddress
                print(f"   ✅ {contract_name} deployed at: {address}")
                return address
            else:
                print(f"❌ Deployment failed for {contract_name}")
                print(f"   Transaction failed - status: {tx_receipt.status}")
                # Try to get error details
                try:
                    tx = self.w3.eth.get_transaction(tx_hash)
                    print(f"   Transaction data: {tx.hex()}")
                except Exception as e:
                    print(f"   Could not get transaction details: {e}")
                return None
            
        except Exception as e:
            print(f"❌ Error deploying {contract_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _deploy_contract_with_args(self, contract_name, constructor_args):
        """Deploy a contract with constructor arguments using Web3.py"""
        try:
            print(f"   Deploying {contract_name} with constructor args...")
            print(f"   Constructor args: {constructor_args}")
            
            # Load contract artifact
            artifact_path = f"artifacts/contracts/{contract_name}.sol/{contract_name}.json"
            if not Path(artifact_path).exists():
                print(f"❌ Contract artifact not found: {artifact_path}")
                return None
            
            with open(artifact_path, 'r') as f:
                contract_data = json.load(f)
            
            # Create contract instance
            contract = self.w3.eth.contract(
                abi=contract_data['abi'],
                bytecode=contract_data['bytecode']
            )
            
            # Get current gas price and increase it slightly for faster processing
            current_gas_price = self.w3.eth.gas_price
            # Increase gas price by 20% for faster processing
            adjusted_gas_price = int(current_gas_price * 2.0)  # Increased gas price multiplier
            
            # Build transaction with constructor arguments
            construct_txn = contract.constructor(*constructor_args).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 5000000,  # Increased gas limit
                'gasPrice': adjusted_gas_price
            })
            
            print(f"   Gas estimate: {construct_txn['gas']}")
            print(f"   Gas price: {construct_txn['gasPrice']} (adjusted from {current_gas_price})")
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(construct_txn, private_key=self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            print(f"   Transaction sent: {tx_hash.hex()}")
            print(f"   Waiting for confirmation... (timeout: 300 seconds)")
            
            # Wait for transaction receipt with longer timeout
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
            print(f"   Transaction hash: {tx_hash.hex()}")
            print(f"   Transaction status: {tx_receipt.status}")
            print(f"   Gas used: {tx_receipt.gasUsed}")
            
            if tx_receipt.status == 1:
                address = tx_receipt.contractAddress
                print(f"   ✅ {contract_name} deployed at: {address}")
                return address
            else:
                print(f"❌ Deployment failed for {contract_name}")
                print(f"   Transaction failed - status: {tx_receipt.status}")
                # Try to get error details
                try:
                    tx = self.w3.eth.get_transaction(tx_hash)
                    print(f"   Transaction data: {tx.hex()}")
                except Exception as e:
                    print(f"   Could not get transaction details: {e}")
                return None
            
        except Exception as e:
            print(f"❌ Error deploying {contract_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _deploy_contract_from_path(self, contract_path):
        """Deploy a contract from a specific path using Web3.py"""
        try:
            contract_name = contract_path.split('/')[-1]
            print(f"   Deploying {contract_name} from {contract_path}...")
            
            # Convert snake_case to PascalCase for contract name
            contract_name_pascal = ''.join(word.capitalize() for word in contract_name.split('_'))
            
            # Load contract artifact
            artifact_path = f"artifacts/contracts/{contract_path}.sol/{contract_name_pascal}.json"
            if not Path(artifact_path).exists():
                print(f"❌ Contract artifact not found: {artifact_path}")
                return None
            
            with open(artifact_path, 'r') as f:
                contract_data = json.load(f)
            
            # Create contract instance
            contract = self.w3.eth.contract(
                abi=contract_data['abi'],
                bytecode=contract_data['bytecode']
            )
            
            # Get current gas price and increase it slightly for faster processing
            current_gas_price = self.w3.eth.gas_price
            # Increase gas price by 20% for faster processing
            adjusted_gas_price = int(current_gas_price * 2.0)  # Increased gas price multiplier
            
            # Build transaction with lower gas limit for verifier contracts
            construct_txn = contract.constructor().build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 3000000,  # Reduced gas limit for verifier contracts
                'gasPrice': adjusted_gas_price
            })
            
            print(f"   Gas estimate: {construct_txn['gas']}")
            print(f"   Gas price: {construct_txn['gasPrice']} (adjusted from {current_gas_price})")
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(construct_txn, private_key=self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            print(f"   Transaction sent: {tx_hash.hex()}")
            print(f"   Waiting for confirmation... (timeout: 300 seconds)")
            
            # Wait for transaction receipt with longer timeout
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)  # 5 minutes
            print(f"   Transaction hash: {tx_hash.hex()}")
            print(f"   Transaction status: {tx_receipt.status}")
            print(f"   Gas used: {tx_receipt.gasUsed}")
            
            if tx_receipt.status == 1:
                address = tx_receipt.contractAddress
                print(f"   ✅ {contract_name} deployed at: {address}")
                return address
            else:
                print(f"❌ Deployment failed for {contract_name}")
                print(f"   Transaction failed - status: {tx_receipt.status}")
                # Try to get error details
                try:
                    tx = self.w3.eth.get_transaction(tx_hash)
                    print(f"   Transaction data: {tx}")
                except Exception as e:
                    print(f"   Could not get transaction details: {e}")
                return None
            
        except Exception as e:
            print(f"❌ Error deploying {contract_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def save_deployment_addresses(self):
        """Save deployment addresses to file"""
        try:
            deployment_file = Path("deployment_addresses.json")
            
            # Create new deployment data structure
            deployment_data = {
                "network": 11155111,  # Sepolia
                "deployer": self.account.address,
                "contracts": {},
                "timestamp": int(time.time())
            }
            
            # Load existing addresses if file exists
            if deployment_file.exists():
                with open(deployment_file, 'r') as f:
                    existing_data = json.load(f)
                    if "contracts" in existing_data:
                        deployment_data["contracts"].update(existing_data["contracts"])
            
            # Update with new addresses
            deployment_data["contracts"].update(self.deployment_addresses)
            
            # Save to file
            with open(deployment_file, 'w') as f:
                json.dump(deployment_data, f, indent=2)
            
            print(f"✅ Deployment addresses saved to {deployment_file}")
            
        except Exception as e:
            print(f"❌ Failed to save deployment addresses: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def verify_deployment(self):
        """Verify that all contracts are deployed and accessible"""
        try:
            print("🔍 Verifying deployment...")
            
            for contract_name, address in self.deployment_addresses.items():
                # Check if contract exists at address
                code = self.w3.eth.get_code(address)
                if code == b'':
                    print(f"❌ Contract {contract_name} not found at {address}")
                    return False
                else:
                    print(f"✅ {contract_name} verified at {address}")
            
            return True
            
        except Exception as e:
            print(f"❌ Verification failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

def main():
    """Main deployment function"""
    
    # Configuration - Use the correct environment variables
    RPC_URL = os.getenv('BLOCKCHAIN_RPC_URL', 'http://localhost:8545')
    PRIVATE_KEY = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
    CHAIN_ID = os.getenv('CHAIN_ID', '11155111')  # Sepolia chain ID
    
    if not PRIVATE_KEY:
        print("❌ BLOCKCHAIN_PRIVATE_KEY environment variable not set")
        return
    
    if not RPC_URL:
        print("❌ BLOCKCHAIN_RPC_URL environment variable not set")
        return
    
    print(f"🔧 Deployment Configuration:")
    print(f"   RPC URL: {RPC_URL}")
    print(f"   Chain ID: {CHAIN_ID}")
    print(f"   Account: {Account.from_key(PRIVATE_KEY).address}")
    
    # Initialize deployer
    deployer = ContractDeployer()
    
    try:
        # Setup Web3
        deployer.setup_web3(RPC_URL, PRIVATE_KEY)
        
        # Compile contracts
        if not deployer.compile_contracts():
            return
        
        # Deploy all contracts
        if not deployer.deploy_all_contracts():
            return
        
        # Verify deployment
        if not deployer.verify_deployment():
            return
        
        # Save addresses
        deployer.save_deployment_addresses()
        
        print("\n🎉 All contracts deployed successfully!")
        print("\n📋 Deployment Summary:")
        for name, address in deployer.deployment_addresses.items():
            print(f"  {name}: {address}")
        
        print(f"\n🌐 Network: Sepolia (Chain ID: {CHAIN_ID})")
        print(f"🔗 Explorer: https://sepolia.etherscan.io/")
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")

if __name__ == "__main__":
    main()