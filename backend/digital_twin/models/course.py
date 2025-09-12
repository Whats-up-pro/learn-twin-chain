"""
Course and Module models with IPFS integration
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from beanie import Document, Indexed
from pydantic import Field, BaseModel, ConfigDict
from pymongo import IndexModel
from bson import ObjectId

class CourseMetadata(BaseModel):
    """Course metadata structure"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    difficulty_level: str = "intermediate"  # beginner, intermediate, advanced
    estimated_hours: int = 0
    prerequisites: List[str] = []
    learning_objectives: List[str] = []
    skills_taught: List[str] = []
    tags: List[str] = []
    language: str = "en"

class ModuleContent(BaseModel):
    """Module content structure"""
    content_type: str  # video, text, interactive, quiz, assignment
    content_cid: Optional[str] = None  # IPFS CID for content
    content_url: Optional[str] = None  # Alternative URL
    duration_minutes: int = 0
    order: int = 0

class Assessment(BaseModel):
    """Assessment structure"""
    assessment_id: str
    title: str
    type: str  # quiz, assignment, project, exam
    questions_cid: Optional[str] = None  # IPFS CID for questions
    rubric_cid: Optional[str] = None  # IPFS CID for rubric
    max_score: float = 100.0
    passing_score: float = 70.0
    time_limit_minutes: Optional[int] = None

class Course(Document):
    """Course document with IPFS content storage"""
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Core identification
    course_id: Indexed(str, unique=True) = Field(..., description="Unique course identifier")
    title: str = Field(..., description="Course title")
    description: str = Field(..., description="Course description")
    thumbnail_url: Optional[str] = Field(default=None, description="Course thumbnail image URL")
    
    # Content management
    syllabus_cid: Optional[str] = Field(default=None, description="IPFS CID for syllabus")
    content_cid: Optional[str] = Field(default=None, description="IPFS CID for course content")
    
    # Authoring
    created_by: Indexed(str) = Field(..., description="Creator DID")
    institution: str = Field(..., description="Institution identifier")
    instructors: List[str] = Field(default_factory=list, description="Instructor DIDs")
    
    # Version control
    version: int = Field(default=1, description="Course version")
    
    # Publication status
    status: str = Field(default="draft", description="Publication status")  # draft, review, published, archived
    published_at: Optional[datetime] = Field(default=None, description="Publication timestamp")
    
    # Metadata
    metadata: CourseMetadata = Field(default_factory=CourseMetadata, description="Course metadata")
    
    # Enrollment
    enrollment_start: Optional[datetime] = Field(default=None, description="Enrollment start date")
    enrollment_end: Optional[datetime] = Field(default=None, description="Enrollment end date")
    course_start: Optional[datetime] = Field(default=None, description="Course start date")
    course_end: Optional[datetime] = Field(default=None, description="Course end date")
    
    # Settings
    max_enrollments: Optional[int] = Field(default=None, description="Maximum number of enrollments")
    is_public: bool = Field(default=True, description="Public visibility")
    requires_approval: bool = Field(default=False, description="Requires enrollment approval")
    
    # NFT settings
    completion_nft_enabled: bool = Field(default=True, description="Enable completion NFTs")
    nft_contract_address: Optional[str] = Field(default=None, description="NFT contract address")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "courses"
        indexes = [
            IndexModel("course_id", unique=True),
            IndexModel("created_by"),
            IndexModel("institution"),
            IndexModel("status"),
            IndexModel("is_public"),
            IndexModel("created_at"),
            IndexModel("metadata.difficulty_level"),
            IndexModel("metadata.tags")
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)
    
    def dict(self, *args, **kwargs):
        """Override dict method to handle ObjectId serialization"""
        doc_dict = super().dict(*args, **kwargs)
        # Convert ObjectId to string if present
        if '_id' in doc_dict and isinstance(doc_dict['_id'], ObjectId):
            doc_dict['_id'] = str(doc_dict['_id'])
        return doc_dict
    
    @classmethod
    def from_mongo(cls, data):
        """Convert MongoDB document to Course instance"""
        if data is None:
            return None
        
        # Convert ObjectId to string
        if '_id' in data and isinstance(data['_id'], ObjectId):
            data['_id'] = str(data['_id'])
        
        return cls(**data)

class Module(Document):
    """Module document with IPFS content storage"""
    
    # Core identification
    module_id: Indexed(str, unique=True) = Field(..., description="Unique module identifier")
    course_id: Indexed(str) = Field(..., description="Parent course identifier")
    title: str = Field(..., description="Module title")
    description: str = Field(..., description="Module description")
    
    # Content management
    content: List[ModuleContent] = Field(default_factory=list, description="Module content")
    content_cid: Optional[str] = Field(default=None, description="IPFS CID for compiled content")
    
    # Structure
    order: int = Field(default=0, description="Module order in course")
    parent_module: Optional[str] = Field(default=None, description="Parent module ID for nested structure")
    
    # Learning design
    learning_objectives: List[str] = Field(default_factory=list, description="Module learning objectives")
    estimated_duration: int = Field(default=60, description="Estimated completion time in minutes")
    
    # Assessment
    assessments: List[Assessment] = Field(default_factory=list, description="Module assessments")
    completion_criteria: Dict[str, Any] = Field(default_factory=dict, description="Completion criteria")
    
    # Status
    status: str = Field(default="draft", description="Module status")  # draft, review, published, archived
    is_mandatory: bool = Field(default=True, description="Required for course completion")
    
    # Prerequisites
    prerequisites: List[str] = Field(default_factory=list, description="Required prerequisite modules")
    
    # NFT settings
    completion_nft_enabled: bool = Field(default=False, description="Enable module completion NFT")
    nft_metadata_cid: Optional[str] = Field(default=None, description="IPFS CID for NFT metadata")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "modules"
        indexes = [
            IndexModel("module_id", unique=True),
            IndexModel("course_id"),
            IndexModel("status"),
            IndexModel("order"),
            IndexModel("parent_module"),
            IndexModel("is_mandatory"),
            IndexModel("created_at")
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)

