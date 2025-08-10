"""
Authentication service with Argon2 password hashing, email verification, and session management
"""
import os
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple, List
from passlib.context import CryptContext
from passlib.hash import argon2
import jwt
from jwt import InvalidTokenError as JWTError
import redis.asyncio as redis
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Request
import logging

from ..models.user import User, UserProfile
from ..models.session import UserSession, RefreshToken
from ..models.permission import Role, Permission, UserRoleAssignment
from .email_service import EmailService
from .redis_service import RedisService

logger = logging.getLogger(__name__)

# Password hashing context with Argon2
pwd_context = CryptContext(
    schemes=["argon2"], 
    deprecated="auto",
    argon2__memory_cost=65536,  # 64 MB
    argon2__time_cost=3,        # 3 iterations
    argon2__parallelism=1       # Single thread
)

security = HTTPBearer()

class AuthenticationError(Exception):
    """Custom authentication error"""
    pass

class AuthService:
    """Complete authentication service"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.redis_service = RedisService()
        self.jwt_secret = os.getenv("JWT_SECRET_KEY", "your-secret-key")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        self.session_expire_hours = int(os.getenv("SESSION_EXPIRE_HOURS", "24"))
        
    # Password management
    def hash_password(self, password: str) -> str:
        """Hash password using Argon2"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def validate_password(self, password: str) -> bool:
        """Validate password strength"""
        if len(password) < 8:
            return False
        
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        return sum([has_upper, has_lower, has_digit, has_special]) >= 3
    
    # User registration
    async def register_user(self, user_data: Dict[str, Any]) -> User:
        """Register a new user with email verification"""
        try:
            # Check if user already exists
            existing_user = await User.find_one({"$or": [{"email": user_data["email"]}, {"did": user_data["did"]}]})
            if existing_user:
                if existing_user.email == user_data["email"]:
                    raise HTTPException(status_code=400, detail="Email already registered")
                else:
                    raise HTTPException(status_code=400, detail="DID already exists")
            
            # Validate password
            if not self.validate_password(user_data["password"]):
                raise HTTPException(
                    status_code=400, 
                    detail="Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
                )
            
            # Hash password
            password_hash = self.hash_password(user_data["password"])
            
            # Generate email verification token
            verification_token = secrets.token_urlsafe(32)
            verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
            
            # Create user with default role "student"
            user = User(
                did=user_data["did"],
                email=user_data["email"],
                password_hash=password_hash,
                name=user_data["name"],
                role="student",  # Always default to student
                avatar_url=user_data.get("avatar_url", ""),
                institution=user_data.get("institution", ""),
                program=user_data.get("program", ""),
                birth_year=user_data.get("birth_year"),
                enrollment_date=user_data.get("enrollment_date"),
                department=user_data.get("department", ""),
                specialization=user_data.get("specialization", []),
                email_verification_token=verification_token,
                email_verification_expires=verification_expires,
                is_email_verified=False
            )
            
            await user.insert()
            
            # Create user profile - TEMPORARILY DISABLED due to Beanie initialization issue
            # TODO: Fix UserProfile initialization in database setup
            # profile = UserProfile(user_id=user.did)
            # await profile.insert()
            
            # Assign default role "student"
            await self.assign_default_role(user.did, "student")
            
            # Send verification email
            await self.send_verification_email(user.email, user.name, verification_token)
            
            logger.info(f"User registered successfully: {user.did}")
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration error: {e}")
            raise HTTPException(status_code=500, detail="Registration failed")
    
    # Email verification
    async def send_verification_email(self, email: str, name: str, token: str):
        """Send email verification"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        # Use normal routing (no hash router)
        verification_url = f"{frontend_url}/verify-email?token={token}"
        
        await self.email_service.send_verification_email(email, name, verification_url)
    
    async def verify_email(self, token: str) -> bool:
        """Verify email with token"""
        try:
            user = await User.find_one({
                "email_verification_token": token,
                "email_verification_expires": {"$gt": datetime.now(timezone.utc)}
            })
            
            if not user:
                raise HTTPException(status_code=400, detail="Invalid or expired verification token")
            
            user.is_email_verified = True
            user.email_verification_token = None
            user.email_verification_expires = None
            user.update_timestamp()
            
            await user.save()
            
            logger.info(f"Email verified for user: {user.did}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Email verification error: {e}")
            raise HTTPException(status_code=500, detail="Email verification failed")
    
    # Password reset
    async def request_password_reset(self, email: str):
        """Request password reset"""
        try:
            user = await User.find_one({"email": email})
            if not user:
                # Don't reveal if email exists
                return {"message": "If email exists, reset link has been sent"}
            
            reset_token = secrets.token_urlsafe(32)
            reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
            
            user.password_reset_token = reset_token
            user.password_reset_expires = reset_expires
            user.update_timestamp()
            
            await user.save()
            
            # Send reset email
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            # Use normal routing (no hash router)
            reset_url = f"{frontend_url}/reset-password?token={reset_token}"
            
            await self.email_service.send_password_reset_email(user.email, user.name, reset_url)
            
            return {"message": "If email exists, reset link has been sent"}
            
        except Exception as e:
            logger.error(f"Password reset request error: {e}")
            return {"message": "If email exists, reset link has been sent"}
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password with token"""
        try:
            user = await User.find_one({
                "password_reset_token": token,
                "password_reset_expires": {"$gt": datetime.now(timezone.utc)}
            })
            
            if not user:
                raise HTTPException(status_code=400, detail="Invalid or expired reset token")
            
            if not self.validate_password(new_password):
                raise HTTPException(
                    status_code=400, 
                    detail="Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
                )
            
            user.password_hash = self.hash_password(new_password)
            user.password_reset_token = None
            user.password_reset_expires = None
            user.update_timestamp()
            
            await user.save()
            
            # Invalidate all sessions
            await self.invalidate_all_user_sessions(user.did)
            
            logger.info(f"Password reset successfully for user: {user.did}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Password reset error: {e}")
            raise HTTPException(status_code=500, detail="Password reset failed")
    
    # Authentication
    async def authenticate_user(self, identifier: str, password: str) -> Optional[User]:
        """Authenticate user by email/DID and password"""
        try:
            # Find user by email or DID
            user = await User.find_one({
                "$or": [{"email": identifier}, {"did": identifier}],
                "is_active": True
            })
            
            if not user or not self.verify_password(password, user.password_hash):
                return None
            
            if not user.is_email_verified:
                raise HTTPException(status_code=400, detail="Email not verified")
            
            # Update last login
            user.last_login = datetime.now(timezone.utc)
            user.update_timestamp()
            await user.save()
            
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None
    
    # Session management
    async def create_session(self, user_id: str, ip_address: str = None, user_agent: str = None) -> UserSession:
        """Create a new user session"""
        try:
            session_id = str(uuid.uuid4())
            expires_at = datetime.now(timezone.utc) + timedelta(hours=self.session_expire_hours)
            
            session = UserSession(
                session_id=session_id,
                user_id=user_id,
                expires_at=expires_at,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            await session.insert()
            
            # Store in Redis for fast lookup
            await self.redis_service.set_session(session_id, user_id, self.session_expire_hours * 3600)
            
            logger.info(f"Session created for user: {user_id}")
            return session
            
        except Exception as e:
            logger.error(f"Session creation error: {e}")
            raise HTTPException(status_code=500, detail="Session creation failed")
    
    async def get_session(self, session_id: str) -> Optional[UserSession]:
        """Get session by ID"""
        try:
            # Check Redis first
            user_id = await self.redis_service.get_session(session_id)
            if user_id:
                # Get full session from database
                session = await UserSession.find_one({
                    "session_id": session_id,
                    "is_active": True
                })
                
                if session:
                    # Ensure expires_at has timezone info
                    expires_at = session.expires_at
                    if expires_at.tzinfo is None:
                        expires_at = expires_at.replace(tzinfo=timezone.utc)
                        session.expires_at = expires_at
                    
                    # Check if expired
                    if expires_at > datetime.now(timezone.utc):
                        # Update last accessed
                        session.last_accessed = datetime.now(timezone.utc)
                        await session.save()
                        return session
            
            return None
            
        except Exception as e:
            logger.error(f"Session retrieval error: {e}")
            return None
    
    async def invalidate_session(self, session_id: str):
        """Invalidate a session"""
        try:
            # Remove from Redis
            await self.redis_service.delete_session(session_id)
            
            # Update database
            session = await UserSession.find_one({"session_id": session_id})
            if session:
                session.revoke("manual_logout")
                await session.save()
            
            logger.info(f"Session invalidated: {session_id}")
            
        except Exception as e:
            logger.error(f"Session invalidation error: {e}")
    
    async def invalidate_all_user_sessions(self, user_id: str):
        """Invalidate all sessions for a user"""
        try:
            sessions = await UserSession.find({"user_id": user_id, "is_active": True}).to_list()
            
            for session in sessions:
                await self.redis_service.delete_session(session.session_id)
                session.revoke("password_reset")
                await session.save()
            
            logger.info(f"All sessions invalidated for user: {user_id}")
            
        except Exception as e:
            logger.error(f"Session invalidation error: {e}")
    
    # JWT token management (alternative to sessions)

    
    # Role and permission management
    async def assign_default_role(self, user_id: str, role_name: str = "student"):
        """Assign default role to user"""
        try:
            # Check if role exists
            role = await Role.find_one({"name": role_name, "is_active": True})
            if not role:
                # Create default role if it doesn't exist
                await self.create_default_roles()
                role = await Role.find_one({"name": role_name})
            
            # Check if assignment already exists
            existing = await UserRoleAssignment.find_one({"user_id": user_id, "role_name": role_name})
            if existing:
                return
            
            assignment = UserRoleAssignment(
                user_id=user_id,
                role_name=role_name,
                assigned_by="system",
                assigned_at=datetime.now(timezone.utc)
            )
            
            await assignment.insert()
            logger.info(f"Role {role_name} assigned to user: {user_id}")
            
        except Exception as e:
            logger.error(f"Role assignment error: {e}")
    
    async def get_user_permissions(self, user_id: str) -> List[str]:
        """Get all permissions for a user"""
        try:
            # Get user's role assignments
            assignments = await UserRoleAssignment.find({
                "user_id": user_id,
                "is_active": True,
                "$or": [
                    {"expires_at": None},
                    {"expires_at": {"$gt": datetime.now(timezone.utc)}}
                ]
            }).to_list()
            
            permissions = set()
            
            # If no role assignments, assign default student role
            if not assignments:
                await self.assign_default_role(user_id, "student")
                # Get the assignment we just created
                assignments = await UserRoleAssignment.find({
                    "user_id": user_id,
                    "is_active": True
                }).to_list()
            
            for assignment in assignments:
                role = await Role.find_one({"name": assignment.role_name, "is_active": True})
                if role:
                    permissions.update(role.permissions)
            
            # Get user's direct permissions
            user = await User.find_one({"did": user_id})
            if user and hasattr(user, 'permissions') and user.permissions:
                permissions.update(user.permissions)
            
            return list(permissions)
            
        except Exception as e:
            logger.error(f"Permission retrieval error: {e}")
            # Return basic permissions as fallback
            return ["read_own_profile", "read_courses", "read_modules"]
    
    async def check_permission(self, user_id: str, permission: str) -> bool:
        """Check if user has specific permission"""
        permissions = await self.get_user_permissions(user_id)
        return permission in permissions
    
    async def create_default_roles(self):
        """Create default roles and permissions"""
        try:
            from ..models.permission import DEFAULT_PERMISSIONS, DEFAULT_ROLES
            
            # Create permissions
            for perm_data in DEFAULT_PERMISSIONS:
                existing = await Permission.find_one({"name": perm_data["name"]})
                if not existing:
                    permission = Permission(**perm_data)
                    await permission.insert()
            
            # Create roles
            for role_data in DEFAULT_ROLES:
                existing = await Role.find_one({"name": role_data["name"]})
                if not existing:
                    role = Role(**role_data)
                    await role.insert()
            
            logger.info("Default roles and permissions created")
            
        except Exception as e:
            logger.error(f"Default role creation error: {e}")
    
    # User management
    async def get_current_user(self, request: Request) -> Optional[User]:
        """Get current user from session or token"""
        try:
            # Try session-based auth first
            session_id = request.cookies.get("session_id")
            if session_id:
                session = await self.get_session(session_id)
                if session:
                    user = await User.find_one({"did": session.user_id, "is_active": True})
                    return user
            
            # Try JWT auth
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ")[1]
                from .jwt_service import jwt_service
                payload = jwt_service.verify_access_token(token)
                if payload:
                    user_id = payload.get("sub")
                    user = await User.find_one({"did": user_id, "is_active": True})
                    return user
            
            return None
            
        except Exception as e:
            logger.error(f"Current user retrieval error: {e}")
            return None