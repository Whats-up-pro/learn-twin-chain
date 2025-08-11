"""
FastAPI dependencies for authentication and authorization
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer
import logging

from .services.auth_service import AuthService
from .models.user import User

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

auth_service = AuthService()

async def get_current_user(request: Request) -> User:
    """Get current authenticated user"""
    try:
        user = await auth_service.get_current_user(request)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Current user retrieval error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user(request: Request) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    try:
        return await auth_service.get_current_user(request)
    except Exception as e:
        logger.debug(f"Optional user retrieval error: {e}")
        return None

async def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    """Get current user dict if authenticated, None otherwise"""
    try:
        user = await auth_service.get_current_user(request)
        if user:
            try:
                permissions = await auth_service.get_user_permissions(user.did)
            except Exception as perm_error:
                logger.warning(f"Failed to get user permissions: {perm_error}")
                permissions = ["read_own_profile", "read_courses", "read_modules"]  # Default permissions
            
            return {
                "user_id": user.did,
                "email": user.email,
                "role": user.role,
                "permissions": permissions
            }
        return None
    except Exception as e:
        logger.debug(f"Optional user dict retrieval error: {e}")
        return None

def require_permission(permission: str):
    """Dependency factory for permission-based authorization"""
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        has_permission = await auth_service.check_permission(current_user.did, permission)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission}"
            )
        return current_user
    return permission_checker

def require_role(role: str):
    """Dependency factory for role-based authorization"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {role}"
            )
        return current_user
    return role_checker

def require_email_verified():
    """Dependency to ensure user has verified email"""
    async def email_verified_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification required"
            )
        return current_user
    return email_verified_checker

def require_wallet_connected():
    """Dependency to ensure user has connected wallet"""
    async def wallet_connected_checker(current_user: User = Depends(get_current_user)) -> User:
        from .services.siwe_service import SIWEService
        siwe_service = SIWEService()
        
        wallets = await siwe_service.get_user_wallets(current_user.did)
        if not wallets:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Wallet connection required"
            )
        return current_user
    return wallet_connected_checker

async def get_user_permissions(current_user: User = Depends(get_current_user)) -> list[str]:
    """Get current user's permissions"""
    return await auth_service.get_user_permissions(current_user.did)

# Custom dependency combinations
async def require_student(current_user: User = Depends(require_role("student"))) -> User:
    """Require student role"""
    return current_user

async def require_teacher(current_user: User = Depends(require_role("teacher"))) -> User:
    """Require teacher role"""
    return current_user

async def require_admin(current_user: User = Depends(require_role("admin"))) -> User:
    """Require admin role"""
    return current_user

async def require_verified_student(
    current_user: User = Depends(require_email_verified())
) -> User:
    """Require verified student"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student role required"
        )
    return current_user

async def require_connected_student(
    current_user: User = Depends(require_wallet_connected())
) -> User:
    """Require student with connected wallet"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student role required"
        )
    return current_user

# Rate limiting dependency
async def rate_limit_auth(request: Request):
    """Rate limiting for authentication endpoints"""
    from .services.redis_service import RedisService
    
    redis_service = RedisService()
    client_ip = request.client.host if request.client else "unknown"
    
    # Allow 10 auth requests per minute per IP
    allowed = await redis_service.check_rate_limit(f"auth:{client_ip}", 10, 60)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again later."
        )
    
    return True