class Enrollment(Document):
    """Course enrollment tracking"""
    
    user_id: Indexed(str) = Field(..., description="Student DID")
    course_id: Indexed(str) = Field(..., description="Course identifier")
    
    # Enrollment details
    enrolled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(default="active", description="Enrollment status")  # active, completed, dropped, suspended
    
    # Progress tracking
    completed_modules: List[str] = Field(default_factory=list, description="Completed module IDs")
    current_module: Optional[str] = Field(default=None, description="Current module ID")
    completion_percentage: float = Field(default=0.0, description="Overall completion percentage")
    
    # Completion
    completed_at: Optional[datetime] = Field(default=None, description="Course completion timestamp")
    final_grade: Optional[float] = Field(default=None, description="Final grade/score")
    certificate_issued: bool = Field(default=False, description="Certificate issuance status")
    certificate_nft_token_id: Optional[str] = Field(default=None, description="Certificate NFT token ID")
    
    # Metadata
    notes: Optional[str] = Field(default=None, description="Enrollment notes")
    
    class Settings:
        name = "enrollments"
        indexes = [
            IndexModel("user_id"),
            IndexModel("course_id"),
            IndexModel([("user_id", 1), ("course_id", 1)], unique=True),
            IndexModel("status"),
            IndexModel("enrolled_at"),
            IndexModel("completed_at"),
            IndexModel("certificate_issued")
        ]

class Lesson(Document):
    """Lesson document with individual content tracking"""
    
    # Core identification
    lesson_id: Indexed(str, unique=True) = Field(..., description="Unique lesson identifier")
    module_id: Indexed(str) = Field(..., description="Parent module identifier")
    course_id: Indexed(str) = Field(..., description="Parent course identifier")
    
    # Lesson details
    title: str = Field(..., description="Lesson title")
    description: str = Field(default="", description="Lesson description")
    
    # Content management
    content_type: str = Field(..., description="Content type: video, text, interactive, quiz, assignment")
    content_url: Optional[str] = Field(default=None, description="Content URL (e.g., YouTube link)")
    content_cid: Optional[str] = Field(default=None, description="IPFS CID for content")
    
    # Structure and timing
    duration_minutes: int = Field(default=30, description="Estimated lesson duration in minutes")
    order: int = Field(default=0, description="Lesson order within module")
    
    # Learning design
    learning_objectives: List[str] = Field(default_factory=list, description="Lesson learning objectives")
    keywords: List[str] = Field(default_factory=list, description="Lesson keywords/tags")
    
    # Status
    status: str = Field(default="published", description="Lesson status")  # draft, review, published, archived
    is_mandatory: bool = Field(default=True, description="Required for module completion")
    
    # Prerequisites
    prerequisites: List[str] = Field(default_factory=list, description="Required prerequisite lessons")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "lessons"
        indexes = [
            IndexModel("lesson_id", unique=True),
            IndexModel("module_id"),
            IndexModel("course_id"),
            IndexModel("order"),
            IndexModel("content_type"),
            IndexModel("status"),
            IndexModel("is_mandatory"),
            IndexModel("created_at")
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)

class ModuleProgress(Document):
    """Detailed module progress tracking"""
    
    user_id: Indexed(str) = Field(..., description="Student DID")
    course_id: str = Field(..., description="Course identifier")
    module_id: Indexed(str) = Field(..., description="Module identifier")
    
    # Progress details
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_accessed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = Field(default=None, description="Module completion timestamp")
    
    # Content progress
    content_progress: Dict[str, float] = Field(default_factory=dict, description="Progress per content item")
    time_spent_minutes: int = Field(default=0, description="Total time spent")
    
    # Assessment results
    assessment_scores: Dict[str, float] = Field(default_factory=dict, description="Assessment scores")
    best_score: float = Field(default=0.0, description="Best assessment score")
    attempts: int = Field(default=0, description="Number of attempts")
    
    # Status
    status: str = Field(default="in_progress", description="Progress status")  # not_started, in_progress, completed, failed
    completion_percentage: float = Field(default=0.0, description="Module completion percentage")
    
    # NFT tracking
    nft_minted: bool = Field(default=False, description="Completion NFT minted")
    nft_token_id: Optional[str] = Field(default=None, description="NFT token ID")
    nft_tx_hash: Optional[str] = Field(default=None, description="NFT minting transaction hash")
    
    class Settings:
        name = "module_progress"
        indexes = [
            IndexModel("user_id"),
            IndexModel("course_id"),
            IndexModel("module_id"),
            IndexModel([("user_id", 1), ("module_id", 1)], unique=True),
            IndexModel("status"),
            IndexModel("completed_at"),
            IndexModel("nft_minted")
        ]