"""
Notification Service for sending various types of notifications to users
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from .email_service import EmailService
from ..models.user import User

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for handling user notifications"""
    
    def __init__(self):
        self.email_service = EmailService()
    
    async def send_course_completion_notification(
        self, 
        user_id: str, 
        course_title: str, 
        certificate_title: str,
        certificate_type: str
    ) -> Dict[str, Any]:
        """Send notification when user completes a course and earns a certificate"""
        try:
            # Get user information
            user = await User.find_one(User.did == user_id)
            if not user:
                logger.warning(f"User not found for notification: {user_id}")
                return {"success": False, "error": "User not found"}
            
            # Prepare notification data
            notification_data = {
                "user_id": user_id,
                "user_email": user.email,
                "user_name": getattr(user, 'full_name', user.email),
                "course_title": course_title,
                "certificate_title": certificate_title,
                "certificate_type": certificate_type,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Send email notification
            try:
                await self.email_service.send_course_completion_email(
                    to_email=user.email,
                    user_name=notification_data["user_name"],
                    course_title=course_title,
                    certificate_title=certificate_title
                )
                logger.info(f"Course completion email sent to {user.email}")
            except Exception as email_err:
                logger.warning(f"Failed to send course completion email: {email_err}")
            
            # Store notification in database (if needed)
            # This could be stored in a notifications collection for in-app notifications
            
            return {
                "success": True,
                "message": "Course completion notification sent successfully",
                "data": notification_data
            }
            
        except Exception as e:
            logger.error(f"Error sending course completion notification: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_achievement_notification(
        self,
        user_id: str,
        achievement_title: str,
        achievement_type: str,
        points_earned: int = 0
    ) -> Dict[str, Any]:
        """Send notification when user earns an achievement"""
        try:
            # Get user information
            user = await User.find_one(User.did == user_id)
            if not user:
                logger.warning(f"User not found for achievement notification: {user_id}")
                return {"success": False, "error": "User not found"}
            
            # Prepare notification data
            notification_data = {
                "user_id": user_id,
                "user_email": user.email,
                "user_name": getattr(user, 'full_name', user.email),
                "achievement_title": achievement_title,
                "achievement_type": achievement_type,
                "points_earned": points_earned,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Send email notification
            try:
                await self.email_service.send_achievement_email(
                    to_email=user.email,
                    user_name=notification_data["user_name"],
                    achievement_title=achievement_title,
                    points_earned=points_earned
                )
                logger.info(f"Achievement email sent to {user.email}")
            except Exception as email_err:
                logger.warning(f"Failed to send achievement email: {email_err}")
            
            return {
                "success": True,
                "message": "Achievement notification sent successfully",
                "data": notification_data
            }
            
        except Exception as e:
            logger.error(f"Error sending achievement notification: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_certificate_notification(
        self,
        user_id: str,
        certificate_title: str,
        certificate_type: str,
        issuer: str = "LearnTwinChain"
    ) -> Dict[str, Any]:
        """Send notification when user earns a certificate"""
        try:
            # Get user information
            user = await User.find_one(User.did == user_id)
            if not user:
                logger.warning(f"User not found for certificate notification: {user_id}")
                return {"success": False, "error": "User not found"}
            
            # Prepare notification data
            notification_data = {
                "user_id": user_id,
                "user_email": user.email,
                "user_name": getattr(user, 'full_name', user.email),
                "certificate_title": certificate_title,
                "certificate_type": certificate_type,
                "issuer": issuer,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Send email notification
            try:
                await self.email_service.send_certificate_email(
                    to_email=user.email,
                    user_name=notification_data["user_name"],
                    certificate_title=certificate_title,
                    certificate_type=certificate_type,
                    issuer=issuer
                )
                logger.info(f"Certificate email sent to {user.email}")
            except Exception as email_err:
                logger.warning(f"Failed to send certificate email: {email_err}")
            
            return {
                "success": True,
                "message": "Certificate notification sent successfully",
                "data": notification_data
            }
            
        except Exception as e:
            logger.error(f"Error sending certificate notification: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_learning_milestone_notification(
        self,
        user_id: str,
        milestone_title: str,
        milestone_description: str,
        milestone_type: str
    ) -> Dict[str, Any]:
        """Send notification for learning milestones"""
        try:
            # Get user information
            user = await User.find_one(User.did == user_id)
            if not user:
                logger.warning(f"User not found for milestone notification: {user_id}")
                return {"success": False, "error": "User not found"}
            
            # Prepare notification data
            notification_data = {
                "user_id": user_id,
                "user_email": user.email,
                "user_name": getattr(user, 'full_name', user.email),
                "milestone_title": milestone_title,
                "milestone_description": milestone_description,
                "milestone_type": milestone_type,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Send email notification
            try:
                await self.email_service.send_milestone_email(
                    to_email=user.email,
                    user_name=notification_data["user_name"],
                    milestone_title=milestone_title,
                    milestone_description=milestone_description
                )
                logger.info(f"Milestone email sent to {user.email}")
            except Exception as email_err:
                logger.warning(f"Failed to send milestone email: {email_err}")
            
            return {
                "success": True,
                "message": "Milestone notification sent successfully",
                "data": notification_data
            }
            
        except Exception as e:
            logger.error(f"Error sending milestone notification: {e}")
            return {"success": False, "error": str(e)}
