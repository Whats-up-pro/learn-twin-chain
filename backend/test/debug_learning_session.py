#!/usr/bin/env python3
"""
Debug script for learning session creation
"""

import json
import os
import sys
from pathlib import Path
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env')

def debug_learning_session():
    """Debug learning session creation step by step"""
    print("🔍 Debugging Learning Session Creation")
    print("=" * 50)
    
    try:
        # Setup Web3
        rpc_url = os.getenv('BLOCKCHAIN_RPC_URL')
        private_key = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
        student_private_key = os.getenv('STUDENT_PRIVATE_KEY')
        
        if not rpc_url or not private_key or not student_private_key:
            print("❌ Missing environment variables")
            return False
        
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not w3.is_connected():
            print("❌ Failed to connect to blockchain")
            return False
        
        account = w3.eth.account.from_key(private_key)
        student_account = w3.eth.account.from_key(student_private_key)
        
        print(f"✅ Connected to blockchain")
        print(f"📝 Deployer account: {account.address}")
        print(f"📝 Student account: {student_account.address}")
        
        # Load contract addresses
        deployment_file = Path(__file__).parent.parent / "deployment_addresses.json"
        with open(deployment_file, 'r') as f:
            data = json.load(f)
            contract_addresses = data.get('contracts', {})
        
        learning_data_registry_address = contract_addresses.get('learning_data_registry')
        if not learning_data_registry_address:
            print("❌ LearningDataRegistry address not found")
            return False
        
        print(f"📋 LearningDataRegistry address: {learning_data_registry_address}")
        
        # Load contract ABI
        abi_path = Path(__file__).parent.parent / "artifacts/contracts/LearningDataRegistry.sol/LearningDataRegistry.json"
        with open(abi_path, 'r') as f:
            contract_data = json.load(f)
        
        contract = w3.eth.contract(
            address=learning_data_registry_address,
            abi=contract_data['abi']
        )
        
        print("✅ Contract loaded successfully")
        
        # Check contract state
        print("\n🔍 Checking contract state...")
        
        try:
            owner = contract.functions.owner().call()
            print(f"   📋 Contract owner: {owner}")
        except Exception as e:
            print(f"   ❌ Could not get owner: {str(e)}")
        
        try:
            is_paused = contract.functions.paused().call()
            print(f"   📋 Contract paused: {is_paused}")
        except Exception as e:
            print(f"   ❌ Could not check pause status: {str(e)}")
        
        try:
            min_validators = contract.functions.minValidators().call()
            print(f"   📋 Min validators: {min_validators}")
        except Exception as e:
            print(f"   ❌ Could not get min validators: {str(e)}")
        
        try:
            session_timeout = contract.functions.sessionTimeout().call()
            print(f"   📋 Session timeout: {session_timeout} seconds")
        except Exception as e:
            print(f"   ❌ Could not get session timeout: {str(e)}")
        
        # Check if student is authorized validator
        try:
            is_validator = contract.functions.authorizedValidators(student_account.address).call()
            print(f"   📋 Student is authorized validator: {is_validator}")
        except Exception as e:
            print(f"   ❌ Could not check validator status: {str(e)}")
        
        # Test learning session creation
        print("\n🧪 Testing learning session creation...")
        
        # Test data
        module_id = "python_basics_001"
        learning_data_hash = b'\x00' * 32  # 32 bytes of zeros
        score = 85
        time_spent = 3600
        attempts = 3
        
        print(f"   📋 Test parameters:")
        print(f"      Module ID: {module_id}")
        print(f"      Learning data hash: {learning_data_hash}")
        print(f"      Score: {score}")
        print(f"      Time spent: {time_spent}")
        print(f"      Attempts: {attempts}")
        
        # Try to create learning session
        try:
            # First, try to call the function to see if it would succeed
            print("\n🔍 Testing function call (simulation)...")
            try:
                result = contract.functions.createLearningSession(
                    module_id,
                    learning_data_hash,
                    score,
                    time_spent,
                    attempts
                ).call({'from': student_account.address})
                print(f"   ✅ Call simulation successful: {result}")
            except Exception as e:
                print(f"   ❌ Call simulation failed: {str(e)}")
                # Try to decode the error
                if "execution reverted" in str(e):
                    print("   📋 This is a revert error - checking specific conditions...")
                    
                    # Check each condition individually
                    print("\n🔍 Checking individual conditions...")
                    
                    # Check if module ID is empty
                    if len(module_id) == 0:
                        print("   ❌ Module ID is empty")
                    else:
                        print("   ✅ Module ID is not empty")
                    
                    # Check if score is valid
                    if score > 100:
                        print("   ❌ Score is greater than 100")
                    else:
                        print("   ✅ Score is valid (≤ 100)")
                    
                    # Check if time spent is valid
                    if time_spent <= 0:
                        print("   ❌ Time spent is not positive")
                    else:
                        print("   ✅ Time spent is positive")
                    
                    # Check if attempts is valid
                    if attempts <= 0:
                        print("   ❌ Attempts is not positive")
                    else:
                        print("   ✅ Attempts is positive")
                    
                    # Check if contract is paused
                    try:
                        is_paused = contract.functions.paused().call()
                        if is_paused:
                            print("   ❌ Contract is paused")
                        else:
                            print("   ✅ Contract is not paused")
                    except:
                        print("   ⚠️  Could not check pause status")
            
            # Build transaction with higher gas limit
            tx = contract.functions.createLearningSession(
                module_id,
                learning_data_hash,
                score,
                time_spent,
                attempts
            ).build_transaction({
                'from': student_account.address,
                'nonce': w3.eth.get_transaction_count(student_account.address),
                'gas': 500000,  # Increased gas limit
                'gasPrice': w3.eth.gas_price
            })
            
            print("   ✅ Transaction built successfully")
            
            # Sign transaction
            signed_tx = w3.eth.account.sign_transaction(tx, private_key=student_account.key.hex())
            print("   ✅ Transaction signed successfully")
            
            # Send transaction
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            print(f"   ✅ Transaction sent: {tx_hash.hex()}")
            
            # Wait for receipt
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"   📋 Transaction status: {tx_receipt.status}")
            print(f"   📋 Gas used: {tx_receipt.gasUsed}")
            
            if tx_receipt.status == 1:
                print("   ✅ Learning session created successfully!")
                
                # Try to extract session hash from event
                for log in tx_receipt.logs:
                    if log.address.lower() == contract.address.lower():
                        try:
                            event = contract.events.LearningSessionCreated().process_log(log)
                            session_hash = event['args']['sessionHash']
                            print(f"   📋 Session hash: {session_hash.hex()}")
                            break
                        except Exception as e:
                            print(f"   ⚠️  Could not parse event: {str(e)}")
                            continue
                
                return True
            else:
                print("   ❌ Transaction failed")
                
                # Try to get more error details
                try:
                    # Get the transaction to see if there are any logs
                    tx_data = w3.eth.get_transaction(tx_hash)
                    print(f"   📋 Transaction data: {tx_data}")
                    
                    # Check if there are any logs that might indicate the error
                    if tx_receipt.logs:
                        print(f"   📋 Transaction logs: {tx_receipt.logs}")
                except Exception as e:
                    print(f"   ⚠️  Could not get transaction details: {str(e)}")
                
                return False
                
        except Exception as e:
            print(f"   ❌ Error creating learning session: {str(e)}")
            return False
        
    except Exception as e:
        print(f"❌ Debug failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = debug_learning_session()
    if success:
        print("\n🎉 Learning session creation works!")
    else:
        print("\n❌ Learning session creation failed!") 