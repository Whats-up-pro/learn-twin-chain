"""
Enhanced LearnTwinChain main application with complete authentication and RBAC
"""
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from datetime import datetime
import sys

# Add backend directory to Python path for RAG imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import API routers
from digital_twin.api.auth_api import router as auth_router
from digital_twin.api.course_api import router as course_router
from digital_twin.api.lesson_api import router as lesson_router
from digital_twin.api.quiz_api import router as quiz_router
from digital_twin.api.achievement_api import router as achievement_router
from digital_twin.api.twin_api import router as twin_router
from digital_twin.api.learning_api import router as learning_router
from digital_twin.api.analytics_api import router as analytics_router
from digital_twin.api.blockchain_api import router as blockchain_router
from digital_twin.api.ipfs_api import router as ipfs_router
from digital_twin.api.zkp_api import router as zkp_router
from digital_twin.api.gemini_api import router as gemini_router
from digital_twin.api.user_api import router as user_router
from digital_twin.api.discussion_api import router as discussion_router
from digital_twin.api.video_settings_api import router as video_settings_router
from digital_twin.api.search_api import router as search_router
from digital_twin.api.subscription_api import router as subscription_router

# Import configuration and services
from .config.config import config
from .config.database import connect_to_mongo, close_mongo_connection
from .services.auth_service import AuthService
from .services.redis_service import RedisService
from .services.subscription_service import SubscriptionService
from .middleware import SessionMiddleware
from .utils import Logger

# Legacy imports for backward compatibility
from digital_twin.services.learning_service import LearningService
from digital_twin.services.analytics_service import AnalyticsService

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Initialize logger
logger = Logger("main")

# Initialize services
auth_service = AuthService()
redis_service = RedisService()
subscription_service = SubscriptionService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    try:
        # Startup
        logger.info("Starting LearnTwinChain application...")
        
        # Connect to MongoDB
        await connect_to_mongo()
        logger.info("MongoDB connected")
        
        # Connect to Redis
        await redis_service.connect()
        logger.info("Redis connected")
        
        # Create default roles and permissions
        await auth_service.create_default_roles()
        logger.info("Default roles and permissions created")
        
        # Initialize subscription plans
        await subscription_service.initialize_default_plans()
        logger.info("Subscription plans initialized")
        
        logger.info("Application startup completed successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        raise
    finally:
        # Shutdown
        logger.info("Shutting down application...")
        
        try:
            # Close MongoDB connection
            await close_mongo_connection()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"MongoDB shutdown error: {e}")
        
        try:
            # Close Redis connection
            await redis_service.disconnect()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Redis shutdown error: {e}")
        
        logger.info("Application shutdown completed")

# Initialize FastAPI app
app = FastAPI(
    title="LearnTwinChain API",
    description="Enhanced Digital Twin-based Learning Platform with Blockchain Integration and Complete Authentication",
    version="2.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    lifespan=lifespan
)

# Configure CORS
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:5180").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add Session middleware to automatically attach session data to req.user
app.add_middleware(SessionMiddleware)

