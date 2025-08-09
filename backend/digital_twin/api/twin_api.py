from fastapi import APIRouter, HTTPException, Request, Body
from typing import Dict, Any
from datetime import datetime
from ..services.twin_service import TwinService
from ..services.digital_twin_service import DigitalTwinService, update_digital_twin, update_twin_and_pin_to_ipfs
from ..services.digital_twin_storage import load_digital_twin, save_digital_twin
from ..services.blockchain_service import BlockchainService
from ..services.nonce_store import GLOBAL_NONCE_STORE
from ..utils.date_utils import get_current_vietnam_time_iso
import json

router = APIRouter()
twin_service = TwinService()
digital_twin_service = DigitalTwinService()
blockchain = BlockchainService()

@router.post("/twins")
def create_twin(twin_id: str, config: dict):
    return twin_service.create_twin(twin_id, config)

@router.get("/twins/{twin_id}")
def get_twin(twin_id: str):
    return twin_service.get_twin(twin_id)

@router.post("/update-twin")
async def update_twin(request: Request):
    try:
        data = await request.json()
        result = update_digital_twin(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.post("/twins/{twin_id}/complete-module", tags=["Digital Twin Actions"])
def complete_module_and_pin(
    twin_id: str, 
    module_data: Dict[str, Any] = Body(
        ...,
        examples={
            "default": {
                "module_name": "New Module Name",
                "completed_at": get_current_vietnam_time_iso(),
                "tokenized": False,
                "nft_cid": None
            }
        }
    )
):
    """
    Simulates a student completing a module, updates the digital twin,
    pins the new state to IPFS, and anchors the update on-chain.
    """
    try:
        # 1. Load the existing twin data
        print(f"--- Loading data for: {twin_id} ---")
        twin_data = load_digital_twin(twin_id)
        if not twin_data:
            raise HTTPException(status_code=404, detail="Digital twin not found")
        
        print("--- Data loaded successfully. Content snippet: ---")
        print(json.dumps(twin_data, indent=2, ensure_ascii=False)[:500]) # Print first 500 chars

        # 2. Simulate the update
        module_name = module_data.get("module_name", "Unknown Module")
        
        # Ensure checkpoint_history exists
        if 'checkpoint_history' not in twin_data['learning_state']:
            twin_data['learning_state']['checkpoint_history'] = []

        # Add new checkpoint
        twin_data['learning_state']['checkpoint_history'].append({
            "module": module_name,
            "completed_at": module_data.get("completed_at"),
            "tokenized": module_data.get("tokenized"),
            "nft_cid": module_data.get("nft_cid")
        })

        # Also update progress for simplicity
        if 'progress' not in twin_data['learning_state']:
            twin_data['learning_state']['progress'] = {}
        twin_data['learning_state']['progress'][module_name] = 1.0

        print(f"--- Data after update, before pinning. Content snippet: ---")
        print(json.dumps(twin_data, indent=2, ensure_ascii=False)[:500]) # Print first 500 chars

        # 3. Pin the canonical payload for the next version
        result = update_twin_and_pin_to_ipfs(twin_data)
        pinned_payload = result.get('pinned_payload') or {}
        version = result.get('version')
        ipfs_cid = result.get('ipfs_cid')

        # 4. Persist a stored payload that includes latest_cid for convenient retrieval
        stored_payload = dict(pinned_payload)
        stored_payload['latest_cid'] = ipfs_cid
        save_digital_twin(twin_id, stored_payload)

        # 5. Anchor on-chain using the exact pinned payload
        if blockchain.is_available():
            did = pinned_payload.get('twin_id')
            anchor = blockchain.log_twin_update(did, version, pinned_payload, ipfs_cid=ipfs_cid)
            result['onchain'] = anchor
        else:
            result['onchain'] = {'success': False, 'error': 'Blockchain not available'}

        print("--- Process completed successfully. ---")
        return result

    except Exception as e:
        # Log the exception for debugging
        print(f"Error in complete_module_and_pin: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 


@router.post("/twins/{twin_id}/challenge")
def get_update_challenge(twin_id: str):
    """Issue a nonce for client to sign the next DT update."""
    import secrets
    nonce = secrets.token_hex(16)
    GLOBAL_NONCE_STORE.add_nonce(nonce, ttl_seconds=300)
    return {"nonce": nonce, "twin_id": twin_id}


@router.post("/twins/{twin_id}/signed-update")
async def signed_update_twin(twin_id: str, payload: Dict[str, Any] = Body(...)):
    """Client sends updated DT, the nonce and signature; server pins and anchors on-chain."""
    try:
        nonce = payload.get('nonce')
        signature = payload.get('signature')
        twin_data = payload.get('twin_data')
        if not nonce or not signature or not isinstance(twin_data, dict):
            raise HTTPException(status_code=400, detail="Missing nonce/signature/twin_data")
        if not GLOBAL_NONCE_STORE.validate_and_consume(nonce):
            raise HTTPException(status_code=400, detail="Invalid or expired nonce")

        if twin_data.get('twin_id') != twin_id:
            raise HTTPException(status_code=400, detail="twin_id mismatch")

        result = update_twin_and_pin_to_ipfs(twin_data)
        pinned_payload = result.get('pinned_payload') or {}
        version = result.get('version')
        ipfs_cid = result.get('ipfs_cid')
        # Persist locally with latest_cid for convenience
        stored_payload = dict(pinned_payload)
        stored_payload['latest_cid'] = ipfs_cid
        save_digital_twin(twin_id, stored_payload)

        if blockchain.is_available():
            did = pinned_payload.get('twin_id')
            # Compute hash and message for verification
            data_hash_hex = blockchain.create_data_hash_hex(pinned_payload)
            message = blockchain._format_update_message(did, version, data_hash_hex, ipfs_cid, nonce)
            if not blockchain.verify_owner_signature(did, message, signature):
                return {"status": "error", "message": "Signature verification failed", "onchain": {"success": False}}
            anchor = blockchain.log_twin_update(did, version, pinned_payload, ipfs_cid=ipfs_cid)
            result['onchain'] = anchor
        else:
            result['onchain'] = {'success': False, 'error': 'Blockchain not available'}

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))