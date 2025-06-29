# backend/digital_twin/services/blockchain_service.py
from blockchain_utils import BlockchainManager
from typing import Dict, Any, Optional
import os
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from web3 import Web3
from eth_account import Account

class BlockchainService:
    def __init__(self):
        self.w3 = None
        self.account = None
        self.contracts = {}
        self._initialize_blockchain()
    
    def _initialize_blockchain(self):
        """Initialize blockchain connection and contracts"""
        try:
            rpc_url = os.getenv('BLOCKCHAIN_RPC_URL')
            private_key = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
            
            if not rpc_url or not private_key:
                print("Blockchain environment variables not configured")
                return
            
            # Initialize Web3
            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            self.account = Account.from_key(private_key)
            
            # Load contract addresses
            module_progress_address = os.getenv('MODULE_PROGRESS_CONTRACT_ADDRESS')
            achievement_address = os.getenv('ACHIEVEMENT_CONTRACT_ADDRESS')
            registry_address = os.getenv('REGISTRY_CONTRACT_ADDRESS')
            
            if not all([module_progress_address, achievement_address, registry_address]):
                print("Contract addresses not configured")
                return
            
            # Load contract ABIs
            self._load_contracts()
            print("Blockchain service initialized successfully")
            
        except Exception as e:
            print(f"Failed to initialize blockchain: {e}")
    
    def _load_contracts(self):
        """Load contract ABIs and create contract instances"""
        try:
            # Load ModuleProgressNFT
            with open('contracts/abi/ModuleProgressNFT.json', 'r') as f:
                module_progress_abi = json.load(f)
            
            # Load LearningAchievementNFT
            with open('contracts/abi/LearningAchievementNFT.json', 'r') as f:
                achievement_abi = json.load(f)
            
            # Load DigitalTwinRegistry
            with open('contracts/abi/DigitalTwinRegistry.json', 'r') as f:
                registry_abi = json.load(f)
            
            # Create contract instances
            self.contracts['module_progress'] = self.w3.eth.contract(
                address=os.getenv('MODULE_PROGRESS_CONTRACT_ADDRESS'),
                abi=module_progress_abi
            )
            
            self.contracts['achievement'] = self.w3.eth.contract(
                address=os.getenv('ACHIEVEMENT_CONTRACT_ADDRESS'),
                abi=achievement_abi
            )
            
            self.contracts['registry'] = self.w3.eth.contract(
                address=os.getenv('REGISTRY_CONTRACT_ADDRESS'),
                abi=registry_abi
            )
            
        except Exception as e:
            print(f"Failed to load contracts: {e}")
    
    def is_available(self) -> bool:
        """Check if blockchain service is available"""
        return (self.w3 is not None and 
                self.account is not None and 
                len(self.contracts) > 0)
    
    def _send_transaction(self, contract_function, *args):
        """Send transaction to blockchain"""
        try:
            # Build transaction
            transaction = contract_function(*args).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 5000000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send
            signed_txn = self.w3.eth.account.sign_transaction(
                transaction, 
                os.getenv('BLOCKCHAIN_PRIVATE_KEY')
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for confirmation
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return tx_hash.hex()
            
        except Exception as e:
            raise Exception(f"Transaction failed: {str(e)}")
    
    def mint_module_completion_nft(
        self,
        student_address: str,
        student_did: str,
        module_id: str,
        module_title: str,
        completion_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mint ERC-1155 NFT for module completion"""
        if not self.is_available():
            return {"error": "Blockchain service not available"}
        
        try:
            # Prepare metadata URI (in production, upload to IPFS)
            metadata_uri = f"ipfs://{module_id}_{student_address}_{int(time.time())}"
            
            # Mint module completion
            tx_hash = self._send_transaction(
                self.contracts['module_progress'].functions.mintModuleCompletion,
                student_address,
                module_id,
                metadata_uri,
                1  # amount
            )
            
            return {
                "success": True,
                "tx_hash": tx_hash,
                "module_id": module_id,
                "student_address": student_address,
                "metadata_uri": metadata_uri,
                "timestamp": int(time.time())
            }
            
        except Exception as e:
            return {"error": f"Failed to mint module completion NFT: {str(e)}"}
    
    def mint_learning_achievement_nft(
        self,
        student_address: str,
        student_did: str,
        achievement_type: str,
        title: str,
        description: str,
        achievement_data: Dict[str, Any],
        expires_at: Optional[int] = None
    ) -> Dict[str, Any]:
        """Mint ERC-721 NFT for learning achievement"""
        if not self.is_available():
            return {"error": "Blockchain service not available"}
        
        try:
            # Map achievement type to enum
            achievement_type_map = {
                "COURSE_COMPLETION": 0,
                "SKILL_MASTERY": 1,
                "CERTIFICATION": 2,
                "MILESTONE": 3,
                "SPECIAL_RECOGNITION": 4
            }
            
            if achievement_type not in achievement_type_map:
                return {"error": f"Invalid achievement type: {achievement_type}"}
            
            # Prepare metadata URI
            metadata_uri = f"ipfs://{achievement_type}_{student_address}_{int(time.time())}"
            
            # Mint achievement
            tx_hash = self._send_transaction(
                self.contracts['achievement'].functions.mintAchievement,
                student_address,
                achievement_type_map[achievement_type],
                title,
                description,
                metadata_uri,
                expires_at or 0
            )
            
            return {
                "success": True,
                "tx_hash": tx_hash,
                "achievement_type": achievement_type,
                "title": title,
                "student_address": student_address,
                "metadata_uri": metadata_uri,
                "timestamp": int(time.time())
            }
            
        except Exception as e:
            return {"error": f"Failed to mint achievement NFT: {str(e)}"}
    
    def mint_course_completion_certificate(
        self,
        student_address: str,
        student_did: str,
        course_name: str,
        course_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mint course completion certificate"""
        return self.mint_learning_achievement_nft(
            student_address,
            student_did,
            "COURSE_COMPLETION",
            course_name,
            f"Certificate of completion for {course_name}",
            course_data
        )
    
    def mint_skill_mastery_certificate(
        self,
        student_address: str,
        student_did: str,
        skill_name: str,
        skill_data: Dict[str, Any],
        expires_in_days: int = 365
    ) -> Dict[str, Any]:
        """Mint skill mastery certificate with expiration"""
        expires_at = int(time.time()) + (expires_in_days * 24 * 60 * 60)
        
        return self.mint_learning_achievement_nft(
            student_address,
            student_did,
            "SKILL_MASTERY",
            skill_name,
            f"Mastery certificate for {skill_name}",
            skill_data,
            expires_at
        )
    
    def get_student_blockchain_data(
        self,
        student_address: str,
        student_did: str
    ) -> Dict[str, Any]:
        """Get all blockchain data for a student"""
        if not self.is_available():
            return {"error": "Blockchain service not available"}
        
        try:
            # Get module progress (ERC-1155)
            module_progress = self.contracts['module_progress'].functions.getStudentModuleProgress(student_address).call()
            
            # Get achievements (ERC-721)
            achievements = self.contracts['achievement'].functions.getStudentAchievements(student_address).call()
            
            # Get twin logs
            twin_logs = self.contracts['registry'].functions.getTwinLogs(student_did).call()
            
            return {
                "success": True,
                "student_address": student_address,
                "student_did": student_did,
                "module_progress": module_progress,
                "achievements": achievements,
                "twin_logs": twin_logs,
                "timestamp": int(time.time())
            }
            
        except Exception as e:
            return {"error": f"Failed to get blockchain data: {str(e)}"}
    
    def check_achievement_eligibility(
        self,
        student_address: str,
        achievement_type: str,
        criteria: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Check if student is eligible for an achievement"""
        if not self.is_available():
            return {"error": "Blockchain service not available"}
        
        try:
            # Get current progress
            module_progress = self.contracts['module_progress'].functions.getStudentModuleProgress(student_address).call()
            achievements = self.contracts['achievement'].functions.getStudentAchievements(student_address).call()
            
            # Check eligibility based on criteria
            eligible = False
            reason = ""
            
            if achievement_type == "COURSE_COMPLETION":
                required_modules = criteria.get('required_modules', [])
                completed_modules = module_progress.get('total_modules', 0)
                eligible = completed_modules >= len(required_modules)
                reason = f"Completed {completed_modules}/{len(required_modules)} required modules"
                
            elif achievement_type == "SKILL_MASTERY":
                required_skill_level = criteria.get('required_skill_level', 0.8)
                current_level = module_progress.get('current_level', 1)
                eligible = current_level >= required_skill_level
                reason = f"Current level: {current_level}, Required: {required_skill_level}"
                
            elif achievement_type == "MILESTONE_REACHED":
                required_achievements = criteria.get('required_achievements', 0)
                current_achievements = len(achievements)
                eligible = current_achievements >= required_achievements
                reason = f"Current achievements: {current_achievements}, Required: {required_achievements}"
            
            return {
                "success": True,
                "eligible": eligible,
                "reason": reason,
                "current_progress": {
                    "module_progress": module_progress,
                    "achievements_count": len(achievements)
                }
            }
            
        except Exception as e:
            return {"error": f"Failed to check eligibility: {str(e)}"}
    
    def generate_employer_verification(
        self,
        student_address: str,
        required_achievements: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate verification data for employers"""
        if not self.is_available():
            return {"error": "Blockchain service not available"}
        
        try:
            verification_data = self.contracts['registry'].functions.generateEmployerVerificationData(
                student_address,
                required_achievements
            ).call()
            
            return {
                "success": True,
                "verification_data": verification_data
            }
            
        except Exception as e:
            return {"error": f"Failed to generate verification: {str(e)}"}
    
    def create_zkp_certificate(
        self,
        student_did: str,
        student_address: str,
        twin_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create ZKP certificate data structure"""
        if not self.is_available():
            return {"error": "Blockchain service not available"}
        
        try:
            # Get blockchain data
            module_progress = self.contracts['module_progress'].functions.getStudentModuleProgress(student_address).call()
            achievements = self.contracts['achievement'].functions.getStudentAchievements(student_address).call()
            
            # Create ZKP certificate data
            zkp_data = self.contracts['registry'].functions.createZKP(
                student_did,
                achievements,
                module_progress,
                twin_data
            ).call()
            
            # Upload to IPFS
            ipfs_cid = self.contracts['registry'].functions.uploadToIPFS(zkp_data).call()
            
            return {
                "success": True,
                "zkp_certificate": zkp_data,
                "ipfs_cid": ipfs_cid,
                "ipfs_url": self.contracts['registry'].functions.getIPFSURL(ipfs_cid).call()
            }
            
        except Exception as e:
            return {"error": f"Failed to create ZKP certificate: {str(e)}"}
    
    def register_learning_checkpoint(
        self,
        student_did: str,
        module_id: str,
        score: int,
        twin_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Register learning checkpoint on blockchain"""
        if not self.is_available():
            return {"error": "Blockchain service not available"}
        
        try:
            tx_hash = self._send_transaction(
                self.contracts['registry'].functions.registerCheckpoint,
                student_did,
                module_id,
                score,
                twin_data
            )
            
            return {
                "success": True,
                "tx_hash": tx_hash,
                "student_did": student_did,
                "module_id": module_id,
                "timestamp": int(time.time())
            }
            
        except Exception as e:
            return {"error": f"Failed to register checkpoint: {str(e)}"}
    
    def verify_achievement(
        self,
        token_id: int
    ) -> Dict[str, Any]:
        """Verify if an achievement is still valid"""
        if not self.is_available():
            return {"error": "Blockchain service not available"}
        
        try:
            is_valid = self.contracts['achievement'].functions.checkAchievementValidity(token_id).call()
            
            return {
                "success": True,
                "token_id": token_id,
                "is_valid": is_valid,
                "timestamp": int(time.time())
            }
            
        except Exception as e:
            return {"error": f"Failed to verify achievement: {str(e)}"}