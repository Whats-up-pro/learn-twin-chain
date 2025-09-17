"""
Ranking API endpoints for certificates and achievements leaderboards
"""

import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timezone, timedelta
from ..models.user import User
from ..models.course import Enrollment
from ..models.quiz_achievement import UserAchievement, Achievement
from ..models.nft import NFTRecord
from ..dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ranking", tags=["ranking"])

class RankingService:
    """Service for handling ranking and leaderboard operations"""
    
    @staticmethod
    async def get_certificate_leaderboard(
        timeframe: str = "all",
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get certificate leaderboard ranked by number of certificates"""
        try:
            # Build time filter
            time_filter = {}
            if timeframe != "all":
                now = datetime.now(timezone.utc)
                if timeframe == "week":
                    time_filter = {"completed_at": {"$gte": now - timedelta(weeks=1)}}
                elif timeframe == "month":
                    time_filter = {"completed_at": {"$gte": now - timedelta(days=30)}}
                elif timeframe == "year":
                    time_filter = {"completed_at": {"$gte": now - timedelta(days=365)}}
            
            # Get course completion certificates from enrollments
            enrollment_pipeline = [
                {"$match": {
                    "status": "completed",
                    "certificate_issued": True,
                    **time_filter
                }},
                {"$group": {
                    "_id": "$user_id",
                    "certificate_count": {"$sum": 1},
                    "latest_certificate": {"$max": "$completed_at"},
                    "courses": {"$push": {
                        "course_id": "$course_id",
                        "completed_at": "$completed_at",
                        "final_grade": "$final_grade"
                    }}
                }},
                {"$sort": {"certificate_count": -1, "latest_certificate": -1}},
                {"$limit": limit}
            ]
            
            try:
                enrollment_results = await Enrollment.aggregate(enrollment_pipeline).to_list()
            except Exception as e:
                logger.warning(f"Enrollment aggregation failed: {e}")
                enrollment_results = []
            
            # Get NFT certificates
            nft_time_filter = {}
            if timeframe != "all":
                now = datetime.now(timezone.utc)
                if timeframe == "week":
                    nft_time_filter = {"created_at": {"$gte": now - timedelta(weeks=1)}}
                elif timeframe == "month":
                    nft_time_filter = {"created_at": {"$gte": now - timedelta(days=30)}}
                elif timeframe == "year":
                    nft_time_filter = {"created_at": {"$gte": now - timedelta(days=365)}}
            
            nft_pipeline = [
                {"$match": {
                    "achievement_type": {"$in": ["course_completion", "skill_mastery", "certification"]},
                    **nft_time_filter
                }},
                {"$group": {
                    "_id": "$owner_address",
                    "nft_certificate_count": {"$sum": 1},
                    "latest_nft": {"$max": "$created_at"},
                    "nfts": {"$push": {
                        "token_id": "$token_id",
                        "achievement_type": "$achievement_type",
                        "title": {"$ifNull": ["$metadata.name", "Certificate"]},
                        "created_at": "$created_at"
                    }}
                }},
                {"$sort": {"nft_certificate_count": -1, "latest_nft": -1}},
                {"$limit": limit}
            ]
            
            try:
                nft_results = await NFTRecord.aggregate(nft_pipeline).to_list()
            except Exception as e:
                logger.warning(f"NFT certificate aggregation failed: {e}")
                nft_results = []
            
            # Combine and merge results
            combined_rankings = {}
            
            # Process enrollment results
            for result in enrollment_results:
                user_id = result["_id"]
                combined_rankings[user_id] = {
                    "user_id": user_id,
                    "certificate_count": result["certificate_count"],
                    "nft_certificate_count": 0,
                    "total_certificates": result["certificate_count"],
                    "latest_certificate": result["latest_certificate"],
                    "courses": result["courses"],
                    "nfts": []
                }
            
            # Process NFT results
            for result in nft_results:
                user_id = result["_id"]
                if user_id in combined_rankings:
                    combined_rankings[user_id]["nft_certificate_count"] = result["nft_certificate_count"]
                    combined_rankings[user_id]["total_certificates"] += result["nft_certificate_count"]
                    combined_rankings[user_id]["nfts"] = result["nfts"]
                    if result["latest_nft"] > combined_rankings[user_id]["latest_certificate"]:
                        combined_rankings[user_id]["latest_certificate"] = result["latest_nft"]
                else:
                    combined_rankings[user_id] = {
                        "user_id": user_id,
                        "certificate_count": 0,
                        "nft_certificate_count": result["nft_certificate_count"],
                        "total_certificates": result["nft_certificate_count"],
                        "latest_certificate": result["latest_nft"],
                        "courses": [],
                        "nfts": result["nfts"]
                    }
            
            # Sort by total certificates
            sorted_rankings = sorted(
                combined_rankings.values(),
                key=lambda x: (x["total_certificates"], x["latest_certificate"]),
                reverse=True
            )
            
            # Enhance with user information
            enhanced_rankings = []
            for i, ranking in enumerate(sorted_rankings[:limit]):
                try:
                    user = await User.find_one(User.did == ranking["user_id"])
                    enhanced_ranking = {
                        "rank": i + 1,
                        "user_id": ranking["user_id"],
                        "user_name": user.full_name if user and hasattr(user, 'full_name') else "Anonymous",
                        "user_email": user.email if user else None,
                        "avatar_url": getattr(user, 'avatar_url', None) if user else None,
                        "certificate_count": ranking["certificate_count"],
                        "nft_certificate_count": ranking["nft_certificate_count"],
                        "total_certificates": ranking["total_certificates"],
                        "latest_certificate": ranking["latest_certificate"],
                        "courses": ranking["courses"],
                        "nfts": ranking["nfts"]
                    }
                    enhanced_rankings.append(enhanced_ranking)
                except Exception as e:
                    logger.warning(f"Failed to enhance ranking for user {ranking['user_id']}: {e}")
                    # Add basic ranking without user info
                    enhanced_ranking = {
                        "rank": i + 1,
                        "user_id": ranking["user_id"],
                        "user_name": "Anonymous",
                        "user_email": None,
                        "avatar_url": None,
                        "certificate_count": ranking["certificate_count"],
                        "nft_certificate_count": ranking["nft_certificate_count"],
                        "total_certificates": ranking["total_certificates"],
                        "latest_certificate": ranking["latest_certificate"],
                        "courses": ranking["courses"],
                        "nfts": ranking["nfts"]
                    }
                    enhanced_rankings.append(enhanced_ranking)
            
            return {
                "success": True,
                "leaderboard": enhanced_rankings,
                "timeframe": timeframe,
                "total_users": len(enhanced_rankings)
            }
            
        except Exception as e:
            logger.error(f"Certificate leaderboard retrieval failed: {e}")
            raise HTTPException(status_code=500, detail="Certificate leaderboard retrieval failed")
    
    @staticmethod
    async def get_achievement_leaderboard(
        timeframe: str = "all",
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get achievement leaderboard ranked by number of achievements"""
        try:
            # Build time filter
            time_filter = {}
            if timeframe != "all":
                now = datetime.now(timezone.utc)
                if timeframe == "week":
                    time_filter = {"earned_at": {"$gte": now - timedelta(weeks=1)}}
                elif timeframe == "month":
                    time_filter = {"earned_at": {"$gte": now - timedelta(days=30)}}
                elif timeframe == "year":
                    time_filter = {"earned_at": {"$gte": now - timedelta(days=365)}}
            
            # Get achievements from UserAchievement collection
            achievement_pipeline = [
                {"$match": time_filter},
                {"$lookup": {
                    "from": "achievements",
                    "localField": "achievement_id",
                    "foreignField": "achievement_id",
                    "as": "achievement"
                }},
                {"$unwind": {"path": "$achievement", "preserveNullAndEmptyArrays": True}},
                {"$match": {"achievement.status": "active"}},
                {"$group": {
                    "_id": "$user_id",
                    "achievement_count": {"$sum": 1},
                    "total_points": {"$sum": "$bonus_points"},
                    "latest_achievement": {"$max": "$earned_at"},
                    "achievements": {"$push": {
                        "achievement_id": "$achievement_id",
                        "title": {"$ifNull": ["$achievement.title", "Unknown Achievement"]},
                        "tier": {"$ifNull": ["$achievement.tier", "bronze"]},
                        "points": "$bonus_points",
                        "earned_at": "$earned_at"
                    }}
                }},
                {"$sort": {"achievement_count": -1, "total_points": -1, "latest_achievement": -1}},
                {"$limit": limit}
            ]
            
            try:
                achievement_results = await UserAchievement.aggregate(achievement_pipeline).to_list()
            except Exception as e:
                logger.warning(f"Achievement aggregation failed: {e}")
                achievement_results = []
            
            # Get NFT achievements
            nft_time_filter = {}
            if timeframe != "all":
                now = datetime.now(timezone.utc)
                if timeframe == "week":
                    nft_time_filter = {"created_at": {"$gte": now - timedelta(weeks=1)}}
                elif timeframe == "month":
                    nft_time_filter = {"created_at": {"$gte": now - timedelta(days=30)}}
                elif timeframe == "year":
                    nft_time_filter = {"created_at": {"$gte": now - timedelta(days=365)}}
            
            nft_pipeline = [
                {"$match": {
                    "achievement_type": {"$in": ["achievement", "learning_milestone", "excellence_award"]},
                    **nft_time_filter
                }},
                {"$group": {
                    "_id": "$owner_address",
                    "nft_achievement_count": {"$sum": 1},
                    "latest_nft": {"$max": "$created_at"},
                    "nfts": {"$push": {
                        "token_id": "$token_id",
                        "achievement_type": "$achievement_type",
                        "title": {"$ifNull": ["$metadata.name", "Achievement"]},
                        "created_at": "$created_at"
                    }}
                }},
                {"$sort": {"nft_achievement_count": -1, "latest_nft": -1}},
                {"$limit": limit}
            ]
            
            try:
                nft_results = await NFTRecord.aggregate(nft_pipeline).to_list()
            except Exception as e:
                logger.warning(f"NFT achievement aggregation failed: {e}")
                nft_results = []
            
            # Combine and merge results
            combined_rankings = {}
            
            # Process achievement results
            for result in achievement_results:
                user_id = result["_id"]
                combined_rankings[user_id] = {
                    "user_id": user_id,
                    "achievement_count": result["achievement_count"],
                    "nft_achievement_count": 0,
                    "total_achievements": result["achievement_count"],
                    "total_points": result["total_points"],
                    "latest_achievement": result["latest_achievement"],
                    "achievements": result["achievements"],
                    "nfts": []
                }
            
            # Process NFT results
            for result in nft_results:
                user_id = result["_id"]
                if user_id in combined_rankings:
                    combined_rankings[user_id]["nft_achievement_count"] = result["nft_achievement_count"]
                    combined_rankings[user_id]["total_achievements"] += result["nft_achievement_count"]
                    combined_rankings[user_id]["nfts"] = result["nfts"]
                    if result["latest_nft"] > combined_rankings[user_id]["latest_achievement"]:
                        combined_rankings[user_id]["latest_achievement"] = result["latest_nft"]
                else:
                    combined_rankings[user_id] = {
                        "user_id": user_id,
                        "achievement_count": 0,
                        "nft_achievement_count": result["nft_achievement_count"],
                        "total_achievements": result["nft_achievement_count"],
                        "total_points": 0,
                        "latest_achievement": result["latest_nft"],
                        "achievements": [],
                        "nfts": result["nfts"]
                    }
            
            # Sort by total achievements, then by points
            sorted_rankings = sorted(
                combined_rankings.values(),
                key=lambda x: (x["total_achievements"], x["total_points"], x["latest_achievement"]),
                reverse=True
            )
            
            # Enhance with user information
            enhanced_rankings = []
            for i, ranking in enumerate(sorted_rankings[:limit]):
                try:
                    user = await User.find_one(User.did == ranking["user_id"])
                    enhanced_ranking = {
                        "rank": i + 1,
                        "user_id": ranking["user_id"],
                        "user_name": user.full_name if user and hasattr(user, 'full_name') else "Anonymous",
                        "user_email": user.email if user else None,
                        "avatar_url": getattr(user, 'avatar_url', None) if user else None,
                        "achievement_count": ranking["achievement_count"],
                        "nft_achievement_count": ranking["nft_achievement_count"],
                        "total_achievements": ranking["total_achievements"],
                        "total_points": ranking["total_points"],
                        "latest_achievement": ranking["latest_achievement"],
                        "achievements": ranking["achievements"],
                        "nfts": ranking["nfts"]
                    }
                    enhanced_rankings.append(enhanced_ranking)
                except Exception as e:
                    logger.warning(f"Failed to enhance ranking for user {ranking['user_id']}: {e}")
                    # Add basic ranking without user info
                    enhanced_ranking = {
                        "rank": i + 1,
                        "user_id": ranking["user_id"],
                        "user_name": "Anonymous",
                        "user_email": None,
                        "avatar_url": None,
                        "achievement_count": ranking["achievement_count"],
                        "nft_achievement_count": ranking["nft_achievement_count"],
                        "total_achievements": ranking["total_achievements"],
                        "total_points": ranking["total_points"],
                        "latest_achievement": ranking["latest_achievement"],
                        "achievements": ranking["achievements"],
                        "nfts": ranking["nfts"]
                    }
                    enhanced_rankings.append(enhanced_ranking)
            
            return {
                "success": True,
                "leaderboard": enhanced_rankings,
                "timeframe": timeframe,
                "total_users": len(enhanced_rankings)
            }
            
        except Exception as e:
            logger.error(f"Achievement leaderboard retrieval failed: {e}")
            raise HTTPException(status_code=500, detail="Achievement leaderboard retrieval failed")
    
    @staticmethod
    async def get_user_ranking_position(user_id: str, ranking_type: str) -> Dict[str, Any]:
        """Get user's ranking position in leaderboards"""
        try:
            if ranking_type == "certificates":
                # Get all certificate rankings
                all_rankings = await RankingService.get_certificate_leaderboard(timeframe="all", limit=1000)
                leaderboard = all_rankings.get("leaderboard", [])
            elif ranking_type == "achievements":
                # Get all achievement rankings
                all_rankings = await RankingService.get_achievement_leaderboard(timeframe="all", limit=1000)
                leaderboard = all_rankings.get("leaderboard", [])
            else:
                raise HTTPException(status_code=400, detail="Invalid ranking type")
            
            # Find user's position
            user_position = None
            for ranking in leaderboard:
                if ranking["user_id"] == user_id:
                    user_position = ranking
                    break
            
            if not user_position:
                # User not found in rankings, they have 0 certificates/achievements
                return {
                    "success": True,
                    "user_id": user_id,
                    "ranking_type": ranking_type,
                    "rank": None,
                    "total_users": len(leaderboard),
                    "user_stats": {
                        "certificate_count": 0,
                        "nft_certificate_count": 0,
                        "total_certificates": 0,
                        "achievement_count": 0,
                        "nft_achievement_count": 0,
                        "total_achievements": 0,
                        "total_points": 0
                    }
                }
            
            return {
                "success": True,
                "user_id": user_id,
                "ranking_type": ranking_type,
                "rank": user_position["rank"],
                "total_users": len(leaderboard),
                "user_stats": {
                    "certificate_count": user_position.get("certificate_count", 0),
                    "nft_certificate_count": user_position.get("nft_certificate_count", 0),
                    "total_certificates": user_position.get("total_certificates", 0),
                    "achievement_count": user_position.get("achievement_count", 0),
                    "nft_achievement_count": user_position.get("nft_achievement_count", 0),
                    "total_achievements": user_position.get("total_achievements", 0),
                    "total_points": user_position.get("total_points", 0)
                }
            }
            
        except Exception as e:
            logger.error(f"User ranking position retrieval failed: {e}")
            raise HTTPException(status_code=500, detail="User ranking position retrieval failed")

# API Endpoints

@router.get("/certificates")
async def get_certificate_leaderboard(
    timeframe: str = Query("all", regex="^(week|month|year|all)$"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get certificate leaderboard ranked by number of certificates"""
    return await RankingService.get_certificate_leaderboard(timeframe, limit)

@router.get("/achievements")
async def get_achievement_leaderboard(
    timeframe: str = Query("all", regex="^(week|month|year|all)$"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get achievement leaderboard ranked by number of achievements"""
    return await RankingService.get_achievement_leaderboard(timeframe, limit)

@router.get("/my-position")
async def get_my_ranking_position(
    ranking_type: str = Query(..., regex="^(certificates|achievements)$"),
    current_user: User = Depends(get_current_user)
):
    """Get current user's ranking position"""
    return await RankingService.get_user_ranking_position(current_user.did, ranking_type)

@router.get("/stats")
async def get_ranking_stats(
    current_user: User = Depends(get_current_user)
):
    """Get overall ranking statistics"""
    try:
        # Get certificate stats
        cert_rankings = await RankingService.get_certificate_leaderboard(timeframe="all", limit=1000)
        cert_leaderboard = cert_rankings.get("leaderboard", [])
        
        # Get achievement stats
        achievement_rankings = await RankingService.get_achievement_leaderboard(timeframe="all", limit=1000)
        achievement_leaderboard = achievement_rankings.get("leaderboard", [])
        
        # Calculate statistics
        total_certificates = sum(user.get("total_certificates", 0) for user in cert_leaderboard)
        total_achievements = sum(user.get("total_achievements", 0) for user in achievement_leaderboard)
        total_points = sum(user.get("total_points", 0) for user in achievement_leaderboard)
        
        # Get user's positions
        user_cert_position = None
        user_achievement_position = None
        
        for i, user in enumerate(cert_leaderboard):
            if user["user_id"] == current_user.did:
                user_cert_position = i + 1
                break
        
        for i, user in enumerate(achievement_leaderboard):
            if user["user_id"] == current_user.did:
                user_achievement_position = i + 1
                break
        
        return {
            "success": True,
            "stats": {
                "total_users_with_certificates": len(cert_leaderboard),
                "total_users_with_achievements": len(achievement_leaderboard),
                "total_certificates_issued": total_certificates,
                "total_achievements_earned": total_achievements,
                "total_points_earned": total_points,
                "user_rankings": {
                    "certificate_rank": user_cert_position,
                    "achievement_rank": user_achievement_position
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Ranking stats retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Ranking stats retrieval failed")
