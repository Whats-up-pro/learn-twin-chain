"""
Database configuration and connection management for MongoDB
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional
import logging

from ..models.user import User, UserProfile
from ..models.user_settings import UserSettings
from ..models.digital_twin import DigitalTwin, DigitalTwinVersion
from ..models.course import Course, Module, Enrollment, ModuleProgress, Lesson
from ..models.nft import NFTRecord
from ..models.session import UserSession, RefreshToken
from ..models.wallet import WalletLink, SIWENonce
from ..models.permission import Role, Permission, UserRoleAssignment
from ..models.quiz_achievement import Quiz, QuizAttempt, Achievement, UserAchievement

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

database = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/learntwinchain")
        database_name = os.getenv("MONGODB_DB_NAME", "learntwinchain")
        
        logger.info(f"Connecting to MongoDB at {mongodb_uri}")
        
        # Create connection
        database.client = AsyncIOMotorClient(mongodb_uri)
        database.database = database.client[database_name]
        
        # Test connection
        await database.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Initialize Beanie with document models
        await init_beanie(
            database=database.database,
            document_models=[
                User,
                UserProfile,
                UserSettings,
                DigitalTwin,
                DigitalTwinVersion,
                Course,
                Module,
                Lesson,
                Enrollment,
                ModuleProgress,
                Quiz,
                QuizAttempt,
                Achievement,
                UserAchievement,
                NFTRecord,
                UserSession,
                RefreshToken,
                WalletLink,
                SIWENonce,
                Role,
                Permission,
                UserRoleAssignment
            ]
        )
        
        logger.info("Beanie initialized with all document models")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()
        logger.info("MongoDB connection closed")

async def create_indexes():
    """Create database indexes for performance"""
    try:
        # User indexes
        await User.create_index("email", unique=True)
        await User.create_index("did", unique=True)
        
        # Digital Twin indexes
        await DigitalTwin.create_index("twin_id", unique=True)
        await DigitalTwin.create_index("owner_did")
        await DigitalTwin.create_index("latest_cid")
        
        # Course and Module indexes
        await Course.create_index("course_id", unique=True)
        await Module.create_index("module_id", unique=True)
        await Module.create_index("course_id")
        
        # NFT indexes
        await NFTRecord.create_index("token_id", unique=True)
        await NFTRecord.create_index("owner_address")
        await NFTRecord.create_index("student_did")
        
        # Session indexes
        await UserSession.create_index("session_id", unique=True)
        await UserSession.create_index("user_id")
        await UserSession.create_index("expires_at")
        
        # Refresh token indexes
        await RefreshToken.create_index("token_id", unique=True)
        await RefreshToken.create_index("user_id")
        await RefreshToken.create_index("token_hash")
        await RefreshToken.create_index("expires_at")
        await RefreshToken.create_index("family_id")
        
        # Wallet indexes
        await WalletLink.create_index("wallet_address", unique=True)
        await WalletLink.create_index("user_id")
        
        # Permission indexes
        await Role.create_index("name", unique=True)
        await Permission.create_index("name", unique=True)
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

def get_database():
    """Get database instance"""
    return database.database

def get_client():
    """Get MongoDB client instance"""
    return database.client