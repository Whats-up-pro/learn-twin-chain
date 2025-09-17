from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from ..services.blockchain_service import BlockchainService

router = APIRouter(prefix="/blockchain", tags=["blockchain"])

# Initialize blockchain service
blockchain_service = BlockchainService()

# Pydantic models
class ModuleCompletionRequest(BaseModel):
    student_address: str
    student_did: str
    module_id: str
    module_title: str
    completion_data: Dict[str, Any]

class AchievementRequest(BaseModel):
    student_address: str
    student_did: str
    achievement_type: str
    title: str
    description: str
    achievement_data: Dict[str, Any]
    expires_at: Optional[int] = None

class CourseCompletionRequest(BaseModel):
    student_address: str
    student_did: str
    course_name: str
    course_data: Dict[str, Any]

class SkillMasteryRequest(BaseModel):
    student_address: str
    student_did: str
    skill_name: str
    skill_data: Dict[str, Any]
    expires_in_days: int = 365

class CheckpointRequest(BaseModel):
    student_did: str
    module_id: str
    score: int
    twin_data: Dict[str, Any]

class EligibilityRequest(BaseModel):
    student_address: str
    achievement_type: str
    criteria: Dict[str, Any]

class VerificationRequest(BaseModel):
    student_address: str
    required_achievements: Optional[List[str]] = None

class ZKPCertificateRequest(BaseModel):
    student_did: str
    student_address: str
    twin_data: Dict[str, Any]

@router.get("/status")
async def get_blockchain_status():
    """Check blockchain service status"""
    return {
        "available": blockchain_service.is_available(),
        "status": "active" if blockchain_service.is_available() else "disabled"
    }

@router.post("/mint/module-completion")
async def mint_module_completion_nft(request: ModuleCompletionRequest):
    """Mint ERC-1155 NFT for module completion"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.mint_module_completion_nft(
        request.student_address,
        request.student_did,
        request.module_id,
        request.module_title,
        request.completion_data
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post("/mint/achievement")
async def mint_learning_achievement_nft(request: AchievementRequest):
    """Mint ERC-721 NFT for learning achievement"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.mint_learning_achievement_nft(
        request.student_address,
        request.student_did,
        request.achievement_type,
        request.title,
        request.description,
        request.achievement_data,
        request.expires_at
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post("/mint/course-completion")
async def mint_course_completion_certificate(request: CourseCompletionRequest):
    """Mint course completion certificate"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.mint_course_completion_certificate(
        request.student_address,
        request.student_did,
        request.course_name,
        request.course_data
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post("/mint/skill-mastery")
async def mint_skill_mastery_certificate(request: SkillMasteryRequest):
    """Mint skill mastery certificate"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.mint_skill_mastery_certificate(
        request.student_address,
        request.student_did,
        request.skill_name,
        request.skill_data,
        request.expires_in_days
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/student/{student_address}/data")
async def get_student_blockchain_data(student_address: str, student_did: str):
    """Get all blockchain data for a student"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    try:
        result = blockchain_service.get_student_blockchain_data(student_address, student_did)
        
        if "error" in result:
            # Return empty data instead of error for missing student data
            if "not found" in result.get("error", "").lower():
                return {
                    "success": True,
                    "student_address": student_address,
                    "student_did": student_did,
                    "module_completions": [],
                    "total_achievements": 0,
                    "skills_verified": [],
                    "certificates": [],
                    "message": "No blockchain data found for this student"
                }
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except Exception as e:
        # Log the error but return empty data instead of failing
        print(f"Blockchain data retrieval error: {e}")
        return {
            "success": True,
            "student_address": student_address,
            "student_did": student_did,
            "module_completions": [],
            "total_achievements": 0,
            "skills_verified": [],
            "certificates": [],
            "message": "Blockchain service temporarily unavailable"
        }

@router.post("/checkpoint/register")
async def register_learning_checkpoint(request: CheckpointRequest):
    """Register learning checkpoint on blockchain"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.register_learning_checkpoint(
        request.student_did,
        request.module_id,
        request.score,
        request.twin_data
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post("/achievement/check-eligibility")
async def check_achievement_eligibility(request: EligibilityRequest):
    """Check if student is eligible for an achievement"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.check_achievement_eligibility(
        request.student_address,
        request.achievement_type,
        request.criteria
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post("/verification/employer")
async def generate_employer_verification(request: VerificationRequest):
    """Generate verification data for employers"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.generate_employer_verification(
        request.student_address,
        request.required_achievements
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post("/certificate/zkp")
async def create_zkp_certificate(request: ZKPCertificateRequest):
    """Create ZKP certificate data structure"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.create_zkp_certificate(
        request.student_did,
        request.student_address,
        request.twin_data
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/achievement/{token_id}/verify")
async def verify_achievement(token_id: int):
    """Verify if an achievement is still valid"""
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    
    result = blockchain_service.verify_achievement(token_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/achievements/types")
async def get_achievement_types():
    """Get available achievement types"""
    return {
        "achievement_types": [
            {
                "type": "COURSE_COMPLETION",
                "description": "Certificate for completing a full course",
                "nft_type": "ERC-721"
            },
            {
                "type": "SKILL_MASTERY", 
                "description": "Certificate for mastering a specific skill",
                "nft_type": "ERC-721"
            },
            {
                "type": "CERTIFICATION",
                "description": "Professional certification",
                "nft_type": "ERC-721"
            },
            {
                "type": "MILESTONE",
                "description": "Achievement for reaching learning milestones",
                "nft_type": "ERC-721"
            },
            {
                "type": "SPECIAL_RECOGNITION",
                "description": "Special recognition for exceptional performance",
                "nft_type": "ERC-721"
            },
            {
                "type": "MODULE_COMPLETION",
                "description": "NFT for completing individual modules",
                "nft_type": "ERC-1155"
            }
        ]
    } 