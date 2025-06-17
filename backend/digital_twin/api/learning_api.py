from fastapi import APIRouter
from ..services.learning_service import LearningService

router = APIRouter()
learning_service = LearningService()

@router.post("/students")
def create_student_twin(twin_id: str, config: dict, profile: dict):
    return learning_service.create_student_twin(twin_id, config, profile)

@router.get("/students/{twin_id}")
def get_student_twin(twin_id: str):
    return learning_service.get_student_twin(twin_id) 