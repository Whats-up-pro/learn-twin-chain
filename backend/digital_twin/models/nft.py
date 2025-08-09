"""
NFT tracking and management models
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from beanie import Document, Indexed
from pydantic import Field, BaseModel
from pymongo import IndexModel

class NFTMetadata(BaseModel):
    """NFT metadata structure"""
    name: str
    description: str
    image: Optional[str] = None  # IPFS URL
    animation_url: Optional[str] = None  # IPFS URL for animations
    external_url: Optional[str] = None
    attributes: List[Dict[str, Any]] = []
    background_color: Optional[str] = None

class VerificationCredential(BaseModel):
    """Verifiable credential structure"""
    issuer: str  # DID of issuer
    subject: str  # DID of subject
    credential_type: str
    issue_date: datetime
    expiration_date: Optional[datetime] = None
    proof: Dict[str, Any] = {}  # Cryptographic proof
    credential_cid: str  # IPFS CID of full credential

class NFTRecord(Document):
    """NFT record tracking for learning achievements"""
    
    # Core identification
    token_id: Indexed(str, unique=True) = Field(..., description="Unique NFT token ID")
    contract_address: Indexed(str) = Field(..., description="Smart contract address")
    token_standard: str = Field(default="ERC-721", description="Token standard (ERC-721, ERC-1155)")
    
    # Ownership
    owner_address: Indexed(str) = Field(..., description="Current owner wallet address")
    student_did: Indexed(str) = Field(..., description="Student DID")
    original_owner: str = Field(..., description="Original owner address")
    
    # Issuance details
    issuer_did: str = Field(..., description="Issuer DID (institution/teacher)")
    issue_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Achievement details
    achievement_type: str = Field(..., description="Type of achievement")  # course_completion, skill_mastery, module_completion
    course_id: Optional[str] = Field(default=None, description="Related course ID")
    module_id: Optional[str] = Field(default=None, description="Related module ID")
    skill_name: Optional[str] = Field(default=None, description="Skill name for skill-based NFTs")
    
    # Metadata
    metadata: NFTMetadata = Field(..., description="NFT metadata")
    metadata_cid: str = Field(..., description="IPFS CID for metadata")
    metadata_uri: str = Field(..., description="Complete metadata URI")
    
    # Verification
    verifiable_credential: Optional[VerificationCredential] = Field(default=None, description="Associated verifiable credential")
    verification_proof: Optional[Dict[str, Any]] = Field(default=None, description="Verification proof data")
    
    # Blockchain details
    mint_tx_hash: str = Field(..., description="Minting transaction hash")
    block_number: Optional[int] = Field(default=None, description="Block number")
    gas_used: Optional[int] = Field(default=None, description="Gas used for minting")
    
    # Status tracking
    mint_status: str = Field(default="pending", description="Minting status")  # pending, minted, failed
    is_revoked: bool = Field(default=False, description="Revocation status")
    revoked_at: Optional[datetime] = Field(default=None, description="Revocation timestamp")
    revoked_reason: Optional[str] = Field(default=None, description="Revocation reason")
    
    # Transfer history
    transfer_history: List[Dict[str, Any]] = Field(default_factory=list, description="Transfer history")
    
    # ZKP integration
    zkp_proof_cid: Optional[str] = Field(default=None, description="Zero-knowledge proof CID")
    private_attributes: Optional[Dict[str, str]] = Field(default=None, description="Encrypted private attributes")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "nft_records"
        indexes = [
            IndexModel("token_id", unique=True),
            IndexModel("contract_address"),
            IndexModel("owner_address"),
            IndexModel("student_did"),
            IndexModel("issuer_did"),
            IndexModel("achievement_type"),
            IndexModel("course_id"),
            IndexModel("module_id"),
            IndexModel("skill_name"),
            IndexModel("mint_status"),
            IndexModel("is_revoked"),
            IndexModel("issue_date"),
            IndexModel([("contract_address", 1), ("token_id", 1)])
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)
    
    def add_transfer(self, from_address: str, to_address: str, tx_hash: str, block_number: int = None):
        """Add transfer record"""
        transfer_record = {
            "from_address": from_address,
            "to_address": to_address,
            "tx_hash": tx_hash,
            "block_number": block_number,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.transfer_history.append(transfer_record)
        self.owner_address = to_address
        self.update_timestamp()
    
    def revoke(self, reason: str):
        """Revoke the NFT"""
        self.is_revoked = True
        self.revoked_at = datetime.now(timezone.utc)
        self.revoked_reason = reason
        self.update_timestamp()

class NFTCollection(Document):
    """NFT collection management"""
    
    collection_id: Indexed(str, unique=True) = Field(..., description="Unique collection identifier")
    name: str = Field(..., description="Collection name")
    description: str = Field(..., description="Collection description")
    
    # Contract details
    contract_address: Indexed(str) = Field(..., description="Smart contract address")
    contract_type: str = Field(..., description="Contract type")  # achievement, course, skill
    
    # Collection metadata
    image_cid: Optional[str] = Field(default=None, description="Collection image IPFS CID")
    banner_cid: Optional[str] = Field(default=None, description="Collection banner IPFS CID")
    
    # Creator details
    creator_did: str = Field(..., description="Creator DID")
    institution: str = Field(..., description="Institution identifier")
    
    # Collection settings
    is_public: bool = Field(default=True, description="Public visibility")
    is_tradeable: bool = Field(default=True, description="Allow trading")
    royalty_percentage: float = Field(default=0.0, description="Royalty percentage")
    
    # Statistics
    total_supply: int = Field(default=0, description="Total NFTs in collection")
    unique_holders: int = Field(default=0, description="Number of unique holders")
    floor_price: Optional[float] = Field(default=None, description="Floor price")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "nft_collections"
        indexes = [
            IndexModel("collection_id", unique=True),
            IndexModel("contract_address"),
            IndexModel("creator_did"),
            IndexModel("institution"),
            IndexModel("contract_type"),
            IndexModel("is_public")
        ]

class NFTTemplate(Document):
    """NFT template for standardized creation"""
    
    template_id: Indexed(str, unique=True) = Field(..., description="Unique template identifier")
    name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")
    
    # Template details
    achievement_type: str = Field(..., description="Achievement type")
    collection_id: str = Field(..., description="Target collection ID")
    
    # Metadata template
    metadata_template: Dict[str, Any] = Field(..., description="Metadata template structure")
    
    # Visual design
    image_template_cid: Optional[str] = Field(default=None, description="Image template IPFS CID")
    design_properties: Dict[str, Any] = Field(default_factory=dict, description="Design customization properties")
    
    # Requirements
    requirements: Dict[str, Any] = Field(default_factory=dict, description="Achievement requirements")
    
    # Status
    is_active: bool = Field(default=True, description="Template active status")
    
    # Creator
    created_by: str = Field(..., description="Creator DID")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "nft_templates"
        indexes = [
            IndexModel("template_id", unique=True),
            IndexModel("achievement_type"),
            IndexModel("collection_id"),
            IndexModel("is_active"),
            IndexModel("created_by")
        ]

class MintingQueue(Document):
    """Queue for NFT minting operations"""
    
    queue_id: Indexed(str, unique=True) = Field(..., description="Unique queue item identifier")
    user_id: str = Field(..., description="User DID")
    
    # Minting details
    achievement_type: str = Field(..., description="Achievement type")
    template_id: Optional[str] = Field(default=None, description="Template ID")
    metadata: Dict[str, Any] = Field(..., description="NFT metadata")
    
    # Status
    status: str = Field(default="queued", description="Queue status")  # queued, processing, completed, failed
    priority: int = Field(default=0, description="Processing priority")
    
    # Processing details
    assigned_worker: Optional[str] = Field(default=None, description="Assigned worker ID")
    processing_started: Optional[datetime] = Field(default=None, description="Processing start time")
    
    # Results
    token_id: Optional[str] = Field(default=None, description="Minted token ID")
    tx_hash: Optional[str] = Field(default=None, description="Transaction hash")
    error_message: Optional[str] = Field(default=None, description="Error message if failed")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Retry logic
    retry_count: int = Field(default=0, description="Number of retry attempts")
    max_retries: int = Field(default=3, description="Maximum retry attempts")
    
    class Settings:
        name = "minting_queue"
        indexes = [
            IndexModel("queue_id", unique=True),
            IndexModel("user_id"),
            IndexModel("status"),
            IndexModel("priority"),
            IndexModel("created_at"),
            IndexModel("assigned_worker")
        ]