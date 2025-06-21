from fastapi import APIRouter, HTTPException, Request, Body
from typing import Dict, Any
from datetime import datetime
from ..services.twin_service import TwinService
from ..services.digital_twin_service import update_digital_twin, update_twin_and_pin_to_ipfs
from ..services.digital_twin_storage import load_digital_twin
from ..utils.date_utils import get_current_vietnam_time_iso
import json

router = APIRouter()
twin_service = TwinService()

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
    and pins the new state to IPFS.
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

        # 3. Call the new service function to update and pin
        result = update_twin_and_pin_to_ipfs(twin_data)
        print("--- Process completed successfully. ---")
        return result

    except Exception as e:
        # Log the exception for debugging
        print(f"Error in complete_module_and_pin: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 