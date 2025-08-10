"""
Lesson management API endpoints
"""
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
import logging
from datetime import datetime, timezone

from ..models.course import Lesson, Module, Course
from ..models.user import User
from ..dependencies import get_current_user, require_permission
from ..services.ipfs_service import IPFSService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/lessons", tags=["lessons"])

ipfs_service = IPFSService()

# Pydantic models
class LessonCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)
    module_id: str = Field(..., description="Parent module identifier")
    content_type: str = Field(..., description="Content type: video, text, interactive, quiz, assignment")
    content_url: Optional[str] = Field(default=None, description="Content URL (e.g., YouTube link)")
    content_data: Optional[Dict[str, Any]] = Field(default=None, description="Content data to be pinned to IPFS")
    duration_minutes: int = Field(default=30, ge=1)
    order: int = Field(default=0, ge=0)
    learning_objectives: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    is_mandatory: bool = Field(default=True)
    prerequisites: List[str] = Field(default_factory=list)

class LessonUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_url: Optional[str] = None
    content_data: Optional[Dict[str, Any]] = None
    duration_minutes: Optional[int] = None
    order: Optional[int] = None
    learning_objectives: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    is_mandatory: Optional[bool] = None
    prerequisites: Optional[List[str]] = None
    status: Optional[str] = None

class LessonProgressRequest(BaseModel):
    completion_percentage: float = Field(..., ge=0, le=100)
    time_spent_minutes: int = Field(default=0, ge=0)
    notes: Optional[str] = None

