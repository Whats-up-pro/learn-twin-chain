class TwinModel:
    """
    Mô hình Digital Twin cốt lõi.
    """
    def __init__(self, twin_id: str, config: dict):
        self.twin_id = twin_id
        self.config = config
        self.state = {}

    def update_state(self, new_state: dict):
        """
        Cập nhật trạng thái của Digital Twin.
        """
        self.state.update(new_state)

    def get_state(self) -> dict:
        """
        Lấy trạng thái hiện tại của Digital Twin.
        """
        return self.state 