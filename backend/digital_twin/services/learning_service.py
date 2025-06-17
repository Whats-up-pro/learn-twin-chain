import os
import json
from ..models.student_twin import StudentTwin

class LearningService:
    """
    Service quản lý học tập cho học sinh.
    """
    def __init__(self):
        self.students = {}
        self.load_students_from_files()

    def load_students_from_files(self):
        # Đường dẫn tới backend/data/digital_twins
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
        if not os.path.isdir(data_dir):
            return
        for fname in os.listdir(data_dir):
            if fname.endswith('.json'):
                fpath = os.path.join(data_dir, fname)
                with open(fpath, encoding='utf-8') as f:
                    data = json.load(f)
                    twin_id = data.get('twin_id')
                    if twin_id:
                        self.students[twin_id] = data

    def create_student_twin(self, twin_id: str, config: dict, profile: dict):
        twin = StudentTwin(twin_id, config, profile)
        self.students[twin_id] = twin
        return twin

    def get_student_twin(self, twin_id: str):
        return self.students.get(twin_id)

    def list_student_twins(self):
        """Trả về danh sách tất cả student twins"""
        return list(self.students.values()) 