"""
Video content management API endpoints
"""
import os
import uuid
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
import boto3
from botocore.exceptions import ClientError
import logging

from ..models.video_content import (
    VideoContent, VideoUploadSession, VideoQuality, VideoThumbnail, 
    VideoSubtitle, VideoProcessingStatus, VideoUploadRequest, 
    VideoUploadResponse, VideoMetadataUpdateRequest, VideoStreamingUrlResponse
)
from ..models.video_settings import VideoLearningSettings, VideoQuality as PrefQuality
from ..models.user import User
from ..dependencies import get_current_user, require_permission
from ..services.video_processing_service import VideoProcessingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/videos", tags=["videos"])

# Initialize services
video_processing_service = VideoProcessingService()

# AWS S3 configuration (you can also use Google Cloud Storage)
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "learn-twin-videos")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
CDN_BASE_URL = os.getenv("CDN_BASE_URL")

# Initialize S3 client
s3_client = boto3.client(
    's3',
    region_name=S3_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

@router.post("/upload/initiate", response_model=VideoUploadResponse)
async def initiate_video_upload(
    request: VideoUploadRequest,
    current_user: User = Depends(get_current_user)
):
    """Initiate a chunked video upload session"""
    try:
        # Validate file size (max 2GB)
        if request.file_size > 2 * 1024 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size too large. Maximum 2GB allowed.")
        
        # Validate file type
        allowed_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
        file_ext = os.path.splitext(request.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}")
        
        # Create upload session
        session_id = str(uuid.uuid4())
        total_chunks = (request.file_size + request.chunk_size - 1) // request.chunk_size
        
        # Create temporary storage path
        temp_path = f"uploads/temp/{session_id}/{request.filename}"
        
        upload_session = VideoUploadSession(
            session_id=session_id,
            user_id=current_user.user_id,
            lesson_id=request.lesson_id,
            filename=request.filename,
            file_size=request.file_size,
            chunk_size=request.chunk_size,
            total_chunks=total_chunks,
            temp_storage_path=temp_path,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)  # 24 hour expiry
        )
        
        await upload_session.insert()
        
        # Generate presigned URL for upload
        upload_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': temp_path,
                'ContentType': 'application/octet-stream'
            },
            ExpiresIn=3600  # 1 hour
        )
        
        return VideoUploadResponse(
            session_id=session_id,
            upload_url=upload_url,
            chunk_size=request.chunk_size,
            total_chunks=total_chunks,
            expires_at=upload_session.expires_at
        )
        
    except Exception as e:
        logger.error(f"Failed to initiate video upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate video upload")

