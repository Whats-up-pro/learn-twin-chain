from ..models.student_twin import StudentTwin

class LearningService:
    """
    Service quản lý học tập cho học sinh.
    """
    def __init__(self):
        self.students = {}

    def create_student_twin(self, twin_id: str, config: dict, profile: dict):
        twin = StudentTwin(twin_id, config, profile)
        self.students[twin_id] = twin
        return twin

    def get_student_twin(self, twin_id: str):
        return self.students.get(twin_id) 