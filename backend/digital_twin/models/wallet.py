"""
Wallet linking models for SIWE (Sign-In with Ethereum) integration
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel

class WalletLink(Document):
    """Wallet link document for user-wallet mapping"""
    
    user_id: Indexed(str) = Field(..., description="User DID")
    wallet_address: Indexed(str, unique=True) = Field(..., description="Ethereum wallet address")
    
    # Verification details
    signature: str = Field(..., description="SIWE signature")
    message: str = Field(..., description="SIWE message that was signed")
    nonce: str = Field(..., description="Nonce used for verification")
    
    # Metadata
    linked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_used: Optional[datetime] = Field(default=None, description="Last time wallet was used")
    
    # Status
    is_active: bool = Field(default=True, description="Link active status")
    is_primary: bool = Field(default=False, description="Primary wallet for user")
    
    # Additional data
    chain_id: Optional[int] = Field(default=None, description="Blockchain network ID")
    wallet_type: Optional[str] = Field(default="metamask", description="Wallet type/provider")
    
    class Settings:
        name = "wallet_links"
        indexes = [
            IndexModel("user_id"),
            IndexModel("wallet_address", unique=True),
            IndexModel([("user_id", 1), ("is_primary", 1)]),
            IndexModel("is_active"),
            IndexModel("linked_at")
        ]

class SIWENonce(Document):
    """SIWE nonce management for wallet verification"""
    
    nonce: Indexed(str, unique=True) = Field(..., description="Unique nonce string")
    wallet_address: str = Field(..., description="Wallet address requesting nonce")
    
    # Timing
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Indexed(datetime) = Field(..., description="Nonce expiration time")
    
    # Usage tracking
    used: bool = Field(default=False, description="Whether nonce has been used")
    used_at: Optional[datetime] = Field(default=None, description="When nonce was used")
    
    # Security
    ip_address: Optional[str] = Field(default=None, description="Client IP address")
    user_agent: Optional[str] = Field(default=None, description="Client user agent")
    
    class Settings:
        name = "siwe_nonces"
        indexes = [
            IndexModel("nonce", unique=True),
            IndexModel("wallet_address"),
            IndexModel("expires_at"),
            IndexModel("used"),
            IndexModel([("expires_at", 1)], expireAfterSeconds=0)  # TTL index
        ]
    
    def is_expired(self) -> bool:
        """Check if nonce is expired"""
        return datetime.now(timezone.utc) > self.expires_at
    
    def mark_used(self):
        """Mark nonce as used"""
        self.used = True
        self.used_at = datetime.now(timezone.utc)

class WalletTransaction(Document):
    """Track wallet transactions related to the platform"""
    
    user_id: str = Field(..., description="User DID")
    wallet_address: str = Field(..., description="Wallet address")
    
    # Transaction details
    tx_hash: Indexed(str, unique=True) = Field(..., description="Transaction hash")
    tx_type: str = Field(..., description="Transaction type (mint, transfer, etc.)")
    
    # Contract interaction
    contract_address: Optional[str] = Field(default=None, description="Smart contract address")
    token_id: Optional[str] = Field(default=None, description="NFT token ID")
    
    # Status
    status: str = Field(default="pending", description="Transaction status")
    block_number: Optional[int] = Field(default=None, description="Block number")
    gas_used: Optional[int] = Field(default=None, description="Gas used")
    gas_price: Optional[str] = Field(default=None, description="Gas price in wei")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = Field(default=None, description="Confirmation timestamp")
    
    # Additional data
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional transaction data")
    
    class Settings:
        name = "wallet_transactions"
        indexes = [
            IndexModel("user_id"),
            IndexModel("wallet_address"),
            IndexModel("tx_hash", unique=True),
            IndexModel("tx_type"),
            IndexModel("status"),
            IndexModel("created_at")
        ]