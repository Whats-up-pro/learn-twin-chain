from ..core.twin_model import TwinModel

class TeacherTwin(TwinModel):
    """
    Digital Twin cho giáo viên.
    """
    def __init__(self, twin_id: str, config: dict, teacher_profile: dict):
        super().__init__(twin_id, config)
        self.profile = teacher_profile
        # Thêm các thuộc tính riêng cho giáo viên 