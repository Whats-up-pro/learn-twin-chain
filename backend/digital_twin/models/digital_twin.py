"""
Enhanced Digital Twin model with hybrid storage (MongoDB + IPFS + on-chain)
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from beanie import Document, Indexed
from pydantic import Field, BaseModel
from pymongo import IndexModel

class LearningProgress(BaseModel):
    """Learning progress tracking"""
    module_id: str
    course_id: str  # Added: Link to course structure
    completion_percentage: float = 0.0
    start_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    time_spent_minutes: int = 0
    lessons_completed: List[str] = []  # Added: List of completed lesson IDs
    quiz_attempts: List[Dict[str, Any]] = []  # Added: Enhanced quiz tracking
    last_accessed: Optional[datetime] = None
    nft_minted: bool = False  # Added: Track if module completion NFT was minted
    nft_token_id: Optional[str] = None  # Added: NFT token ID if minted

class LessonProgress(BaseModel):
    """Individual lesson progress tracking"""
    lesson_id: str
    module_id: str
    course_id: str
    completion_percentage: float = 0.0
    start_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    time_spent_minutes: int = 0
    last_accessed: Optional[datetime] = None

class QuizAttemptRecord(BaseModel):
    """Quiz attempt tracking"""
    quiz_id: str
    lesson_id: Optional[str] = None  # Quiz might be associated with a lesson
    module_id: str
    course_id: str
    attempt_number: int
    start_time: datetime
    completion_time: Optional[datetime] = None
    score_percentage: float = 0.0
    time_spent_minutes: int = 0
    passed: bool = False

class AchievementRecord(BaseModel):
    """Achievement tracking"""
    achievement_id: str
    title: str
    description: str
    achievement_type: str  # LEARNING, COMPLETION, ASSESSMENT, SKILL, ENGAGEMENT
    tier: str  # BRONZE, SILVER, GOLD, PLATINUM
    earned_at: datetime
    evidence: Dict[str, Any] = {}  # Evidence data (module_id, quiz_id, etc.)
    nft_minted: bool = False
    nft_token_id: Optional[str] = None
    nft_contract_address: Optional[str] = None

class EnrollmentRecord(BaseModel):
    """Course enrollment tracking"""
    course_id: str
    enrolled_at: datetime
    status: str  # enrolled, in_progress, completed, dropped
    completion_percentage: float = 0.0
    completed_at: Optional[datetime] = None
    final_grade: Optional[float] = None
    certificate_issued: bool = False
    certificate_nft_token_id: Optional[str] = None

class CheckpointRecord(BaseModel):
    """Learning checkpoint record"""
    checkpoint_id: str
    timestamp: datetime
    twin_state_cid: str  # IPFS CID of twin state at checkpoint
    trigger_event: str  # module_completion, skill_verification, achievement_earned, etc.
    metadata: Dict[str, Any] = {}

class DigitalTwin(Document):
    """Enhanced Digital Twin document with hybrid storage"""
    
    # Core identification
    twin_id: Indexed(str, unique=True) = Field(..., description="Unique digital twin identifier (DID)")
    owner_did: Indexed(str) = Field(..., description="Owner's decentralized identifier")
    
    # Version control
    version: int = Field(default=1, description="Twin version number")
    latest_cid: Optional[str] = Field(default=None, description="Latest IPFS CID")
    
    # On-chain anchoring
    on_chain_tx_hash: Optional[str] = Field(default=None, description="Blockchain transaction hash")
    registry_address: Optional[str] = Field(default=None, description="Smart contract registry address")
    anchor_status: str = Field(default="pending", description="On-chain anchoring status")
    
    # Profile information (for fast queries)
    profile: Dict[str, Any] = Field(default_factory=dict, description="Basic profile data")
    
    # Learning state (for fast queries)
    current_modules: List[str] = Field(default_factory=list, description="Currently enrolled modules")
    completed_modules: List[str] = Field(default_factory=list, description="Completed modules")
    learning_progress: List[LearningProgress] = Field(default_factory=list, description="Detailed progress")
    
    # Enhanced learning tracking
    lesson_progress: List[LessonProgress] = Field(default_factory=list, description="Individual lesson progress")
    quiz_attempts: List[QuizAttemptRecord] = Field(default_factory=list, description="Quiz attempt history")
    achievements: List[AchievementRecord] = Field(default_factory=list, description="Earned achievements")
    enrollments: List[EnrollmentRecord] = Field(default_factory=list, description="Course enrollments")
    
    # Interaction patterns (simplified)
    learning_style: str = Field(default="balanced", description="Identified learning style")
    
    # Checkpoint history
    checkpoint_history: List[CheckpointRecord] = Field(default_factory=list, description="Learning checkpoints")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Privacy settings (simplified)
    privacy_level: str = Field(default="private", description="Privacy level: private, institution, public")
    
    class Settings:
        name = "digital_twins"
        indexes = [
            IndexModel("twin_id", unique=True),
            IndexModel("owner_did"),
            IndexModel("latest_cid"),
            IndexModel("anchor_status"),
            IndexModel("updated_at"),
            IndexModel("privacy_level"),
            # Learning tracking indexes
            IndexModel("current_modules"),
            IndexModel("completed_modules"),
            IndexModel("enrollments.course_id"),
            IndexModel("achievements.achievement_type"),
            IndexModel("achievements.tier"),
            IndexModel("achievements.earned_at"),
            IndexModel([("owner_did", 1), ("enrollments.course_id", 1)]),
            IndexModel([("owner_did", 1), ("achievements.tier", 1)])
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)
    
    def add_checkpoint(self, checkpoint_id: str, cid: str, trigger_event: str, metadata: Dict[str, Any] = None):
        """Add a new checkpoint record"""
        checkpoint = CheckpointRecord(
            checkpoint_id=checkpoint_id,
            timestamp=datetime.now(timezone.utc),
            twin_state_cid=cid,
            trigger_event=trigger_event,
            metadata=metadata or {}
        )
        self.checkpoint_history.append(checkpoint)
        self.update_timestamp()
    

    
    def update_learning_progress(self, module_id: str, course_id: str, completion_percentage: float, time_spent: int = 0):
        """Update learning progress for a module"""
        # Find existing progress
        for progress in self.learning_progress:
            if progress.module_id == module_id:
                progress.completion_percentage = completion_percentage
                progress.time_spent_minutes += time_spent
                progress.last_accessed = datetime.now(timezone.utc)
                if completion_percentage >= 100 and progress.completion_date is None:
                    progress.completion_date = datetime.now(timezone.utc)
                    if module_id not in self.completed_modules:
                        self.completed_modules.append(module_id)
                break
        else:
            # Create new progress record
            progress = LearningProgress(
                module_id=module_id,
                course_id=course_id,
                completion_percentage=completion_percentage,
                start_date=datetime.now(timezone.utc),
                completion_date=datetime.now(timezone.utc) if completion_percentage >= 100 else None,
                time_spent_minutes=time_spent,
                last_accessed=datetime.now(timezone.utc)
            )
            self.learning_progress.append(progress)
            if completion_percentage >= 100 and module_id not in self.completed_modules:
                self.completed_modules.append(module_id)
        
        # Update current modules
        if module_id not in self.current_modules and completion_percentage < 100:
            self.current_modules.append(module_id)
        elif module_id in self.current_modules and completion_percentage >= 100:
            self.current_modules.remove(module_id)
        
        self.update_timestamp()
    
    def update_lesson_progress(self, lesson_id: str, module_id: str, course_id: str, completion_percentage: float, time_spent: int = 0):
        """Update progress for a specific lesson"""
        # Find existing lesson progress
        for progress in self.lesson_progress:
            if progress.lesson_id == lesson_id:
                progress.completion_percentage = completion_percentage
                progress.time_spent_minutes += time_spent
                progress.last_accessed = datetime.now(timezone.utc)
                if completion_percentage >= 100 and progress.completion_date is None:
                    progress.completion_date = datetime.now(timezone.utc)
                break
        else:
            # Create new lesson progress record
            progress = LessonProgress(
                lesson_id=lesson_id,
                module_id=module_id,
                course_id=course_id,
                completion_percentage=completion_percentage,
                start_date=datetime.now(timezone.utc),
                completion_date=datetime.now(timezone.utc) if completion_percentage >= 100 else None,
                time_spent_minutes=time_spent,
                last_accessed=datetime.now(timezone.utc)
            )
            self.lesson_progress.append(progress)
        
        # Update module progress if lesson is completed
        if completion_percentage >= 100:
            # Find module progress and add lesson to completed lessons
            for module_progress in self.learning_progress:
                if module_progress.module_id == module_id:
                    if lesson_id not in module_progress.lessons_completed:
                        module_progress.lessons_completed.append(lesson_id)
                    break
        
        self.update_timestamp()
    
    def add_quiz_attempt(self, quiz_id: str, module_id: str, course_id: str, score_percentage: float, 
                        lesson_id: str = None):
        """Add a quiz attempt record"""
        attempt_number = len([q for q in self.quiz_attempts if q.quiz_id == quiz_id]) + 1
        
        quiz_attempt = QuizAttemptRecord(
            quiz_id=quiz_id,
            lesson_id=lesson_id,
            module_id=module_id,
            course_id=course_id,
            attempt_number=attempt_number,
            start_time=datetime.now(timezone.utc),
            completion_time=datetime.now(timezone.utc),
            score_percentage=score_percentage,
            passed=score_percentage >= 70  # Default passing threshold
        )
        
        self.quiz_attempts.append(quiz_attempt)
        
        # Update module progress quiz attempts
        for module_progress in self.learning_progress:
            if module_progress.module_id == module_id:
                quiz_data = {
                    'quiz_id': quiz_id,
                    'attempt_number': attempt_number,
                    'score_percentage': score_percentage,
                    'completed_at': datetime.now(timezone.utc).isoformat(),
                    'passed': quiz_attempt.passed
                }
                module_progress.quiz_attempts.append(quiz_data)
                break
        
        self.update_timestamp()
    
    def add_achievement(self, achievement_id: str, title: str, description: str, 
                       achievement_type: str, tier: str, evidence: Dict[str, Any] = None):
        """Add an earned achievement"""
        achievement = AchievementRecord(
            achievement_id=achievement_id,
            title=title,
            description=description,
            achievement_type=achievement_type,
            tier=tier,
            earned_at=datetime.now(timezone.utc),
            evidence=evidence or {}
        )
        
        self.achievements.append(achievement)
        
        # Add checkpoint for achievement
        self.add_checkpoint(
            checkpoint_id=f"achievement_{achievement_id}",
            cid="",  # Will be updated when pinned to IPFS
            trigger_event="achievement_earned",
            metadata={
                'achievement_id': achievement_id,
                'tier': tier,
                'type': achievement_type
            }
        )
        
        self.update_timestamp()
    
    def enroll_in_course(self, course_id: str):
        """Enroll student in a course"""
        # Check if already enrolled
        for enrollment in self.enrollments:
            if enrollment.course_id == course_id:
                return  # Already enrolled
        
        enrollment = EnrollmentRecord(
            course_id=course_id,
            enrolled_at=datetime.now(timezone.utc),
            status="enrolled"
        )
        
        self.enrollments.append(enrollment)
        self.update_timestamp()
    
    def get_canonical_payload(self) -> Dict[str, Any]:
        """Get the canonical payload for IPFS storage"""
        return {
            "twin_id": self.twin_id,
            "owner_did": self.owner_did,
            "version": self.version,
            "timestamp": self.updated_at.isoformat(),
            "profile": self.profile,
            "learning_state": {
                "current_modules": self.current_modules,
                "completed_modules": self.completed_modules,
                "progress": [progress.dict() for progress in self.learning_progress],
                "lesson_progress": [lesson.dict() for lesson in self.lesson_progress],
                "quiz_attempts": [quiz.dict() for quiz in self.quiz_attempts]
            },
            "achievements": [achievement.dict() for achievement in self.achievements],
            "enrollments": [enrollment.dict() for enrollment in self.enrollments],
            "learning_style": self.learning_style,
            "checkpoint_history": [checkpoint.dict() for checkpoint in self.checkpoint_history],
            "privacy_level": self.privacy_level
        }

class DigitalTwinVersion(Document):
    """Version history for digital twins"""
    
    twin_id: Indexed(str) = Field(..., description="Digital twin identifier")
    version: int = Field(..., description="Version number")
    cid: str = Field(..., description="IPFS CID for this version")
    
    # Change tracking
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = Field(..., description="DID of user who created this version")
    change_description: str = Field(..., description="Description of changes")
    change_type: str = Field(..., description="Type of change (checkpoint, skill_update, etc.)")
    
    # Verification
    verified: bool = Field(default=False, description="Version verification status")
    verified_by: Optional[str] = Field(default=None, description="DID of verifier")
    verification_date: Optional[datetime] = Field(default=None, description="Verification timestamp")
    
    class Settings:
        name = "digital_twin_versions"
        indexes = [
            IndexModel("twin_id"),
            IndexModel("version"),
            IndexModel([("twin_id", 1), ("version", 1)], unique=True),
            IndexModel("cid"),
            IndexModel("created_at"),
            IndexModel("verified")
        ]