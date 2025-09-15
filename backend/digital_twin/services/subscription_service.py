"""
Subscription service for managing user subscriptions and payments
"""
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from decimal import Decimal

from ..models.subscription import (
    UserSubscription, PaymentTransaction, SubscriptionFeature, 
    SubscriptionPlanConfig, SubscriptionPlan, SubscriptionStatus, 
    PaymentStatus, PaymentMethod
)
from ..models.user import User

logger = logging.getLogger(__name__)

class SubscriptionService:
    """Service for managing user subscriptions"""
    
    def __init__(self):
        self.plan_configs = {
            SubscriptionPlan.BASIC: {
                "name": "Basic Plan",
                "description": "Perfect for beginners learning Web3 and blockchain fundamentals",
                "monthly_price": 299000,  # 299k VND
                "yearly_price": 2990000,  # 2.99M VND (save 20%)
                "features": [
                    "Access to all Beginner courses",
                    "GPT-4o Mini AI tutor access",
                    "Gemini 2.0 Flash AI tutor",
                    "Basic NFT certificates",
                    "Standard video quality (720p)",
                    "Community discussions",
                    "Basic progress tracking",
                    "Mobile app access"
                ],
                "limits": {
                    "max_courses": 50,
                    "max_ai_queries_per_day": 20,
                    "video_quality": "720p",
                    "nft_tier": "basic",
                    "mentoring_sessions": 0,
                    "lab_access": False,
                    "early_access": False,
                    "advanced_features": False
                }
            },
            SubscriptionPlan.PREMIUM: {
                "name": "Premium Plan",
                "description": "Complete Web3 learning experience with advanced features",
                "monthly_price": 799000,  # 799k VND
                "yearly_price": 7990000,  # 7.99M VND (save 20%)
                "features": [
                    "Access to ALL courses (Beginner to Advanced)",
                    "Early access to new courses and features",
                    "GPT-4o AI tutor with advanced mode",
                    "Gemini 2.0 Pro AI tutor",
                    "Premium NFT certificates (rare collectibles)",
                    "4K video quality streaming",
                    "Private mentoring sessions with Web3 experts",
                    "Advanced sandbox lab environment",
                    "NFT trading and marketplace access",
                    "Priority support",
                    "Custom learning paths",
                    "Advanced analytics and insights",
                    "Exclusive community access",
                    "Offline course downloads"
                ],
                "limits": {
                    "max_courses": -1,  # Unlimited
                    "max_ai_queries_per_day": -1,  # Unlimited
                    "video_quality": "4K",
                    "nft_tier": "premium",
                    "mentoring_sessions": 4,  # Per month
                    "lab_access": True,
                    "early_access": True,
                    "advanced_features": True
                }
            }
        }
    
    async def initialize_default_plans(self):
        """Initialize default subscription plans in database"""
        try:
            for plan_type, config in self.plan_configs.items():
                existing_plan = await SubscriptionPlanConfig.find_one(
                    SubscriptionPlanConfig.plan == plan_type
                )
                
                if not existing_plan:
                    plan_config = SubscriptionPlanConfig(
                        plan=plan_type,
                        name=config["name"],
                        description=config["description"],
                        monthly_price=config["monthly_price"],
                        yearly_price=config["yearly_price"],
                        features=config["features"],
                        limits=config["limits"],
                        is_popular=(plan_type == SubscriptionPlan.PREMIUM)
                    )
                    await plan_config.save()
                    logger.info(f"Created default plan: {plan_type}")
                else:
                    # Update existing plan
                    existing_plan.name = config["name"]
                    existing_plan.description = config["description"]
                    existing_plan.monthly_price = config["monthly_price"]
                    existing_plan.yearly_price = config["yearly_price"]
                    existing_plan.features = config["features"]
                    existing_plan.limits = config["limits"]
                    existing_plan.update_timestamp()
                    await existing_plan.save()
                    logger.info(f"Updated plan: {plan_type}")
            
            logger.info("Subscription plans initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize subscription plans: {e}")
            raise
    
    async def get_user_subscription(self, user_id: str) -> Optional[UserSubscription]:
        """Get user's current active subscription"""
        try:
            subscription = await UserSubscription.find_one(
                UserSubscription.user_id == user_id,
                UserSubscription.status == SubscriptionStatus.ACTIVE
            )
            return subscription
        except Exception as e:
            logger.error(f"Failed to get user subscription: {e}")
            return None
    
    async def get_user_subscription_history(self, user_id: str) -> List[UserSubscription]:
        """Get user's subscription history"""
        try:
            subscriptions = await UserSubscription.find(
                UserSubscription.user_id == user_id
            ).sort([("created_at", -1)]).to_list()
            return subscriptions
        except Exception as e:
            logger.error(f"Failed to get subscription history: {e}")
            return []
    
    async def check_feature_access(self, user_id: str, feature: str) -> bool:
        """Check if user has access to a specific feature"""
        try:
            subscription = await self.get_user_subscription(user_id)
            
            if not subscription or not subscription.is_active():
                return False
            
            plan_config = await SubscriptionPlanConfig.find_one(
                SubscriptionPlanConfig.plan == subscription.plan
            )
            
            if not plan_config:
                return False
            
            # Check feature limits
            limits = plan_config.limits
            return limits.get(feature, False)
            
        except Exception as e:
            logger.error(f"Failed to check feature access: {e}")
            return False
    
    async def get_plan_config(self, plan: SubscriptionPlan) -> Optional[SubscriptionPlanConfig]:
        """Get subscription plan configuration"""
        try:
            return await SubscriptionPlanConfig.find_one(
                SubscriptionPlanConfig.plan == plan,
                SubscriptionPlanConfig.is_active == True
            )
        except Exception as e:
            logger.error(f"Failed to get plan config: {e}")
            return None
    
    async def get_all_plans(self) -> List[SubscriptionPlanConfig]:
        """Get all available subscription plans"""
        try:
            return await SubscriptionPlanConfig.find(
                SubscriptionPlanConfig.is_active == True
            ).to_list()
        except Exception as e:
            logger.error(f"Failed to get subscription plans: {e}")
            return []
    
    async def create_subscription(
        self, 
        user_id: str, 
        plan: SubscriptionPlan, 
        billing_cycle: str,
        payment_method: PaymentMethod,
        payment_reference: Optional[str] = None
    ) -> Optional[UserSubscription]:
        """Create a new subscription for user"""
        try:
            # Cancel existing active subscription
            await self.cancel_user_subscription(user_id, "Upgrading to new plan")
            
            # Get plan configuration
            plan_config = await self.get_plan_config(plan)
            if not plan_config:
                raise ValueError(f"Plan {plan} not found or inactive")
            
            # Calculate pricing and duration
            if billing_cycle == "yearly":
                price = plan_config.yearly_price
                duration_days = 365
            else:
                price = plan_config.monthly_price
                duration_days = 30
            
            # Calculate end date
            start_date = datetime.now(timezone.utc)
            end_date = start_date + timedelta(days=duration_days)
            
            # Create subscription
            subscription = UserSubscription(
                user_id=user_id,
                plan=plan,
                billing_cycle=billing_cycle,
                price=price,
                start_date=start_date,
                end_date=end_date,
                payment_method=payment_method,
                payment_reference=payment_reference,
                features=plan_config.limits,
                status=SubscriptionStatus.ACTIVE
            )
            
            await subscription.save()
            logger.info(f"Created subscription for user {user_id}: {plan} ({billing_cycle})")
            return subscription
            
        except Exception as e:
            logger.error(f"Failed to create subscription: {e}")
            return None
    
    async def cancel_user_subscription(self, user_id: str, reason: str = "User cancellation") -> bool:
        """Cancel user's active subscription"""
        try:
            subscription = await self.get_user_subscription(user_id)
            if subscription:
                subscription.status = SubscriptionStatus.CANCELLED
                subscription.cancelled_at = datetime.now(timezone.utc)
                subscription.update_timestamp()
                await subscription.save()
                logger.info(f"Cancelled subscription for user {user_id}: {reason}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to cancel subscription: {e}")
            return False
    
    async def create_payment_transaction(
        self,
        user_id: str,
        amount: float,
        payment_method: PaymentMethod,
        description: str,
        subscription_id: Optional[str] = None,
        gateway_transaction_id: Optional[str] = None
    ) -> Optional[PaymentTransaction]:
        """Create a new payment transaction"""
        try:
            transaction_id = str(uuid.uuid4())
            
            transaction = PaymentTransaction(
                transaction_id=transaction_id,
                user_id=user_id,
                subscription_id=subscription_id,
                amount=amount,
                payment_method=payment_method,
                description=description,
                gateway_transaction_id=gateway_transaction_id,
                status=PaymentStatus.PENDING
            )
            
            await transaction.save()
            logger.info(f"Created payment transaction: {transaction_id}")
            return transaction
            
        except Exception as e:
            logger.error(f"Failed to create payment transaction: {e}")
            return None
    
    async def update_payment_status(
        self, 
        transaction_id: str, 
        status: PaymentStatus,
        gateway_response: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update payment transaction status"""
        try:
            transaction = await PaymentTransaction.find_one(
                PaymentTransaction.transaction_id == transaction_id
            )
            
            if not transaction:
                return False
            
            transaction.status = status
            transaction.gateway_response = gateway_response
            transaction.update_timestamp()
            
            if status == PaymentStatus.COMPLETED:
                transaction.completed_at = datetime.now(timezone.utc)
            
            await transaction.save()
            logger.info(f"Updated payment status: {transaction_id} -> {status}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update payment status: {e}")
            return False
    
    async def get_payment_transaction(self, transaction_id: str) -> Optional[PaymentTransaction]:
        """Get payment transaction by ID"""
        try:
            return await PaymentTransaction.find_one(
                PaymentTransaction.transaction_id == transaction_id
            )
        except Exception as e:
            logger.error(f"Failed to get payment transaction: {e}")
            return None
    
    async def get_user_payment_history(self, user_id: str) -> List[PaymentTransaction]:
        """Get user's payment history"""
        try:
            return await PaymentTransaction.find(
                PaymentTransaction.user_id == user_id
            ).sort([("created_at", -1)]).to_list()
        except Exception as e:
            logger.error(f"Failed to get payment history: {e}")
            return []
    
    async def check_course_access(self, user_id: str, course_id: str) -> bool:
        """Check if user can access a specific course based on subscription"""
        try:
            subscription = await self.get_user_subscription(user_id)
            
            # If no subscription, check if course is free/beginner
            if not subscription or not subscription.is_active():
                # Allow access to free beginner courses
                from ..models.course import Course
                course = await Course.find_one(Course.course_id == course_id)
                if course and course.metadata.get("difficulty_level") == "beginner":
                    return True
                return False
            
            # Premium users have access to all courses
            if subscription.plan == SubscriptionPlan.PREMIUM:
                return True
            
            # Basic users can access beginner and some intermediate courses
            if subscription.plan == SubscriptionPlan.BASIC:
                from ..models.course import Course
                course = await Course.find_one(Course.course_id == course_id)
                if course:
                    difficulty = course.metadata.get("difficulty_level", "beginner")
                    return difficulty in ["beginner", "intermediate"]
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to check course access: {e}")
            return False
    
    async def get_user_plan_info(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user subscription information"""
        try:
            subscription = await self.get_user_subscription(user_id)
            
            if not subscription:
                return {
                    "has_subscription": False,
                    "plan": None,
                    "status": None,
                    "features": {},
                    "limits": {},
                    "days_remaining": 0
                }
            
            plan_config = await self.get_plan_config(subscription.plan)
            
            return {
                "has_subscription": True,
                "plan": subscription.plan,
                "plan_name": plan_config.name if plan_config else subscription.plan,
                "status": subscription.status,
                "features": plan_config.features if plan_config else [],
                "limits": plan_config.limits if plan_config else {},
                "days_remaining": int(subscription.days_remaining()),
                "billing_cycle": subscription.billing_cycle,
                "price": subscription.price,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date
            }
            
        except Exception as e:
            logger.error(f"Failed to get user plan info: {e}")
            return {
                "has_subscription": False,
                "plan": None,
                "status": None,
                "features": {},
                "limits": {},
                "days_remaining": 0
            }
