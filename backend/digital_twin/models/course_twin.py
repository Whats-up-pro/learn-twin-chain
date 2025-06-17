from ..core.twin_model import TwinModel

class CourseTwin(TwinModel):
    """
    Digital Twin cho khóa học.
    """
    def __init__(self, twin_id: str, config: dict, course_info: dict):
        super().__init__(twin_id, config)
        self.course_info = course_info
        # Thêm các thuộc tính riêng cho khóa học 