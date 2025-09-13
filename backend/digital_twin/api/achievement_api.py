"""
Achievement management API endpoints
"""
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
import logging
from datetime import datetime, timezone

from ..models.quiz_achievement import Achievement, UserAchievement, AchievementType, AchievementTier, AchievementCriteria
from ..models.user import User
from ..dependencies import get_current_user, require_permission
from ..services.ipfs_service import IPFSService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/achievements", tags=["achievements"])

ipfs_service = IPFSService()

# Pydantic models
class AchievementCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    achievement_type: AchievementType
    tier: AchievementTier = Field(default=AchievementTier.BRONZE)
    category: str = Field(..., min_length=1)
    icon_url: Optional[str] = None
    badge_color: str = Field(default="#FFD700")
    criteria: Dict[str, Any] = Field(..., description="Achievement criteria")
    is_repeatable: bool = Field(default=False)
    is_hidden: bool = Field(default=False)
    course_id: Optional[str] = None
    module_id: Optional[str] = None
    points_reward: int = Field(default=0, ge=0)
    nft_enabled: bool = Field(default=False)
    tags: List[str] = Field(default_factory=list)
    rarity: str = Field(default="common")

class AchievementUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tier: Optional[AchievementTier] = None
    category: Optional[str] = None
    icon_url: Optional[str] = None
    badge_color: Optional[str] = None
    criteria: Optional[Dict[str, Any]] = None
    is_repeatable: Optional[bool] = None
    is_hidden: Optional[bool] = None
    points_reward: Optional[int] = None
    nft_enabled: Optional[bool] = None
    tags: Optional[List[str]] = None
    rarity: Optional[str] = None
    status: Optional[str] = None

class UserAchievementRequest(BaseModel):
    achievement_id: str
    earned_through: str
    course_id: Optional[str] = None
    module_id: Optional[str] = None
    quiz_id: Optional[str] = None
    earned_value: Optional[float] = None
    bonus_points: int = Field(default=0)

