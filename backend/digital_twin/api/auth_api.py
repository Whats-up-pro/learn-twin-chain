"""
Authentication API endpoints with complete RBAC and SIWE support
"""
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Request, Response, Body
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr, Field
import logging

from ..services.auth_service import AuthService
from ..services.siwe_service import SIWEService
from ..services.jwt_service import jwt_service
from ..models.user import User
from ..models.permission import Role, Permission, UserRoleAssignment
from ..dependencies import get_current_user, require_permission, get_optional_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

auth_service = AuthService()
siwe_service = SIWEService()
security = HTTPBearer()

# Available program options
AVAILABLE_PROGRAMS = [
    "Computer Science",
    "Cybersecurity", 
    "Artificial Intelligence",
    "Data Science",
    "Networking",
    "Software Engineering",
    "Information Technology",
    "Digital Marketing",
    "Blockchain Technology",
    "Machine Learning"
]

# Pydantic models
class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username (will be used to create DID)")
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(default="student", description="User role")
    avatar_url: Optional[str] = Field(default="")
    institution: Optional[str] = Field(default="")
    program: str = Field(..., description="Study program")
    birth_year: Optional[int] = Field(default=None, ge=1900, le=2010)
    department: Optional[str] = Field(default="")
    specialization: Optional[list] = Field(default=[])

class UserLoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or DID")
    password: str = Field(..., min_length=1)

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

class SIWENonceRequest(BaseModel):
    wallet_address: str = Field(..., description="Ethereum wallet address")

class SIWEVerifyRequest(BaseModel):
    message: str = Field(..., description="SIWE message")
    signature: str = Field(..., description="SIWE signature")
    wallet_address: str = Field(..., description="Ethereum wallet address")

class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_url: Optional[str] = None
    institution: Optional[str] = None
    program: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[list] = None

class TokenRefreshRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token")

class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

