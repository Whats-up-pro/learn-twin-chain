"""
Discussion API endpoints for video learning platform
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import JSONResponse
import logging

from ..models.discussion import (
    Discussion, Comment, DiscussionLike, CommentLike,
    DiscussionCreateRequest, DiscussionUpdateRequest,
    CommentCreateRequest, CommentUpdateRequest,
    DiscussionResponse, CommentResponse,
    DiscussionType, DiscussionStatus, CommentStatus
)
from ..models.user import User
from ..dependencies import get_current_user, require_permission

logger = logging.getLogger(__name__)

router = APIRouter()

# ============ DISCUSSION ENDPOINTS ============

@router.get("/discussions/", response_model=Dict[str, Any])
async def get_discussions(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    module_id: Optional[str] = Query(None, description="Filter by module ID"),
    lesson_id: Optional[str] = Query(None, description="Filter by lesson ID"),
    discussion_type: Optional[DiscussionType] = Query(None, description="Filter by discussion type"),
    status: Optional[DiscussionStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    current_user: User = Depends(get_current_user)
):
    """Get discussions with filtering and pagination"""
    try:
        # Build filter query
        filter_query = {}
        
        if course_id:
            filter_query["course_id"] = course_id
        if module_id:
            filter_query["module_id"] = module_id
        if lesson_id:
            filter_query["lesson_id"] = lesson_id
        if discussion_type:
            filter_query["discussion_type"] = discussion_type
        if status:
            filter_query["status"] = status
        else:
            filter_query["status"] = DiscussionStatus.ACTIVE
        
        # Apply search if provided
        if search:
            # Add search conditions to filter query
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}}
            ]
        
        # Get discussions with pagination and sorting
        discussions = await Discussion.find(filter_query).sort("-last_activity_at").skip(skip).limit(limit).to_list()
        
        # Get total count
        total = await Discussion.find(filter_query).count()
        
        # Convert to response format and check if user liked each discussion
        discussion_responses = []
        for discussion in discussions:
            # Check if user liked this discussion
            user_like = await DiscussionLike.find_one({
                "discussion_id": discussion.discussion_id,
                "user_id": current_user.did
            })
            
            discussion_dict = discussion.to_dict()
            discussion_dict["is_liked_by_user"] = user_like is not None
            discussion_responses.append(DiscussionResponse(**discussion_dict))
        
        return {
            "discussions": discussion_responses,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Failed to get discussions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve discussions")

@router.get("/discussions/{discussion_id}", response_model=DiscussionResponse)
async def get_discussion(
    discussion_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific discussion by ID"""
    try:
        discussion = await Discussion.find_one({"discussion_id": discussion_id})
        
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Increment view count
        discussion.view_count += 1
        await discussion.save()
        
        # Check if user liked this discussion
        user_like = await DiscussionLike.find_one({
            "discussion_id": discussion_id,
            "user_id": current_user.did
        })
        
        discussion_dict = discussion.to_dict()
        discussion_dict["is_liked_by_user"] = user_like is not None
        
        return DiscussionResponse(**discussion_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get discussion {discussion_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve discussion")

@router.post("/discussions/", response_model=DiscussionResponse)
async def create_discussion(
    request: DiscussionCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new discussion"""
    try:
        # Generate unique discussion ID
        discussion_id = f"disc_{uuid.uuid4().hex[:12]}"
        
        # Create discussion
        discussion = Discussion(
            discussion_id=discussion_id,
            title=request.title,
            content=request.content,
            discussion_type=request.discussion_type,
            course_id=request.course_id,
            module_id=request.module_id,
            lesson_id=request.lesson_id,
            author_id=current_user.did,
            author_name=current_user.name or current_user.email,
            author_avatar=current_user.avatar_url,
            tags=request.tags,
            category=request.category,
            status=DiscussionStatus.ACTIVE
        )
        
        await discussion.save()
        
        discussion_dict = discussion.to_dict()
        discussion_dict["is_liked_by_user"] = False
        
        return DiscussionResponse(**discussion_dict)
        
    except Exception as e:
        logger.error(f"Failed to create discussion: {e}")
        raise HTTPException(status_code=500, detail="Failed to create discussion")

@router.put("/discussions/{discussion_id}", response_model=DiscussionResponse)
async def update_discussion(
    discussion_id: str,
    request: DiscussionUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update a discussion (only by author or admin)"""
    try:
        discussion = await Discussion.find_one({"discussion_id": discussion_id})
        
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Check permissions
        if discussion.author_id != current_user.did:
            # Check if user has admin permissions
            if not await require_permission(current_user, "moderate_discussions"):
                raise HTTPException(status_code=403, detail="Not authorized to update this discussion")
        
        # Update fields
        if request.title is not None:
            discussion.title = request.title
        if request.content is not None:
            discussion.content = request.content
        if request.tags is not None:
            discussion.tags = request.tags
        if request.category is not None:
            discussion.category = request.category
        if request.is_pinned is not None:
            discussion.is_pinned = request.is_pinned
        if request.is_locked is not None:
            discussion.is_locked = request.is_locked
        
        discussion.updated_at = datetime.now(timezone.utc)
        await discussion.save()
        
        # Check if user liked this discussion
        user_like = await DiscussionLike.find_one({
            "discussion_id": discussion_id,
            "user_id": current_user.did
        })
        
        discussion_dict = discussion.to_dict()
        discussion_dict["is_liked_by_user"] = user_like is not None
        
        return DiscussionResponse(**discussion_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update discussion {discussion_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update discussion")

@router.delete("/discussions/{discussion_id}")
async def delete_discussion(
    discussion_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a discussion (only by author or admin)"""
    try:
        discussion = await Discussion.find_one({"discussion_id": discussion_id})
        
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Check permissions
        if discussion.author_id != current_user.did:
            # Check if user has admin permissions
            if not await require_permission(current_user, "moderate_discussions"):
                raise HTTPException(status_code=403, detail="Not authorized to delete this discussion")
        
        # Delete discussion and related data
        await Discussion.find_one({"discussion_id": discussion_id}).delete()
        await Comment.find({"discussion_id": discussion_id}).delete()
        await DiscussionLike.find({"discussion_id": discussion_id}).delete()
        
        return {"message": "Discussion deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete discussion {discussion_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete discussion")

@router.post("/discussions/{discussion_id}/like")
async def toggle_discussion_like(
    discussion_id: str,
    current_user: User = Depends(get_current_user)
):
    """Toggle like on a discussion"""
    try:
        discussion = await Discussion.find_one({"discussion_id": discussion_id})
        
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Check if user already liked
        existing_like = await DiscussionLike.find_one({
            "discussion_id": discussion_id,
            "user_id": current_user.did
        })
        
        if existing_like:
            # Remove like
            await existing_like.delete()
            discussion.like_count = max(0, discussion.like_count - 1)
            liked = False
        else:
            # Add like
            like = DiscussionLike(
                like_id=f"like_{uuid.uuid4().hex[:12]}",
                discussion_id=discussion_id,
                user_id=current_user.did
            )
            await like.save()
            discussion.like_count += 1
            liked = True
        
        await discussion.save()
        
        return {"liked": liked, "like_count": discussion.like_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle discussion like {discussion_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to toggle like")

# ============ COMMENT ENDPOINTS ============

@router.get("/discussions/{discussion_id}/comments", response_model=List[CommentResponse])
async def get_discussion_comments(
    discussion_id: str,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    current_user: User = Depends(get_current_user)
):
    """Get comments for a discussion"""
    try:
        # Verify discussion exists
        discussion = await Discussion.find_one({"discussion_id": discussion_id})
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Get top-level comments (no parent)
        comments = await Comment.find({
            "discussion_id": discussion_id,
            "parent_comment_id": None,
            "status": CommentStatus.PUBLISHED
        }).sort("created_at").skip(skip).limit(limit).to_list()
        
        # Build comment tree with replies
        comment_responses = []
        for comment in comments:
            comment_dict = comment.to_dict()
            
            # Check if user liked this comment
            user_like = await CommentLike.find_one({
                "comment_id": comment.comment_id,
                "user_id": current_user.did
            })
            comment_dict["is_liked_by_user"] = user_like is not None
            
            # Get replies
            replies = await Comment.find({
                "parent_comment_id": comment.comment_id,
                "status": CommentStatus.PUBLISHED
            }).sort("created_at").to_list()
            
            reply_responses = []
            for reply in replies:
                reply_dict = reply.to_dict()
                
                # Check if user liked this reply
                reply_user_like = await CommentLike.find_one({
                    "comment_id": reply.comment_id,
                    "user_id": current_user.did
                })
                reply_dict["is_liked_by_user"] = reply_user_like is not None
                reply_dict["replies"] = []  # No nested replies for now
                
                reply_responses.append(CommentResponse(**reply_dict))
            
            comment_dict["replies"] = reply_responses
            comment_responses.append(CommentResponse(**comment_dict))
        
        return comment_responses
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get comments for discussion {discussion_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve comments")

@router.post("/discussions/{discussion_id}/comments", response_model=CommentResponse)
async def create_comment(
    discussion_id: str,
    request: CommentCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new comment"""
    try:
        # Verify discussion exists and is not locked
        discussion = await Discussion.find_one({"discussion_id": discussion_id})
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        if discussion.is_locked:
            raise HTTPException(status_code=403, detail="Discussion is locked for new comments")
        
        # Verify parent comment exists if specified
        if request.parent_comment_id:
            parent_comment = await Comment.find_one({"comment_id": request.parent_comment_id})
            if not parent_comment:
                raise HTTPException(status_code=404, detail="Parent comment not found")
        
        # Generate unique comment ID
        comment_id = f"comment_{uuid.uuid4().hex[:12]}"
        
        # Create comment
        comment = Comment(
            comment_id=comment_id,
            discussion_id=discussion_id,
            content=request.content,
            author_id=current_user.did,
            author_name=current_user.name or current_user.email,
            author_avatar=current_user.avatar_url,
            parent_comment_id=request.parent_comment_id,
            status=CommentStatus.PUBLISHED
        )
        
        await comment.save()
        
        # Update discussion comment count and last activity
        discussion.comment_count += 1
        discussion.last_activity_at = datetime.now(timezone.utc)
        await discussion.save()
        
        # Update parent comment reply count if this is a reply
        if request.parent_comment_id:
            parent_comment.reply_count += 1
            await parent_comment.save()
        
        comment_dict = comment.to_dict()
        comment_dict["is_liked_by_user"] = False
        comment_dict["replies"] = []
        
        return CommentResponse(**comment_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create comment for discussion {discussion_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create comment")

@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    request: CommentUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update a comment (only by author)"""
    try:
        comment = await Comment.find_one({"comment_id": comment_id})
        
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Check permissions
        if comment.author_id != current_user.did:
            raise HTTPException(status_code=403, detail="Not authorized to update this comment")
        
        # Update comment
        comment.content = request.content
        comment.is_edited = True
        comment.updated_at = datetime.now(timezone.utc)
        await comment.save()
        
        comment_dict = comment.to_dict()
        
        # Check if user liked this comment
        user_like = await CommentLike.find_one({
            "comment_id": comment_id,
            "user_id": current_user.did
        })
        comment_dict["is_liked_by_user"] = user_like is not None
        
        # Get replies
        replies = await Comment.find({
            "parent_comment_id": comment_id,
            "status": CommentStatus.PUBLISHED
        }).sort("created_at").to_list()
        
        reply_responses = []
        for reply in replies:
            reply_dict = reply.to_dict()
            
            # Check if user liked this reply
            reply_user_like = await CommentLike.find_one({
                "comment_id": reply.comment_id,
                "user_id": current_user.did
            })
            reply_dict["is_liked_by_user"] = reply_user_like is not None
            reply_dict["replies"] = []
            
            reply_responses.append(CommentResponse(**reply_dict))
        
        comment_dict["replies"] = reply_responses
        
        return CommentResponse(**comment_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update comment {comment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update comment")

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (only by author or admin)"""
    try:
        comment = await Comment.find_one({"comment_id": comment_id})
        
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Check permissions
        if comment.author_id != current_user.did:
            # Check if user has admin permissions
            if not await require_permission(current_user, "moderate_discussions"):
                raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
        # Soft delete by changing status
        comment.status = CommentStatus.DELETED
        await comment.save()
        
        # Update discussion comment count
        discussion = await Discussion.find_one({"discussion_id": comment.discussion_id})
        if discussion:
            discussion.comment_count = max(0, discussion.comment_count - 1)
            await discussion.save()
        
        # Update parent comment reply count if this is a reply
        if comment.parent_comment_id:
            parent_comment = await Comment.find_one({"comment_id": comment.parent_comment_id})
            if parent_comment:
                parent_comment.reply_count = max(0, parent_comment.reply_count - 1)
                await parent_comment.save()
        
        return {"message": "Comment deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete comment {comment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")

@router.post("/comments/{comment_id}/like")
async def toggle_comment_like(
    comment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Toggle like on a comment"""
    try:
        comment = await Comment.find_one({"comment_id": comment_id})
        
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Check if user already liked
        existing_like = await CommentLike.find_one({
            "comment_id": comment_id,
            "user_id": current_user.did
        })
        
        if existing_like:
            # Remove like
            await existing_like.delete()
            comment.like_count = max(0, comment.like_count - 1)
            liked = False
        else:
            # Add like
            like = CommentLike(
                like_id=f"like_{uuid.uuid4().hex[:12]}",
                comment_id=comment_id,
                user_id=current_user.did
            )
            await like.save()
            comment.like_count += 1
            liked = True
        
        await comment.save()
        
        return {"liked": liked, "like_count": comment.like_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle comment like {comment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to toggle like")

# ============ STATISTICS ENDPOINTS ============

@router.get("/discussions/statistics")
async def get_discussion_statistics(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    current_user: User = Depends(get_current_user)
):
    """Get discussion statistics"""
    try:
        filter_query = {"status": DiscussionStatus.ACTIVE}
        if course_id:
            filter_query["course_id"] = course_id
        
        # Get counts
        total_discussions = await Discussion.find(filter_query).count()
        total_comments = await Comment.find({"status": CommentStatus.PUBLISHED}).count()
        
        # Get user's contributions
        user_discussions = await Discussion.find({
            "author_id": current_user.did,
            **filter_query
        }).count()
        
        user_comments = await Comment.find({
            "author_id": current_user.did,
            "status": CommentStatus.PUBLISHED
        }).count()
        
        return {
            "total_discussions": total_discussions,
            "total_comments": total_comments,
            "user_discussions": user_discussions,
            "user_comments": user_comments
        }
        
    except Exception as e:
        logger.error(f"Failed to get discussion statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")
