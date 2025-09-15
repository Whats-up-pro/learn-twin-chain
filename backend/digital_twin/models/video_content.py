"""
Video content management models for learning platform
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from beanie import Document, Indexed
from pymongo import IndexModel

class VideoQuality(BaseModel):
    """Video quality variant"""
    quality: str = Field(..., description="Quality identifier (1080p, 720p, 480p, 360p)")
    resolution: str = Field(..., description="Resolution (1920x1080, 1280x720, etc.)")
    bitrate: int = Field(..., description="Bitrate in kbps")
    file_size: int = Field(..., description="File size in bytes")
    storage_path: str = Field(..., description="Storage path for this quality")
    cdn_url: Optional[str] = Field(None, description="CDN URL for this quality")
    is_processed: bool = Field(default=False, description="Processing status")

class VideoThumbnail(BaseModel):
    """Video thumbnail information"""
    timestamp: float = Field(..., description="Timestamp in seconds")
    url: str = Field(..., description="Thumbnail URL")
    width: int = Field(default=320, description="Thumbnail width")
    height: int = Field(default=180, description="Thumbnail height")

class VideoSubtitle(BaseModel):
    """Video subtitle/caption information"""
    language: str = Field(..., description="Language code (en, es, fr, etc.)")
    label: str = Field(..., description="Display label (English, Spanish, etc.)")
    url: str = Field(..., description="Subtitle file URL")
    is_default: bool = Field(default=False, description="Default subtitle")
    is_auto_generated: bool = Field(default=False, description="Auto-generated or manual")

class VideoProcessingStatus(BaseModel):
    """Video processing status tracking"""
    status: str = Field(..., description="Processing status: pending, processing, completed, failed")
    progress: float = Field(default=0.0, ge=0.0, le=100.0, description="Processing progress percentage")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    started_at: Optional[datetime] = Field(None, description="Processing start time")
    completed_at: Optional[datetime] = Field(None, description="Processing completion time")
    processing_job_id: Optional[str] = Field(None, description="External processing job ID")

class VideoContent(Document):
    """Video content document with comprehensive metadata"""
    
    # Core identification
    video_id: Indexed(str, unique=True) = Field(..., description="Unique video identifier")
    lesson_id: Indexed(str) = Field(..., description="Associated lesson ID")
    course_id: Indexed(str) = Field(..., description="Associated course ID")
    
    # Basic information
    title: str = Field(..., description="Video title")
    description: Optional[str] = Field(None, description="Video description")
    duration: float = Field(..., description="Video duration in seconds")
    
    # File information
    original_filename: str = Field(..., description="Original uploaded filename")
    file_extension: str = Field(..., description="File extension (mp4, mov, avi, etc.)")
    original_file_size: int = Field(..., description="Original file size in bytes")
    mime_type: str = Field(..., description="MIME type")
    
    # Storage information
    storage_provider: str = Field(default="s3", description="Storage provider (s3, gcs, etc.)")
    bucket_name: str = Field(..., description="Storage bucket name")
    storage_path: str = Field(..., description="Storage path for original file")
    
    # Video qualities
    qualities: List[VideoQuality] = Field(default_factory=list, description="Available video qualities")
    default_quality: str = Field(default="720p", description="Default quality to serve")
    
    # Thumbnails and previews
    thumbnail_url: Optional[str] = Field(None, description="Main thumbnail URL")
    thumbnails: List[VideoThumbnail] = Field(default_factory=list, description="Video thumbnails")
    preview_gif_url: Optional[str] = Field(None, description="Preview GIF URL")
    
    # Subtitles and accessibility
    subtitles: List[VideoSubtitle] = Field(default_factory=list, description="Available subtitles")
    has_auto_subtitles: bool = Field(default=False, description="Has auto-generated subtitles")
    
    # Processing status
    processing_status: VideoProcessingStatus = Field(..., description="Processing status")
    
    # Access control
    is_public: bool = Field(default=False, description="Public access")
    access_level: str = Field(default="enrolled", description="Access level: public, enrolled, premium")
    allowed_domains: List[str] = Field(default_factory=list, description="Allowed domains for embedding")
    
    # Analytics and engagement
    view_count: int = Field(default=0, description="Total view count")
    unique_viewers: int = Field(default=0, description="Unique viewer count")
    average_watch_time: float = Field(default=0.0, description="Average watch time in seconds")
    completion_rate: float = Field(default=0.0, ge=0.0, le=100.0, description="Completion rate percentage")
    
    # Technical metadata
    video_codec: Optional[str] = Field(None, description="Video codec (h264, h265, etc.)")
    audio_codec: Optional[str] = Field(None, description="Audio codec (aac, mp3, etc.)")
    frame_rate: Optional[float] = Field(None, description="Frame rate (fps)")
    aspect_ratio: Optional[str] = Field(None, description="Aspect ratio (16:9, 4:3, etc.)")
    
    # Timestamps
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed_at: Optional[datetime] = Field(None, description="Processing completion time")
    last_accessed_at: Optional[datetime] = Field(None, description="Last access time")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "video_content"
        indexes = [
            IndexModel("video_id", unique=True),
            IndexModel("lesson_id"),
            IndexModel("course_id"),
            IndexModel("processing_status.status"),
            IndexModel("uploaded_at"),
            [("course_id", 1), ("lesson_id", 1)],
        ]
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "video_id": self.video_id,
            "lesson_id": self.lesson_id,
            "course_id": self.course_id,
            "title": self.title,
            "description": self.description,
            "duration": self.duration,
            "original_filename": self.original_filename,
            "file_extension": self.file_extension,
            "original_file_size": self.original_file_size,
            "mime_type": self.mime_type,
            "storage_provider": self.storage_provider,
            "bucket_name": self.bucket_name,
            "storage_path": self.storage_path,
            "qualities": [q.dict() for q in self.qualities],
            "default_quality": self.default_quality,
            "thumbnail_url": self.thumbnail_url,
            "thumbnails": [t.dict() for t in self.thumbnails],
            "preview_gif_url": self.preview_gif_url,
            "subtitles": [s.dict() for s in self.subtitles],
            "has_auto_subtitles": self.has_auto_subtitles,
            "processing_status": self.processing_status.dict(),
            "is_public": self.is_public,
            "access_level": self.access_level,
            "allowed_domains": self.allowed_domains,
            "view_count": self.view_count,
            "unique_viewers": self.unique_viewers,
            "average_watch_time": self.average_watch_time,
            "completion_rate": self.completion_rate,
            "video_codec": self.video_codec,
            "audio_codec": self.audio_codec,
            "frame_rate": self.frame_rate,
            "aspect_ratio": self.aspect_ratio,
            "uploaded_at": self.uploaded_at,
            "processed_at": self.processed_at,
            "last_accessed_at": self.last_accessed_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

class VideoUploadSession(Document):
    """Video upload session for chunked uploads"""
    
    # Session identification
    session_id: Indexed(str, unique=True) = Field(..., description="Upload session ID")
    user_id: Indexed(str) = Field(..., description="User ID")
    lesson_id: str = Field(..., description="Target lesson ID")
    
    # Upload information
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="Total file size")
    chunk_size: int = Field(default=5 * 1024 * 1024, description="Chunk size in bytes (5MB default)")
    total_chunks: int = Field(..., description="Total number of chunks")
    uploaded_chunks: List[int] = Field(default_factory=list, description="List of uploaded chunk numbers")
    
    # Upload status
    status: str = Field(default="uploading", description="Upload status: uploading, completed, failed")
    progress: float = Field(default=0.0, ge=0.0, le=100.0, description="Upload progress percentage")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    
    # Storage information
    temp_storage_path: str = Field(..., description="Temporary storage path")
    final_storage_path: Optional[str] = Field(None, description="Final storage path after completion")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(..., description="Session expiration time")
    
    class Settings:
        name = "video_upload_sessions"
        indexes = [
            IndexModel("session_id", unique=True),
            IndexModel("user_id"),
            IndexModel("lesson_id"),
            IndexModel("status"),
            IndexModel("expires_at"),
        ]

# Request/Response models
class VideoUploadRequest(BaseModel):
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    lesson_id: str = Field(..., description="Target lesson ID")
    chunk_size: Optional[int] = Field(default=5 * 1024 * 1024, description="Chunk size in bytes")

class VideoUploadResponse(BaseModel):
    session_id: str
    upload_url: str
    chunk_size: int
    total_chunks: int
    expires_at: datetime

class VideoMetadataUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    access_level: Optional[str] = None
    allowed_domains: Optional[List[str]] = None

class VideoStreamingUrlResponse(BaseModel):
    video_id: str
    streaming_url: str
    thumbnail_url: Optional[str] = None
    subtitles: List[VideoSubtitle] = []
    qualities: List[VideoQuality] = []
    duration: float
    title: str
