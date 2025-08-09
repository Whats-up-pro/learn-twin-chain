from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import sys
import secrets
import hashlib

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from digital_twin.services.blockchain_service import BlockchainService
from ..services.zkp_service import ZKPService

router = APIRouter(prefix="/zkp", tags=["ZKP"])

# Initialize ZKP service
zkp_service = ZKPService()

# Pydantic models
class ZKPProofRequest(BaseModel):
    student_address: str
    module_id: str
    score: int
    time_spent: int
    attempts: int
    study_materials: List[str]

class ZKPSkillProofRequest(BaseModel):
    student_address: str
    skill_type: str
    total_modules: int
    average_score: int
    total_study_time: int
    skill_specific_modules: List[str]
    practice_hours: int

class ZKPVerifyRequest(BaseModel):
    proof: Dict[str, Any]
    public_inputs: List[int]
    circuit_type: str

class ZKPMintRequest(BaseModel):
    student_address: str
    proof: Dict[str, Any]
    public_inputs: List[int]
    module_id: str
    metadata_uri: str

class ZKPSkillMintRequest(BaseModel):
    student_address: str
    proof: Dict[str, Any]
    public_inputs: List[int]
    skill_type: str
    metadata_uri: str

class ZKPBatchVerifyRequest(BaseModel):
    proofs: List[Dict[str, Any]]
    public_inputs_list: List[List[int]]
    metadata_uris: List[str]
    scores: List[int]

class ZKPChallengeRequest(BaseModel):
    module_id: str

class ZKPChallengeResponse(BaseModel):
    challenge_nonce: str
    message: str

# Dependency
def get_blockchain_service():
    return BlockchainService()

@router.post("/generate-learning-proof")
async def generate_learning_proof(
    request: ZKPProofRequest,
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
):
    """Generate ZK-SNARK proof for learning achievement"""
    try:
        result = blockchain_service.generate_zkp_learning_proof(
            student_address=request.student_address,
            module_id=request.module_id,
            score=request.score,
            time_spent=request.time_spent,
            attempts=request.attempts,
            study_materials=request.study_materials
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "ZK-SNARK learning proof generated successfully",
                "data": result
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to generate proof"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating ZKP proof: {str(e)}")

@router.post("/generate-skill-proof")
async def generate_skill_proof(
    request: ZKPSkillProofRequest,
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
):
    """Generate ZK-SNARK proof for skill verification"""
    try:
        result = blockchain_service.generate_zkp_skill_proof(
            student_address=request.student_address,
            skill_type=request.skill_type,
            total_modules=request.total_modules,
            average_score=request.average_score,
            total_study_time=request.total_study_time,
            skill_specific_modules=request.skill_specific_modules,
            practice_hours=request.practice_hours
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "ZK-SNARK skill proof generated successfully",
                "data": result
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to generate skill proof"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating ZKP skill proof: {str(e)}")

@router.post("/verify-proof")
async def verify_proof(
    request: ZKPVerifyRequest,
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
):
    """Verify a ZK-SNARK proof"""
    try:
        result = blockchain_service.verify_zkp_proof(
            proof=request.proof,
            public_inputs=request.public_inputs,
            circuit_type=request.circuit_type
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": result.get("message", "Proof verification completed"),
                "verified": result.get("verified", False),
                "data": result
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to verify proof"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying ZKP proof: {str(e)}")

@router.post("/mint-with-proof")
async def mint_with_proof(
    request: ZKPMintRequest,
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
):
    """Mint NFT using on-chain zkSNARK proof verification"""
    try:
        result = blockchain_service.mint_with_zkp_proof(
            student_address=request.student_address,
            proof=request.proof,
            public_inputs=request.public_inputs,
            module_id=request.module_id,
            metadata_uri=request.metadata_uri,
            score=request.score
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "NFT minted successfully with on-chain ZK proof verification",
                "tx_hash": result.get("tx_hash"),
                "verified": result.get("verified", False),
                "circuit_type": result.get("circuit_type"),
                "proof_hash": result.get("proof_hash"),
                "block_number": result.get("block_number"),
                "verification_timestamp": result.get("verification_timestamp")
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to mint with proof"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error minting with ZKP proof: {str(e)}")

@router.post("/mint-skill-with-proof")
async def mint_skill_with_proof(
    request: ZKPSkillMintRequest,
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
):
    """Mint skill verification NFT using on-chain zkSNARK proof verification"""
    try:
        result = blockchain_service.mint_skill_with_zkp_proof(
            student_address=request.student_address,
            proof=request.proof,
            public_inputs=request.public_inputs,
            skill_type=request.skill_type,
            metadata_uri=request.metadata_uri
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "Skill NFT minted successfully with on-chain ZK proof verification",
                "tx_hash": result.get("tx_hash"),
                "verified": result.get("verified", False),
                "circuit_type": result.get("circuit_type"),
                "proof_hash": result.get("proof_hash"),
                "block_number": result.get("block_number"),
                "verification_timestamp": result.get("verification_timestamp")
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to mint skill with proof"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error minting skill with ZKP proof: {str(e)}")

@router.post("/batch-verify-proofs")
async def batch_verify_proofs(
    request: ZKPBatchVerifyRequest,
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
):
    """Batch verify multiple learning achievement proofs on-chain"""
    try:
        result = blockchain_service.batch_verify_learning_proofs(
            proofs=request.proofs,
            public_inputs_list=request.public_inputs_list,
            metadata_uris=request.metadata_uris,
            scores=request.scores
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": f"Batch verification completed successfully",
                "tx_hash": result.get("tx_hash"),
                "verified_count": result.get("verified_count"),
                "block_number": result.get("block_number"),
                "verification_timestamp": result.get("verification_timestamp")
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to batch verify proofs"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch verification: {str(e)}")

@router.post("/challenge", response_model=ZKPChallengeResponse)
async def generate_zkp_challenge(request: ZKPChallengeRequest):
    """Generate a ZKP challenge for student to sign"""
    try:
        # Generate a secure nonce for the challenge
        challenge_nonce = secrets.token_hex(32)
        
        # Create the message that student needs to sign
        message = f"LearnTwin Module Completion Challenge: {challenge_nonce}"
        
        return ZKPChallengeResponse(
            challenge_nonce=challenge_nonce,
            message=message
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate ZKP challenge: {str(e)}")

@router.post("/certificate/create")
async def create_zkp_certificate(
    student_address: str,
    student_did: str,
    twin_data: Dict[str, Any] = {},
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
):
    """Create ZKP certificate for student"""
    try:
        result = blockchain_service.create_zkp_certificate(
            student_did=student_did,
            student_address=student_address,
            twin_data=twin_data
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "ZKP certificate created successfully",
                "data": result
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create ZKP certificate"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating ZKP certificate: {str(e)}")

@router.get("/status")
async def get_zkp_status():
    """Get ZKP system status"""
    return {
        "success": True,
        "message": "ZKP system is operational",
        "features": [
            "Learning achievement proof generation",
            "Skill verification proof generation", 
            "Proof verification",
            "NFT minting with proofs",
            "ZKP certificate creation"
        ],
        "circuits": [
            "learning_achievement.circom",
            "skill_verification.circom"
        ]
    } 