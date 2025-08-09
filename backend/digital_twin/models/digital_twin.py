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
    completion_percentage: float = 0.0
    start_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    time_spent_minutes: int = 0
    quiz_scores: List[float] = []
    last_accessed: Optional[datetime] = None

class SkillAssessment(BaseModel):
    """Skill assessment and competency tracking"""
    skill_name: str
    proficiency_level: str  # beginner, intermediate, advanced, expert
    assessment_score: float = 0.0
    verified: bool = False
    verified_by: Optional[str] = None
    verification_date: Optional[datetime] = None
    evidence_cids: List[str] = []  # IPFS CIDs for evidence

class CheckpointRecord(BaseModel):
    """Learning checkpoint record"""
    checkpoint_id: str
    timestamp: datetime
    twin_state_cid: str  # IPFS CID of twin state at checkpoint
    trigger_event: str  # module_completion, skill_verification, etc.
    metadata: Dict[str, Any] = {}

class DigitalTwin(Document):
    """Enhanced Digital Twin document with hybrid storage"""
    
    # Core identification
    twin_id: Indexed(str, unique=True) = Field(..., description="Unique digital twin identifier (DID)")
    owner_did: Indexed(str) = Field(..., description="Owner's decentralized identifier")
    
    # Version control
    version: int = Field(default=1, description="Twin version number")
    latest_cid: Optional[str] = Field(default=None, description="Latest IPFS CID")
    previous_cids: List[str] = Field(default_factory=list, description="Historical IPFS CIDs")
    
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
    
    # Skill assessment (for fast queries)
    skill_assessments: List[SkillAssessment] = Field(default_factory=list, description="Skill evaluations")
    verified_skills: List[str] = Field(default_factory=list, description="Verified skill names")
    
    # Interaction patterns
    learning_style: str = Field(default="balanced", description="Identified learning style")
    preferred_topics: List[str] = Field(default_factory=list, description="Preferred learning topics")
    activity_pattern: Dict[str, Any] = Field(default_factory=dict, description="Learning activity patterns")
    
    # Checkpoint history
    checkpoint_history: List[CheckpointRecord] = Field(default_factory=list, description="Learning checkpoints")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Privacy and sharing settings
    privacy_level: str = Field(default="private", description="Privacy level: private, institution, public")
    sharing_permissions: Dict[str, List[str]] = Field(default_factory=dict, description="Granular sharing permissions")
    
    # AI and analytics
    ai_insights: Dict[str, Any] = Field(default_factory=dict, description="AI-generated insights")
    prediction_models: Dict[str, Any] = Field(default_factory=dict, description="Predictive model data")
    
    class Settings:
        name = "digital_twins"
        indexes = [
            IndexModel("twin_id", unique=True),
            IndexModel("owner_did"),
            IndexModel("latest_cid"),
            IndexModel("anchor_status"),
            IndexModel("updated_at"),
            IndexModel("privacy_level"),
            IndexModel("verified_skills")
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
    
    def update_skill_assessment(self, skill_name: str, proficiency_level: str, score: float, verified: bool = False, verified_by: str = None):
        """Update or add skill assessment"""
        # Find existing assessment
        for assessment in self.skill_assessments:
            if assessment.skill_name == skill_name:
                assessment.proficiency_level = proficiency_level
                assessment.assessment_score = score
                if verified:
                    assessment.verified = True
                    assessment.verified_by = verified_by
                    assessment.verification_date = datetime.now(timezone.utc)
                    if skill_name not in self.verified_skills:
                        self.verified_skills.append(skill_name)
                break
        else:
            # Create new assessment
            assessment = SkillAssessment(
                skill_name=skill_name,
                proficiency_level=proficiency_level,
                assessment_score=score,
                verified=verified,
                verified_by=verified_by,
                verification_date=datetime.now(timezone.utc) if verified else None
            )
            self.skill_assessments.append(assessment)
            if verified and skill_name not in self.verified_skills:
                self.verified_skills.append(skill_name)
        
        self.update_timestamp()
    
    def update_learning_progress(self, module_id: str, completion_percentage: float, time_spent: int = 0):
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
                "progress": [progress.dict() for progress in self.learning_progress]
            },
            "skill_profile": {
                "assessments": [assessment.dict() for assessment in self.skill_assessments],
                "verified_skills": self.verified_skills
            },
            "interaction_patterns": {
                "learning_style": self.learning_style,
                "preferred_topics": self.preferred_topics,
                "activity_pattern": self.activity_pattern
            },
            "checkpoint_history": [checkpoint.dict() for checkpoint in self.checkpoint_history],
            "ai_insights": self.ai_insights,
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