# Lesson CRUD endpoints
@router.post("/", dependencies=[Depends(require_permission("create_lesson"))])
async def create_lesson(
    request: LessonCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new lesson"""
    try:
        # Verify module exists and get course info
        module = await Module.find_one({"module_id": request.module_id})
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        
        # Verify course and check permissions
        course = await Course.find_one({"course_id": module.course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        if current_user.did not in course.instructors and current_user.did != course.created_by:
            if current_user.role not in ["admin", "institution_admin"]:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Generate lesson ID
        lesson_id = f"lesson_{int(datetime.now().timestamp())}_{request.module_id}"
        
        # Handle content data - pin to IPFS if provided
        content_cid = None
        if request.content_data:
            content_cid = await ipfs_service.pin_json(
                request.content_data,
                name=f"lesson_content_{lesson_id}",
                metadata={
                    "lesson_id": lesson_id,
                    "module_id": request.module_id,
                    "course_id": module.course_id,
                    "content_type": request.content_type
                }
            )
        
        # Create lesson
        lesson = Lesson(
            lesson_id=lesson_id,
            module_id=request.module_id,
            course_id=module.course_id,
            title=request.title,
            description=request.description,
            content_type=request.content_type,
            content_url=request.content_url,
            content_cid=content_cid,
            duration_minutes=request.duration_minutes,
            order=request.order,
            learning_objectives=request.learning_objectives,
            keywords=request.keywords,
            is_mandatory=request.is_mandatory,
            prerequisites=request.prerequisites
        )
        
        await lesson.insert()
        
        logger.info(f"Lesson created: {lesson_id}")
        return {
            "message": "Lesson created successfully",
            "lesson": lesson.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lesson creation failed: {e}")
        raise HTTPException(status_code=500, detail="Lesson creation failed")

@router.get("/")
async def search_lessons(
    module_id: Optional[str] = Query(None, description="Filter by module ID"),
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Search and filter lessons"""
    try:
        filters = {}
        
        if module_id:
            filters["module_id"] = module_id
        if course_id:
            filters["course_id"] = course_id
        if content_type:
            filters["content_type"] = content_type
        if status:
            filters["status"] = status
        else:
            filters["status"] = {"$ne": "archived"}
        
        # Only show published lessons to students
        if current_user.role == "student":
            filters["status"] = "published"
        
        lessons = await Lesson.find(filters).sort("order").skip(skip).limit(limit).to_list()
        total = await Lesson.count_documents(filters)
        
        return {
            "lessons": [lesson.dict() for lesson in lessons],
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Lesson search failed: {e}")
        raise HTTPException(status_code=500, detail="Lesson search failed")

@router.get("/{lesson_id}")
async def get_lesson(
    lesson_id: str,
    include_content: bool = Query(False, description="Include IPFS content"),
    current_user: User = Depends(get_current_user)
):
    """Get lesson by ID"""
    try:
        lesson = await Lesson.find_one({"lesson_id": lesson_id})
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        # Check if student can access this lesson
        if current_user.role == "student" and lesson.status != "published":
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        lesson_data = lesson.dict()
        
        # Include IPFS content if requested and available
        if include_content and lesson.content_cid:
            try:
                content = await ipfs_service.get_json(lesson.content_cid)
                lesson_data["content_data"] = content
            except Exception as e:
                logger.warning(f"Failed to retrieve IPFS content for lesson {lesson_id}: {e}")
        
        return {"lesson": lesson_data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lesson retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Lesson retrieval failed")

@router.put("/{lesson_id}", dependencies=[Depends(require_permission("update_lesson"))])
async def update_lesson(
    lesson_id: str,
    request: LessonUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update lesson"""
    try:
        lesson = await Lesson.find_one({"lesson_id": lesson_id})
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        # Check permissions
        course = await Course.find_one({"course_id": lesson.course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        if current_user.did not in course.instructors and current_user.did != course.created_by:
            if current_user.role not in ["admin", "institution_admin"]:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Apply updates
        update_data = request.dict(exclude_none=True)
        
        # Handle content data update
        if "content_data" in update_data and update_data["content_data"]:
            content_cid = await ipfs_service.pin_json(
                update_data["content_data"],
                name=f"lesson_content_{lesson_id}_updated",
                metadata={
                    "lesson_id": lesson_id,
                    "module_id": lesson.module_id,
                    "course_id": lesson.course_id,
                    "content_type": lesson.content_type,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            )
            lesson.content_cid = content_cid
            del update_data["content_data"]
        
        for key, value in update_data.items():
            if hasattr(lesson, key):
                setattr(lesson, key, value)
        
        lesson.update_timestamp()
        await lesson.save()
        
        logger.info(f"Lesson updated: {lesson_id}")
        return {
            "message": "Lesson updated successfully",
            "lesson": lesson.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lesson update failed: {e}")
        raise HTTPException(status_code=500, detail="Lesson update failed")

@router.delete("/{lesson_id}", dependencies=[Depends(require_permission("delete_lesson"))])
async def delete_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete lesson (soft delete by setting status to archived)"""
    try:
        lesson = await Lesson.find_one({"lesson_id": lesson_id})
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        # Check permissions
        course = await Course.find_one({"course_id": lesson.course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        if current_user.did not in course.instructors and current_user.did != course.created_by:
            if current_user.role not in ["admin", "institution_admin"]:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        lesson.status = "archived"
        lesson.update_timestamp()
        await lesson.save()
        
        logger.info(f"Lesson deleted: {lesson_id}")
        return {"message": "Lesson deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lesson deletion failed: {e}")
        raise HTTPException(status_code=500, detail="Lesson deletion failed")

@router.post("/{lesson_id}/publish", dependencies=[Depends(require_permission("publish_lesson"))])
async def publish_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Publish a lesson"""
    try:
        lesson = await Lesson.find_one({"lesson_id": lesson_id})
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        # Check permissions
        course = await Course.find_one({"course_id": lesson.course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        if current_user.did not in course.instructors and current_user.did != course.created_by:
            if current_user.role not in ["admin", "institution_admin"]:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        lesson.status = "published"
        lesson.update_timestamp()
        await lesson.save()
        
        logger.info(f"Lesson published: {lesson_id}")
        return {
            "message": "Lesson published successfully",
            "lesson": lesson.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lesson publishing failed: {e}")
        raise HTTPException(status_code=500, detail="Lesson publishing failed")

# Lesson progress endpoints
@router.post("/{lesson_id}/progress")
async def update_lesson_progress(
    lesson_id: str,
    request: LessonProgressRequest,
    current_user: User = Depends(get_current_user)
):
    """Update lesson progress for current user"""
    try:
        lesson = await Lesson.find_one({"lesson_id": lesson_id, "status": "published"})
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found or not published")
        
        # Update module progress with lesson completion
        from ..services.course_service import CourseService
        course_service = CourseService()
        
        # Get or create module progress
        from ..models.course import ModuleProgress
        module_progress = await ModuleProgress.find_one({
            "user_id": current_user.did,
            "module_id": lesson.module_id
        })
        
        if not module_progress:
            module_progress = ModuleProgress(
                user_id=current_user.did,
                course_id=lesson.course_id,
                module_id=lesson.module_id
            )
            await module_progress.insert()
        
        # Update lesson progress in content_progress
        lesson_key = f"lesson_{lesson_id}"
        module_progress.content_progress[lesson_key] = request.completion_percentage
        module_progress.time_spent_minutes += request.time_spent_minutes
        module_progress.last_accessed = datetime.now(timezone.utc)
        
        # Calculate overall module completion
        all_lessons = await Lesson.find({
            "module_id": lesson.module_id,
            "status": "published",
            "is_mandatory": True
        }).to_list()
        
        if all_lessons:
            completed_lessons = sum(
                1 for lesson_obj in all_lessons 
                if module_progress.content_progress.get(f"lesson_{lesson_obj.lesson_id}", 0) >= 100
            )
            module_progress.completion_percentage = (completed_lessons / len(all_lessons)) * 100
            
            # Mark module as completed if all mandatory lessons are done
            if module_progress.completion_percentage >= 100 and not module_progress.completed_at:
                module_progress.status = "completed"
                module_progress.completed_at = datetime.now(timezone.utc)
        
        await module_progress.save()
        
        # Update digital twin if lesson is completed
        if request.completion_percentage >= 100:
            from ..services.digital_twin_service import DigitalTwinService
            twin_service = DigitalTwinService()
            
            twin_id = f"did:learntwin:{current_user.did.replace('did:learntwin:', '')}"
            await twin_service.update_learning_progress(
                twin_id,
                lesson_id,
                request.completion_percentage,
                request.time_spent_minutes,
                None  # No scores for regular lessons
            )
        
        logger.info(f"Lesson progress updated: {current_user.did} -> {lesson_id} ({request.completion_percentage}%)")
        return {
            "message": "Lesson progress updated successfully",
            "lesson_progress": {
                "lesson_id": lesson_id,
                "completion_percentage": request.completion_percentage,
                "time_spent_minutes": request.time_spent_minutes
            },
            "module_progress": module_progress.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lesson progress update failed: {e}")
        raise HTTPException(status_code=500, detail="Lesson progress update failed")

@router.get("/{lesson_id}/progress")
async def get_lesson_progress(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get lesson progress for current user"""
    try:
        lesson = await Lesson.find_one({"lesson_id": lesson_id})
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        # Get module progress
        from ..models.course import ModuleProgress
        module_progress = await ModuleProgress.find_one({
            "user_id": current_user.did,
            "module_id": lesson.module_id
        })
        
        if not module_progress:
            return {
                "lesson_progress": {
                    "lesson_id": lesson_id,
                    "completion_percentage": 0,
                    "time_spent_minutes": 0,
                    "started": False
                }
            }
        
        lesson_key = f"lesson_{lesson_id}"
        completion_percentage = module_progress.content_progress.get(lesson_key, 0)
        
        return {
            "lesson_progress": {
                "lesson_id": lesson_id,
                "completion_percentage": completion_percentage,
                "time_spent_minutes": module_progress.time_spent_minutes,
                "started": completion_percentage > 0,
                "completed": completion_percentage >= 100,
                "last_accessed": module_progress.last_accessed.isoformat() if module_progress.last_accessed else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lesson progress retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Lesson progress retrieval failed")

@router.get("/module/{module_id}")
async def get_module_lessons(
    module_id: str,
    include_progress: bool = Query(False, description="Include user progress"),
    current_user: User = Depends(get_current_user)
):
    """Get all lessons for a module"""
    try:
        # Verify module exists
        module = await Module.find_one({"module_id": module_id})
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        
        # Get lessons
        filters = {"module_id": module_id}
        if current_user.role == "student":
            filters["status"] = "published"
        
        lessons = await Lesson.find(filters).sort("order").to_list()
        
        lessons_data = []
        for lesson in lessons:
            lesson_data = lesson.dict()
            
            # Include progress if requested
            if include_progress:
                from ..models.course import ModuleProgress
                module_progress = await ModuleProgress.find_one({
                    "user_id": current_user.did,
                    "module_id": module_id
                })
                
                if module_progress:
                    lesson_key = f"lesson_{lesson.lesson_id}"
                    completion_percentage = module_progress.content_progress.get(lesson_key, 0)
                    lesson_data["progress"] = {
                        "completion_percentage": completion_percentage,
                        "completed": completion_percentage >= 100
                    }
                else:
                    lesson_data["progress"] = {
                        "completion_percentage": 0,
                        "completed": False
                    }
            
            lessons_data.append(lesson_data)
        
        return {
            "lessons": lessons_data,
            "module": module.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Module lessons retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Module lessons retrieval failed")