# Authentication endpoints
@router.post("/register")
async def register(request: UserRegisterRequest):
    """Register a new user"""
    try:
        # Validate program
        if request.program not in AVAILABLE_PROGRAMS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid program. Available options: {', '.join(AVAILABLE_PROGRAMS)}"
            )
        
        # Validate username format (alphanumeric and underscore only)
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', request.username):
            raise HTTPException(
                status_code=400,
                detail="Username must contain only letters, numbers, and underscores"
            )
        
        # Generate DID from username
        did = f"did:learntwin:{request.username}"
        
        # Set enrollment date to current date
        enrollment_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Prepare user data
        user_data = request.dict()
        user_data['did'] = did
        user_data['enrollment_date'] = enrollment_date
        
        # Remove username from user_data as it's only used for DID generation
        del user_data['username']
        
        user = await auth_service.register_user(user_data)
        
        return {
            "message": "User registered successfully. Please check your email for verification.",
            "user": user.to_dict(exclude_sensitive=True),
            "did": did,
            "enrollment_date": enrollment_date
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login(request: UserLoginRequest, response: Response, http_request: Request):
    """Login user with email/DID and password"""
    try:
        # Authenticate user
        user = await auth_service.authenticate_user(request.identifier, request.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Get client information
        ip_address = http_request.client.host if http_request.client else None
        user_agent = http_request.headers.get("user-agent")
        
        # Create session
        session = await auth_service.create_session(user.did, ip_address, user_agent)
        
        # Set secure cookie
        response.set_cookie(
            key="session_id",
            value=session.session_id,
            max_age=86400,  # 24 hours
            httponly=True,
            secure=True,  # HTTPS only in production
            samesite="lax"
        )
        
        # Get user permissions
        permissions = await auth_service.get_user_permissions(user.did)
        
        # Create JWT tokens
        token_data = {
            "sub": user.did,
            "user_id": user.did,
            "role": user.role,
            "permissions": permissions,
            "name": user.name,
            "email": user.email
        }
        access_token = jwt_service.create_access_token(token_data)
        
        # Create refresh token
        refresh_token_data = await jwt_service.create_refresh_token(
            user.did, 
            ip_address, 
            user_agent
        )
        
        return {
            "message": "Login successful",
            "user": user.to_dict(exclude_sensitive=True),
            "permissions": permissions,
            "session_id": session.session_id,
            "access_token": access_token,
            "refresh_token": refresh_token_data["token"],
            "token_type": "bearer",
            "expires_in": jwt_service.get_token_expiry()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.post("/logout")
async def logout(response: Response, http_request: Request):
    """Logout user"""
    try:
        session_id = http_request.cookies.get("session_id")
        if session_id:
            await auth_service.invalidate_session(session_id)
        
        # Clear cookie
        response.delete_cookie(key="session_id")
        
        # Invalidate all refresh tokens for the user if we can identify them
        authorization = http_request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            payload = jwt_service.verify_access_token(token)
            if payload:
                user_id = payload.get("sub")
                if user_id:
                    await jwt_service.invalidate_all_user_tokens(user_id)
        
        return {"message": "Logout successful"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"message": "Logout completed"}

@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(request: TokenRefreshRequest):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        refresh_token = await jwt_service.verify_refresh_token(request.refresh_token)
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user
        user = await User.find_one({"did": refresh_token.user_id, "is_active": True})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Get user permissions
        permissions = await auth_service.get_user_permissions(user.did)
        
        # Create new access token
        token_data = {
            "sub": user.did,
            "user_id": user.did,
            "role": user.role,
            "permissions": permissions,
            "name": user.name,
            "email": user.email
        }
        new_access_token = jwt_service.create_access_token(token_data)
        
        # Create new refresh token
        new_refresh_token_data = await jwt_service.create_refresh_token(user.did)
        
        # Invalidate old refresh token
        await jwt_service.invalidate_refresh_token(request.refresh_token)
        
        return TokenRefreshResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token_data["token"],
            token_type="bearer",
            expires_in=jwt_service.get_token_expiry()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    permissions = await auth_service.get_user_permissions(current_user.did)
    wallets = await siwe_service.get_user_wallets(current_user.did)
    
    return {
        "user": current_user.to_dict(exclude_sensitive=True),
        "permissions": permissions,
        "wallets": [{"address": w.wallet_address, "is_primary": w.is_primary} for w in wallets]
    }

@router.put("/me")
async def update_current_user(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update current user information"""
    try:
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        
        for key, value in update_data.items():
            setattr(current_user, key, value)
        
        current_user.update_timestamp()
        await current_user.save()
        
        return {
            "message": "User updated successfully",
            "user": current_user.to_dict(exclude_sensitive=True)
        }
        
    except Exception as e:
        logger.error(f"User update error: {e}")
        raise HTTPException(status_code=500, detail="User update failed")

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    try:
        # Verify current password
        if not auth_service.verify_password(request.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Validate new password
        if not auth_service.validate_password(request.new_password):
            raise HTTPException(
                status_code=400, 
                detail="Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
            )
        
        # Update password
        current_user.password_hash = auth_service.hash_password(request.new_password)
        current_user.update_timestamp()
        await current_user.save()
        
        # Invalidate all sessions except current
        await auth_service.invalidate_all_user_sessions(current_user.did)
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {e}")
        raise HTTPException(status_code=500, detail="Password change failed")

# Email verification
@router.post("/verify-email")
async def verify_email(token: str = Body(..., embed=True)):
    """Verify email address"""
    try:
        success = await auth_service.verify_email(token)
        if success:
            return {"message": "Email verified successfully"}
        else:
            raise HTTPException(status_code=400, detail="Email verification failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        raise HTTPException(status_code=500, detail="Email verification failed")

@router.post("/resend-verification")
async def resend_verification(email: EmailStr = Body(..., embed=True)):
    """Resend email verification"""
    try:
        user = await User.find_one({"email": email, "is_email_verified": False})
        if user:
            # Generate new token
            import secrets
            verification_token = secrets.token_urlsafe(32)
            verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
            
            user.email_verification_token = verification_token
            user.email_verification_expires = verification_expires
            await user.save()
            
            # Send email
            await auth_service.send_verification_email(user.email, user.name, verification_token)
        
        return {"message": "If email exists and is unverified, verification email has been sent"}
        
    except Exception as e:
        logger.error(f"Resend verification error: {e}")
        return {"message": "If email exists and is unverified, verification email has been sent"}

# Password reset
@router.post("/password-reset")
async def request_password_reset(request: PasswordResetRequest):
    """Request password reset"""
    result = await auth_service.request_password_reset(request.email)
    return result

@router.post("/password-reset/confirm")
async def confirm_password_reset(request: PasswordResetConfirm):
    """Confirm password reset"""
    try:
        success = await auth_service.reset_password(request.token, request.new_password)
        if success:
            return {"message": "Password reset successfully"}
        else:
            raise HTTPException(status_code=400, detail="Password reset failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirmation error: {e}")
        raise HTTPException(status_code=500, detail="Password reset failed")

# SIWE (Sign-In with Ethereum) endpoints
@router.post("/siwe/nonce")
async def get_siwe_nonce(request: SIWENonceRequest, http_request: Request):
    """Generate SIWE nonce for wallet authentication"""
    try:
        ip_address = http_request.client.host if http_request.client else None
        user_agent = http_request.headers.get("user-agent")
        
        nonce = await siwe_service.generate_nonce(
            request.wallet_address, 
            ip_address, 
            user_agent
        )
        
        return {"nonce": nonce}
        
    except Exception as e:
        logger.error(f"SIWE nonce generation error: {e}")
        raise HTTPException(status_code=500, detail="Nonce generation failed")

@router.post("/siwe/verify")
async def verify_siwe_signature(request: SIWEVerifyRequest, current_user: User = Depends(get_current_user)):
    """Verify SIWE signature and link wallet to user"""
    try:
        # Verify SIWE signature
        verification_result = await siwe_service.verify_siwe_signature(
            request.message,
            request.signature,
            request.wallet_address
        )
        
        if not verification_result["valid"]:
            raise HTTPException(
                status_code=400, 
                detail=f"SIWE verification failed: {verification_result.get('error', 'Unknown error')}"
            )
        
        # Link wallet to user
        wallet_link = await siwe_service.link_wallet_to_user(
            current_user.did,
            request.wallet_address,
            request.signature,
            request.message,
            verification_result["nonce"]
        )
        
        return {
            "message": "Wallet linked successfully",
            "wallet": {
                "address": wallet_link.wallet_address,
                "is_primary": wallet_link.is_primary,
                "linked_at": wallet_link.linked_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SIWE verification error: {e}")
        raise HTTPException(status_code=500, detail="Wallet linking failed")

@router.delete("/wallets/{wallet_address}")
async def unlink_wallet(wallet_address: str, current_user: User = Depends(get_current_user)):
    """Unlink wallet from user account"""
    try:
        success = await siwe_service.unlink_wallet(current_user.did, wallet_address)
        if success:
            return {"message": "Wallet unlinked successfully"}
        else:
            raise HTTPException(status_code=400, detail="Wallet unlinking failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Wallet unlinking error: {e}")
        raise HTTPException(status_code=500, detail="Wallet unlinking failed")

@router.put("/wallets/{wallet_address}/primary")
async def set_primary_wallet(wallet_address: str, current_user: User = Depends(get_current_user)):
    """Set wallet as primary"""
    try:
        success = await siwe_service.set_primary_wallet(current_user.did, wallet_address)
        if success:
            return {"message": "Primary wallet updated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Primary wallet update failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Primary wallet update error: {e}")
        raise HTTPException(status_code=500, detail="Primary wallet update failed")

# Admin endpoints for user management
@router.get("/users", dependencies=[Depends(require_permission("manage_users"))])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    search: Optional[str] = None
):
    """List users (admin only)"""
    try:
        query = {"is_active": True}
        
        if role:
            query["role"] = role
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"did": {"$regex": search, "$options": "i"}}
            ]
        
        users = await User.find(query).skip(skip).limit(limit).to_list()
        total = await User.count_documents(query)
        
        return {
            "users": [user.to_dict(exclude_sensitive=True) for user in users],
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"User listing error: {e}")
        raise HTTPException(status_code=500, detail="User listing failed")

@router.get("/users/{user_id}", dependencies=[Depends(require_permission("manage_users"))])
async def get_user(user_id: str):
    """Get user by ID (admin only)"""
    try:
        user = await User.find_one({"did": user_id, "is_active": True})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        permissions = await auth_service.get_user_permissions(user_id)
        wallets = await siwe_service.get_user_wallets(user_id)
        
        return {
            "user": user.to_dict(exclude_sensitive=True),
            "permissions": permissions,
            "wallets": [{"address": w.wallet_address, "is_primary": w.is_primary} for w in wallets]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User retrieval error: {e}")
        raise HTTPException(status_code=500, detail="User retrieval failed")

@router.put("/users/{user_id}/role", dependencies=[Depends(require_permission("manage_users"))])
async def update_user_role(
    user_id: str, 
    new_role: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Update user role (admin only)"""
    try:
        user = await User.find_one({"did": user_id, "is_active": True})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if role exists
        role = await Role.find_one({"name": new_role, "is_active": True})
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Update user role
        old_role = user.role
        user.role = new_role
        user.update_timestamp()
        await user.save()
        
        # Update role assignment
        # Remove old role assignment
        await UserRoleAssignment.find({
            "user_id": user_id,
            "role_name": old_role
        }).delete()
        
        # Add new role assignment
        assignment = UserRoleAssignment(
            user_id=user_id,
            role_name=new_role,
            assigned_by=current_user.did,
            assigned_at=datetime.now(timezone.utc)
        )
        await assignment.insert()
        
        return {"message": f"User role updated from {old_role} to {new_role}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User role update error: {e}")
        raise HTTPException(status_code=500, detail="User role update failed")

@router.delete("/users/{user_id}", dependencies=[Depends(require_permission("manage_users"))])
async def deactivate_user(user_id: str):
    """Deactivate user account (admin only)"""
    try:
        user = await User.find_one({"did": user_id, "is_active": True})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Deactivate user
        user.is_active = False
        user.update_timestamp()
        await user.save()
        
        # Invalidate all sessions
        await auth_service.invalidate_all_user_sessions(user_id)
        
        return {"message": "User deactivated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User deactivation error: {e}")
        raise HTTPException(status_code=500, detail="User deactivation failed")

# Session management endpoints
@router.post("/extend-session")
async def extend_session(http_request: Request):
    """Extend current session TTL"""
    try:
        session_id = http_request.cookies.get("session_id")
        if not session_id:
            raise HTTPException(status_code=401, detail="No active session")
        
        # Get session from database
        session = await auth_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Extend session in both Redis and database
        session_expire_hours = int(os.getenv("SESSION_EXPIRE_HOURS", "24"))
        new_expires_at = datetime.now(timezone.utc) + timedelta(hours=session_expire_hours)
        
        # Update database
        session.expires_at = new_expires_at
        session.last_accessed = datetime.now(timezone.utc)
        await session.save()
        
        # Extend Redis session
        await auth_service.redis_service.extend_session(session_id, session_expire_hours * 3600)
        
        return {
            "message": "Session extended successfully",
            "expires_at": new_expires_at.isoformat(),
            "expires_in_hours": session_expire_hours
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session extension error: {e}")
        raise HTTPException(status_code=500, detail="Session extension failed")

@router.get("/session-status")
async def get_session_status(http_request: Request):
    """Get current session status and expiration time"""
    try:
        session_id = http_request.cookies.get("session_id")
        if not session_id:
            return {"authenticated": False, "session_id": None}
        
        # Get session from database
        session = await auth_service.get_session(session_id)
        if not session:
            return {"authenticated": False, "session_id": None}
        
        # Calculate time remaining
        now = datetime.now(timezone.utc)
        expires_at = session.expires_at
        time_remaining_seconds = (expires_at - now).total_seconds()
        
        return {
            "authenticated": True,
            "session_id": session_id,
            "expires_at": expires_at.isoformat(),
            "time_remaining_seconds": max(0, int(time_remaining_seconds)),
            "expires_soon": time_remaining_seconds < 300  # 5 minutes
        }
        
    except Exception as e:
        logger.error(f"Session status check error: {e}")
        return {"authenticated": False, "session_id": None}

# Utility endpoints
@router.get("/programs")
async def get_available_programs():
    """Get list of available study programs"""
    return {
        "programs": AVAILABLE_PROGRAMS,
        "total": len(AVAILABLE_PROGRAMS)
    }