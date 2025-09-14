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
from ..models.discussion import Discussion, Comment, DiscussionLike, CommentLike
from ..models.video_settings import VideoLearningSettings, VideoSession
from ..models.subscription import UserSubscription, PaymentTransaction, SubscriptionFeature, SubscriptionPlanConfig

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
                UserRoleAssignment,
                Discussion,
                Comment,
                DiscussionLike,
                CommentLike,
                VideoLearningSettings,
                VideoSession,
                UserSubscription,
                PaymentTransaction,
                SubscriptionFeature,
                SubscriptionPlanConfig
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
        
        # Discussion indexes
        await Discussion.create_index("discussion_id", unique=True)
        await Discussion.create_index("course_id")
        await Discussion.create_index("module_id")
        await Discussion.create_index("lesson_id")
        await Discussion.create_index("author_id")
        await Discussion.create_index("status")
        await Discussion.create_index("last_activity_at")
        
        # Comment indexes
        await Comment.create_index("comment_id", unique=True)
        await Comment.create_index("discussion_id")
        await Comment.create_index("author_id")
        await Comment.create_index("status")
        await Comment.create_index("created_at")
        
        # Discussion/Comment Like indexes
        await DiscussionLike.create_index([("discussion_id", 1), ("user_id", 1)], unique=True)
        await CommentLike.create_index([("comment_id", 1), ("user_id", 1)], unique=True)
        
        # Video Settings indexes
        await VideoLearningSettings.create_index("user_id", unique=True)
        await VideoSession.create_index("session_id", unique=True)
        await VideoSession.create_index("user_id")
        await VideoSession.create_index("course_id")
        await VideoSession.create_index("lesson_id")
        await VideoSession.create_index("started_at")
        
        # Subscription indexes
        await UserSubscription.create_index("user_id")
        await UserSubscription.create_index("plan")
        await UserSubscription.create_index("status")
        await UserSubscription.create_index("end_date")
        
        # Payment transaction indexes
        await PaymentTransaction.create_index("transaction_id", unique=True)
        await PaymentTransaction.create_index("user_id")
        await PaymentTransaction.create_index("status")
        await PaymentTransaction.create_index("created_at")
        
        # Subscription plan indexes
        await SubscriptionPlanConfig.create_index("plan", unique=True)
        await SubscriptionPlanConfig.create_index("is_active")
        
        # Subscription feature indexes
        await SubscriptionFeature.create_index("plan")
        await SubscriptionFeature.create_index("feature_name")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

def get_database():
    """Get database instance"""
    return database.database

def get_client():
    """Get MongoDB client instance"""
    return database.client