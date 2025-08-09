#!/usr/bin/env python3
"""
Debug script to investigate validator approval issues
"""

import json
import os
import sys
from pathlib import Path
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables from backend directory
load_dotenv(Path(__file__).parent.parent / '.env')

# Add the backend directory to the path for digital_twin import
sys.path.insert(0, str(Path(__file__).parent.parent))

def debug_approval_issue():
    """Debug the validator approval issue"""
    
    # Setup Web3
    rpc_url = os.getenv('BLOCKCHAIN_RPC_URL')
    private_key = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
    student_private_key = os.getenv('STUDENT_PRIVATE_KEY')
    
    if not rpc_url or not private_key or not student_private_key:
        print("❌ Missing blockchain configuration")
        return
    
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("❌ Failed to connect to blockchain")
        return
    
    account = w3.eth.account.from_key(private_key)
    student_account = w3.eth.account.from_key(student_private_key)
    
    print(f"✅ Connected to blockchain at {rpc_url}")
    print(f"📝 Deployer account: {account.address}")
    print(f"📝 Student account: {student_account.address}")
    
    # Load deployment addresses
    deployment_file = Path(__file__).parent.parent / "deployment_addresses.json"
    with open(deployment_file, 'r') as f:
        deployment_data = json.load(f)
        contracts = deployment_data.get('contracts', {})
    
    # Load LearningDataRegistry contract
    contract_address = contracts.get('learning_data_registry')
    if not contract_address:
        print("❌ LearningDataRegistry address not found")
        return
    
    # Load ABI
    abi_path = Path(__file__).parent.parent / "artifacts" / "contracts" / "LearningDataRegistry.sol" / "LearningDataRegistry.json"
    with open(abi_path, 'r') as f:
        abi_data = json.load(f)
        abi = abi_data['abi']
    
    contract = w3.eth.contract(address=contract_address, abi=abi)
    
    print(f"✅ Contract loaded at {contract_address}")
    
    # Check contract state
    print("\n🔍 Checking contract state...")
    
    # Check if contract is paused
    try:
        is_paused = contract.functions.paused().call()
        print(f"   📋 Contract paused: {is_paused}")
    except Exception as e:
        print(f"   ❌ Failed to check pause status: {str(e)}")
    
    # Check validator status
    try:
        is_validator = contract.functions.authorizedValidators(account.address).call()
        print(f"   📋 Deployer is validator: {is_validator}")
    except Exception as e:
        print(f"   ❌ Failed to check validator status: {str(e)}")
    
    # Check min validators required
    try:
        min_validators = contract.functions.minValidators().call()
        print(f"   📋 Min validators required: {min_validators}")
    except Exception as e:
        print(f"   ❌ Failed to check min validators: {str(e)}")
    
    # Check session timeout
    try:
        session_timeout = contract.functions.sessionTimeout().call()
        print(f"   📋 Session timeout: {session_timeout} seconds ({session_timeout // 3600} hours)")
    except Exception as e:
        print(f"   ❌ Failed to check session timeout: {str(e)}")
    
    # Create a test session
    print("\n🔍 Creating test session...")
    
    # Test parameters
    module_id = "python_basics_001"
    learning_data_hash = b'\x00' * 32  # 32 bytes of zeros
    score = 85
    time_spent = 3600
    attempts = 3
    
    # Create session hash
    session_data = (
        student_account.address,
        module_id,
        learning_data_hash,
        w3.eth.get_block('latest')['timestamp'],
        score,
        time_spent,
        attempts
    )
    
    # Use the correct Web3.py method for encoding
    from eth_abi import encode
    session_hash = w3.keccak(
        encode(
            ['address', 'string', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256'],
            session_data
        )
    )
    
    print(f"   📋 Session hash: {session_hash.hex()}")
    
    # Create learning session
    try:
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
        
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=student_account.key.hex())
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        if tx_receipt.status == 1:
            print("   ✅ Session created successfully")
            print(f"   📋 Transaction: {tx_hash.hex()}")
        else:
            print("   ❌ Session creation failed")
            return
    except Exception as e:
        print(f"   ❌ Session creation error: {str(e)}")
        return
    
    # Check session details
    print("\n🔍 Checking session details...")
    
    try:
        session_details = contract.functions.getLearningSession(session_hash).call()
        print(f"   📋 Student: {session_details[0]}")
        print(f"   📋 Module ID: {session_details[1]}")
        print(f"   📋 Learning data hash: {session_details[2].hex()}")
        print(f"   📋 Timestamp: {session_details[3]}")
        print(f"   📋 Score: {session_details[4]}")
        print(f"   📋 Time spent: {session_details[5]}")
        print(f"   📋 Attempts: {session_details[6]}")
        print(f"   📋 Is verified: {session_details[7]}")
        print(f"   📋 Approval count: {session_details[8]}")
        
        # Check if session exists
        session_timestamp = session_details[3]
        if session_timestamp > 0:
            print("   ✅ Session exists")
        else:
            print("   ❌ Session does not exist")
            return
    except Exception as e:
        print(f"   ❌ Failed to get session details: {str(e)}")
        return
    
    # Check if session is expired
    try:
        current_time = w3.eth.get_block('latest')['timestamp']
        session_age = current_time - session_timestamp
        session_timeout_seconds = contract.functions.sessionTimeout().call()
        
        print(f"   📋 Current time: {current_time}")
        print(f"   📋 Session age: {session_age} seconds")
        print(f"   📋 Session timeout: {session_timeout_seconds} seconds")
        
        if session_age > session_timeout_seconds:
            print("   ❌ Session has expired")
            return
        else:
            print("   ✅ Session is not expired")
    except Exception as e:
        print(f"   ❌ Failed to check session expiration: {str(e)}")
    
    # Check if validator has already approved
    try:
        # This would require checking the validatorApprovals mapping
        # For now, we'll try the approval and see what happens
        print("\n🔍 Attempting approval...")
        
        tx = contract.functions.validateLearningSession(
            session_hash,
            True  # approved
        ).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 500000,  # Increased gas limit
            'gasPrice': w3.eth.gas_price
        })
        
        # Estimate gas to see if there are any issues
        try:
            estimated_gas = contract.functions.validateLearningSession(
                session_hash,
                True
            ).estimate_gas({'from': account.address})
            print(f"   📋 Estimated gas: {estimated_gas}")
        except Exception as e:
            print(f"   ❌ Gas estimation failed: {str(e)}")
            return
        
        # Sign and send transaction
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=account.key.hex())
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        if tx_receipt.status == 1:
            print("   ✅ Approval successful")
            print(f"   📋 Transaction: {tx_hash.hex()}")
            
            # Check updated session details
            session_details = contract.functions.getLearningSession(session_hash).call()
            print(f"   📋 Updated approval count: {session_details[8]}")
            print(f"   📋 Updated is verified: {session_details[7]}")
            
            # Check if session is verified
            is_verified = contract.functions.isSessionVerified(session_hash).call()
            print(f"   📋 Session verified: {is_verified}")
            
        else:
            print("   ❌ Approval failed")
            print(f"   📋 Transaction: {tx_hash.hex()}")
            
    except Exception as e:
        print(f"   ❌ Approval error: {str(e)}")

if __name__ == "__main__":
    debug_approval_issue() 