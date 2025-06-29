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
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        twin_id = data.get('twin_id')
                        if twin_id:
                            self.students[twin_id] = data
                except UnicodeDecodeError:
                    # Fallback to cp1252 if utf-8 fails
                    with open(fpath, 'r', encoding='cp1252') as f:
                        data = json.load(f)
                        twin_id = data.get('twin_id')
                        if twin_id:
                            self.students[twin_id] = data

    def reload_students(self):
        """Reload dữ liệu từ files"""
        self.students = {}
        self.load_students_from_files()

    def create_student_twin(self, twin_id: str, config: dict, profile: dict):
        twin = StudentTwin(twin_id, config, profile)
        self.students[twin_id] = twin
        return twin

    def get_student_twin(self, twin_id: str):
        return self.students.get(twin_id)

    def list_student_twins(self):
        """Trả về danh sách tất cả student twins"""
        # Reload dữ liệu trước khi trả về để đảm bảo cập nhật
        self.reload_students()
        students_list = list(self.students.values())
        return {
            "total": len(students_list),
            "students": students_list
        }

    def update_student_twin(self, twin_id: str, updated_data: dict):
        """Cập nhật thông tin student twin"""
        if twin_id not in self.students:
            raise ValueError(f"Student twin {twin_id} not found")
        
        # Cập nhật trong memory
        self.students[twin_id] = updated_data
        
        # Cập nhật file - tạo tên file hợp lệ từ DID
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
        
        # Tạo tên file hợp lệ với prefix 'dt_' và thay thế ký tự không hợp lệ
        safe_filename = twin_id.replace(':', '_').replace('/', '_').replace('\\', '_')
        safe_filename = f"dt_{safe_filename}"
        file_path = os.path.join(data_dir, f"{safe_filename}.json")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        
        return updated_data

    def get_student_twin_file_path(self, twin_id: str) -> str:
        """Lấy đường dẫn file cho student twin"""
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
        safe_filename = twin_id.replace(':', '_').replace('/', '_').replace('\\', '_')
        safe_filename = f"dt_{safe_filename}"
        return os.path.join(data_dir, f"{safe_filename}.json") 