"""
Subscription API endpoints
"""
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from ..services.subscription_service import SubscriptionService
from ..services.payment_service import PaymentService
from ..models.user import User
from ..models.subscription import (
    SubscriptionPlan, PaymentMethod, SubscriptionStatus, 
    PaymentStatus
)
from ..dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscription", tags=["subscription"])

subscription_service = SubscriptionService()
payment_service = PaymentService()

# Pydantic models
class SubscriptionCreateRequest(BaseModel):
    plan: SubscriptionPlan = Field(..., description="Subscription plan")
    billing_cycle: str = Field(..., description="Billing cycle (monthly/yearly)")
    payment_method: PaymentMethod = Field(..., description="Payment method")

class PaymentWebhookRequest(BaseModel):
    payment_method: PaymentMethod = Field(..., description="Payment method")
    transaction_id: Optional[str] = Field(None, description="Transaction ID")
    gateway_data: Dict[str, Any] = Field(..., description="Gateway webhook data")

class SubscriptionUpdateRequest(BaseModel):
    plan: Optional[SubscriptionPlan] = Field(None, description="New plan")
    billing_cycle: Optional[str] = Field(None, description="New billing cycle")

@router.get("/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    try:
        plans = await subscription_service.get_all_plans()
        
        plans_data = []
        for plan in plans:
            plan_dict = plan.dict()
            plans_data.append({
                "plan": plan_dict["plan"],
                "name": plan_dict["name"],
                "description": plan_dict["description"],
                "monthly_price": plan_dict["monthly_price"],
                "yearly_price": plan_dict["yearly_price"],
                "currency": plan_dict["currency"],
                "features": plan_dict["features"],
                "limits": plan_dict["limits"],
                "is_popular": plan_dict["is_popular"],
                "yearly_discount": round((1 - plan_dict["yearly_price"] / (plan_dict["monthly_price"] * 12)) * 100)
            })
        
        return {
            "success": True,
            "plans": plans_data
        }
        
    except Exception as e:
        logger.error(f"Failed to get subscription plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription plans")

@router.get("/current")
async def get_current_subscription(current_user: User = Depends(get_current_user)):
    """Get user's current subscription"""
    try:
        subscription_info = await subscription_service.get_user_plan_info(current_user.did)
        
        return {
            "success": True,
            "subscription": subscription_info
        }
        
    except Exception as e:
        logger.error(f"Failed to get current subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to get current subscription")

@router.get("/history")
async def get_subscription_history(current_user: User = Depends(get_current_user)):
    """Get user's subscription history"""
    try:
        subscriptions = await subscription_service.get_user_subscription_history(current_user.did)
        
        history_data = []
        for subscription in subscriptions:
            sub_dict = subscription.dict()
            history_data.append({
                "id": str(subscription.id),
                "plan": sub_dict["plan"],
                "status": sub_dict["status"],
                "billing_cycle": sub_dict["billing_cycle"],
                "price": sub_dict["price"],
                "start_date": sub_dict["start_date"],
                "end_date": sub_dict["end_date"],
                "cancelled_at": sub_dict["cancelled_at"],
                "payment_method": sub_dict["payment_method"],
                "created_at": sub_dict["created_at"]
            })
        
        return {
            "success": True,
            "history": history_data
        }
        
    except Exception as e:
        logger.error(f"Failed to get subscription history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription history")

@router.post("/create")
async def create_subscription(
    request: SubscriptionCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new subscription"""
    try:
        # Get plan configuration
        plan_config = await subscription_service.get_plan_config(request.plan)
        if not plan_config:
            raise HTTPException(status_code=400, detail=f"Plan {request.plan} not found")
        
        # Calculate price
        if request.billing_cycle == "yearly":
            price = plan_config.yearly_price
        else:
            price = plan_config.monthly_price
        
        # Create payment transaction
        transaction = await subscription_service.create_payment_transaction(
            user_id=current_user.did,
            amount=price,
            payment_method=request.payment_method,
            description=f"{plan_config.name} - {request.billing_cycle} subscription"
        )
        
        if not transaction:
            raise HTTPException(status_code=500, detail="Failed to create payment transaction")
        
        # Create payment request with gateway
        user_info = {
            "email": current_user.email,
            "name": current_user.name,
            "user_id": current_user.did
        }
        
        return_url = f"/subscription/payment/success?transaction_id={transaction.transaction_id}"
        
        payment_result = await payment_service.create_payment_request(
            transaction_id=transaction.transaction_id,
            amount=price,
            payment_method=request.payment_method,
            description=f"{plan_config.name} - {request.billing_cycle} subscription",
            return_url=return_url,
            user_info=user_info
        )
        
        if not payment_result.get("success"):
            raise HTTPException(status_code=400, detail=payment_result.get("error", "Payment creation failed"))
        
        # Update transaction with gateway info
        await subscription_service.update_payment_status(
            transaction_id=transaction.transaction_id,
            status=PaymentStatus.PENDING,
            gateway_response=payment_result
        )
        
        return {
            "success": True,
            "payment_url": payment_result.get("payment_url"),
            "transaction_id": transaction.transaction_id,
            "amount": price,
            "currency": "VND"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription")

@router.post("/payment/webhook")
async def handle_payment_webhook(
    request: PaymentWebhookRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Handle payment webhook from gateway"""
    try:
        webhook_result = await payment_service.handle_payment_webhook(
            payment_method=request.payment_method,
            webhook_data=request.gateway_data
        )
        
        if not webhook_result.get("success"):
            return {"success": False, "error": webhook_result.get("error")}
        
        transaction_id = webhook_result.get("transaction_id")
        gateway_transaction_id = webhook_result.get("gateway_transaction_id")
        
        if not transaction_id:
            return {"success": False, "error": "Transaction ID not found in webhook"}
        
        # Update payment status
        await subscription_service.update_payment_status(
            transaction_id=transaction_id,
            status=PaymentStatus.COMPLETED,
            gateway_response=request.gateway_data
        )
        
        # Get transaction details
        transaction = await subscription_service.get_payment_transaction(transaction_id)
        if not transaction:
            return {"success": False, "error": "Transaction not found"}
        
        # Create subscription if payment is completed
        if webhook_result.get("status") == "completed":
            # Extract subscription details from transaction description
            description_parts = transaction.description.split(" - ")
            if len(description_parts) >= 2:
                plan_name = description_parts[0]
                billing_cycle = description_parts[1].split(" ")[0]  # Extract "monthly" or "yearly"
                
                # Map plan name to plan enum
                plan = None
                if "Basic" in plan_name:
                    plan = SubscriptionPlan.BASIC
                elif "Premium" in plan_name:
                    plan = SubscriptionPlan.PREMIUM
                
                if plan:
                    subscription = await subscription_service.create_subscription(
                        user_id=transaction.user_id,
                        plan=plan,
                        billing_cycle=billing_cycle,
                        payment_method=transaction.payment_method,
                        payment_reference=gateway_transaction_id
                    )
                    
                    if subscription:
                        return {
                            "success": True,
                            "message": "Payment processed and subscription created successfully",
                            "subscription_id": str(subscription.id)
                        }
        
        return {
            "success": True,
            "message": "Payment processed successfully"
        }
        
    except Exception as e:
        logger.error(f"Payment webhook handling failed: {e}")
        raise HTTPException(status_code=500, detail="Payment webhook handling failed")

@router.get("/payment/status/{transaction_id}")
async def get_payment_status(
    transaction_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get payment transaction status"""
    try:
        transaction = await subscription_service.get_payment_transaction(transaction_id)
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if transaction.user_id != current_user.did:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "transaction": {
                "id": transaction.transaction_id,
                "amount": transaction.amount,
                "currency": transaction.currency,
                "payment_method": transaction.payment_method,
                "status": transaction.status,
                "description": transaction.description,
                "created_at": transaction.created_at,
                "completed_at": transaction.completed_at
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get payment status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get payment status")

@router.post("/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_user)):
    """Cancel user's current subscription"""
    try:
        success = await subscription_service.cancel_user_subscription(
            user_id=current_user.did,
            reason="User requested cancellation"
        )
        
        if success:
            return {
                "success": True,
                "message": "Subscription cancelled successfully"
            }
        else:
            return {
                "success": False,
                "message": "No active subscription found to cancel"
            }
        
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")

@router.get("/features")
async def get_user_features(current_user: User = Depends(get_current_user)):
    """Get user's available features based on subscription"""
    try:
        subscription_info = await subscription_service.get_user_plan_info(current_user.did)
        
        return {
            "success": True,
            "features": subscription_info.get("features", []),
            "limits": subscription_info.get("limits", {}),
            "plan": subscription_info.get("plan"),
            "has_subscription": subscription_info.get("has_subscription", False)
        }
        
    except Exception as e:
        logger.error(f"Failed to get user features: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user features")

@router.get("/check-access/{course_id}")
async def check_course_access(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if user can access a specific course"""
    try:
        has_access = await subscription_service.check_course_access(
            user_id=current_user.did,
            course_id=course_id
        )
        
        return {
            "success": True,
            "has_access": has_access,
            "course_id": course_id
        }
        
    except Exception as e:
        logger.error(f"Failed to check course access: {e}")
        raise HTTPException(status_code=500, detail="Failed to check course access")

@router.get("/payment-history")
async def get_payment_history(current_user: User = Depends(get_current_user)):
    """Get user's payment history"""
    try:
        payments = await subscription_service.get_user_payment_history(current_user.did)
        
        payment_data = []
        for payment in payments:
            payment_dict = payment.dict()
            payment_data.append({
                "id": payment_dict["transaction_id"],
                "amount": payment_dict["amount"],
                "currency": payment_dict["currency"],
                "payment_method": payment_dict["payment_method"],
                "status": payment_dict["status"],
                "description": payment_dict["description"],
                "created_at": payment_dict["created_at"],
                "completed_at": payment_dict["completed_at"]
            })
        
        return {
            "success": True,
            "payments": payment_data
        }
        
    except Exception as e:
        logger.error(f"Failed to get payment history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get payment history")
