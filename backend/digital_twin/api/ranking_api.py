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
            
            # Get all users first to ensure everyone is included
            all_users = await User.find().to_list()
            user_rankings = {}
            
            # Initialize all users with 0 certificates
            for user in all_users:
                user_rankings[user.did] = {
                    "user_id": user.did,
                    "user_name": getattr(user, 'name', 'Anonymous'),
                    "user_email": getattr(user, 'email', None),
                    "avatar_url": getattr(user, 'avatar_url', None),
                    "certificate_count": 0,
                    "nft_certificate_count": 0,
                    "total_certificates": 0,
                    "latest_certificate": None,
                    "courses": [],
                    "nfts": []
                }
            
            # Get course completion certificates from enrollments
            try:
                enrollment_filter = {
                    "status": "completed",
                    "certificate_issued": True,
                    **time_filter
                }
                enrollments = await Enrollment.find(enrollment_filter).to_list()
                
                # Process enrollment results
                for enrollment in enrollments:
                    user_id = enrollment.user_id
                    if user_id in user_rankings:
                        user_rankings[user_id]["certificate_count"] += 1
                        user_rankings[user_id]["total_certificates"] += 1
                        user_rankings[user_id]["courses"].append({
                            "course_id": enrollment.course_id,
                            "completed_at": enrollment.completed_at,
                            "final_grade": getattr(enrollment, 'final_grade', None)
                        })
                        if not user_rankings[user_id]["latest_certificate"] or enrollment.completed_at > user_rankings[user_id]["latest_certificate"]:
                            user_rankings[user_id]["latest_certificate"] = enrollment.completed_at
                            
            except Exception as e:
                logger.warning(f"Enrollment query failed: {e}")
            
            # Get NFT certificates
            try:
                nft_time_filter = {}
                if timeframe != "all":
                    now = datetime.now(timezone.utc)
                    if timeframe == "week":
                        nft_time_filter = {"created_at": {"$gte": now - timedelta(weeks=1)}}
                    elif timeframe == "month":
                        nft_time_filter = {"created_at": {"$gte": now - timedelta(days=30)}}
                    elif timeframe == "year":
                        nft_time_filter = {"created_at": {"$gte": now - timedelta(days=365)}}
                
                nft_filter = {
                    "achievement_type": {"$in": ["course_completion", "skill_mastery", "certification"]},
                    **nft_time_filter
                }
                nft_records = await NFTRecord.find(nft_filter).to_list()
                
                # Process NFT results
                for nft in nft_records:
                    user_id = nft.owner_address
                    if user_id in user_rankings:
                        user_rankings[user_id]["nft_certificate_count"] += 1
                        user_rankings[user_id]["total_certificates"] += 1
                        user_rankings[user_id]["nfts"].append({
                            "token_id": nft.token_id,
                            "achievement_type": nft.achievement_type,
                            "title": getattr(nft.metadata, 'name', 'Certificate') if hasattr(nft, 'metadata') and nft.metadata else 'Certificate',
                            "created_at": nft.created_at
                        })
                        if not user_rankings[user_id]["latest_certificate"] or nft.created_at > user_rankings[user_id]["latest_certificate"]:
                            user_rankings[user_id]["latest_certificate"] = nft.created_at
                            
            except Exception as e:
                logger.warning(f"NFT certificate query failed: {e}")
            
            # Sort by total certificates (descending), then by latest certificate
            sorted_rankings = sorted(
                user_rankings.values(),
                key=lambda x: (x["total_certificates"], x["latest_certificate"] or datetime.min.replace(tzinfo=timezone.utc)),
                reverse=True
            )
            
            # Add rank numbers and limit results
            enhanced_rankings = []
            for i, ranking in enumerate(sorted_rankings[:limit]):
                ranking["rank"] = i + 1
                enhanced_rankings.append(ranking)
            
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
            
            # Get all users first to ensure everyone is included
            all_users = await User.find().to_list()
            user_rankings = {}
            
            # Initialize all users with 0 achievements
            for user in all_users:
                user_rankings[user.did] = {
                    "user_id": user.did,
                    "user_name": getattr(user, 'name', 'Anonymous'),
                    "user_email": getattr(user, 'email', None),
                    "avatar_url": getattr(user, 'avatar_url', None),
                    "achievement_count": 0,
                    "nft_achievement_count": 0,
                    "total_achievements": 0,
                    "total_points": 0,
                    "latest_achievement": None,
                    "achievements": [],
                    "nfts": []
                }
            
            # Get achievements from UserAchievement collection
            try:
                user_achievements = await UserAchievement.find(time_filter).to_list()
                
                # Process achievement results
                for ua in user_achievements:
                    user_id = ua.user_id
                    if user_id in user_rankings:
                        user_rankings[user_id]["achievement_count"] += 1
                        user_rankings[user_id]["total_achievements"] += 1
                        user_rankings[user_id]["total_points"] += getattr(ua, 'bonus_points', 0)
                        user_rankings[user_id]["achievements"].append({
                            "achievement_id": ua.achievement_id,
                            "title": "Achievement",  # We'll get this from the achievement lookup if needed
                            "tier": "bronze",  # Default tier
                            "points": getattr(ua, 'bonus_points', 0),
                            "earned_at": ua.earned_at
                        })
                        if not user_rankings[user_id]["latest_achievement"] or ua.earned_at > user_rankings[user_id]["latest_achievement"]:
                            user_rankings[user_id]["latest_achievement"] = ua.earned_at
                            
            except Exception as e:
                logger.warning(f"UserAchievement query failed: {e}")
            
            # Get NFT achievements
            try:
                nft_time_filter = {}
                if timeframe != "all":
                    now = datetime.now(timezone.utc)
                    if timeframe == "week":
                        nft_time_filter = {"created_at": {"$gte": now - timedelta(weeks=1)}}
                    elif timeframe == "month":
                        nft_time_filter = {"created_at": {"$gte": now - timedelta(days=30)}}
                    elif timeframe == "year":
                        nft_time_filter = {"created_at": {"$gte": now - timedelta(days=365)}}
                
                nft_filter = {
                    "achievement_type": {"$in": ["achievement", "learning_milestone", "excellence_award"]},
                    **nft_time_filter
                }
                nft_records = await NFTRecord.find(nft_filter).to_list()
                
                # Process NFT results
                for nft in nft_records:
                    user_id = nft.owner_address
                    if user_id in user_rankings:
                        user_rankings[user_id]["nft_achievement_count"] += 1
                        user_rankings[user_id]["total_achievements"] += 1
                        user_rankings[user_id]["nfts"].append({
                            "token_id": nft.token_id,
                            "achievement_type": nft.achievement_type,
                            "title": getattr(nft.metadata, 'name', 'Achievement') if hasattr(nft, 'metadata') and nft.metadata else 'Achievement',
                            "created_at": nft.created_at
                        })
                        if not user_rankings[user_id]["latest_achievement"] or nft.created_at > user_rankings[user_id]["latest_achievement"]:
                            user_rankings[user_id]["latest_achievement"] = nft.created_at
                            
            except Exception as e:
                logger.warning(f"NFT achievement query failed: {e}")
            
            # Sort by total achievements (descending), then by total points, then by latest achievement
            sorted_rankings = sorted(
                user_rankings.values(),
                key=lambda x: (
                    x["total_achievements"], 
                    x["total_points"], 
                    x["latest_achievement"] or datetime.min.replace(tzinfo=timezone.utc)
                ),
                reverse=True
            )
            
            # Add rank numbers and limit results
            enhanced_rankings = []
            for i, ranking in enumerate(sorted_rankings[:limit]):
                ranking["rank"] = i + 1
                enhanced_rankings.append(ranking)
            
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
                all_rankings = await RankingService.get_certificate_leaderboard(timeframe="all", limit=10000)
                leaderboard = all_rankings.get("leaderboard", [])
            elif ranking_type == "achievements":
                # Get all achievement rankings
                all_rankings = await RankingService.get_achievement_leaderboard(timeframe="all", limit=10000)
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
                    "rank": len(leaderboard) + 1,  # Last position
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
        cert_rankings = await RankingService.get_certificate_leaderboard(timeframe="all", limit=10000)
        cert_leaderboard = cert_rankings.get("leaderboard", [])
        
        # Get achievement stats
        achievement_rankings = await RankingService.get_achievement_leaderboard(timeframe="all", limit=10000)
        achievement_leaderboard = achievement_rankings.get("leaderboard", [])
        
        # Calculate statistics
        total_certificates = sum(user.get("total_certificates", 0) for user in cert_leaderboard)
        total_achievements = sum(user.get("total_achievements", 0) for user in achievement_leaderboard)
        total_points = sum(user.get("total_points", 0) for user in achievement_leaderboard)
        
        # Get user's positions
        user_cert_position = None
        user_achievement_position = None
        
        for user in cert_leaderboard:
            if user["user_id"] == current_user.did:
                user_cert_position = user.get("rank")
                break
        
        for user in achievement_leaderboard:
            if user["user_id"] == current_user.did:
                user_achievement_position = user.get("rank")
                break
        
        return {
            "success": True,
            "stats": {
                "total_users_with_certificates": len([u for u in cert_leaderboard if u.get("total_certificates", 0) > 0]),
                "total_users_with_achievements": len([u for u in achievement_leaderboard if u.get("total_achievements", 0) > 0]),
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
