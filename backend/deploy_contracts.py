import os
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
from py_solc_x import compile_files

# Load environment variables
load_dotenv()

class ContractDeployer:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(os.getenv('BLOCKCHAIN_RPC_URL')))
        self.account = Account.from_key(os.getenv('BLOCKCHAIN_PRIVATE_KEY'))
        self.contracts_dir = 'contracts'
        
    def compile_contracts(self):
        """Compile all Solidity contracts"""
        print("🔨 Compiling contracts...")
        
        # Compile contracts
        compiled_contracts = compile_files([
            f'{self.contracts_dir}/LearnTwinNFT.sol',
            f'{self.contracts_dir}/DigitalTwinRegistry.sol'
        ])
        
        return compiled_contracts
    
    def deploy_contract(self, contract_name, compiled_contracts, *args):
        """Deploy a single contract"""
        print(f"🚀 Deploying {contract_name}...")
        
        # Get contract bytecode and ABI
        contract_key = f'{self.contracts_dir}/{contract_name}.sol:{contract_name}'
        contract_interface = compiled_contracts[contract_key]
        
        # Create contract instance
        contract = self.w3.eth.contract(
            abi=contract_interface['abi'],
            bytecode=contract_interface['bin']
        )
        
        # Build transaction
        tx = contract.constructor(*args).build_transaction({
            'from': self.account.address,
            'gas': 3000000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        print(f"✅ {contract_name} deployed at: {receipt.contractAddress}")
        return receipt.contractAddress
    
    def save_deployment_info(self, addresses):
        """Save deployment addresses to file"""
        deployment_info = {
            'network': 'sepolia',
            'deployer': self.account.address,
            'contracts': addresses,
            'deployment_date': str(self.w3.eth.get_block('latest').timestamp)
        }
        
        with open('deployment_info.json', 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        print("📄 Deployment info saved to deployment_info.json")
    
    def deploy_all(self):
        """Deploy all contracts"""
        try:
            # Check connection
            if not self.w3.is_connected():
                raise Exception("❌ Cannot connect to blockchain network")
            
            print(f"🔗 Connected to network: {self.w3.eth.chain_id}")
            print(f"👤 Deployer address: {self.account.address}")
            
            # Check balance
            balance = self.w3.eth.get_balance(self.account.address)
            balance_eth = self.w3.from_wei(balance, 'ether')
            print(f" Balance: {balance_eth} ETH")
            
            if balance_eth < 0.01:
                raise Exception("❌ Insufficient balance for deployment")
            
            # Compile contracts
            compiled_contracts = self.compile_contracts()
            
            # Deploy contracts
            addresses = {}
            
            # Deploy LearnTwinNFT
            addresses['LearnTwinNFT'] = self.deploy_contract(
                'LearnTwinNFT', 
                compiled_contracts
            )
            
            # Deploy DigitalTwinRegistry
            addresses['DigitalTwinRegistry'] = self.deploy_contract(
                'DigitalTwinRegistry', 
                compiled_contracts
            )
            
            # Save deployment info
            self.save_deployment_info(addresses)
            
            return addresses
            
        except Exception as e:
            print(f"❌ Deployment failed: {str(e)}")
            return None

def main():
    print("🚀 Starting contract deployment...")
    
    deployer = ContractDeployer()
    addresses = deployer.deploy_all()
    
    if addresses:
        print("\n🎉 Deployment successful!")
        print("Contract addresses:")
        for name, address in addresses.items():
            print(f"  {name}: {address}")
        
        print("\n📝 Update your .env file with these addresses:")
        print(f"NFT_CONTRACT_ADDRESS={addresses['LearnTwinNFT']}")
        print(f"REGISTRY_CONTRACT_ADDRESS={addresses['DigitalTwinRegistry']}")
    else:
        print("❌ Deployment failed!")

if __name__ == "__main__":
    main()
