"""
Discussion models for video learning platform
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from beanie import Document, Indexed
from pydantic import Field, BaseModel
from pymongo import IndexModel
from enum import Enum

class DiscussionType(str, Enum):
    LESSON = "lesson"
    MODULE = "module"
    COURSE = "course"
    GENERAL = "general"

class DiscussionStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    LOCKED = "locked"

class CommentStatus(str, Enum):
    PUBLISHED = "published"
    HIDDEN = "hidden"
    DELETED = "deleted"

class Discussion(Document):
    """Discussion thread model"""
    
    # Basic information
    discussion_id: Indexed(str, unique=True) = Field(..., description="Unique discussion ID")
    title: str = Field(..., description="Discussion title")
    content: str = Field(..., description="Discussion content/description")
    
    # Context information
    discussion_type: DiscussionType = Field(..., description="Type of discussion")
    course_id: Optional[str] = Field(None, description="Associated course ID")
    module_id: Optional[str] = Field(None, description="Associated module ID")
    lesson_id: Optional[str] = Field(None, description="Associated lesson ID")
    
    # Author information
    author_id: Indexed(str) = Field(..., description="Author user ID")
    author_name: str = Field(..., description="Author display name")
    author_avatar: Optional[str] = Field(None, description="Author avatar URL")
    
    # Discussion metadata
    status: DiscussionStatus = Field(default=DiscussionStatus.ACTIVE, description="Discussion status")
    is_pinned: bool = Field(default=False, description="Whether discussion is pinned")
    is_locked: bool = Field(default=False, description="Whether discussion is locked for new comments")
    
    # Engagement metrics
    view_count: int = Field(default=0, description="Number of views")
    comment_count: int = Field(default=0, description="Number of comments")
    like_count: int = Field(default=0, description="Number of likes")
    
    # Tags and categorization
    tags: List[str] = Field(default_factory=list, description="Discussion tags")
    category: Optional[str] = Field(None, description="Discussion category")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "discussions"
        indexes = [
            IndexModel("discussion_id", unique=True),
            IndexModel("author_id"),
            IndexModel("course_id"),
            IndexModel("module_id"),
            IndexModel("lesson_id"),
            IndexModel("discussion_type"),
            IndexModel("status"),
            IndexModel("created_at"),
            IndexModel("last_activity_at"),
            [("course_id", 1), ("lesson_id", 1)],
            [("course_id", 1), ("module_id", 1)],
        ]
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "discussion_id": self.discussion_id,
            "title": self.title,
            "content": self.content,
            "discussion_type": self.discussion_type,
            "course_id": self.course_id,
            "module_id": self.module_id,
            "lesson_id": self.lesson_id,
            "author_id": self.author_id,
            "author_name": self.author_name,
            "author_avatar": self.author_avatar,
            "status": self.status,
            "is_pinned": self.is_pinned,
            "is_locked": self.is_locked,
            "view_count": self.view_count,
            "comment_count": self.comment_count,
            "like_count": self.like_count,
            "tags": self.tags,
            "category": self.category,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_activity_at": self.last_activity_at
        }

class Comment(Document):
    """Comment model for discussions"""
    
    # Basic information
    comment_id: Indexed(str, unique=True) = Field(..., description="Unique comment ID")
    discussion_id: Indexed(str) = Field(..., description="Parent discussion ID")
    content: str = Field(..., description="Comment content")
    
    # Author information
    author_id: Indexed(str) = Field(..., description="Author user ID")
    author_name: str = Field(..., description="Author display name")
    author_avatar: Optional[str] = Field(None, description="Author avatar URL")
    
    # Comment structure
    parent_comment_id: Optional[str] = Field(None, description="Parent comment ID for replies")
    reply_count: int = Field(default=0, description="Number of replies to this comment")
    
    # Status and moderation
    status: CommentStatus = Field(default=CommentStatus.PUBLISHED, description="Comment status")
    is_edited: bool = Field(default=False, description="Whether comment has been edited")
    
    # Engagement
    like_count: int = Field(default=0, description="Number of likes")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "comments"
        indexes = [
            IndexModel("comment_id", unique=True),
            IndexModel("discussion_id"),
            IndexModel("author_id"),
            IndexModel("parent_comment_id"),
            IndexModel("created_at"),
            [("discussion_id", 1), ("created_at", 1)],
        ]
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "comment_id": self.comment_id,
            "discussion_id": self.discussion_id,
            "content": self.content,
            "author_id": self.author_id,
            "author_name": self.author_name,
            "author_avatar": self.author_avatar,
            "parent_comment_id": self.parent_comment_id,
            "reply_count": self.reply_count,
            "status": self.status,
            "is_edited": self.is_edited,
            "like_count": self.like_count,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

class DiscussionLike(Document):
    """Discussion like model"""
    
    like_id: Indexed(str, unique=True) = Field(..., description="Unique like ID")
    discussion_id: Indexed(str) = Field(..., description="Discussion ID")
    user_id: Indexed(str) = Field(..., description="User ID who liked")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "discussion_likes"
        indexes = [
            IndexModel("like_id", unique=True),
            IndexModel("discussion_id"),
            IndexModel("user_id"),
            [("discussion_id", 1), ("user_id", 1)],
        ]

class CommentLike(Document):
    """Comment like model"""
    
    like_id: Indexed(str, unique=True) = Field(..., description="Unique like ID")
    comment_id: Indexed(str) = Field(..., description="Comment ID")
    user_id: Indexed(str) = Field(..., description="User ID who liked")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "comment_likes"
        indexes = [
            IndexModel("like_id", unique=True),
            IndexModel("comment_id"),
            IndexModel("user_id"),
            [("comment_id", 1), ("user_id", 1)],
        ]

# Request/Response models
class DiscussionCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    discussion_type: DiscussionType
    course_id: Optional[str] = None
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None

class DiscussionUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_locked: Optional[bool] = None

class CommentCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_comment_id: Optional[str] = None

class CommentUpdateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class DiscussionResponse(BaseModel):
    discussion_id: str
    title: str
    content: str
    discussion_type: DiscussionType
    course_id: Optional[str]
    module_id: Optional[str]
    lesson_id: Optional[str]
    author_id: str
    author_name: str
    author_avatar: Optional[str]
    status: DiscussionStatus
    is_pinned: bool
    is_locked: bool
    view_count: int
    comment_count: int
    like_count: int
    tags: List[str]
    category: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_activity_at: datetime
    is_liked_by_user: bool = False

class CommentResponse(BaseModel):
    comment_id: str
    discussion_id: str
    content: str
    author_id: str
    author_name: str
    author_avatar: Optional[str]
    parent_comment_id: Optional[str]
    reply_count: int
    status: CommentStatus
    is_edited: bool
    like_count: int
    created_at: datetime
    updated_at: datetime
    is_liked_by_user: bool = False
    replies: List['CommentResponse'] = []

# Update forward references
CommentResponse.model_rebuild()
