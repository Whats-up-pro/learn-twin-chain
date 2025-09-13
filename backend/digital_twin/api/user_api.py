"""
User API endpoints for user management and settings
"""
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
import argon2
import pyotp
import qrcode
import io
import base64

from ..models.user import User
from ..models.user_settings import UserSettings
from ..dependencies import get_current_user, require_permission

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/user", tags=["user"])

# Pydantic models for requests/responses
class SettingsUpdateRequest(BaseModel):
    language: Optional[str] = None
    dark_mode: Optional[bool] = None
    notifications: Optional[Dict[str, bool]] = None
    privacy: Optional[Dict[str, Any]] = None
    account: Optional[Dict[str, Any]] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class TwoFactorSetupResponse(BaseModel):
    qr_code: str
    secret: str
    backup_codes: list

class TwoFactorVerifyRequest(BaseModel):
    token: str

class DataExportResponse(BaseModel):
    export_id: str
    estimated_time: str

@router.get("/settings")
async def get_user_settings(current_user: User = Depends(get_current_user)):
    """Get user settings"""
    try:
        settings = await UserSettings.find_one({"user_id": current_user.did})
        
        if not settings:
            # Create default settings if none exist
            settings = UserSettings(
                user_id=current_user.did,
                language="en",
                dark_mode=False,
                notifications={
                    "email": True,
                    "push": True,
                    "nftEarned": True,
                    "courseUpdates": True,
                    "achievements": True,
                },
                privacy={
                    "profileVisibility": "public",
                    "showProgress": True,
                    "showAchievements": True,
                },
                account={
                    "emailNotifications": True,
                    "twoFactorAuth": False,
                    "dataExport": False,
                }
            )
            await settings.save()
        
        return {"settings": settings.to_dict()}
        
    except Exception as e:
        logger.error(f"Failed to get user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve settings")

