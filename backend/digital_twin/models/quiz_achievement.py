"""
Quiz and Achievement models for learning platform
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from beanie import Document, Indexed
from pydantic import Field, BaseModel
from pymongo import IndexModel
from enum import Enum

class QuizType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    SHORT_ANSWER = "short_answer"
    MATCHING = "matching"

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    SHORT_ANSWER = "short_answer"

class QuizQuestion(BaseModel):
    """Individual quiz question"""
    question_id: str
    question_text: str
    question_type: QuestionType
    options: List[str] = Field(default_factory=list)  # For multiple choice
    correct_answer: str
    explanation: Optional[str] = None
    points: float = 1.0
    order: int = 0

class Quiz(Document):
    """Quiz document"""
    
    # Core identification
    quiz_id: Indexed(str, unique=True) = Field(..., description="Unique quiz identifier")
    title: str = Field(..., description="Quiz title")
    description: str = Field(..., description="Quiz description")
    
    # Association
    course_id: Indexed(str) = Field(..., description="Parent course identifier")
    module_id: Optional[str] = Field(default=None, description="Associated module identifier")
    
    # Quiz structure
    quiz_type: QuizType = Field(default=QuizType.MULTIPLE_CHOICE, description="Type of quiz")
    questions: List[QuizQuestion] = Field(default_factory=list, description="Quiz questions")
    
    # Settings
    total_points: float = Field(default=0.0, description="Total possible points")
    passing_score: float = Field(default=70.0, description="Minimum passing score percentage")
    time_limit_minutes: Optional[int] = Field(default=None, description="Time limit in minutes")
    max_attempts: int = Field(default=3, description="Maximum attempts allowed")
    shuffle_questions: bool = Field(default=True, description="Shuffle question order")
    shuffle_options: bool = Field(default=True, description="Shuffle answer options")
    
    # Status
    status: str = Field(default="draft", description="Quiz status")  # draft, published, archived
    is_required: bool = Field(default=False, description="Required for course completion")
    
    # Metadata
    created_by: str = Field(..., description="Creator DID")
    instructions: Optional[str] = Field(default=None, description="Quiz instructions")
    tags: List[str] = Field(default_factory=list, description="Quiz tags")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "quizzes"
        indexes = [
            IndexModel("quiz_id", unique=True),
            IndexModel("course_id"),
            IndexModel("module_id"),
            IndexModel("status"),
            IndexModel("created_by"),
            IndexModel("created_at")
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)

class QuizAttempt(Document):
    """Quiz attempt tracking"""
    
    # Core identification
    attempt_id: str = Field(..., description="Unique attempt identifier")
    user_id: Indexed(str) = Field(..., description="Student DID")
    quiz_id: Indexed(str) = Field(..., description="Quiz identifier")
    
    # Attempt details
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    submitted_at: Optional[datetime] = Field(default=None, description="Submission timestamp")
    time_spent_minutes: Optional[int] = Field(default=None, description="Time spent on quiz")
    
    # Answers and scoring
    answers: Dict[str, Any] = Field(default_factory=dict, description="Student answers")
    score: Optional[float] = Field(default=None, description="Final score")
    percentage: Optional[float] = Field(default=None, description="Score percentage")
    passed: Optional[bool] = Field(default=None, description="Whether attempt passed")
    
    # Status
    status: str = Field(default="in_progress", description="Attempt status")  # in_progress, submitted, graded
    attempt_number: int = Field(default=1, description="Attempt number for this student")
    
    # Feedback
    feedback: Optional[str] = Field(default=None, description="Instructor feedback")
    auto_feedback: Optional[str] = Field(default=None, description="Automated feedback")
    
    class Settings:
        name = "quiz_attempts"
        indexes = [
            IndexModel("user_id"),
            IndexModel("quiz_id"),
            IndexModel([("user_id", 1), ("quiz_id", 1)]),
            IndexModel("status"),
            IndexModel("started_at"),
            IndexModel("submitted_at")
        ]

class AchievementType(str, Enum):
    COURSE_COMPLETION = "course_completion"
    MODULE_COMPLETION = "module_completion"
    QUIZ_MASTERY = "quiz_mastery"
    STREAK = "streak"
    SPEED = "speed"
    PERFECTIONIST = "perfectionist"
    EXPLORER = "explorer"
    DEDICATION = "dedication"

class AchievementTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

class AchievementCriteria(BaseModel):
    """Achievement earning criteria"""
    type: str  # course_completion, module_count, quiz_score, etc.
    target_value: float  # Required value to earn achievement
    comparison: str = "gte"  # gte, lte, eq
    time_period: Optional[str] = None  # daily, weekly, monthly
    additional_conditions: Dict[str, Any] = Field(default_factory=dict)

class Achievement(Document):
    """Achievement/Badge document"""
    
    # Core identification
    achievement_id: Indexed(str, unique=True) = Field(..., description="Unique achievement identifier")
    title: str = Field(..., description="Achievement title")
    description: str = Field(..., description="Achievement description")
    
    # Classification
    achievement_type: AchievementType = Field(..., description="Type of achievement")
    tier: AchievementTier = Field(default=AchievementTier.BRONZE, description="Achievement tier/level")
    category: str = Field(..., description="Achievement category")
    
    # Visual
    icon_url: Optional[str] = Field(default=None, description="Achievement icon URL")
    badge_color: str = Field(default="#FFD700", description="Badge color")
    
    # Earning criteria
    criteria: AchievementCriteria = Field(..., description="Criteria to earn this achievement")
    is_repeatable: bool = Field(default=False, description="Can be earned multiple times")
    is_hidden: bool = Field(default=False, description="Hidden until earned")
    
    # Association
    course_id: Optional[str] = Field(default=None, description="Associated course ID")
    module_id: Optional[str] = Field(default=None, description="Associated module ID")
    
    # Rewards
    points_reward: int = Field(default=0, description="Points awarded for earning")
    nft_enabled: bool = Field(default=False, description="Enable NFT for this achievement")
    nft_metadata_cid: Optional[str] = Field(default=None, description="IPFS CID for NFT metadata")
    
    # Status
    status: str = Field(default="active", description="Achievement status")  # active, inactive, deprecated
    
    # Metadata
    created_by: str = Field(..., description="Creator DID")
    tags: List[str] = Field(default_factory=list, description="Achievement tags")
    rarity: str = Field(default="common", description="Achievement rarity")  # common, uncommon, rare, epic, legendary
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "achievements"
        indexes = [
            IndexModel("achievement_id", unique=True),
            IndexModel("achievement_type"),
            IndexModel("tier"),
            IndexModel("category"),
            IndexModel("course_id"),
            IndexModel("module_id"),
            IndexModel("status"),
            IndexModel("created_by"),
            IndexModel("rarity")
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)

class UserAchievement(Document):
    """User earned achievements tracking"""
    
    # Core identification
    user_id: Indexed(str) = Field(..., description="Student DID")
    achievement_id: Indexed(str) = Field(..., description="Achievement identifier")
    
    # Earning details
    earned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    earned_through: str = Field(..., description="How achievement was earned")  # course_completion, quiz_score, etc.
    
    # Context
    course_id: Optional[str] = Field(default=None, description="Course context")
    module_id: Optional[str] = Field(default=None, description="Module context")
    quiz_id: Optional[str] = Field(default=None, description="Quiz context")
    
    # Values at time of earning
    earned_value: Optional[float] = Field(default=None, description="Value that triggered achievement")
    bonus_points: int = Field(default=0, description="Bonus points earned")
    
    # NFT details
    nft_minted: bool = Field(default=False, description="NFT minted for this achievement")
    nft_token_id: Optional[str] = Field(default=None, description="NFT token ID")
    nft_tx_hash: Optional[str] = Field(default=None, description="NFT minting transaction hash")
    
    # Status
    is_showcased: bool = Field(default=False, description="User showcases this achievement")
    
    class Settings:
        name = "user_achievements"
        indexes = [
            IndexModel("user_id"),
            IndexModel("achievement_id"),
            IndexModel([("user_id", 1), ("achievement_id", 1)]),
            IndexModel("earned_at"),
            IndexModel("course_id"),
            IndexModel("module_id"),
            IndexModel("nft_minted"),
            IndexModel("is_showcased")
        ]
