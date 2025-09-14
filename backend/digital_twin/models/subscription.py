"""
Subscription models for LearnTwinChain platform
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel

class SubscriptionPlan(str, Enum):
    """Available subscription plans"""
    BASIC = "basic"
    PREMIUM = "premium"

class PaymentMethod(str, Enum):
    """Available payment methods"""
    CREDIT_CARD = "credit_card"
    ZALO_PAY = "zalo_pay"
    MOMO = "momo"

class SubscriptionStatus(str, Enum):
    """Subscription status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PENDING = "pending"

class PaymentStatus(str, Enum):
    """Payment status"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class UserSubscription(Document):
    """User subscription document"""
    
    # User reference
    user_id: Indexed(str) = Field(..., description="User DID")
    
    # Subscription details
    plan: SubscriptionPlan = Field(..., description="Subscription plan")
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE, description="Subscription status")
    
    # Billing information
    billing_cycle: str = Field(default="monthly", description="Billing cycle (monthly/yearly)")
    price: float = Field(..., description="Subscription price in VND")
    
    # Dates
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: datetime = Field(..., description="Subscription end date")
    cancelled_at: Optional[datetime] = Field(default=None, description="Cancellation date")
    
    # Payment information
    payment_method: PaymentMethod = Field(..., description="Payment method")
    payment_reference: Optional[str] = Field(default=None, description="Payment gateway reference")
    
    # Features and limits
    features: Dict[str, Any] = Field(default_factory=dict, description="Plan features and limits")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "user_subscriptions"
        indexes = [
            IndexModel("user_id"),
            IndexModel("plan"),
            IndexModel("status"),
            IndexModel("end_date"),
            IndexModel("created_at")
        ]
    
    def is_active(self) -> bool:
        """Check if subscription is active and not expired"""
        now = datetime.now(timezone.utc)
        return (self.status == SubscriptionStatus.ACTIVE and 
                self.end_date > now)
    
    def days_remaining(self) -> int:
        """Get days remaining in subscription"""
        if not self.is_active():
            return 0
        now = datetime.now(timezone.utc)
        delta = self.end_date - now
        return max(0, delta.days)
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)

class PaymentTransaction(Document):
    """Payment transaction document"""
    
    # Transaction identification
    transaction_id: Indexed(str, unique=True) = Field(..., description="Unique transaction ID")
    user_id: Indexed(str) = Field(..., description="User DID")
    subscription_id: Optional[str] = Field(default=None, description="Related subscription ID")
    
    # Payment details
    amount: float = Field(..., description="Payment amount in VND")
    currency: str = Field(default="VND", description="Currency code")
    payment_method: PaymentMethod = Field(..., description="Payment method used")
    
    # Payment gateway information
    gateway_transaction_id: Optional[str] = Field(default=None, description="Gateway transaction ID")
    gateway_response: Optional[Dict[str, Any]] = Field(default=None, description="Gateway response data")
    
    # Status and metadata
    status: PaymentStatus = Field(default=PaymentStatus.PENDING, description="Payment status")
    description: str = Field(..., description="Payment description")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = Field(default=None, description="Completion timestamp")
    
    class Settings:
        name = "payment_transactions"
        indexes = [
            IndexModel("transaction_id", unique=True),
            IndexModel("user_id"),
            IndexModel("subscription_id"),
            IndexModel("status"),
            IndexModel("created_at"),
            IndexModel("gateway_transaction_id")
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)

class SubscriptionFeature(Document):
    """Subscription feature configuration"""
    
    plan: SubscriptionPlan = Field(..., description="Subscription plan")
    feature_name: str = Field(..., description="Feature name")
    feature_value: Any = Field(..., description="Feature value or limit")
    description: str = Field(default="", description="Feature description")
    
    class Settings:
        name = "subscription_features"
        indexes = [
            IndexModel("plan"),
            IndexModel("feature_name")
        ]

class SubscriptionPlanConfig(Document):
    """Subscription plan configuration"""
    
    plan: SubscriptionPlan = Field(..., description="Plan identifier")
    name: str = Field(..., description="Plan display name")
    description: str = Field(..., description="Plan description")
    
    # Pricing
    monthly_price: float = Field(..., description="Monthly price in VND")
    yearly_price: float = Field(..., description="Yearly price in VND")
    currency: str = Field(default="VND", description="Currency code")
    
    # Features
    features: List[str] = Field(default_factory=list, description="Plan features list")
    limits: Dict[str, Any] = Field(default_factory=dict, description="Plan limits")
    
    # Display settings
    is_popular: bool = Field(default=False, description="Mark as popular plan")
    is_active: bool = Field(default=True, description="Plan is active")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "subscription_plans"
        indexes = [
            IndexModel("plan", unique=True),
            IndexModel("is_active"),
            IndexModel("monthly_price"),
            IndexModel("yearly_price")
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now(timezone.utc)