@router.put("/settings")
async def update_user_settings(
    request: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user settings"""
    try:
        settings = await UserSettings.find_one({"user_id": current_user.did})
        
        if not settings:
            settings = UserSettings(user_id=current_user.did)
        
        # Update fields if provided
        if request.language is not None:
            settings.language = request.language
        if request.dark_mode is not None:
            settings.dark_mode = request.dark_mode
        if request.notifications is not None:
            settings.notifications.update(request.notifications)
        if request.privacy is not None:
            settings.privacy.update(request.privacy)
        if request.account is not None:
            settings.account.update(request.account)
        
        settings.update_timestamp()
        await settings.save()
        
        return {"settings": settings.to_dict()}
        
    except Exception as e:
        logger.error(f"Failed to update user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

@router.put("/settings/{category}")
async def update_setting_category(
    category: str,
    settings_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update specific setting category"""
    try:
        settings = await UserSettings.find_one({"user_id": current_user.did})
        
        if not settings:
            settings = UserSettings(user_id=current_user.did)
        
        # Update specific category
        if category == "notifications":
            settings.notifications.update(settings_data)
        elif category == "privacy":
            settings.privacy.update(settings_data)
        elif category == "account":
            settings.account.update(settings_data)
        else:
            raise HTTPException(status_code=400, detail="Invalid setting category")
        
        settings.update_timestamp()
        await settings.save()
        
        return {"settings": settings.to_dict()}
        
    except Exception as e:
        logger.error(f"Failed to update {category} settings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update {category} settings")

@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    try:
        # Validate current password
        if not argon2.PasswordHasher().verify(current_user.password_hash, request.current_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Validate new password
        if request.new_password != request.confirm_password:
            raise HTTPException(status_code=400, detail="New passwords do not match")
        
        if len(request.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Hash new password
        hasher = argon2.PasswordHasher()
        new_password_hash = hasher.hash(request.new_password)
        
        # Update user
        current_user.password_hash = new_password_hash
        current_user.update_timestamp()
        await current_user.save()
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to change password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

@router.post("/2fa/setup")
async def setup_two_factor(current_user: User = Depends(get_current_user)):
    """Setup two-factor authentication"""
    try:
        # Generate secret
        secret = pyotp.random_base32()
        
        # Create TOTP object
        totp = pyotp.TOTP(secret)
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp.provisioning_uri(
            name=current_user.email,
            issuer_name="Learn Twin Chain"
        ))
        qr.make(fit=True)
        
        # Convert QR code to base64
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code = base64.b64encode(buffer.getvalue()).decode()
        
        # Generate backup codes
        backup_codes = [pyotp.random_base32()[:8].upper() for _ in range(10)]
        
        return TwoFactorSetupResponse(
            qr_code=f"data:image/png;base64,{qr_code}",
            secret=secret,
            backup_codes=backup_codes
        )
        
    except Exception as e:
        logger.error(f"Failed to setup 2FA: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup 2FA")

@router.post("/2fa/verify")
async def verify_two_factor(
    request: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    """Verify and enable two-factor authentication"""
    try:
        # Get settings
        settings = await UserSettings.find_one({"user_id": current_user.did})
        if not settings:
            settings = UserSettings(user_id=current_user.did)
        
        # Verify token (this would need the secret from setup)
        # For now, we'll just enable 2FA
        settings.two_factor_enabled = True
        settings.two_factor_secret = "stored_secret"  # In real implementation, store the secret
        settings.account["twoFactorAuth"] = True
        settings.update_timestamp()
        await settings.save()
        
        return {"message": "2FA enabled successfully"}
        
    except Exception as e:
        logger.error(f"Failed to verify 2FA: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify 2FA")

@router.post("/2fa/disable")
async def disable_two_factor(current_user: User = Depends(get_current_user)):
    """Disable two-factor authentication"""
    try:
        settings = await UserSettings.find_one({"user_id": current_user.did})
        if settings:
            settings.two_factor_enabled = False
            settings.two_factor_secret = None
            settings.two_factor_backup_codes = None
            settings.account["twoFactorAuth"] = False
            settings.update_timestamp()
            await settings.save()
        
        return {"message": "2FA disabled successfully"}
        
    except Exception as e:
        logger.error(f"Failed to disable 2FA: {e}")
        raise HTTPException(status_code=500, detail="Failed to disable 2FA")

@router.post("/data-export")
async def request_data_export(current_user: User = Depends(get_current_user)):
    """Request data export"""
    try:
        # Generate export ID
        export_id = f"export_{current_user.did}_{int(datetime.now().timestamp())}"
        
        # In a real implementation, this would queue a background job
        # For now, we'll just return a mock response
        estimated_time = "24-48 hours"
        
        # Update settings
        settings = await UserSettings.find_one({"user_id": current_user.did})
        if settings:
            settings.last_data_export = datetime.now(timezone.utc)
            settings.data_export_requests.append({
                "export_id": export_id,
                "requested_at": datetime.now(timezone.utc).isoformat(),
                "status": "pending"
            })
            settings.update_timestamp()
            await settings.save()
        
        return DataExportResponse(
            export_id=export_id,
            estimated_time=estimated_time
        )
        
    except Exception as e:
        logger.error(f"Failed to request data export: {e}")
        raise HTTPException(status_code=500, detail="Failed to request data export")

@router.get("/data-export/{export_id}")
async def get_data_export_status(
    export_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get data export status"""
    try:
        settings = await UserSettings.find_one({"user_id": current_user.did})
        
        if not settings or not settings.data_export_requests:
            raise HTTPException(status_code=404, detail="Export request not found")
        
        # Find the export request
        export_request = None
        for req in settings.data_export_requests:
            if req["export_id"] == export_id:
                export_request = req
                break
        
        if not export_request:
            raise HTTPException(status_code=404, detail="Export request not found")
        
        # Mock status - in real implementation, check actual export status
        status = "completed" if export_request["status"] == "pending" else export_request["status"]
        download_url = f"/api/v1/user/data-export/{export_id}/download" if status == "completed" else None
        
        return {
            "status": status,
            "download_url": download_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get export status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get export status")

@router.put("/notifications")
async def update_notification_preferences(
    notifications: Dict[str, bool],
    current_user: User = Depends(get_current_user)
):
    """Update notification preferences"""
    try:
        settings = await UserSettings.find_one({"user_id": current_user.did})
        if not settings:
            settings = UserSettings(user_id=current_user.did)
        
        settings.notifications.update(notifications)
        settings.update_timestamp()
        await settings.save()
        
        return {"message": "Notification preferences updated"}
        
    except Exception as e:
        logger.error(f"Failed to update notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification preferences")

@router.put("/privacy")
async def update_privacy_settings(
    privacy: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update privacy settings"""
    try:
        settings = await UserSettings.find_one({"user_id": current_user.did})
        if not settings:
            settings = UserSettings(user_id=current_user.did)
        
        settings.privacy.update(privacy)
        settings.update_timestamp()
        await settings.save()
        
        return {"message": "Privacy settings updated"}
        
    except Exception as e:
        logger.error(f"Failed to update privacy settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update privacy settings")
