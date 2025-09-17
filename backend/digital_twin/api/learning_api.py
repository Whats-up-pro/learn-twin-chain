from fastapi import APIRouter, Body, HTTPException, UploadFile, File, Depends
from ..services.learning_service import LearningService
from ..services.blockchain_service import BlockchainService
from ..utils.vc_utils import create_vc
from ..services.ipfs_service import IPFSService
from ..models.user import User
from ..dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, TYPE_CHECKING
import os
import json
import tempfile
import shutil

# Import RAG system
if TYPE_CHECKING:
    from rag.rag import LearnTwinRAGAgent

try:
    from rag.rag import LearnTwinRAGAgent
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    print("⚠️ RAG system not available")

router = APIRouter()
learning_service = LearningService()
blockchain_service = BlockchainService()

# Initialize RAG agent (lazy loading)
_rag_agent = None

def get_rag_agent() -> Optional["LearnTwinRAGAgent"]:
    """Get or initialize RAG agent"""
    global _rag_agent
    if not RAG_AVAILABLE:
        return None
    
    if _rag_agent is None:
        try:
            _rag_agent = LearnTwinRAGAgent(verbose=1)
        except Exception as e:
            print(f"Failed to initialize RAG agent: {e}")
            return None
    
    return _rag_agent

# Pydantic models for RAG endpoints
class RAGQueryRequest(BaseModel):
    question: str
    context_type: Optional[str] = "learning"  # learning, exercise, assessment, general
    max_tokens: Optional[int] = 2048
    temperature: Optional[float] = 0.1
    top_k: Optional[int] = 5

class RAGQueryResponse(BaseModel):
    question: str
    answer: str
    context_type: str
    query_time: float
    source_documents: Optional[List[Dict[str, Any]]] = None
    num_sources_used: Optional[int] = 0
    success: bool
    model_used: Optional[str] = None
    error: Optional[str] = None

class DocumentSearchRequest(BaseModel):
    query: str
    k: Optional[int] = 10
    document_type: Optional[str] = None

class DocumentUploadRequest(BaseModel):
    file_name: str
    metadata: Optional[Dict[str, Any]] = None

@router.post("/students")
def create_student_twin(twin_id: str, config: dict, profile: dict):
    return learning_service.create_student_twin(twin_id, config, profile)

@router.get("/students/{twin_id}")
def get_student_twin(twin_id: str):
    return learning_service.get_student_twin(twin_id)

@router.get("/students")
def list_student_twins():
    return learning_service.list_student_twins()

