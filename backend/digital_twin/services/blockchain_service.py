# backend/digital_twin/services/blockchain_service.py
from ..blockchain_utils import BlockchainManager
from typing import Dict, Any, Optional
import os

class BlockchainService:
    def __init__(self):
        self.blockchain = BlockchainManager(
            rpc_url=os.getenv('BLOCKCHAIN_RPC_URL'),
            private_key=os.getenv('BLOCKCHAIN_PRIVATE_KEY')
        )

    def create_learning_checkpoint(
        self, 
        student_did: str, 
        module_id: str, 
        twin_data: Dict[str, Any], 
        score: int
    ) -> Dict[str, str]:
        """Create a complete learning checkpoint with NFT and blockchain record"""
        
        # 1. Register checkpoint on registry
        registry_tx = self.blockchain.register_checkpoint(
            student_did, module_id, score, twin_data
        )
        
        # 2. Mint achievement NFT
        nft_metadata = {
            "name": f"Module Completion: {module_id}",
            "description": f"Successfully completed {module_id} with score {score}",
            "image": "ipfs://QmYourImageHash",
            "attributes": [
                {"trait_type": "Module", "value": module_id},
                {"trait_type": "Score", "value": score},
                {"trait_type": "Completion Date", "value": twin_data.get("timestamp")}
            ]
        }
        
        nft_tx = self.blockchain.mint_achievement_nft(
            student_did, module_id, module_id, score, nft_metadata
        )
        
        # 3. Log twin update
        twin_tx = self.blockchain.log_twin_update(
            student_did, 
            twin_data.get("version", 1), 
            twin_data, 
            module_id, 
            score, 
            is_checkpoint=True
        )
        
        return {
            "registry_transaction": registry_tx,
            "nft_transaction": nft_tx,
            "twin_transaction": twin_tx
        }

    def update_learning_progress(
        self, 
        student_did: str, 
        module_id: str, 
        progress: int, 
        twin_data: Dict[str, Any]
    ) -> str:
        """Update learning progress with ERC-1155 token"""
        
        progress_metadata = {
            "module_id": module_id,
            "progress": progress,
            "timestamp": twin_data.get("timestamp"),
            "twin_data": twin_data
        }
        
        return self.blockchain.mint_progress_nft(
            student_did, module_id, progress, progress_metadata, False
        )

    def get_student_blockchain_data(self, student_did: str) -> Dict[str, Any]:
        """Get all blockchain data for a student"""
        return {
            "nfts": self.blockchain.get_student_nfts(student_did),
            "progress": self.blockchain.get_student_progress(student_did),
            "twin_logs": self.blockchain.get_twin_logs(student_did)
        }