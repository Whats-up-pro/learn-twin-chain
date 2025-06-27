# backend/models.py
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

# Định nghĩa chi tiết hơn về tiến độ học tập theo từng chủ đề Python
class PythonProgress(BaseModel):
    topic: str # Ví dụ: "Biến và kiểu dữ liệu", "Cấu trúc điều khiển", "Hàm", "Lập trình hướng đối tượng"
    understanding_level: float = Field(default=0.0, ge=0.0, le=1.0) # Mức độ hiểu (0.0 đến 1.0)
    last_accessed: Optional[datetime] = None
    completion_status: str = "not_started" # "not_started", "in_progress", "completed"

# Định nghĩa các kỹ năng Python
class PythonSkill(BaseModel):
    skill_name: str # Ví dụ: "Giải quyết vấn đề", "Tư duy logic", "Viết code sạch"
    proficiency_level: float = Field(default=0.0, ge=0.0, le=1.0) # Mức độ thành thạo (0.0 đến 1.0)
    evidence: List[str] = [] # Danh sách các bằng chứng (ví dụ: link bài tập, mô tả dự án)

# Định nghĩa hành vi học tập
class LearningBehavior(BaseModel):
    total_study_time: int = 0 # Tổng thời gian học (phút)
    average_session_length: Optional[int] = None # Thời gian trung bình mỗi phiên học (phút)
    quiz_accuracy: Dict[str, float] = {} # Tỷ lệ đúng các bài quiz theo chủ đề
    average_overall_quiz_accuracy: float = Field(default=0.0, ge=0.0, le=1.0) # Tỷ lệ đúng trung bình các bài quiz
    preferred_learning_times: List[str] = [] # Thời gian trong ngày học hiệu quả nhất
    # ... thêm các chỉ số hành vi khác

# Cấu trúc cho dữ liệu tương tác LLM chi tiết hơn
class LLMInteraction(BaseModel):
    timestamp: datetime
    user_query: str
    llm_response: str
    topics_discussed: List[str] = []
    # ... thêm các chi tiết khác

class InteractionLogs(BaseModel):
    last_llm_session: Optional[datetime] = None
    most_asked_topics: List[str] = []
    preferred_learning_style: Optional[str] = None
    llm_interaction_history: List[LLMInteraction] = [] # Lịch sử tương tác LLM

# Cập nhật cấu trúc Digital Twin
class DigitalTwin(BaseModel):
    twin_id: str # DID của người học
    owner_did: str
    python_progress: Dict[str, PythonProgress] = {} # Tiến độ học Python theo chủ đề
    python_skills: Dict[str, PythonSkill] = {} # Kỹ năng Python
    learning_behavior: LearningBehavior = LearningBehavior() # Hành vi học tập
    interaction_logs: InteractionLogs = InteractionLogs() # Giữ lại cấu trúc interaction logs
    # Add other dimensions of the twin here (e.g., skills, behavior)

# Cập nhật cấu trúc Update Twin Request
class UpdateTwinRequest(BaseModel):
    twin_id: str
    owner_did: str
    python_progress_updates: Optional[Dict[str, PythonProgress]] = None
    python_skills_updates: Optional[Dict[str, PythonSkill]] = None
    learning_behavior_updates: Optional[LearningBehavior] = None
    interaction_logs_updates: Optional[InteractionLogs] = None
    # ... thêm các trường cập nhật khác

# Cấu trúc cho dữ liệu Quiz
class QuizAnswer(BaseModel):
    question_id: str
    answer: str
    is_correct: bool

class QuizResult(BaseModel):
    quiz_id: str
    module: str
    answers: List[QuizAnswer]
    score: float
    completed_at: datetime

# Cập nhật cấu trúc cho NFT Metadata
class NFTMetadata(BaseModel):
    name: str
    description: str
    image: str # Link đến hình ảnh NFT trên IPFS
    attributes: List[Dict[str, str]] = [] # Ví dụ: [{"trait_type": "Skill", "value": "Python Basic"}]

# Cấu trúc cho NFT Mint Request
class NFTMintRequest(BaseModel):
    twin_id: str
    module: str
    skill_token_uri: str # IPFS URI for the NFT metadata

# Cấu trúc cho NFT Mint Response
class NFTMintResponse(BaseModel):
    success: bool
    transaction_hash: Optional[str] = None
    token_id: Optional[int] = None

# Cấu trúc cho LLM Query
class LLMQuery(BaseModel):
    twin_id: str
    prompt: str

# Cấu trúc cho LLM Response
class LLMResponse(BaseModel):
    response: str
    suggested_next_steps: List[str] = []

# Cấu trúc cho Verifier Request
class VerifierRequest(BaseModel):
    twin_id: str
    cid: str # IPFS CID of the twin data
    signature: str # Signature from the owner DID
    timestamp: datetime

# Cấu trúc cho Verifier Response
class VerifierResponse(BaseModel):
    is_valid: bool
    integrity_checked: bool
    authenticity_checked: bool
    provenance_checked: bool
    message: str