@router.post("/upload/chunk/{session_id}")
async def upload_chunk(
    session_id: str,
    chunk_number: int = Form(...),
    chunk_data: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a video chunk"""
    try:
        # Get upload session
        upload_session = await VideoUploadSession.find_one({"session_id": session_id})
        if not upload_session:
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        # Verify user ownership
        if upload_session.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if session is expired
        if datetime.now(timezone.utc) > upload_session.expires_at:
            raise HTTPException(status_code=410, detail="Upload session expired")
        
        # Validate chunk number
        if chunk_number < 0 or chunk_number >= upload_session.total_chunks:
            raise HTTPException(status_code=400, detail="Invalid chunk number")
        
        # Check if chunk already uploaded
        if chunk_number in upload_session.uploaded_chunks:
            return {"message": "Chunk already uploaded", "chunk_number": chunk_number}
        
        # Upload chunk to S3
        chunk_key = f"{upload_session.temp_storage_path}.chunk_{chunk_number}"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=chunk_key,
            Body=chunk_data.file.read(),
            ContentType='application/octet-stream'
        )
        
        # Update session
        upload_session.uploaded_chunks.append(chunk_number)
        upload_session.progress = (len(upload_session.uploaded_chunks) / upload_session.total_chunks) * 100
        upload_session.updated_at = datetime.now(timezone.utc)
        
        # Check if all chunks uploaded
        if len(upload_session.uploaded_chunks) == upload_session.total_chunks:
            upload_session.status = "completed"
            # Trigger video processing
            await process_uploaded_video(upload_session)
        
        await upload_session.save()
        
        return {
            "message": "Chunk uploaded successfully",
            "chunk_number": chunk_number,
            "progress": upload_session.progress,
            "status": upload_session.status
        }
        
    except Exception as e:
        logger.error(f"Failed to upload chunk: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload chunk")

async def process_uploaded_video(upload_session: VideoUploadSession):
    """Process uploaded video after all chunks are received"""
    try:
        # Combine chunks into final video file
        final_key = f"videos/{upload_session.lesson_id}/{upload_session.filename}"
        
        # Download and combine chunks
        combined_data = b""
        for chunk_number in range(upload_session.total_chunks):
            chunk_key = f"{upload_session.temp_storage_path}.chunk_{chunk_number}"
            
            response = s3_client.get_object(Bucket=S3_BUCKET, Key=chunk_key)
            combined_data += response['Body'].read()
        
        # Upload final video
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=final_key,
            Body=combined_data,
            ContentType='video/mp4'
        )
        
        # Clean up chunks
        for chunk_number in range(upload_session.total_chunks):
            chunk_key = f"{upload_session.temp_storage_path}.chunk_{chunk_number}"
            s3_client.delete_object(Bucket=S3_BUCKET, Key=chunk_key)
        
        # Create video content record
        video_id = str(uuid.uuid4())
        video_content = VideoContent(
            video_id=video_id,
            lesson_id=upload_session.lesson_id,
            course_id="",  # Will be updated from lesson
            title=os.path.splitext(upload_session.filename)[0],
            duration=0.0,  # Will be updated after processing
            original_filename=upload_session.filename,
            file_extension=os.path.splitext(upload_session.filename)[1],
            original_file_size=upload_session.file_size,
            mime_type='video/mp4',
            storage_provider='s3',
            bucket_name=S3_BUCKET,
            storage_path=final_key,
            processing_status=VideoProcessingStatus(
                status="processing",
                progress=0.0,
                started_at=datetime.now(timezone.utc)
            )
        )
        
        await video_content.insert()
        
        # Update upload session
        upload_session.final_storage_path = final_key
        await upload_session.save()
        
        # Start video processing
        await video_processing_service.process_video(video_content)
        
    except Exception as e:
        logger.error(f"Failed to process uploaded video: {e}")
        # Update processing status to failed
        if 'video_content' in locals():
            video_content.processing_status.status = "failed"
            video_content.processing_status.error_message = str(e)
            await video_content.save()

@router.get("/stream/{video_id}")
async def get_video_streaming_url(
    video_id: str,
    quality: Optional[str] = Query(None, description="Video quality (optional; falls back to user settings)"),
    current_user: User = Depends(get_current_user)
):
    """Get video streaming URL with access control"""
    try:
        # Get video content
        video_content = await VideoContent.find_one({"video_id": video_id})
        if not video_content:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check access permissions
        if not video_content.is_public and video_content.access_level == "enrolled":
            # Add your enrollment check logic here
            pass
        
        # Helper to estimate height from resolution/label
        def get_height(q: VideoQuality) -> int:
            try:
                if q.resolution:
                    parts = q.resolution.lower().split("x")
                    if len(parts) == 2:
                        return int(parts[1])
            except Exception:
                pass
            try:
                if q.quality and q.quality.endswith('p'):
                    return int(q.quality[:-1])
            except Exception:
                pass
            return 0

        quality_by_label = {q.quality: q for q in video_content.qualities}
        selected_quality: Optional[VideoQuality] = None

        # 1) Use explicit query param if valid
        if quality and quality in quality_by_label:
            selected_quality = quality_by_label[quality]

        # 2) Apply user video settings selection
        if not selected_quality:
            user_settings = await VideoLearningSettings.find_one({"user_id": current_user.did})

            available = sorted(list(video_content.qualities), key=lambda q: get_height(q), reverse=True)

            if user_settings and user_settings.data_saver_mode:
                available = [q for q in available if get_height(q) <= 480]

            if user_settings and user_settings.bandwidth_limit:
                try:
                    limit_kbps = int(user_settings.bandwidth_limit)
                    available = [q for q in available if (q.bitrate or 0) <= limit_kbps]
                except Exception:
                    pass

            def pick_by_preference(pref: PrefQuality) -> Optional[VideoQuality]:
                if pref in (PrefQuality.AUTO, PrefQuality.UHD):
                    # AUTO means highest available after filters; UHD prefers 2160p if present
                    if pref == PrefQuality.UHD:
                        preferred = [q for q in available if get_height(q) >= 2160]
                        if preferred:
                            return preferred[0]
                    return available[0] if available else None
                if pref == PrefQuality.HD:
                    preferred = [q for q in available if get_height(q) >= 1080]
                    return preferred[0] if preferred else (available[0] if available else None)
                if pref == PrefQuality.HIGH:
                    preferred = [q for q in available if get_height(q) >= 720]
                    return preferred[0] if preferred else (available[0] if available else None)
                if pref == PrefQuality.MEDIUM:
                    preferred = [q for q in available if 480 <= get_height(q) < 720]
                    return preferred[0] if preferred else (available[-1] if available else None)
                if pref == PrefQuality.LOW:
                    preferred = [q for q in available if get_height(q) <= 360]
                    return preferred[0] if preferred else (available[-1] if available else None)
                return available[0] if available else None

            if user_settings:
                selected_quality = pick_by_preference(user_settings.preferred_quality)

        # 3) Fallbacks: default quality then highest
        if not selected_quality and video_content.default_quality in quality_by_label:
            selected_quality = quality_by_label[video_content.default_quality]
        if not selected_quality and video_content.qualities:
            selected_quality = max(video_content.qualities, key=get_height)
        
        if not selected_quality:
            raise HTTPException(status_code=404, detail="Requested quality not available")
        
        # Generate streaming URL
        # Prefer the stored cdn_url (which may be a direct S3 URL in this setup)
        streaming_url = selected_quality.cdn_url
        if not streaming_url:
            if CDN_BASE_URL:
                streaming_url = f"{CDN_BASE_URL}/{selected_quality.storage_path}"
            else:
                streaming_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{selected_quality.storage_path}"
        
        # Update access tracking
        video_content.last_accessed_at = datetime.now(timezone.utc)
        video_content.view_count += 1
        await video_content.save()
        
        return VideoStreamingUrlResponse(
            video_id=video_id,
            streaming_url=streaming_url,
            thumbnail_url=video_content.thumbnail_url,
            subtitles=video_content.subtitles,
            qualities=[q.dict() for q in video_content.qualities],
            duration=video_content.duration,
            title=video_content.title
        )
        
    except Exception as e:
        logger.error(f"Failed to get video streaming URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to get video streaming URL")

@router.get("/{video_id}/status")
async def get_video_processing_status(
    video_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get video processing status"""
    try:
        video_content = await VideoContent.find_one({"video_id": video_id})
        if not video_content:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "video_id": video_id,
            "status": video_content.processing_status.status,
            "progress": video_content.processing_status.progress,
            "error_message": video_content.processing_status.error_message,
            "started_at": video_content.processing_status.started_at,
            "completed_at": video_content.processing_status.completed_at
        }
        
    except Exception as e:
        logger.error(f"Failed to get video status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get video status")

