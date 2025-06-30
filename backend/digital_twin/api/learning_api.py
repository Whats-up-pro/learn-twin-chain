from fastapi import APIRouter, Body, HTTPException
from ..services.learning_service import LearningService
from ..services.blockchain_service import BlockchainService
from ..utils.vc_utils import create_vc
from ..services.ipfs_service import IPFSService
import os
import json

router = APIRouter()
learning_service = LearningService()
blockchain_service = BlockchainService()

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
        
        # 3. Upload DID document lên IPFS
        ipfs = IPFSService()
        version = student_data.get("version", 1) + 1
        cid_did = ipfs.upload_json(did_document, name=f"DID_{student_did}_v{version}.json")
        
        # 4. Link DID lên blockchain (registry contract)
        try:
            # Gọi smart contract để link DID với CID
            tx_hash = blockchain_service.blockchain.link_did_to_blockchain(
                student_did,
                cid_did,
                student_address,
                skill,
                token_id
            )
        except Exception as e:
            print(f"Warning: Could not link to blockchain: {e}")
            tx_hash = None
        
        # 5. Cập nhật student data với DID document mới
        student_data["did_document"] = did_document
        student_data["did_cid"] = cid_did
        student_data["blockchain_tx"] = tx_hash
        student_data["version"] = student_data.get("version", 1) + 1
        
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