@router.post("/skills/verify-and-mint")
def verify_and_mint_skill(student_did: str = Body(...), student_address: str = Body(...), skill: str = Body(...), metadata: dict = Body(...)):
    try:
        # 1. Lấy private key trường từ file
        privkey_path = os.path.join(os.path.dirname(__file__), '../../data/school_keys/school_private_key.pem')
        with open(privkey_path, 'r') as f:
            pem = f.read()
        # Chuyển PEM sang hex (demo, chỉ dùng cho secp256k1, không bảo mật cho production)
        from ecdsa import SigningKey
        sk = SigningKey.from_pem(pem)
        private_key_hex = sk.to_string().hex()
        issuer_did = "did:learntwin:uit001"

        # 2. Tạo VC chuẩn hóa và ký số
        vc = create_vc(issuer_did, student_did, skill, metadata, private_key_hex)

        # 3. Upload VC lên IPFS
        ipfs = IPFSService()
        cid_nft = ipfs.upload_json(vc, name=f"VC_{student_did}_{skill}.json")

        # 4. Mint NFT với metadata là CIDnft
        nft_metadata = {
            "name": f"Skill Achievement: {skill}",
            "description": f"Verified credential for skill: {skill}",
            "image": "ipfs://QmYourImageHash",  # Có thể thay bằng logo skill
            "attributes": [
                {"trait_type": "Skill", "value": skill},
                {"trait_type": "Issuer", "value": issuer_did},
                {"trait_type": "Student", "value": student_did},
                {"trait_type": "Student Address", "value": student_address},
                {"trait_type": "Verification Date", "value": metadata.get("verification_date", "")},
                {"trait_type": "VC CID", "value": cid_nft}
            ],
            "vc_data": vc  # Embed VC data trong NFT metadata
        }
        
        # Mint NFT sử dụng blockchain service với địa chỉ Ethereum
        token_id = blockchain_service.blockchain.mint_achievement_nft(
            student_address,  # student_address (địa chỉ Ethereum)
            skill,            # module_id (dùng skill làm module_id)
            f"Skill: {skill}",  # module_title
            metadata.get("score", 100),  # score
            nft_metadata
        )

        # 5. Cập nhật NFT_list của học sinh
        # Lấy thông tin học sinh hiện tại
        student_data = learning_service.get_student_twin(student_did)
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Thêm NFT mới vào NFT_list
        new_nft_entry = {
            "token_id": token_id,
            "skill": skill,
            "cid_nft": cid_nft,
            "mint_date": metadata.get("verification_date", ""),
            "issuer": issuer_did,
            "student_address": student_address,
            "metadata": nft_metadata
        }
        
        if "NFT_list" not in student_data:
            student_data["NFT_list"] = []
        student_data["NFT_list"].append(new_nft_entry)
        
        # Cập nhật file twin
        learning_service.update_student_twin(student_did, student_data)
        
        # Cập nhật users.json
        users_file = os.path.join(os.path.dirname(__file__), '../../data/users/users.json')
        try:
            with open(users_file, 'r', encoding='utf-8') as f:
                users = json.load(f)
        except UnicodeDecodeError:
            # Fallback to cp1252 if utf-8 fails
            with open(users_file, 'r', encoding='cp1252') as f:
                users = json.load(f)
        
        for user in users:
            if user.get("did") == student_did:
                if "NFT_list" not in user:
                    user["NFT_list"] = []
                user["NFT_list"].append(new_nft_entry)
                break
        
        with open(users_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)

        return {
            "status": "success",
            "message": f"Skill {skill} verified and NFT minted successfully",
            "vc": vc,
            "cid_nft": cid_nft,
            "token_id": token_id,
            "nft_metadata": nft_metadata
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Minting failed: {str(e)}")

@router.post("/skills/verify-and-mint-demo")
def verify_and_mint_skill_demo(student_did: str = Body(...), skill: str = Body(...), metadata: dict = Body(...)):
    """Demo endpoint để test flow mint NFT mà không cần blockchain thực"""
    try:
        # 1. Lấy private key trường từ file
        privkey_path = os.path.join(os.path.dirname(__file__), '../../data/school_keys/school_private_key.pem')
        with open(privkey_path, 'r') as f:
            pem = f.read()
        # Chuyển PEM sang hex (demo, chỉ dùng cho secp256k1, không bảo mật cho production)
        from ecdsa import SigningKey
        sk = SigningKey.from_pem(pem)
        private_key_hex = sk.to_string().hex()
        issuer_did = "did:learntwin:uit001"

        # 2. Tạo VC chuẩn hóa và ký số
        vc = create_vc(issuer_did, student_did, skill, metadata, private_key_hex)

        # 3. Upload VC lên IPFS
        ipfs = IPFSService()
        cid_nft = ipfs.upload_json(vc, name=f"VC_{student_did}_{skill}.json")

        # 4. Demo mint NFT (không thực sự mint trên blockchain)
        import uuid
        token_id = f"demo_token_{uuid.uuid4().hex[:8]}"
        
        nft_metadata = {
            "name": f"Skill Achievement: {skill}",
            "description": f"Verified credential for skill: {skill}",
            "image": "ipfs://QmYourImageHash",  # Có thể thay bằng logo skill
            "attributes": [
                {"trait_type": "Skill", "value": skill},
                {"trait_type": "Issuer", "value": issuer_did},
                {"trait_type": "Student", "value": student_did},
                {"trait_type": "Verification Date", "value": metadata.get("verification_date", "")},
                {"trait_type": "VC CID", "value": cid_nft},
                {"trait_type": "Demo", "value": "true"}
            ],
            "vc_data": vc  # Embed VC data trong NFT metadata
        }

        # 5. Cập nhật NFT_list của học sinh
        # Lấy thông tin học sinh hiện tại
        student_data = learning_service.get_student_twin(student_did)
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Thêm NFT mới vào NFT_list
        new_nft_entry = {
            "token_id": token_id,
            "skill": skill,
            "cid_nft": cid_nft,
            "mint_date": metadata.get("verification_date", ""),
            "issuer": issuer_did,
            "metadata": nft_metadata,
            "demo": True
        }
        
        if "NFT_list" not in student_data:
            student_data["NFT_list"] = []
        student_data["NFT_list"].append(new_nft_entry)
        
        # Cập nhật file twin
        learning_service.update_student_twin(student_did, student_data)
        
        # Cập nhật users.json
        users_file = os.path.join(os.path.dirname(__file__), '../../data/users/users.json')
        try:
            with open(users_file, 'r', encoding='utf-8') as f:
                users = json.load(f)
        except UnicodeDecodeError:
            # Fallback to cp1252 if utf-8 fails
            with open(users_file, 'r', encoding='cp1252') as f:
                users = json.load(f)
        
        for user in users:
            if user.get("did") == student_did:
                if "NFT_list" not in user:
                    user["NFT_list"] = []
                user["NFT_list"].append(new_nft_entry)
                break
        
        with open(users_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)

        return {
            "status": "success",
            "message": f"Skill {skill} verified and demo NFT created successfully",
            "vc": vc,
            "cid_nft": cid_nft,
            "token_id": token_id,
            "nft_metadata": nft_metadata,
            "demo": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo minting failed: {str(e)}")

@router.post("/did/update")
def update_did_data(student_did: str = Body(...), student_address: str = Body(...), skill: str = Body(...), token_id: str = Body(...), cid_nft: str = Body(...)):
    """Update DID data với thông tin NFT mới và link lên blockchain"""
    try:
        # 1. Lấy thông tin student hiện tại
        student_data = learning_service.get_student_twin(student_did)
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # 2. Tạo DID document mới với NFT information
        did_document = {
            "@context": [
                "https://www.w3.org/ns/did/v1",
                "https://w3id.org/security/suites/ed25519-2018/v1"
            ],
            "id": student_did,
            "controller": student_did,
            "verificationMethod": [
                {
                    "id": f"{student_did}#keys-1",
                    "type": "Ed25519VerificationKey2018",
                    "controller": student_did,
                    "publicKeyBase58": student_data.get("public_key", "")
                }
            ],
            "service": [
                {
                    "id": f"{student_did}#linkeddomains",
                    "type": "LinkedDomains",
                    "serviceEndpoint": "https://learntwinchain.com"
                }
            ],
            "alsoKnownAs": [student_address],
            "metadata": {
                "created": student_data.get("created_at", ""),
                "updated": "2024-01-15T00:00:00Z",
                "version": student_data.get("version", 1) + 1
            },
            "nft_credentials": {
                "skill": skill,
                "token_id": token_id,
                "cid_nft": cid_nft,
                "blockchain_address": student_address,
                "issuer": "did:learntwin:uit001",
                "issued_at": "2024-01-15T00:00:00Z"
            }
        }
        
        # 3. Upload DID document lên IPFS (use consistent service)
        ipfs = IPFSService()
        version = student_data.get("version", 1) + 1
        cid_did = ipfs.upload_json(did_document, name=f"DID_{student_did}_v{version}.json")
        
        # 4. Đăng ký DID owner + Link DID lên blockchain (registry contract)
        try:
            # Đăng ký DID owner để có thể update logs về sau
            _ = blockchain_service.register_twin(student_did, student_address)
            # Gọi smart contract để link DID với CID (sử dụng service thống nhất)
            tx_result = blockchain_service.link_did_to_blockchain(
                student_did,
                cid_did,
                student_address,
                skill,
                token_id
            )
            tx_hash = tx_result.get('tx_hash') if isinstance(tx_result, dict) else tx_result
        except Exception as e:
            print(f"Warning: Could not link to blockchain: {e}")
            tx_hash = None
        
        # 5. Cập nhật student data với DID document mới (single version bump)
        student_data["did_document"] = did_document
        student_data["did_cid"] = cid_did
        student_data["blockchain_tx"] = tx_hash
        student_data["version"] = version
        
        # Cập nhật file
        learning_service.update_student_twin(student_did, student_data)
        
        return {
            "status": "success",
            "message": f"DID data updated successfully for {student_did}",
            "did_document": did_document,
            "cid_did": cid_did,
            "blockchain_tx": tx_hash,
            "student_data": student_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DID update failed: {str(e)}")

# ===== RAG/AI TUTOR ENDPOINTS =====

@router.post("/ai-tutor/query", response_model=RAGQueryResponse)
async def query_ai_tutor(
    request: RAGQueryRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Query the AI Tutor with RAG (Retrieval-Augmented Generation)
    
    This endpoint provides intelligent tutoring by combining knowledge from uploaded documents
    with Gemini 2.5 Pro's language capabilities.
    """
    # Check AI query limit
    from ..services.subscription_service import subscription_service
    limit_info = await subscription_service.check_ai_query_limit(current_user.did)
    
    if not limit_info["can_query"]:
        raise HTTPException(
            status_code=429,
            detail=f"AI Query Limit Reached. You have used {limit_info['queries_used']}/{limit_info['daily_limit']} queries today. Upgrade to {limit_info['plan_name']} for more queries."
        )
    
    rag_agent = get_rag_agent()
    if not rag_agent:
        raise HTTPException(
            status_code=503, 
            detail="AI Tutor service is not available. Please check RAG system configuration."
        )
    
    try:
        result = rag_agent.query(
            question=request.question,
            context_type=request.context_type,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_k=request.top_k
        )
        
        # Increment query usage
        await subscription_service.increment_ai_query_usage(current_user.did)
        
        return RAGQueryResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Tutor query failed: {str(e)}")

@router.post("/ai-tutor/upload-document")
async def upload_document_to_knowledge_base(
    file: UploadFile = File(...),
    metadata: Optional[str] = None
):
    """
    Upload a document to the AI Tutor's knowledge base
    
    Supports: PDF, TXT, CSV, DOCX, JSON files
    """
    rag_agent = get_rag_agent()
    if not rag_agent:
        raise HTTPException(
            status_code=503, 
            detail="AI Tutor service is not available. Please check RAG system configuration."
        )
    
    # Validate file type
    allowed_extensions = {'.pdf', '.txt', '.csv', '.docx', '.doc', '.json'}
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file_extension}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            # Save uploaded file
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        try:
            # Parse metadata if provided
            doc_metadata = {}
            if metadata:
                try:
                    doc_metadata = json.loads(metadata)
                except json.JSONDecodeError:
                    pass
            
            # Add upload metadata
            doc_metadata.update({
                'uploaded_filename': file.filename,
                'file_size': os.path.getsize(temp_path),
                'uploader': 'learning_api'
            })
            
            # Upload to knowledge base
            success = rag_agent.upload_document(temp_path, doc_metadata)
            
            if success:
                return {
                    "status": "success",
                    "message": f"Document '{file.filename}' uploaded successfully to knowledge base",
                    "filename": file.filename,
                    "file_size": os.path.getsize(temp_path),
                    "metadata": doc_metadata
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to process document")
                
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload failed: {str(e)}")

@router.post("/ai-tutor/search-documents")
async def search_documents_in_knowledge_base(request: DocumentSearchRequest):
    """
    Search for documents in the AI Tutor's knowledge base
    """
    rag_agent = get_rag_agent()
    if not rag_agent:
        raise HTTPException(
            status_code=503, 
            detail="AI Tutor service is not available. Please check RAG system configuration."
        )
    
    try:
        results = rag_agent.search_documents(
            query=request.query,
            k=request.k,
            document_type=request.document_type
        )
        
        return {
            "query": request.query,
            "document_type": request.document_type,
            "total_results": len(results),
            "documents": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document search failed: {str(e)}")

@router.get("/ai-tutor/knowledge-base/stats")
async def get_knowledge_base_stats():
    """
    Get statistics about the AI Tutor's knowledge base
    """
    rag_agent = get_rag_agent()
    if not rag_agent:
        raise HTTPException(
            status_code=503, 
            detail="AI Tutor service is not available. Please check RAG system configuration."
        )
    
    try:
        stats = rag_agent.get_knowledge_base_stats()
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get knowledge base stats: {str(e)}")

@router.get("/ai-tutor/document-types")
async def list_document_types():
    """
    List available document types in the knowledge base
    """
    rag_agent = get_rag_agent()
    if not rag_agent:
        raise HTTPException(
            status_code=503, 
            detail="AI Tutor service is not available. Please check RAG system configuration."
        )
    
    try:
        types = rag_agent.list_document_types()
        return {
            "document_types": types,
            "total_types": len(types),
            "available_types": ["learning", "exercise", "assessment", "programming", "computer_science", "general"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list document types: {str(e)}")

@router.post("/ai-tutor/learning-assistance")
async def get_learning_assistance(
    student_did: str = Body(...),
    question: str = Body(...),
    context_type: str = Body("learning"),
    current_topic: Optional[str] = Body(None),
    difficulty_level: Optional[str] = Body("intermediate")
):
    """
    Get personalized learning assistance for a specific student
    
    This endpoint combines the student's learning profile with RAG to provide
    personalized educational assistance.
    """
    rag_agent = get_rag_agent()
    if not rag_agent:
        raise HTTPException(
            status_code=503, 
            detail="AI Tutor service is not available. Please check RAG system configuration."
        )
    
    try:
        # Get student data
        student_data = learning_service.get_student_twin(student_did)
        if not student_data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Enhance question with student context
        enhanced_question = f"""
Student Context:
- DID: {student_did}
- Current Topic: {current_topic or 'General'}
- Difficulty Level: {difficulty_level}
- Learning Progress: {student_data.get('learning_state', {}).get('progress', {})}

Student Question: {question}

Please provide personalized assistance considering the student's current level and progress.
"""
        
        # Query RAG with enhanced context
        result = rag_agent.query(
            question=enhanced_question,
            context_type=context_type,
            max_tokens=2048,
            temperature=0.2,  # Slightly more deterministic for educational content
            top_k=5
        )
        
        # Add student-specific information to response
        result['student_did'] = student_did
        result['personalized'] = True
        result['current_topic'] = current_topic
        result['difficulty_level'] = difficulty_level
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Learning assistance failed: {str(e)}") 