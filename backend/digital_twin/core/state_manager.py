class StateManager:
    """
    Quản lý trạng thái của Digital Twin.
    """
    def __init__(self):
        self.states = {}

    def set_state(self, twin_id: str, state: dict):
        self.states[twin_id] = state

    def get_state(self, twin_id: str) -> dict:
        return self.states.get(twin_id, {})

    def reset_state(self, twin_id: str):
        self.states[twin_id] = {} 