from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict
from ..models import TwinState, TwinConfig, TwinEvent
from ..core import DigitalTwin
from ..utils import Logger

router = APIRouter()
logger = Logger("api")

# Lưu trữ các Digital Twin instances
twins: Dict[str, DigitalTwin] = {}

@router.post("/twins", response_model=TwinConfig)
async def create_twin(config: TwinConfig):
    """Tạo một Digital Twin mới"""
    if config.id in twins:
        raise HTTPException(status_code=400, detail="Twin ID already exists")
    
    twin = DigitalTwin(config.id, config)
    twins[config.id] = twin
    logger.info(f"Created new twin: {config.id}")
    return config

@router.get("/twins/{twin_id}/state", response_model=Optional[TwinState])
async def get_twin_state(twin_id: str):
    """Lấy trạng thái hiện tại của Digital Twin"""
    if twin_id not in twins:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twins[twin_id].get_current_state()

@router.post("/twins/{twin_id}/state", response_model=TwinState)
async def update_twin_state(twin_id: str, properties: dict, metadata: Optional[dict] = None):
    """Cập nhật trạng thái của Digital Twin"""
    if twin_id not in twins:
        raise HTTPException(status_code=404, detail="Twin not found")
    
    twin = twins[twin_id]
    if not twin.validate_properties(properties):
        raise HTTPException(status_code=400, detail="Invalid properties")
    
    return twin.update_state(properties, metadata)

@router.get("/twins/{twin_id}/history", response_model=List[TwinState])
async def get_twin_history(twin_id: str, limit: Optional[int] = None):
    """Lấy lịch sử trạng thái của Digital Twin"""
    if twin_id not in twins:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twins[twin_id].get_state_history(limit)

@router.post("/twins/{twin_id}/events", response_model=TwinEvent)
async def record_twin_event(twin_id: str, event_type: str, data: dict, blockchain_tx_hash: Optional[str] = None):
    """Ghi lại sự kiện của Digital Twin"""
    if twin_id not in twins:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twins[twin_id].record_event(event_type, data, blockchain_tx_hash) 