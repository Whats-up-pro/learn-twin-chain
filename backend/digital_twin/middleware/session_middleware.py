"""
Session middleware to automatically attach session data to req.user
Implements the exact authentication flow:
1. Client sends session cookie automatically with each request
2. Server looks up the session ID in Redis and attaches session data to req.user
"""
import logging
from typing import Optional, Dict, Any
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from ..services.auth_service import AuthService

logger = logging.getLogger(__name__)

class SessionMiddleware(BaseHTTPMiddleware):
    """Middleware to attach session data to req.user for subsequent requests"""
    
    def __init__(self, app):
        super().__init__(app)
        self.auth_service = AuthService()
    
    async def dispatch(self, request: Request, call_next):
        """Process request and attach session data to req.user"""
        try:
            # Initialize req.user attribute
            request.state.user = None
            request.state.session_data = None
            request.state.csrf_token = None
            
            # Check for session cookie
            session_id = request.cookies.get("session_id")
            if session_id:
                # Look up session ID in Redis and get complete session data
                session_data = await self.auth_service.get_session_data(session_id)
                
                if session_data:
                    # Attach session data to req.user (following exact user requirement)
                    request.state.user = {
                        "userID": session_data["userID"],
                        "roles": session_data["roles"],
                        "csrf_token": session_data["csrf_token"],
                        "expiration_time": session_data["expiration_time"],
                        "created_at": session_data.get("created_at"),
                        "ip_address": session_data.get("ip_address"),
                        "user_agent": session_data.get("user_agent")
                    }
                    request.state.session_data = session_data
                    request.state.csrf_token = session_data["csrf_token"]
                    
                    logger.debug(f"Session data attached to req.user for user: {session_data['userID']}")
                else:
                    logger.debug(f"Invalid or expired session: {session_id}")
            else:
                logger.debug("No session cookie found")
            
            # Process the request
            response = await call_next(request)
            
            return response
            
        except Exception as e:
            logger.error(f"Session middleware error: {e}")
            # Continue processing even if session middleware fails
            request.state.user = None
            request.state.session_data = None
            request.state.csrf_token = None
            
            response = await call_next(request)
            return response

def get_session_user(request: Request) -> Optional[Dict[str, Any]]:
    """Helper function to get session user data from request state"""
    return getattr(request.state, 'user', None)

def get_session_data(request: Request) -> Optional[Dict[str, Any]]:
    """Helper function to get complete session data from request state"""
    return getattr(request.state, 'session_data', None)

def get_csrf_token(request: Request) -> Optional[str]:
    """Helper function to get CSRF token from request state"""
    return getattr(request.state, 'csrf_token', None)

def require_session_auth(request: Request) -> Dict[str, Any]:
    """Dependency to require session authentication"""
    user_data = get_session_user(request)
    if not user_data:
        raise HTTPException(
            status_code=401,
            detail="Session authentication required"
        )
    return user_data

def require_csrf_token(request: Request) -> str:
    """Dependency to require and return CSRF token"""
    csrf_token = get_csrf_token(request)
    if not csrf_token:
        raise HTTPException(
            status_code=401,
            detail="CSRF token required"
        )
    return csrf_token
