from ..core.twin_model import TwinModel

class StudentTwin(TwinModel):
    """
    Digital Twin cho học sinh.
    """
    def __init__(self, twin_id: str, config: dict, student_profile: dict):
        super().__init__(twin_id, config)
        self.profile = student_profile
        # Thêm các thuộc tính riêng cho học sinh 