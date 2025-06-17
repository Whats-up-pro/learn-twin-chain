from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime

class TwinState(BaseModel):
    id: str
    timestamp: datetime
    properties: Dict[str, Any]
    status: str
    metadata: Optional[Dict[str, Any]] = None

class TwinHistory(BaseModel):
    twin_id: str
    states: List[TwinState]
    last_updated: datetime

class TwinConfig(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    update_interval: int
    properties_schema: Dict[str, str]
    blockchain_address: Optional[str] = None

class TwinEvent(BaseModel):
    twin_id: str
    event_type: str
    timestamp: datetime
    data: Dict[str, Any]
    blockchain_tx_hash: Optional[str] = None 