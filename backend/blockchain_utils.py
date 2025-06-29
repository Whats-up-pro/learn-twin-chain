import os
import json
import hashlib
import requests
import time
from web3 import Web3
from eth_account import Account
from typing import Dict, Any, Optional

class BlockchainManager:
    def __init__(self, rpc_url: str, private_key: str):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = Account.from_key(private_key)
        
        # Pinata configuration
        self.pinata_api_key = os.getenv('PINATA_API_KEY')
        self.pinata_secret_key = os.getenv('PINATA_SECRET_KEY')
        self.ipfs_gateway = os.getenv('IPFS_GATEWAY', 'https://gateway.pinata.cloud/ipfs/')
        
        # Contract addresses
        self.nft_contract_address = os.getenv('NFT_CONTRACT_ADDRESS')
        self.registry_contract_address = os.getenv('REGISTRY_CONTRACT_ADDRESS')
        
        # Initialize contracts (if addresses are set)
        if self.nft_contract_address:
            self.nft_contract = self.w3.eth.contract(
                address=self.nft_contract_address, 
                abi=self._load_abi('LearningAchievementNFT.json')
            )
        
        if self.registry_contract_address:
            self.registry_contract = self.w3.eth.contract(
                address=self.registry_contract_address, 
                abi=self._load_abi('DigitalTwinRegistry.json')
            )

    def _load_abi(self, filename: str) -> list:
        """Load contract ABI from file"""
        abi_path = os.path.join('contracts', 'abi', filename)
        with open(abi_path, 'r') as f:
            return json.load(f)

    def upload_to_ipfs(self, data: Dict[str, Any]) -> str:
        """Upload data to IPFS via Pinata"""
        if not self.pinata_api_key or not self.pinata_secret_key:
            raise Exception("Pinata API keys not configured")
        
        # Prepare headers
        headers = {
            'pinata_api_key': self.pinata_api_key,
            'pinata_secret_api_key': self.pinata_secret_key,
            'Content-Type': 'application/json'
        }
        
        # Prepare metadata
        metadata = {
            'pinataMetadata': {
                'name': f'learning_data_{hash(str(data))}',
                'keyvalues': {
                    'type': 'learning_data',
                    'timestamp': str(int(time.time()))
                }
            },
            'pinataContent': data
        }
        
        # Upload to Pinata
        response = requests.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            json=metadata,
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()['IpfsHash']
        else:
            raise Exception(f"IPFS upload failed: {response.text}")

    def get_ipfs_url(self, cid: str) -> str:
        """Get full IPFS URL from CID"""
        return f"{self.ipfs_gateway}{cid}"

    def download_from_ipfs(self, cid: str) -> Dict[str, Any]:
        """Download data from IPFS"""
        url = self.get_ipfs_url(cid)
        response = requests.get(url)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to download from IPFS: {response.status_code}")

    def create_data_hash(self, data: Dict[str, Any]) -> str:
        """Create hash of data for blockchain verification"""
        json_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(json_str.encode()).hexdigest()

    def mint_achievement_nft(
        self, 
        student_address: str, 
        module_id: str, 
        module_title: str, 
        score: int, 
        metadata: Dict[str, Any]
    ) -> str:
        """Mint ERC-721 NFT for module completion"""
        # Upload metadata to IPFS
        ipfs_cid = self.upload_to_ipfs(metadata)
        
        # Convert student_address to checksum address
        student_address_checksum = self.w3.to_checksum_address(student_address)
        
        # Build transaction - using mintSkillMastery for skill achievements
        tx = self.nft_contract.functions.mintSkillMastery(
            student_address_checksum,  # address
            module_id,                 # string
            f"Completed {module_title} with score {score}",  # string
            ipfs_cid,                  # string
            0                          # uint256 (0 = never expires)
        ).build_transaction({
            'from': self.account.address,
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt['transactionHash'].hex()

    def mint_progress_nft(
        self, 
        student_address: str, 
        module_id: str, 
        progress: int, 
        metadata: Dict[str, Any], 
        is_checkpoint: bool = False
    ) -> str:
        """Mint ERC-1155 NFT for learning progress"""
        # Upload metadata to IPFS
        ipfs_cid = self.upload_to_ipfs(metadata)
        
        # Build transaction
        tx = self.registry_contract.functions.mintProgress(
            student_address,
            module_id,
            progress,
            ipfs_cid,
            is_checkpoint
        ).build_transaction({
            'from': self.account.address,
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt['transactionHash'].hex()

    def register_checkpoint(
        self, 
        student_did: str, 
        module_id: str, 
        score: int, 
        twin_data: Dict[str, Any]
    ) -> str:
        """Register learning checkpoint on blockchain"""
        # Upload twin data to IPFS
        ipfs_cid = self.upload_to_ipfs(twin_data)
        
        # Create data hash
        data_hash = self.create_data_hash(twin_data)
        
        # Build transaction
        tx = self.registry_contract.functions.registerCheckpoint(
            student_did,
            module_id,
            score,
            ipfs_cid,
            data_hash
        ).build_transaction({
            'from': self.account.address,
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt['transactionHash'].hex()

    def log_twin_update(
        self, 
        student_did: str, 
        version: int, 
        twin_data: Dict[str, Any], 
        module_id: str, 
        progress: int, 
        is_checkpoint: bool = False
    ) -> str:
        """Log digital twin update to blockchain"""
        # Upload twin data to IPFS
        ipfs_cid = self.upload_to_ipfs(twin_data)
        
        # Create data hash
        data_hash = self.create_data_hash(twin_data)
        
        # Build transaction
        tx = self.registry_contract.functions.logTwinUpdate(
            student_did,
            version,
            data_hash,
            ipfs_cid,
            module_id,
            progress,
            is_checkpoint
        ).build_transaction({
            'from': self.account.address,
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt['transactionHash'].hex()

    def get_student_nfts(self, student_address: str) -> list:
        """Get all NFTs owned by a student"""
        return self.nft_contract.functions.getStudentTokens(student_address).call()

    def get_student_progress(self, student_address: str) -> list:
        """Get all progress NFTs for a student"""
        return self.registry_contract.functions.getStudentProgress(student_address).call()

    def get_twin_logs(self, student_did: str) -> list:
        """Get all twin data logs for a student"""
        return self.registry_contract.functions.getAllTwinDataLogs(student_did).call()

    def verify_checkpoint(self, student_did: str, module_id: str) -> str:
        """Verify a learning checkpoint"""
        tx = self.registry_contract.functions.verifyCheckpoint(
            student_did,
            module_id
        ).build_transaction({
            'from': self.account.address,
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt['transactionHash'].hex()

    def link_did_to_blockchain(
        self, 
        student_did: str, 
        cid_did: str, 
        student_address: str, 
        skill: str, 
        token_id: str
    ) -> str:
        """Link DID với CID lên blockchain registry"""
        if not self.registry_contract:
            raise Exception("Registry contract not initialized")
        
        # Convert student_address to checksum address
        student_address_checksum = self.w3.to_checksum_address(student_address)
        
        # Build transaction
        tx = self.registry_contract.functions.linkDIDToBlockchain(
            student_did,
            cid_did,
            student_address_checksum,
            skill,
            token_id
        ).build_transaction({
            'from': self.account.address,
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt['transactionHash'].hex()