@router.put("/{video_id}/metadata")
async def update_video_metadata(
    video_id: str,
    request: VideoMetadataUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update video metadata"""
    try:
        video_content = await VideoContent.find_one({"video_id": video_id})
        if not video_content:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Update fields if provided
        if request.title is not None:
            video_content.title = request.title
        if request.description is not None:
            video_content.description = request.description
        if request.is_public is not None:
            video_content.is_public = request.is_public
        if request.access_level is not None:
            video_content.access_level = request.access_level
        if request.allowed_domains is not None:
            video_content.allowed_domains = request.allowed_domains
        
        video_content.updated_at = datetime.now(timezone.utc)
        await video_content.save()
        
        return {"message": "Video metadata updated successfully"}
        
    except Exception as e:
        logger.error(f"Failed to update video metadata: {e}")
        raise HTTPException(status_code=500, detail="Failed to update video metadata")

@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete video and all associated files"""
    try:
        video_content = await VideoContent.find_one({"video_id": video_id})
        if not video_content:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Delete from S3
        try:
            # Delete original file
            s3_client.delete_object(Bucket=S3_BUCKET, Key=video_content.storage_path)
            
            # Delete all quality variants
            for quality in video_content.qualities:
                s3_client.delete_object(Bucket=S3_BUCKET, Key=quality.storage_path)
            
            # Delete thumbnails
            for thumbnail in video_content.thumbnails:
                s3_client.delete_object(Bucket=S3_BUCKET, Key=thumbnail.url)
            
            # Delete subtitles
            for subtitle in video_content.subtitles:
                s3_client.delete_object(Bucket=S3_BUCKET, Key=subtitle.url)
                
        except ClientError as e:
            logger.warning(f"Failed to delete some files from S3: {e}")
        
        # Delete from database
        await video_content.delete()
        
        return {"message": "Video deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete video: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete video")

@router.get("/lesson/{lesson_id}")
async def get_lesson_videos(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all videos for a lesson"""
    try:
        videos = await VideoContent.find({"lesson_id": lesson_id}).to_list()
        
        return {
            "lesson_id": lesson_id,
            "videos": [video.to_dict() for video in videos]
        }
        
    except Exception as e:
        logger.error(f"Failed to get lesson videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to get lesson videos")
