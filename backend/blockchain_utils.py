import os
import json
import hashlib
import requests
import time
from typing import Dict, Any, Optional, List, Union
from enum import Enum

try:
    from web3 import Web3
    from eth_account import Account
except ImportError:
    print("Warning: web3 and eth_account not installed. Blockchain features will be disabled.")
    Web3 = None
    Account = None

class AchievementType(Enum):
    COURSE_COMPLETION = 0
    SKILL_MASTERY = 1
    MILESTONE_REACHED = 2
    CERTIFICATION = 3
    LEADERSHIP = 4
    INNOVATION = 5

class BlockchainManager:
    def __init__(self, rpc_url: str, private_key: str):
        if Web3 is None or Account is None:
            raise Exception("Web3 and eth_account must be installed for blockchain features")
            
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = Account.from_key(private_key)
        
        # Pinata configuration
        self.pinata_api_key = os.getenv('PINATA_API_KEY')
        self.pinata_secret_key = os.getenv('PINATA_SECRET_KEY')
        self.ipfs_gateway = os.getenv('IPFS_GATEWAY', 'https://gateway.pinata.cloud/ipfs/')
        
        # Contract addresses
        self.module_progress_contract_address = os.getenv('MODULE_PROGRESS_CONTRACT_ADDRESS')
        self.achievement_contract_address = os.getenv('ACHIEVEMENT_CONTRACT_ADDRESS')
        self.registry_contract_address = os.getenv('REGISTRY_CONTRACT_ADDRESS')
        
        # Initialize contracts
        self._initialize_contracts()

    def _initialize_contracts(self):
        """Initialize all smart contracts"""
        if self.module_progress_contract_address:
            self.module_progress_contract = self.w3.eth.contract(
                address=self.module_progress_contract_address,
                abi=self._load_abi('ModuleProgressNFT.json')
            )
        
        if self.achievement_contract_address:
            self.achievement_contract = self.w3.eth.contract(
                address=self.achievement_contract_address,
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
        try:
            with open(abi_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: ABI file {filename} not found. Contract functions may not work.")
            return []

    def upload_to_ipfs(self, data: Dict[str, Any]) -> str:
        """Upload data to IPFS via Pinata"""
        if not self.pinata_api_key or not self.pinata_secret_key:
            raise Exception("Pinata API keys not configured")
        
        headers = {
            'pinata_api_key': self.pinata_api_key,
            'pinata_secret_api_key': self.pinata_secret_key,
            'Content-Type': 'application/json'
        }
        
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

    # ERC-1155 Module Progress Functions
    def mint_module_completion(
        self,
        student_address: str,
        module_id: str,
        module_title: str,
        completion_data: Dict[str, Any],
        amount: int = 1
    ) -> str:
        """Mint ERC-1155 NFT for module completion"""
        if not hasattr(self, 'module_progress_contract'):
            raise Exception("Module Progress contract not initialized")
        
        # Upload completion data to IPFS
        metadata = {
            'module_id': module_id,
            'module_title': module_title,
            'completion_data': completion_data,
            'timestamp': int(time.time()),
            'type': 'module_completion'
        }
        
        ipfs_cid = self.upload_to_ipfs(metadata)
        metadata_uri = self.get_ipfs_url(ipfs_cid)
        
        # Build transaction
        tx = self.module_progress_contract.functions.mintModuleCompletion(
            student_address,
            module_id,
            metadata_uri,
            amount
        ).build_transaction({
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
        return receipt['transactionHash'].hex()

    def get_student_module_progress(self, student_address: str) -> Dict[str, Any]:
        """Get student's module progress from ERC-1155 contract"""
        if not hasattr(self, 'module_progress_contract'):
            raise Exception("Module Progress contract not initialized")
        
        try:
            result = self.module_progress_contract.functions.getStudentProgress(student_address).call()
            
            return {
                'total_modules': result[0],
                'current_level': result[1],
                'token_ids': result[2],
                'amounts': result[3]
            }
        except Exception as e:
            print(f"Error getting student progress: {e}")
            return {
                'total_modules': 0,
                'current_level': 1,
                'token_ids': [],
                'amounts': []
            }

    # ERC-721 Achievement Functions
    def mint_learning_achievement(
        self,
        student_address: str,
        achievement_type: AchievementType,
        title: str,
        description: str,
        achievement_data: Dict[str, Any],
        expires_at: int = 0
    ) -> str:
        """Mint ERC-721 NFT for learning achievement"""
        if not hasattr(self, 'achievement_contract'):
            raise Exception("Achievement contract not initialized")
        
        # Upload achievement data to IPFS
        metadata = {
            'achievement_type': achievement_type.value,
            'title': title,
            'description': description,
            'achievement_data': achievement_data,
            'timestamp': int(time.time()),
            'type': 'learning_achievement'
        }
        
        ipfs_cid = self.upload_to_ipfs(metadata)
        metadata_uri = self.get_ipfs_url(ipfs_cid)
        
        # Build transaction
        tx = self.achievement_contract.functions.mintAchievement(
            student_address,
            achievement_type.value,
            title,
            description,
            metadata_uri,
            expires_at
        ).build_transaction({
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
        return receipt['transactionHash'].hex()

    def mint_course_completion_certificate(
        self,
        student_address: str,
        course_name: str,
        course_data: Dict[str, Any]
    ) -> str:
        """Mint course completion certificate"""
        description = f"Certificate of completion for {course_name}"
        
        return self.mint_learning_achievement(
            student_address,
            AchievementType.COURSE_COMPLETION,
            course_name,
            description,
            course_data,
            0  # Never expires
        )

    def mint_skill_mastery_certificate(
        self,
        student_address: str,
        skill_name: str,
        skill_data: Dict[str, Any],
        expires_at: int = 0
    ) -> str:
        """Mint skill mastery certificate"""
        description = f"Mastery certificate for {skill_name}"
        
        return self.mint_learning_achievement(
            student_address,
            AchievementType.SKILL_MASTERY,
            skill_name,
            description,
            skill_data,
            expires_at
        )

    def get_student_achievements(self, student_address: str) -> List[Dict[str, Any]]:
        """Get all achievements for a student"""
        if not hasattr(self, 'achievement_contract'):
            raise Exception("Achievement contract not initialized")
        
        try:
            token_ids = self.achievement_contract.functions.getStudentAchievements(student_address).call()
            achievements = []
            
            for token_id in token_ids:
                details = self.achievement_contract.functions.getAchievementDetails(token_id).call()
                
                achievement = {
                    'token_id': token_id,
                    'achievement_type': AchievementType(details[0]).name,
                    'title': details[1],
                    'description': details[2],
                    'metadata_uri': details[3],
                    'issued_at': details[4],
                    'expires_at': details[5],
                    'is_revoked': details[6],
                    'is_valid': details[7]
                }
                achievements.append(achievement)
            
            return achievements
        except Exception as e:
            print(f"Error getting student achievements: {e}")
            return []

    def check_achievement_validity(self, token_id: int) -> bool:
        """Check if an achievement is still valid"""
        if not hasattr(self, 'achievement_contract'):
            raise Exception("Achievement contract not initialized")
        
        try:
            return self.achievement_contract.functions.checkAchievementValidity(token_id).call()
        except Exception as e:
            print(f"Error checking achievement validity: {e}")
            return False

    # ZKP Certificate Functions
    def create_zkp_certificate_data(
        self,
        student_did: str,
        achievements: List[Dict[str, Any]],
        module_progress: Dict[str, Any],
        twin_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create data structure for ZKP certificate"""
        return {
            'student_did': student_did,
            'timestamp': int(time.time()),
            'achievements': achievements,
            'module_progress': module_progress,
            'twin_data_hash': self.create_data_hash(twin_data),
            'certificate_type': 'learning_zkp_certificate',
            'version': '1.0'
        }

    def generate_employer_verification_data(
        self,
        student_address: str,
        required_achievements: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate verification data for employers"""
        # Get student achievements
        achievements = self.get_student_achievements(student_address)
        
        # Get module progress
        module_progress = self.get_student_module_progress(student_address)
        
        # Filter achievements if required
        if required_achievements:
            achievements = [a for a in achievements if a['title'] in required_achievements]
        
        # Create verification data
        verification_data = {
            'student_address': student_address,
            'timestamp': int(time.time()),
            'total_achievements': len(achievements),
            'total_modules_completed': module_progress['total_modules'],
            'current_level': module_progress['current_level'],
            'achievements': achievements,
            'module_progress': module_progress,
            'verification_hash': self.create_data_hash({
                'achievements': achievements,
                'module_progress': module_progress
            })
        }
        
        return verification_data

    # Legacy functions for backward compatibility
    def mint_achievement_nft(
        self, 
        student_address: str, 
        module_id: str, 
        module_title: str, 
        score: int, 
        metadata: Dict[str, Any]
    ) -> str:
        """Legacy function - now uses ERC-1155"""
        completion_data = {
            'score': score,
            'metadata': metadata
        }
        return self.mint_module_completion(student_address, module_id, module_title, completion_data)

    def mint_progress_nft(
        self, 
        student_address: str, 
        module_id: str, 
        progress: int, 
        metadata: Dict[str, Any], 
        is_checkpoint: bool = False
    ) -> str:
        """Legacy function - now uses ERC-1155"""
        completion_data = {
            'progress': progress,
            'is_checkpoint': is_checkpoint,
            'metadata': metadata
        }
        return self.mint_module_completion(student_address, module_id, f"Module_{module_id}", completion_data)

    def register_checkpoint(
        self, 
        student_did: str, 
        module_id: str, 
        score: int, 
        twin_data: Dict[str, Any]
    ) -> str:
        """Register learning checkpoint on blockchain"""
        if not hasattr(self, 'registry_contract'):
            raise Exception("Registry contract not initialized")
        
        # Upload twin data to IPFS
        ipfs_cid = self.upload_to_ipfs(twin_data)
        
        # Create data hash
        data_hash = self.create_data_hash(twin_data)
        
        # Build transaction
        tx = self.registry_contract.functions.logTwinUpdate(
            student_did,
            1,  # version
            data_hash,
            ipfs_cid
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

    def get_student_nfts(self, student_address: str) -> Dict[str, Any]:
        """Get all NFTs owned by a student"""
        achievements = self.get_student_achievements(student_address)
        module_progress = self.get_student_module_progress(student_address)
        
        return {
            'achievements': achievements,
            'module_progress': module_progress
        }

    def get_student_progress(self, student_address: str) -> Dict[str, Any]:
        """Get all progress NFTs for a student"""
        return self.get_student_module_progress(student_address)

    def get_twin_logs(self, student_did: str) -> List[Any]:
        """Get twin logs from registry"""
        if not hasattr(self, 'registry_contract'):
            raise Exception("Registry contract not initialized")
        
        try:
            return self.registry_contract.functions.getAllTwinDataLogs(student_did).call()
        except Exception as e:
            print(f"Error getting twin logs: {e}")
            return []

    def verify_checkpoint(self, student_did: str, module_id: str) -> str:
        """Verify checkpoint on blockchain"""
        if not hasattr(self, 'registry_contract'):
            raise Exception("Registry contract not initialized")
        
        try:
            latest_log = self.registry_contract.functions.getLatestTwinDataLog(student_did).call()
            return latest_log[1].hex()  # Return data hash
        except Exception as e:
            print(f"Error verifying checkpoint: {e}")
            return ""