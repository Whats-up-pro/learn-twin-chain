from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum

class LearningStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class LearningActivity(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: str  # e.g., "lecture", "quiz", "assignment", "project"
    duration: int  # in minutes
    difficulty: int = Field(ge=1, le=5)  # 1-5 scale
    prerequisites: List[str] = []  # List of activity IDs
    learning_outcomes: List[str] = []

class LearningProgress(BaseModel):
    activity_id: str
    status: LearningStatus
    start_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    score: Optional[float] = None
    attempts: int = 0
    feedback: Optional[str] = None

class StudentProfile(BaseModel):
    id: str
    name: str
    email: str
    learning_style: Optional[str] = None
    preferences: Dict[str, Any] = {}
    strengths: List[str] = []
    weaknesses: List[str] = []
    goals: List[str] = []

class LearningPath(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    activities: List[LearningActivity]
    target_audience: List[str] = []
    estimated_duration: int  # in hours
    difficulty_level: int = Field(ge=1, le=5)
    prerequisites: List[str] = []

class LearningAnalytics(BaseModel):
    student_id: str
    path_id: str
    progress: List[LearningProgress]
    completion_rate: float
    average_score: float
    time_spent: int  # in minutes
    last_activity: datetime
    learning_patterns: Dict[str, Any] = {}
    recommendations: List[str] = [] 