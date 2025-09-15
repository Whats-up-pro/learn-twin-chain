"""
Video learning settings models
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from beanie import Document, Indexed
from pydantic import Field, BaseModel
from pymongo import IndexModel
from enum import Enum

class PlaybackSpeed(str, Enum):
    SLOW_25 = "0.25"
    SLOW_50 = "0.5"
    NORMAL = "1.0"
    FAST_125 = "1.25"
    FAST_150 = "1.5"
    FAST_175 = "1.75"
    FAST_200 = "2.0"

class VideoQuality(str, Enum):
    AUTO = "auto"
    LOW = "240p"
    MEDIUM = "480p"
    HIGH = "720p"
    HD = "1080p"
    UHD = "2160p"

class CaptionLanguage(str, Enum):
    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    CHINESE = "zh"
    JAPANESE = "ja"
    KOREAN = "ko"
    VIETNAMESE = "vi"

class NotificationType(str, Enum):
    LESSON_COMPLETE = "lesson_complete"
    MODULE_COMPLETE = "module_complete"
    QUIZ_AVAILABLE = "quiz_available"
    ACHIEVEMENT_EARNED = "achievement_earned"
    DISCUSSION_REPLY = "discussion_reply"
    COURSE_UPDATE = "course_update"

class VideoLearningSettings(Document):
    """Video learning settings for individual users"""
    
    # User reference
    user_id: Indexed(str, unique=True) = Field(..., description="User ID")
    
    # Video playback settings
    default_playback_speed: PlaybackSpeed = Field(default=PlaybackSpeed.NORMAL, description="Default playback speed")
    remember_playback_speed: bool = Field(default=True, description="Remember last used playback speed")
    auto_play: bool = Field(default=False, description="Auto-play next video")
    auto_advance: bool = Field(default=True, description="Auto-advance to next lesson when current is complete")
    
    # Video quality settings
    preferred_quality: VideoQuality = Field(default=VideoQuality.AUTO, description="Preferred video quality")
    bandwidth_limit: Optional[int] = Field(None, description="Bandwidth limit in kbps")
    data_saver_mode: bool = Field(default=False, description="Enable data saver mode")
    
    # Caption and accessibility settings
    captions_enabled: bool = Field(default=True, description="Enable captions by default")
    caption_language: CaptionLanguage = Field(default=CaptionLanguage.ENGLISH, description="Preferred caption language")
    caption_size: str = Field(default="medium", description="Caption size (small, medium, large)")
    caption_color: str = Field(default="white", description="Caption color")
    caption_background: bool = Field(default=True, description="Show caption background")
    
    # Audio settings
    volume: float = Field(default=1.0, ge=0.0, le=1.0, description="Default volume level")
    remember_volume: bool = Field(default=True, description="Remember last used volume")
    audio_only_mode: bool = Field(default=False, description="Audio-only mode for mobile")
    
    # Learning behavior settings
    pause_on_tab_switch: bool = Field(default=True, description="Pause video when switching tabs")
    show_progress_bar: bool = Field(default=True, description="Show progress bar")
    show_time_remaining: bool = Field(default=True, description="Show time remaining")
    show_lesson_notes: bool = Field(default=True, description="Show lesson notes panel")
    show_discussion_panel: bool = Field(default=True, description="Show discussion panel")
    
    # Notification settings
    notifications: Dict[str, bool] = Field(
        default_factory=lambda: {
            "lesson_complete": True,
            "module_complete": True,
            "quiz_available": True,
            "achievement_earned": True,
            "discussion_reply": True,
            "course_update": True,
        },
        description="Notification preferences"
    )
    
    # Study session settings
    study_reminders: bool = Field(default=True, description="Enable study reminders")
    reminder_frequency: int = Field(default=24, description="Reminder frequency in hours")
    break_reminders: bool = Field(default=True, description="Enable break reminders")
    break_interval: int = Field(default=25, description="Break interval in minutes (Pomodoro)")
    
    # Progress tracking settings
    track_watch_time: bool = Field(default=True, description="Track video watch time")
    track_pause_events: bool = Field(default=True, description="Track pause/play events")
    track_seek_events: bool = Field(default=True, description="Track seek/scrub events")
    track_completion_events: bool = Field(default=True, description="Track completion events")
    
    # Privacy settings
    share_progress: bool = Field(default=True, description="Share progress with instructors")
    share_learning_analytics: bool = Field(default=True, description="Share learning analytics")
    anonymous_analytics: bool = Field(default=True, description="Allow anonymous analytics")
    
    # Advanced settings
    keyboard_shortcuts: bool = Field(default=True, description="Enable keyboard shortcuts")
    picture_in_picture: bool = Field(default=True, description="Enable picture-in-picture")
    fullscreen_on_play: bool = Field(default=False, description="Enter fullscreen on play")
    skip_intro: bool = Field(default=False, description="Skip video intro/outro")
    
    # Custom preferences
    custom_preferences: Dict[str, Any] = Field(default_factory=dict, description="Custom user preferences")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "video_learning_settings"
        indexes = [
            IndexModel("user_id", unique=True),
        ]
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "user_id": self.user_id,
            "default_playback_speed": self.default_playback_speed,
            "remember_playback_speed": self.remember_playback_speed,
            "auto_play": self.auto_play,
            "auto_advance": self.auto_advance,
            "preferred_quality": self.preferred_quality,
            "bandwidth_limit": self.bandwidth_limit,
            "data_saver_mode": self.data_saver_mode,
            "captions_enabled": self.captions_enabled,
            "caption_language": self.caption_language,
            "caption_size": self.caption_size,
            "caption_color": self.caption_color,
            "caption_background": self.caption_background,
            "volume": self.volume,
            "remember_volume": self.remember_volume,
            "audio_only_mode": self.audio_only_mode,
            "pause_on_tab_switch": self.pause_on_tab_switch,
            "show_progress_bar": self.show_progress_bar,
            "show_time_remaining": self.show_time_remaining,
            "show_lesson_notes": self.show_lesson_notes,
            "show_discussion_panel": self.show_discussion_panel,
            "notifications": self.notifications,
            "study_reminders": self.study_reminders,
            "reminder_frequency": self.reminder_frequency,
            "break_reminders": self.break_reminders,
            "break_interval": self.break_interval,
            "track_watch_time": self.track_watch_time,
            "track_pause_events": self.track_pause_events,
            "track_seek_events": self.track_seek_events,
            "track_completion_events": self.track_completion_events,
            "share_progress": self.share_progress,
            "share_learning_analytics": self.share_learning_analytics,
            "anonymous_analytics": self.anonymous_analytics,
            "keyboard_shortcuts": self.keyboard_shortcuts,
            "picture_in_picture": self.picture_in_picture,
            "fullscreen_on_play": self.fullscreen_on_play,
            "skip_intro": self.skip_intro,
            "custom_preferences": self.custom_preferences,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

class VideoSession(Document):
    """Video learning session tracking"""
    
    # Session identification
    session_id: Indexed(str, unique=True) = Field(..., description="Unique session ID")
    user_id: Indexed(str) = Field(..., description="User ID")
    course_id: str = Field(..., description="Course ID")
    module_id: str = Field(..., description="Module ID")
    lesson_id: str = Field(..., description="Lesson ID")
    
    # Session data
    video_url: str = Field(..., description="Video URL")
    video_duration: float = Field(..., description="Video duration in seconds")
    watch_time: float = Field(default=0.0, description="Total watch time in seconds")
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0, description="Completion percentage")
    
    # Interaction tracking
    play_events: List[Dict[str, Any]] = Field(default_factory=list, description="Play events")
    pause_events: List[Dict[str, Any]] = Field(default_factory=list, description="Pause events")
    seek_events: List[Dict[str, Any]] = Field(default_factory=list, description="Seek events")
    volume_changes: List[Dict[str, Any]] = Field(default_factory=list, description="Volume change events")
    speed_changes: List[Dict[str, Any]] = Field(default_factory=list, description="Speed change events")
    
    # Session metadata
    device_type: str = Field(default="desktop", description="Device type (desktop, mobile, tablet)")
    browser: Optional[str] = Field(None, description="Browser information")
    quality_used: Optional[str] = Field(None, description="Video quality used")
    bandwidth_used: Optional[float] = Field(None, description="Bandwidth used in MB")
    
    # Timestamps
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = Field(None, description="Session completion time")
    
    class Settings:
        name = "video_sessions"
        indexes = [
            IndexModel("session_id", unique=True),
            IndexModel("user_id"),
            IndexModel("lesson_id"),
            IndexModel("started_at"),
            [("user_id", 1), ("lesson_id", 1)],
        ]
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "module_id": self.module_id,
            "lesson_id": self.lesson_id,
            "video_url": self.video_url,
            "video_duration": self.video_duration,
            "watch_time": self.watch_time,
            "completion_percentage": self.completion_percentage,
            "play_events": self.play_events,
            "pause_events": self.pause_events,
            "seek_events": self.seek_events,
            "volume_changes": self.volume_changes,
            "speed_changes": self.speed_changes,
            "device_type": self.device_type,
            "browser": self.browser,
            "quality_used": self.quality_used,
            "bandwidth_used": self.bandwidth_used,
            "started_at": self.started_at,
            "last_activity_at": self.last_activity_at,
            "completed_at": self.completed_at
        }

# Request/Response models
class VideoSettingsUpdateRequest(BaseModel):
    # Video playback settings
    default_playback_speed: Optional[PlaybackSpeed] = None
    remember_playback_speed: Optional[bool] = None
    auto_play: Optional[bool] = None
    auto_advance: Optional[bool] = None
    
    # Video quality settings
    preferred_quality: Optional[VideoQuality] = None
    bandwidth_limit: Optional[int] = None
    data_saver_mode: Optional[bool] = None
    
    # Caption and accessibility settings
    captions_enabled: Optional[bool] = None
    caption_language: Optional[CaptionLanguage] = None
    caption_size: Optional[str] = None
    caption_color: Optional[str] = None
    caption_background: Optional[bool] = None
    
    # Audio settings
    volume: Optional[float] = Field(None, ge=0.0, le=1.0)
    remember_volume: Optional[bool] = None
    audio_only_mode: Optional[bool] = None
    
    # Learning behavior settings
    pause_on_tab_switch: Optional[bool] = None
    show_progress_bar: Optional[bool] = None
    show_time_remaining: Optional[bool] = None
    show_lesson_notes: Optional[bool] = None
    show_discussion_panel: Optional[bool] = None
    
    # Notification settings
    notifications: Optional[Dict[str, bool]] = None
    
    # Study session settings
    study_reminders: Optional[bool] = None
    reminder_frequency: Optional[int] = None
    break_reminders: Optional[bool] = None
    break_interval: Optional[int] = None
    
    # Progress tracking settings
    track_watch_time: Optional[bool] = None
    track_pause_events: Optional[bool] = None
    track_seek_events: Optional[bool] = None
    track_completion_events: Optional[bool] = None
    
    # Privacy settings
    share_progress: Optional[bool] = None
    share_learning_analytics: Optional[bool] = None
    anonymous_analytics: Optional[bool] = None
    
    # Advanced settings
    keyboard_shortcuts: Optional[bool] = None
    picture_in_picture: Optional[bool] = None
    fullscreen_on_play: Optional[bool] = None
    skip_intro: Optional[bool] = None
    
    # Custom preferences
    custom_preferences: Optional[Dict[str, Any]] = None

class VideoSessionCreateRequest(BaseModel):
    course_id: str
    module_id: str
    lesson_id: str
    video_url: str
    video_duration: float
    device_type: str = "desktop"
    browser: Optional[str] = None

class VideoSessionUpdateRequest(BaseModel):
    watch_time: Optional[float] = None
    completion_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    play_events: Optional[List[Dict[str, Any]]] = None
    pause_events: Optional[List[Dict[str, Any]]] = None
    seek_events: Optional[List[Dict[str, Any]]] = None
    volume_changes: Optional[List[Dict[str, Any]]] = None
    speed_changes: Optional[List[Dict[str, Any]]] = None
    quality_used: Optional[str] = None
    bandwidth_used: Optional[float] = None
    completed: Optional[bool] = None

class VideoSettingsResponse(BaseModel):
    user_id: str
    default_playback_speed: PlaybackSpeed
    remember_playback_speed: bool
    auto_play: bool
    auto_advance: bool
    preferred_quality: VideoQuality
    bandwidth_limit: Optional[int]
    data_saver_mode: bool
    captions_enabled: bool
    caption_language: CaptionLanguage
    caption_size: str
    caption_color: str
    caption_background: bool
    volume: float
    remember_volume: bool
    audio_only_mode: bool
    pause_on_tab_switch: bool
    show_progress_bar: bool
    show_time_remaining: bool
    show_lesson_notes: bool
    show_discussion_panel: bool
    notifications: Dict[str, bool]
    study_reminders: bool
    reminder_frequency: int
    break_reminders: bool
    break_interval: int
    track_watch_time: bool
    track_pause_events: bool
    track_seek_events: bool
    track_completion_events: bool
    share_progress: bool
    share_learning_analytics: bool
    anonymous_analytics: bool
    keyboard_shortcuts: bool
    picture_in_picture: bool
    fullscreen_on_play: bool
    skip_intro: bool
    custom_preferences: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class VideoSessionResponse(BaseModel):
    session_id: str
    user_id: str
    course_id: str
    module_id: str
    lesson_id: str
    video_url: str
    video_duration: float
    watch_time: float
    completion_percentage: float
    device_type: str
    browser: Optional[str]
    quality_used: Optional[str]
    bandwidth_used: Optional[float]
    started_at: datetime
    last_activity_at: datetime
    completed_at: Optional[datetime]
