#!/usr/bin/env python3
"""
Debug script to check verifier contract and public inputs
"""

import json
import os
import sys
from pathlib import Path
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

def debug_verifier():
    """Debug verifier contract and public inputs"""
    
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
    print(f"📝 Using account: {account.address}")
    
    # Load deployment addresses
    deployment_file = Path(__file__).parent.parent / "deployment_addresses.json"
    if not deployment_file.exists():
        print("❌ Deployment addresses file not found")
        return False
    
    with open(deployment_file, 'r') as f:
        deployment_data = json.load(f)
    
    contracts = deployment_data.get('contracts', {})
    
    # Load contract ABIs
    contracts_dir = Path(__file__).parent.parent / "contracts"
    abi_dir = contracts_dir / "abi"
    
    try:
        # Test 1: Check LearningAchievementVerifier directly
        print("\n🧪 Test 1: Checking LearningAchievementVerifier directly...")
        learning_verifier_address = contracts.get('learning_achievement_verifier')
        if not learning_verifier_address:
            print("❌ LearningAchievementVerifier address not found")
            return False
        
        # Check if contract exists
        learning_verifier_code = w3.eth.get_code(learning_verifier_address)
        if learning_verifier_code == b'':
            print("❌ LearningAchievementVerifier contract not found at address")
            return False
        else:
            print("✅ LearningAchievementVerifier contract found")
        
        # Load learning achievement verifier ABI
        try:
            with open(abi_dir / "LearningAchievementVerifier.json", 'r') as f:
                learning_verifier_abi = json.load(f)
        except FileNotFoundError:
            print("❌ LearningAchievementVerifier ABI not found, trying from artifacts...")
            artifacts_dir = Path(__file__).parent.parent / "artifacts" / "contracts"
            abi_file = artifacts_dir / "verifiers" / "learning_achievement_verifier.sol" / "LearningAchievementVerifier.json"
            if abi_file.exists():
                with open(abi_file, 'r') as f:
                    artifact_data = json.load(f)
                    learning_verifier_abi = artifact_data.get('abi', [])
            else:
                print("❌ LearningAchievementVerifier ABI not found in artifacts")
                return False
        
        learning_verifier = w3.eth.contract(address=learning_verifier_address, abi=learning_verifier_abi)
        
        # Test 2: Check ZKLearningVerifier
        print("\n🧪 Test 2: Checking ZKLearningVerifier...")
        zk_verifier_address = contracts.get('zk_learning_verifier')
        if not zk_verifier_address:
            print("❌ ZKLearningVerifier address not found")
            return False
        
        # Check if contract exists
        zk_verifier_code = w3.eth.get_code(zk_verifier_address)
        if zk_verifier_code == b'':
            print("❌ ZKLearningVerifier contract not found at address")
            return False
        else:
            print("✅ ZKLearningVerifier contract found")
        
        # Load ZKLearningVerifier ABI
        try:
            with open(abi_dir / "ZKLearningVerifier.json", 'r') as f:
                zk_verifier_abi = json.load(f)
        except FileNotFoundError:
            print("❌ ZKLearningVerifier ABI not found, trying from artifacts...")
            artifacts_dir = Path(__file__).parent.parent / "artifacts" / "contracts"
            abi_file = artifacts_dir / "ZKLearningVerifier.sol" / "ZKLearningVerifier.json"
            if abi_file.exists():
                with open(abi_file, 'r') as f:
                    artifact_data = json.load(f)
                    zk_verifier_abi = artifact_data.get('abi', [])
            else:
                print("❌ ZKLearningVerifier ABI not found in artifacts")
                return False
        
        zk_verifier = w3.eth.contract(address=zk_verifier_address, abi=zk_verifier_abi)
        
        # Test 3: Check if ZKLearningVerifier has the right functions
        print("\n🧪 Test 3: Checking ZKLearningVerifier functions...")
        try:
            # Check if function exists in ABI
            function_exists = False
            for abi_item in zk_verifier_abi:
                if abi_item.get('type') == 'function' and abi_item.get('name') == 'getLearningAchievementVerifier':
                    function_exists = True
                    break
            
            if function_exists:
                print("✅ getLearningAchievementVerifier function found in ABI")
                learning_verifier_from_zk = zk_verifier.functions.getLearningAchievementVerifier().call()
                print(f"📋 LearningAchievementVerifier from ZK: {learning_verifier_from_zk}")
                
                if learning_verifier_from_zk.lower() == learning_verifier_address.lower():
                    print("✅ Addresses match!")
                else:
                    print(f"❌ Address mismatch: {learning_verifier_from_zk} vs {learning_verifier_address}")
            else:
                print("❌ getLearningAchievementVerifier function not found in ABI")
                print("📋 Available functions:")
                for abi_item in zk_verifier_abi:
                    if abi_item.get('type') == 'function':
                        print(f"   - {abi_item.get('name')}")
                
        except Exception as e:
            print(f"❌ Error checking ZKLearningVerifier functions: {str(e)}")
        
        # Test 4: Test with sample proof data
        print("\n🧪 Test 4: Testing with sample proof data...")
        
        # Sample proof data from test
        a = [16774005793203314473415030324103065557862542860307429869735894843273474602493, 11971423240489521624321010626906174049819039524239322932857983235684509556985]
        b = [[21875166316753940307271562746163294791163218332134310502751522700978869181510, 2308213304624352114724566454409882706784169172301543734204076574731148304513], [2283840653130515108854584709362745052739517132181733711895878667872794457444, 468521611069155606279508725600237970933586599097576351477581397886843105401]]
        c = [2727299999511474063826346088246382110030504444634142749931854915907589055177, 20553374752565276896231158436774774495276425639130968827936715628333176920434]
        
        # Public inputs from test
        public_inputs = [1, 645548067051047808, 6712707522630743106948500086841963435106262321218559615665236613948745187328, 80, 7200, 10]
        
        print(f"📋 Testing public inputs: {public_inputs}")
        print(f"📋 Public inputs types: {[type(x) for x in public_inputs]}")
        
        # Test direct verification call on LearningAchievementVerifier
        try:
            print("📋 Testing direct verification call on LearningAchievementVerifier...")
            is_valid = learning_verifier.functions.verifyProof(a, b, c, public_inputs).call()
            print(f"📋 Verification result: {is_valid}")
            
            if is_valid:
                print("✅ Proof verification successful!")
            else:
                print("❌ Proof verification failed!")
                
        except Exception as e:
            print(f"❌ Verification call failed: {str(e)}")
            print(f"📋 Error type: {type(e).__name__}")
            
            # Try with different public inputs format
            try:
                print("📋 Trying with string public inputs...")
                public_inputs_str = [str(x) for x in public_inputs]
                is_valid = learning_verifier.functions.verifyProof(a, b, c, public_inputs_str).call()
                print(f"📋 Verification result with strings: {is_valid}")
            except Exception as e2:
                print(f"❌ String verification also failed: {str(e2)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Debug failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main debug function"""
    print("🔧 Debugging verifier contract...")
    
    success = debug_verifier()
    
    if success:
        print("\n✅ Debug completed!")
        sys.exit(0)
    else:
        print("\n❌ Debug failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 