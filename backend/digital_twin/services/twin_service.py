from ..core.twin_model import TwinModel

class TwinService:
    """
    Service quản lý Digital Twin.
    """
    def __init__(self):
        self.twins = {}

    def create_twin(self, twin_id: str, config: dict):
        twin = TwinModel(twin_id, config)
        self.twins[twin_id] = twin
        return twin

    def get_twin(self, twin_id: str):
        return self.twins.get(twin_id) 