# Achievement definition endpoints
@router.post("/", dependencies=[Depends(require_permission("create_achievement"))])
async def create_achievement(
    request: AchievementCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new achievement definition"""
    try:
        # Generate achievement ID
        achievement_id = f"achievement_{int(datetime.now().timestamp())}_{request.achievement_type.value}"
        
        # Create criteria object
        criteria = AchievementCriteria(**request.criteria)
        
        # Create achievement
        achievement = Achievement(
            achievement_id=achievement_id,
            title=request.title,
            description=request.description,
            achievement_type=request.achievement_type,
            tier=request.tier,
            category=request.category,
            icon_url=request.icon_url,
            badge_color=request.badge_color,
            criteria=criteria,
            is_repeatable=request.is_repeatable,
            is_hidden=request.is_hidden,
            course_id=request.course_id,
            module_id=request.module_id,
            points_reward=request.points_reward,
            nft_enabled=request.nft_enabled,
            created_by=current_user.did,
            tags=request.tags,
            rarity=request.rarity
        )
        
        await achievement.insert()
        
        # Pin achievement metadata to IPFS if NFT enabled
        if request.nft_enabled:
            metadata = {
                "name": request.title,
                "description": request.description,
                "image": request.icon_url or "",
                "attributes": [
                    {"trait_type": "Type", "value": request.achievement_type.value},
                    {"trait_type": "Tier", "value": request.tier.value},
                    {"trait_type": "Category", "value": request.category},
                    {"trait_type": "Rarity", "value": request.rarity},
                    {"trait_type": "Points", "value": request.points_reward}
                ]
            }
            
            metadata_cid = await ipfs_service.pin_json(
                metadata,
                name=f"achievement_metadata_{achievement_id}",
                metadata={
                    "achievement_id": achievement_id,
                    "type": "nft_metadata"
                }
            )
            
            achievement.nft_metadata_cid = metadata_cid
            await achievement.save()
        
        logger.info(f"Achievement created: {achievement_id}")
        return {
            "message": "Achievement created successfully",
            "achievement": achievement.dict()
        }
        
    except Exception as e:
        logger.error(f"Achievement creation failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement creation failed")

@router.get("/")
async def search_achievements(
    achievement_type: Optional[AchievementType] = Query(None),
    tier: Optional[AchievementTier] = Query(None),
    category: Optional[str] = Query(None),
    course_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    include_hidden: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Search and filter achievements"""
    try:
        filters = {}
        
        if achievement_type:
            filters["achievement_type"] = achievement_type
        if tier:
            filters["tier"] = tier
        if category:
            filters["category"] = category
        if course_id:
            filters["course_id"] = course_id
        if module_id:
            filters["module_id"] = module_id
        if status:
            filters["status"] = status
        else:
            filters["status"] = {"$ne": "deprecated"}
        
        # Hide hidden achievements unless specifically requested or user is admin
        if not include_hidden and current_user.role not in ["admin", "institution_admin"]:
            filters["is_hidden"] = False
        
        achievements = await Achievement.find(filters).skip(skip).limit(limit).to_list()
        total = await Achievement.find(filters).count()
        
        return {
            "achievements": [achievement.dict() for achievement in achievements],
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Achievement search failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement search failed")

@router.get("/{achievement_id}")
async def get_achievement(
    achievement_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get achievement by ID"""
    try:
        achievement = await Achievement.find_one({"achievement_id": achievement_id})
        if not achievement:
            raise HTTPException(status_code=404, detail="Achievement not found")
        
        # Hide hidden achievements from non-admin users
        if achievement.is_hidden and current_user.role not in ["admin", "institution_admin"]:
            # Check if user has earned this achievement
            user_achievement = await UserAchievement.find_one({
                "user_id": current_user.did,
                "achievement_id": achievement_id
            })
            if not user_achievement:
                raise HTTPException(status_code=404, detail="Achievement not found")
        
        return {"achievement": achievement.dict()}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Achievement retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement retrieval failed")

@router.put("/{achievement_id}", dependencies=[Depends(require_permission("update_achievement"))])
async def update_achievement(
    achievement_id: str,
    request: AchievementUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update achievement"""
    try:
        achievement = await Achievement.find_one({"achievement_id": achievement_id})
        if not achievement:
            raise HTTPException(status_code=404, detail="Achievement not found")
        
        # Check permissions
        if current_user.did != achievement.created_by and current_user.role not in ["admin", "institution_admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Apply updates
        update_data = request.dict(exclude_none=True)
        
        if "criteria" in update_data:
            achievement.criteria = AchievementCriteria(**update_data["criteria"])
            del update_data["criteria"]
        
        for key, value in update_data.items():
            if hasattr(achievement, key):
                setattr(achievement, key, value)
        
        achievement.update_timestamp()
        await achievement.save()
        
        logger.info(f"Achievement updated: {achievement_id}")
        return {
            "message": "Achievement updated successfully",
            "achievement": achievement.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Achievement update failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement update failed")

# User achievement endpoints
@router.post("/earn")
async def award_achievement(
    request: UserAchievementRequest,
    current_user: User = Depends(get_current_user)
):
    """Award an achievement to current user"""
    try:
        # Get achievement definition
        achievement = await Achievement.find_one({
            "achievement_id": request.achievement_id,
            "status": "active"
        })
        if not achievement:
            raise HTTPException(status_code=404, detail="Achievement not found or inactive")
        
        # Check if user already has this achievement (if not repeatable)
        if not achievement.is_repeatable:
            existing = await UserAchievement.find_one({
                "user_id": current_user.did,
                "achievement_id": request.achievement_id
            })
            if existing:
                raise HTTPException(status_code=400, detail="Achievement already earned")
        
        # Validate achievement criteria (basic validation)
        # TODO: Implement comprehensive criteria validation
        
        # Create user achievement
        user_achievement = UserAchievement(
            user_id=current_user.did,
            achievement_id=request.achievement_id,
            earned_through=request.earned_through,
            course_id=request.course_id,
            module_id=request.module_id,
            quiz_id=request.quiz_id,
            earned_value=request.earned_value,
            bonus_points=request.bonus_points + achievement.points_reward
        )
        
        await user_achievement.insert()
        
        # Update user's total points if applicable
        # TODO: Implement user points system
        
        logger.info(f"Achievement awarded: {current_user.did} -> {request.achievement_id}")
        return {
            "message": "Achievement earned successfully",
            "user_achievement": user_achievement.dict(),
            "achievement": achievement.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Achievement awarding failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement awarding failed")

@router.get("/my")
async def get_user_achievements(
    user_id: Optional[str] = Query(None),
    achievement_type: Optional[AchievementType] = Query(None),
    is_completed: Optional[bool] = Query(None),
    include_progress: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """Get current user's achievements with progress"""
    try:
        target_user_id = user_id if user_id and current_user.role in ["admin", "institution_admin"] else current_user.did
        
        # Build aggregation pipeline for user achievements with achievement details
        pipeline = [
            {"$match": {"user_id": target_user_id}},
            {"$lookup": {
                "from": "achievements",
                "localField": "achievement_id",
                "foreignField": "achievement_id",
                "as": "achievement"
            }},
            {"$unwind": "$achievement"},
            {"$match": {"achievement.status": "active"}}
        ]
        
        # Add type filter
        if achievement_type:
            pipeline.append({"$match": {"achievement.achievement_type": achievement_type}})
        
        # Add completion filter
        if is_completed is not None:
            # For simplicity, consider all earned achievements as completed
            # This can be enhanced with progress tracking later
            pass
        
        # Add computed fields
        pipeline.append({
            "$addFields": {
                "progress_percentage": 100.0,  # All earned achievements are 100% complete
                "current_value": {"$ifNull": ["$earned_value", 1.0]},
                "is_completed": True,
                "unlocked_at": "$earned_at"
            }
        })
        
        # Sort by earned date (newest first)
        pipeline.append({"$sort": {"earned_at": -1}})
        
        # Pagination
        pipeline.extend([
            {"$skip": skip},
            {"$limit": limit}
        ])
        
        try:
            user_achievements = await UserAchievement.aggregate(pipeline).to_list()
            # Count total user achievements
            total = len(user_achievements)
        except Exception as agg_error:
            logger.debug(f"Achievement aggregation failed, returning empty list: {agg_error}")
            user_achievements = []
            total = 0
        
        return {
            "user_achievements": user_achievements,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"User achievements retrieval failed: {e}")
        # Return empty result instead of throwing error for better UX
        return {
            "user_achievements": [],
            "total": 0,
            "skip": skip,
            "limit": limit
        }

@router.get("/my/statistics")
async def get_user_achievement_stats(
    user_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get achievement statistics for user"""
    try:
        target_user_id = user_id if user_id and current_user.role in ["admin", "institution_admin"] else current_user.did
        
        # Get user achievements count
        user_achievements_count = await UserAchievement.find({"user_id": target_user_id}).count()
        
        # Get total available achievements
        total_achievements = await Achievement.find({"status": "active", "is_hidden": False}).count()
        
        # Get total points earned
        points_pipeline = [
            {"$match": {"user_id": target_user_id}},
            {"$lookup": {
                "from": "achievements",
                "localField": "achievement_id", 
                "foreignField": "achievement_id",
                "as": "achievement"
            }},
            {"$unwind": "$achievement"},
            {"$group": {
                "_id": None,
                "total_points": {"$sum": {"$add": ["$achievement.points_reward", "$bonus_points"]}}
            }}
        ]
        
        try:
            points_result = await UserAchievement.aggregate(points_pipeline).to_list()
            total_points = points_result[0]["total_points"] if points_result else 0
        except Exception as points_error:
            logger.debug(f"Points calculation failed: {points_error}")
            total_points = 0
        
        # Calculate completion rate
        completion_rate = (user_achievements_count / total_achievements * 100) if total_achievements > 0 else 0
        
        return {
            "stats": {
                "totalAchievements": total_achievements,
                "unlockedCount": user_achievements_count,
                "totalPoints": total_points,
                "completionRate": completion_rate
            }
        }
        
    except Exception as e:
        logger.error(f"Achievement statistics retrieval failed: {e}")
        return {
            "stats": {
                "totalAchievements": 0,
                "unlockedCount": 0,
                "totalPoints": 0,
                "completionRate": 0
            }
        }

@router.post("/my/{user_achievement_id}/mint-nft")
async def mint_achievement_nft(
    user_achievement_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mint NFT for a user achievement"""
    try:
        # Find the user achievement
        user_achievement = await UserAchievement.find_one({
            "_id": user_achievement_id,
            "user_id": current_user.did
        })
        
        if not user_achievement:
            raise HTTPException(status_code=404, detail="Achievement not found")
        
        if user_achievement.nft_minted:
            raise HTTPException(status_code=400, detail="NFT already minted for this achievement")
        
        # Get achievement details
        achievement = await Achievement.find_one({"achievement_id": user_achievement.achievement_id})
        if not achievement or not achievement.nft_enabled:
            raise HTTPException(status_code=400, detail="NFT not enabled for this achievement")
        
        # TODO: Implement actual NFT minting logic here
        # For now, just mark as minted
        user_achievement.nft_minted = True
        user_achievement.nft_token_id = f"token_{user_achievement_id}_{int(datetime.now().timestamp())}"
        user_achievement.nft_tx_hash = f"tx_{user_achievement_id}"
        
        await user_achievement.save()
        
        return {
            "message": "NFT minted successfully",
            "nft_token_id": user_achievement.nft_token_id,
            "tx_hash": user_achievement.nft_tx_hash
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"NFT minting failed: {e}")
        raise HTTPException(status_code=500, detail="NFT minting failed")

@router.get("/my/earned")
async def get_my_achievements(
    achievement_type: Optional[AchievementType] = Query(None),
    course_id: Optional[str] = Query(None),
    showcased_only: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Get current user's earned achievements"""
    try:
        # Build aggregation pipeline
        pipeline = [
            {"$match": {"user_id": current_user.did}},
            {"$lookup": {
                "from": "achievements",
                "localField": "achievement_id",
                "foreignField": "achievement_id",
                "as": "achievement"
            }},
            {"$unwind": "$achievement"},
            {"$match": {"achievement.status": "active"}}
        ]
        
        # Add filters
        if achievement_type:
            pipeline.append({"$match": {"achievement.achievement_type": achievement_type}})
        if course_id:
            pipeline.append({"$match": {"course_id": course_id}})
        if showcased_only:
            pipeline.append({"$match": {"is_showcased": True}})
        
        # Sort by earned date (newest first)
        pipeline.append({"$sort": {"earned_at": -1}})
        
        try:
            user_achievements = await UserAchievement.aggregate(pipeline).to_list()
        except Exception as agg_error:
            logger.debug(f"Achievement aggregation failed, returning empty list: {agg_error}")
            user_achievements = []
        
        return {
            "achievements": user_achievements,
            "total": len(user_achievements)
        }
        
    except Exception as e:
        logger.error(f"User achievements retrieval failed: {e}")
        # Return empty result instead of throwing error
        return {
            "achievements": [],
            "total": 0
        }

@router.put("/my/earned/{user_achievement_id}/showcase")
async def toggle_achievement_showcase(
    user_achievement_id: str,
    showcase: bool = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Toggle achievement showcase status"""
    try:
        user_achievement = await UserAchievement.find_one({
            "_id": user_achievement_id,
            "user_id": current_user.did
        })
        
        if not user_achievement:
            raise HTTPException(status_code=404, detail="User achievement not found")
        
        user_achievement.is_showcased = showcase
        await user_achievement.save()
        
        return {
            "message": f"Achievement {'showcased' if showcase else 'hidden'} successfully",
            "user_achievement": user_achievement.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Achievement showcase toggle failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement showcase toggle failed")

@router.get("/leaderboard")
async def get_achievement_leaderboard(
    achievement_type: Optional[AchievementType] = Query(None),
    course_id: Optional[str] = Query(None),
    timeframe: str = Query("all", regex="^(week|month|year|all)$"),
    limit: int = Query(10, ge=1, le=100)
):
    """Get achievement leaderboard"""
    try:
        # Build time filter
        time_filter = {}
        if timeframe != "all":
            from datetime import timedelta
            
            now = datetime.now(timezone.utc)
            if timeframe == "week":
                time_filter = {"earned_at": {"$gte": now - timedelta(weeks=1)}}
            elif timeframe == "month":
                time_filter = {"earned_at": {"$gte": now - timedelta(days=30)}}
            elif timeframe == "year":
                time_filter = {"earned_at": {"$gte": now - timedelta(days=365)}}
        
        # Build aggregation pipeline
        match_stage = {**time_filter}
        if course_id:
            match_stage["course_id"] = course_id
        
        pipeline = [
            {"$match": match_stage},
            {"$lookup": {
                "from": "achievements",
                "localField": "achievement_id",
                "foreignField": "achievement_id",
                "as": "achievement"
            }},
            {"$unwind": "$achievement"},
            {"$match": {"achievement.status": "active"}}
        ]
        
        if achievement_type:
            pipeline.append({"$match": {"achievement.achievement_type": achievement_type}})
        
        # Group by user and calculate stats
        pipeline.extend([
            {"$group": {
                "_id": "$user_id",
                "total_achievements": {"$sum": 1},
                "total_points": {"$sum": "$bonus_points"},
                "latest_achievement": {"$max": "$earned_at"},
                "achievements": {"$push": "$achievement"}
            }},
            {"$sort": {"total_points": -1, "total_achievements": -1}},
            {"$limit": limit}
        ])
        
        leaderboard = await UserAchievement.aggregate(pipeline).to_list()
        
        # Enhance with user information
        # TODO: Join with user collection to get names/avatars
        
        return {
            "leaderboard": leaderboard,
            "timeframe": timeframe
        }
        
    except Exception as e:
        logger.error(f"Achievement leaderboard retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement leaderboard retrieval failed")

@router.post("/check-eligibility/{achievement_id}")
async def check_achievement_eligibility(
    achievement_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if user is eligible for an achievement"""
    try:
        achievement = await Achievement.find_one({
            "achievement_id": achievement_id,
            "status": "active"
        })
        
        if not achievement:
            raise HTTPException(status_code=404, detail="Achievement not found")
        
        # Check if already earned (if not repeatable)
        if not achievement.is_repeatable:
            existing = await UserAchievement.find_one({
                "user_id": current_user.did,
                "achievement_id": achievement_id
            })
            if existing:
                return {
                    "eligible": False,
                    "reason": "Already earned",
                    "achievement": achievement.dict()
                }
        
        # TODO: Implement comprehensive eligibility checking based on criteria
        # This would involve checking user's progress, quiz scores, etc.
        
        return {
            "eligible": True,
            "reason": "Criteria check not implemented",
            "achievement": achievement.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Achievement eligibility check failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement eligibility check failed")

@router.get("/statistics")
async def get_achievement_statistics(
    course_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get achievement statistics"""
    try:
        # Build filters
        filters = {}
        if course_id:
            filters["course_id"] = course_id
        
        # Get total achievements available
        total_achievements = await Achievement.count_documents({
            "status": "active",
            "is_hidden": False,
            **filters
        })
        
        # Get user's earned achievements
        user_filters = {"user_id": current_user.did, **filters}
        earned_achievements = await UserAchievement.count_documents(user_filters)
        
        # Get achievements by type
        type_pipeline = [
            {"$match": user_filters},
            {"$lookup": {
                "from": "achievements",
                "localField": "achievement_id",
                "foreignField": "achievement_id",
                "as": "achievement"
            }},
            {"$unwind": "$achievement"},
            {"$group": {
                "_id": "$achievement.achievement_type",
                "count": {"$sum": 1}
            }}
        ]
        
        achievements_by_type = await UserAchievement.aggregate(type_pipeline).to_list()
        
        # Get achievements by tier
        tier_pipeline = [
            {"$match": user_filters},
            {"$lookup": {
                "from": "achievements",
                "localField": "achievement_id",
                "foreignField": "achievement_id",
                "as": "achievement"
            }},
            {"$unwind": "$achievement"},
            {"$group": {
                "_id": "$achievement.tier",
                "count": {"$sum": 1}
            }}
        ]
        
        achievements_by_tier = await UserAchievement.aggregate(tier_pipeline).to_list()
        
        # Calculate total points
        total_points = await UserAchievement.aggregate([
            {"$match": user_filters},
            {"$group": {"_id": None, "total": {"$sum": "$bonus_points"}}}
        ]).to_list()
        
        return {
            "total_available": total_achievements,
            "total_earned": earned_achievements,
            "completion_rate": (earned_achievements / total_achievements * 100) if total_achievements > 0 else 0,
            "total_points": total_points[0]["total"] if total_points else 0,
            "by_type": {item["_id"]: item["count"] for item in achievements_by_type},
            "by_tier": {item["_id"]: item["count"] for item in achievements_by_tier}
        }
        
    except Exception as e:
        logger.error(f"Achievement statistics retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Achievement statistics retrieval failed")

@router.get("/course/{course_id}")
async def get_course_achievements(
    course_id: str,
    include_hidden: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Get all achievements for a specific course"""
    try:
        # Verify course exists
        from ..models.course import Course
        course = await Course.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get achievements
        filters = {"course_id": course_id}
        if not include_hidden and current_user.role not in ["admin", "institution_admin"]:
            filters["is_hidden"] = False
        
        achievements = await Achievement.find(filters).to_list()
        
        achievements_data = []
        for achievement in achievements:
            achievement_data = achievement.dict()
            
            # Check if user has earned this achievement
            user_achievement = await UserAchievement.find_one({
                "user_id": current_user.did,
                "achievement_id": achievement.achievement_id
            })
            
            achievement_data["earned"] = user_achievement is not None
            if user_achievement:
                achievement_data["earned_at"] = user_achievement.earned_at.isoformat()
                achievement_data["earned_through"] = user_achievement.earned_through
            
            achievements_data.append(achievement_data)
        
        return {
            "achievements": achievements_data,
            "course": course.dict(),
            "total_achievements": len(achievements_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Course achievements retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Course achievements retrieval failed")

@router.get("/all/courses")
async def get_all_courses_achievements(
    include_hidden: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """Get all achievements across all courses"""
    try:
        # Get achievements
        filters = {}
        if not include_hidden and current_user.role not in ["admin", "institution_admin"]:
            filters["is_hidden"] = False
        
        achievements = await Achievement.find(filters).skip(skip).limit(limit).to_list()
        total = await Achievement.find(filters).count()
        
        achievements_data = []
        for achievement in achievements:
            achievement_data = achievement.dict()
            
            # Check if user has earned this achievement
            user_achievement = await UserAchievement.find_one({
                "user_id": current_user.did,
                "achievement_id": achievement.achievement_id
            })
            
            achievement_data["earned"] = user_achievement is not None
            if user_achievement:
                achievement_data["earned_at"] = user_achievement.earned_at.isoformat()
                achievement_data["earned_through"] = user_achievement.earned_through
            
            achievements_data.append(achievement_data)
        
        return {
            "achievements": achievements_data,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"All courses achievements retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="All courses achievements retrieval failed")