# Include API routers
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])
app.include_router(course_router, prefix="/api/v1", tags=["Courses"])
app.include_router(lesson_router, prefix="/api/v1", tags=["Lessons"])
app.include_router(quiz_router, prefix="/api/v1", tags=["Quizzes"])
app.include_router(achievement_router, prefix="/api/v1", tags=["Achievements"])
app.include_router(twin_router, prefix="/api/v1", tags=["Digital Twins"])
app.include_router(learning_router, prefix="/api/v1", tags=["Learning"])
app.include_router(analytics_router, prefix="/api/v1", tags=["Analytics"])
app.include_router(blockchain_router, prefix="/api/v1", tags=["Blockchain"])
app.include_router(ipfs_router, prefix="/api/v1", tags=["IPFS"])
app.include_router(zkp_router, prefix="/api/v1", tags=["Zero-Knowledge Proofs"])
app.include_router(gemini_router, prefix="/api/v1", tags=["AI/Gemini"])
app.include_router(user_router, prefix="/api/v1", tags=["User Management"])
app.include_router(discussion_router, prefix="/api/v1", tags=["Discussions"])
app.include_router(video_settings_router, prefix="/api/v1", tags=["Video Settings"])
app.include_router(subscription_router, prefix="/api/v1", tags=["Subscription"])
app.include_router(search_router, prefix="/api/v1", tags=["Search"])

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "LearnTwinChain Digital Twin Learning Platform",
        "version": "2.0.0",
        "description": "Complete authentication system with RBAC, SIWE wallet linking, and hybrid digital twin storage",
        "features": [
            "Complete Authentication with Argon2 password hashing",
            "Email verification and password reset",
            "Session-based authentication with Redis",
            "SIWE (Sign-In with Ethereum) wallet linking",
            "Role-Based Access Control (RBAC)",
            "Hybrid Digital Twin storage (MongoDB + IPFS + blockchain)",
            "Course and module management with IPFS content storage",
            "NFT-based learning certificates",
            "Zero-Knowledge Proof integration",
            "Learning analytics and AI insights"
        ],
        "authentication": {
            "login": "/api/v1/auth/login",
            "register": "/api/v1/auth/register",
            "verify_email": "/api/v1/auth/verify-email",
            "siwe_nonce": "/api/v1/auth/siwe/nonce",
            "siwe_verify": "/api/v1/auth/siwe/verify"
        },
        "endpoints": {
            "docs": "/api/v1/docs",
            "redoc": "/api/v1/redoc",
            "openapi": "/api/v1/openapi.json",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "services": {
                "api": "active"
            }
        }
        
        # Check MongoDB
        try:
            from .config.database import get_client
            mongo_client = get_client()
            if mongo_client:
                await mongo_client.admin.command('ping')
                health_status["services"]["mongodb"] = "active"
            else:
                health_status["services"]["mongodb"] = "not_configured"
        except Exception as e:
            health_status["services"]["mongodb"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        # Check Redis
        try:
            redis_healthy = await redis_service.health_check()
            health_status["services"]["redis"] = "active" if redis_healthy else "error"
            if not redis_healthy:
                health_status["status"] = "degraded"
        except Exception as e:
            health_status["services"]["redis"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        # Check IPFS
        try:
            from .services.ipfs_service import IPFSService
            ipfs_service = IPFSService()
            ipfs_health = await ipfs_service.health_check()
            health_status["services"]["ipfs"] = ipfs_health
        except Exception as e:
            health_status["services"]["ipfs"] = f"error: {str(e)}"
        
        # Basic blockchain check
        health_status["services"]["blockchain"] = "configured"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@app.get("/api/v1/info")
async def api_info():
    """API information endpoint"""
    return {
        "api_version": "2.0.0",
        "features": {
            "authentication": {
                "password_hashing": "Argon2",
                "email_verification": True,
                "password_reset": True,
                "session_management": "Redis-based",
                "wallet_linking": "SIWE (EIP-4361)",
                "rbac": True
            },
            "storage": {
                "database": "MongoDB with Beanie ODM",
                "ipfs": "Hybrid (Pinata/Web3.Storage/Local)",
                "blockchain": "Polygon Amoy/Sepolia testnet",
                "caching": "Redis"
            },
            "learning": {
                "digital_twins": "Hybrid storage",
                "courses": "IPFS content storage",
                "progress_tracking": True,
                "nft_certificates": True,
                "zkp_proofs": True
            }
        },
        "security": {
            "cors": "Configurable origins",
            "cookies": "HttpOnly, Secure, SameSite",
            "rate_limiting": "Redis-based",
            "permission_system": "Fine-grained RBAC"
        }
    }

# Legacy endpoints for backward compatibility
from pydantic import BaseModel
from typing import Optional

class TeacherFeedback(BaseModel):
    student_did: str
    teacher_id: str
    feedback: str
    skill: str
    score: float
    created_at: Optional[str] = None

@app.post("/api/v1/teacher-feedback")
async def submit_teacher_feedback(feedback: TeacherFeedback):
    """Legacy endpoint for teacher feedback (backward compatibility)"""
    logger.warning("Using legacy teacher feedback endpoint - consider migrating to new course API")
    
    try:
        # This would integrate with the new course/assessment system
        # For now, return a success response
        return {
            "message": "Feedback submitted successfully",
            "feedback_id": f"feedback_{int(datetime.now().timestamp())}",
            "note": "This is a legacy endpoint. Please use the new course assessment API."
        }
    except Exception as e:
        logger.error(f"Teacher feedback submission error: {e}")
        raise HTTPException(status_code=500, detail="Feedback submission failed")

# Error handlers
from fastapi.responses import JSONResponse
from starlette.requests import Request

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "status_code": 404,
            "path": str(request.url)
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An internal server error occurred",
            "status_code": 500
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )