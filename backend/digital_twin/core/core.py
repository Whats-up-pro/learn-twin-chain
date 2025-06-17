from datetime import datetime
from typing import Dict, List, Optional
from ..models import TwinState, TwinHistory, TwinConfig, TwinEvent
from ..utils import Logger
from ..config.config import config

class DigitalTwin:
    def __init__(self, twin_id: str, config: TwinConfig):
        self.twin_id = twin_id
        self.config = config
        self.logger = Logger(f"DigitalTwin_{twin_id}")
        self.history = TwinHistory(
            twin_id=twin_id,
            states=[],
            last_updated=datetime.now()
        )
    
    def update_state(self, properties: Dict[str, any], metadata: Optional[Dict[str, any]] = None) -> TwinState:
        """Cập nhật trạng thái của Digital Twin"""
        new_state = TwinState(
            id=f"{self.twin_id}_{datetime.now().timestamp()}",
            timestamp=datetime.now(),
            properties=properties,
            status="active",
            metadata=metadata
        )
        
        self.history.states.append(new_state)
        self.history.last_updated = datetime.now()
        
        # Giới hạn lịch sử theo cấu hình
        if len(self.history.states) > config.MAX_HISTORY_LENGTH:
            self.history.states = self.history.states[-config.MAX_HISTORY_LENGTH:]
        
        self.logger.info(f"Updated state for twin {self.twin_id}")
        return new_state
    
    def get_current_state(self) -> Optional[TwinState]:
        """Lấy trạng thái hiện tại của Digital Twin"""
        if not self.history.states:
            return None
        return self.history.states[-1]
    
    def get_state_history(self, limit: Optional[int] = None) -> List[TwinState]:
        """Lấy lịch sử trạng thái của Digital Twin"""
        if limit is None:
            return self.history.states
        return self.history.states[-limit:]
    
    def record_event(self, event_type: str, data: Dict[str, any], blockchain_tx_hash: Optional[str] = None) -> TwinEvent:
        """Ghi lại sự kiện của Digital Twin"""
        event = TwinEvent(
            twin_id=self.twin_id,
            event_type=event_type,
            timestamp=datetime.now(),
            data=data,
            blockchain_tx_hash=blockchain_tx_hash
        )
        self.logger.info(f"Recorded event {event_type} for twin {self.twin_id}")
        return event
    
    def validate_properties(self, properties: Dict[str, any]) -> bool:
        """Kiểm tra tính hợp lệ của các thuộc tính"""
        for key, value_type in self.config.properties_schema.items():
            if key not in properties:
                self.logger.error(f"Missing required property: {key}")
                return False
            if not isinstance(properties[key], eval(value_type)):
                self.logger.error(f"Invalid type for property {key}: expected {value_type}")
                return False
        return True 