"""
Video learning settings API endpoints
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
import logging

from ..models.video_settings import (
    VideoLearningSettings, VideoSession,
    VideoSettingsUpdateRequest, VideoSessionCreateRequest, VideoSessionUpdateRequest,
    VideoSettingsResponse, VideoSessionResponse,
    PlaybackSpeed, VideoQuality, CaptionLanguage
)
from ..models.user import User
from ..dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# ============ VIDEO SETTINGS ENDPOINTS ============

@router.get("/video-settings", response_model=VideoSettingsResponse)
async def get_video_settings(current_user: User = Depends(get_current_user)):
    """Get user's video learning settings"""
    try:
        settings = await VideoLearningSettings.find_one({"user_id": current_user.did})
        
        if not settings:
            # Create default settings if none exist
            settings = VideoLearningSettings(user_id=current_user.did)
            await settings.save()
        
        return VideoSettingsResponse(**settings.to_dict())
        
    except Exception as e:
        logger.error(f"Failed to get video settings for user {current_user.did}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve video settings")

@router.put("/video-settings", response_model=VideoSettingsResponse)
async def update_video_settings(
    request: VideoSettingsUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user's video learning settings"""
    try:
        settings = await VideoLearningSettings.find_one({"user_id": current_user.did})
        
        if not settings:
            settings = VideoLearningSettings(user_id=current_user.did)
        
        # Update fields if provided
        update_data = request.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(settings, field):
                setattr(settings, field, value)
        
        settings.updated_at = datetime.now(timezone.utc)
        await settings.save()
        
        return VideoSettingsResponse(**settings.to_dict())
        
    except Exception as e:
        logger.error(f"Failed to update video settings for user {current_user.did}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update video settings")

@router.put("/video-settings/reset")
async def reset_video_settings(current_user: User = Depends(get_current_user)):
    """Reset video settings to defaults"""
    try:
        # Delete existing settings
        await VideoLearningSettings.find_one({"user_id": current_user.did}).delete()
        
        # Create new default settings
        settings = VideoLearningSettings(user_id=current_user.did)
        await settings.save()
        
        return {"message": "Video settings reset to defaults"}
        
    except Exception as e:
        logger.error(f"Failed to reset video settings for user {current_user.did}: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset video settings")

@router.get("/video-settings/export")
async def export_video_settings(current_user: User = Depends(get_current_user)):
    """Export video settings as JSON"""
    try:
        settings = await VideoLearningSettings.find_one({"user_id": current_user.did})
        
        if not settings:
            settings = VideoLearningSettings(user_id=current_user.did)
            await settings.save()
        
        return {
            "user_id": current_user.did,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "settings": settings.to_dict()
        }
        
    except Exception as e:
        logger.error(f"Failed to export video settings for user {current_user.did}: {e}")
        raise HTTPException(status_code=500, detail="Failed to export video settings")

# ============ VIDEO SESSION ENDPOINTS ============

@router.post("/video-sessions", response_model=VideoSessionResponse)
async def create_video_session(
    request: VideoSessionCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new video learning session"""
    try:
        # Generate unique session ID
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        
        # Create session
        session = VideoSession(
            session_id=session_id,
            user_id=current_user.did,
            course_id=request.course_id,
            module_id=request.module_id,
            lesson_id=request.lesson_id,
            video_url=request.video_url,
            video_duration=request.video_duration,
            device_type=request.device_type,
            browser=request.browser
        )
        
        await session.save()
        
        return VideoSessionResponse(**session.to_dict())
        
    except Exception as e:
        logger.error(f"Failed to create video session for user {current_user.did}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create video session")

@router.get("/video-sessions/{session_id}", response_model=VideoSessionResponse)
async def get_video_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific video session"""
    try:
        session = await VideoSession.find_one({
            "session_id": session_id,
            "user_id": current_user.did
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Video session not found")
        
        return VideoSessionResponse(**session.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get video session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve video session")

@router.put("/video-sessions/{session_id}", response_model=VideoSessionResponse)
async def update_video_session(
    session_id: str,
    request: VideoSessionUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update a video session"""
    try:
        session = await VideoSession.find_one({
            "session_id": session_id,
            "user_id": current_user.did
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Video session not found")
        
        # Update fields if provided
        update_data = request.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(session, field):
                if field == "completed" and value:
                    session.completed_at = datetime.now(timezone.utc)
                elif field != "completed":
                    setattr(session, field, value)
        
        session.last_activity_at = datetime.now(timezone.utc)
        await session.save()
        
        return VideoSessionResponse(**session.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update video session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update video session")

@router.get("/video-sessions/", response_model=List[VideoSessionResponse])
async def get_user_video_sessions(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    module_id: Optional[str] = Query(None, description="Filter by module ID"),
    lesson_id: Optional[str] = Query(None, description="Filter by lesson ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    current_user: User = Depends(get_current_user)
):
    """Get user's video sessions with filtering"""
    try:
        # Build filter query
        filter_query = {"user_id": current_user.did}
        
        if course_id:
            filter_query["course_id"] = course_id
        if module_id:
            filter_query["module_id"] = module_id
        if lesson_id:
            filter_query["lesson_id"] = lesson_id
        
        # Get sessions
        sessions = await VideoSession.find(filter_query).sort("-started_at").skip(skip).limit(limit).to_list()
        
        return [VideoSessionResponse(**session.to_dict()) for session in sessions]
        
    except Exception as e:
        logger.error(f"Failed to get video sessions for user {current_user.did}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve video sessions")

@router.delete("/video-sessions/{session_id}")
async def delete_video_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a video session"""
    try:
        session = await VideoSession.find_one({
            "session_id": session_id,
            "user_id": current_user.did
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Video session not found")
        
        await session.delete()
        
        return {"message": "Video session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete video session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete video session")

# ============ ANALYTICS ENDPOINTS ============

@router.get("/video-sessions/analytics")
async def get_video_analytics(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user)
):
    """Get video learning analytics for user"""
    try:
        from datetime import timedelta
        
        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Build filter query
        filter_query = {
            "user_id": current_user.did,
            "started_at": {"$gte": start_date, "$lte": end_date}
        }
        
        if course_id:
            filter_query["course_id"] = course_id
        
        # Get sessions
        sessions = await VideoSession.find(filter_query).to_list()
        
        # Calculate analytics
        total_sessions = len(sessions)
        total_watch_time = sum(session.watch_time for session in sessions)
        total_video_duration = sum(session.video_duration for session in sessions)
        average_completion = sum(session.completion_percentage for session in sessions) / total_sessions if total_sessions > 0 else 0
        
        # Device breakdown
        device_stats = {}
        for session in sessions:
            device = session.device_type
            device_stats[device] = device_stats.get(device, 0) + 1
        
        # Quality usage
        quality_stats = {}
        for session in sessions:
            if session.quality_used:
                quality = session.quality_used
                quality_stats[quality] = quality_stats.get(quality, 0) + 1
        
        # Daily activity
        daily_activity = {}
        for session in sessions:
            date = session.started_at.date().isoformat()
            if date not in daily_activity:
                daily_activity[date] = {"sessions": 0, "watch_time": 0}
            daily_activity[date]["sessions"] += 1
            daily_activity[date]["watch_time"] += session.watch_time
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "summary": {
                "total_sessions": total_sessions,
                "total_watch_time": total_watch_time,
                "total_video_duration": total_video_duration,
                "average_completion_percentage": round(average_completion, 2),
                "engagement_rate": round((total_watch_time / total_video_duration * 100) if total_video_duration > 0 else 0, 2)
            },
            "device_breakdown": device_stats,
            "quality_usage": quality_stats,
            "daily_activity": daily_activity
        }
        
    except Exception as e:
        logger.error(f"Failed to get video analytics for user {current_user.did}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve video analytics")

# ============ UTILITY ENDPOINTS ============

@router.get("/video-settings/available-options")
async def get_available_options():
    """Get available options for video settings"""
    return {
        "playback_speeds": [speed.value for speed in PlaybackSpeed],
        "video_qualities": [quality.value for quality in VideoQuality],
        "caption_languages": [lang.value for lang in CaptionLanguage],
        "caption_sizes": ["small", "medium", "large"],
        "caption_colors": ["white", "yellow", "green", "blue", "red", "black"],
        "device_types": ["desktop", "mobile", "tablet"],
        "notification_types": [
            "lesson_complete",
            "module_complete", 
            "quiz_available",
            "achievement_earned",
            "discussion_reply",
            "course_update"
        ]
    }
