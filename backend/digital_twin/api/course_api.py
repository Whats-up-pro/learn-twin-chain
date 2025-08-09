"""
Course and Module API endpoints
"""
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
import logging

from ..services.course_service import CourseService
from ..models.user import User
from ..dependencies import get_current_user, require_permission, require_teacher

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/courses", tags=["courses"])

course_service = CourseService()

# Pydantic models
class CourseCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    institution: str = Field(default="")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    enrollment_start: Optional[str] = None
    enrollment_end: Optional[str] = None
    course_start: Optional[str] = None
    course_end: Optional[str] = None
    max_enrollments: Optional[int] = None
    is_public: bool = Field(default=True)
    requires_approval: bool = Field(default=False)
    completion_nft_enabled: bool = Field(default=True)
    syllabus: Optional[Dict[str, Any]] = None

class ModuleCreateRequest(BaseModel):
    course_id: str = Field(..., description="Course identifier")
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    content: List[Dict[str, Any]] = Field(default_factory=list)
    order: int = Field(default=0)
    parent_module: Optional[str] = None
    learning_objectives: List[str] = Field(default_factory=list)
    estimated_duration: int = Field(default=60)
    assessments: List[Dict[str, Any]] = Field(default_factory=list)
    completion_criteria: Dict[str, Any] = Field(default_factory=dict)
    is_mandatory: bool = Field(default=True)
    prerequisites: List[str] = Field(default_factory=list)
    completion_nft_enabled: bool = Field(default=False)

class ModuleProgressUpdate(BaseModel):
    content_progress: Optional[Dict[str, float]] = None
    time_spent: Optional[int] = None
    assessment_score: Optional[float] = None
    assessment_id: Optional[str] = None

# Course endpoints
@router.post("/", dependencies=[Depends(require_permission("create_course"))])
async def create_course(
    request: CourseCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new course"""
    try:
        course = await course_service.create_course(request.dict(), current_user.did)
        return {
            "message": "Course created successfully",
            "course": course.dict()
        }
    except Exception as e:
        logger.error(f"Course creation error: {e}")
        raise HTTPException(status_code=500, detail="Course creation failed")

@router.get("/")
async def search_courses(
    q: Optional[str] = Query(None, description="Search query"),
    difficulty_level: Optional[str] = Query(None, description="Difficulty level filter"),
    institution: Optional[str] = Query(None, description="Institution filter"),
    tags: Optional[List[str]] = Query(None, description="Tags filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Search and filter courses"""
    try:
        filters = {}
        if difficulty_level:
            filters["difficulty_level"] = difficulty_level
        if institution:
            filters["institution"] = institution
        if tags:
            filters["tags"] = tags
        
        result = await course_service.search_courses(q, filters, skip, limit)
        return result
    except Exception as e:
        logger.error(f"Course search error: {e}")
        raise HTTPException(status_code=500, detail="Course search failed")

@router.get("/{course_id}")
async def get_course(
    course_id: str,
    include_modules: bool = Query(False, description="Include course modules"),
    current_user: User = Depends(get_current_user)
):
    """Get course by ID"""
    try:
        course = await course_service.get_course(course_id, include_modules)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return {"course": course.dict()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Course retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Course retrieval failed")

@router.put("/{course_id}", dependencies=[Depends(require_permission("update_course"))])
async def update_course(
    course_id: str,
    updates: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Update course information"""
    try:
        course = await course_service.update_course(course_id, updates, current_user.did)
        return {
            "message": "Course updated successfully",
            "course": course.dict()
        }
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Course update error: {e}")
        raise HTTPException(status_code=500, detail="Course update failed")

@router.post("/{course_id}/publish", dependencies=[Depends(require_permission("publish_course"))])
async def publish_course(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Publish a course"""
    try:
        course = await course_service.publish_course(course_id, current_user.did)
        return {
            "message": "Course published successfully",
            "course": course.dict()
        }
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Course publishing error: {e}")
        raise HTTPException(status_code=500, detail="Course publishing failed")

@router.post("/{course_id}/enroll")
async def enroll_in_course(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Enroll current user in a course"""
    try:
        enrollment = await course_service.enroll_student(course_id, current_user.did)
        return {
            "message": "Enrolled successfully",
            "enrollment": enrollment.dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Course enrollment error: {e}")
        raise HTTPException(status_code=500, detail="Course enrollment failed")

@router.get("/{course_id}/enrollments", dependencies=[Depends(require_permission("view_analytics"))])
async def get_course_enrollments(
    course_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get course enrollments (teacher/admin only)"""
    try:
        # Implementation would go here
        # This would require additional service method
        return {"message": "Endpoint to be implemented"}
    except Exception as e:
        logger.error(f"Course enrollments retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Enrollments retrieval failed")

# Module endpoints
@router.post("/{course_id}/modules", dependencies=[Depends(require_permission("create_module"))])
async def create_module(
    course_id: str,
    request: ModuleCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new module"""
    try:
        # Ensure course_id matches
        module_data = request.dict()
        module_data["course_id"] = course_id
        
        module = await course_service.create_module(module_data, current_user.did)
        return {
            "message": "Module created successfully",
            "module": module.dict()
        }
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Module creation error: {e}")
        raise HTTPException(status_code=500, detail="Module creation failed")

@router.get("/{course_id}/modules")
async def get_course_modules(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all modules for a course"""
    try:
        from ..models.course import Module
        modules = await Module.find({"course_id": course_id}).sort("order").to_list()
        return {
            "modules": [module.dict() for module in modules]
        }
    except Exception as e:
        logger.error(f"Course modules retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Modules retrieval failed")

@router.put("/modules/{module_id}/progress")
async def update_module_progress(
    module_id: str,
    progress_update: ModuleProgressUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update progress in a module"""
    try:
        progress = await course_service.update_module_progress(
            current_user.did,
            module_id,
            progress_update.dict(exclude_none=True)
        )
        return {
            "message": "Progress updated successfully",
            "progress": progress.dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Module progress update error: {e}")
        raise HTTPException(status_code=500, detail="Progress update failed")

@router.get("/modules/{module_id}/progress")
async def get_module_progress(
    module_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get current user's progress in a module"""
    try:
        from ..models.course import ModuleProgress
        progress = await ModuleProgress.find_one({
            "user_id": current_user.did,
            "module_id": module_id
        })
        
        if not progress:
            raise HTTPException(status_code=404, detail="Progress not found")
        
        return {"progress": progress.dict()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Module progress retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Progress retrieval failed")

# User-specific endpoints
@router.get("/my/enrollments")
async def get_my_enrollments(current_user: User = Depends(get_current_user)):
    """Get current user's course enrollments"""
    try:
        enrollments = await course_service.get_student_enrollments(current_user.did)
        return {"enrollments": enrollments}
    except Exception as e:
        logger.error(f"User enrollments retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Enrollments retrieval failed")

@router.get("/my/progress")
async def get_my_progress(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    current_user: User = Depends(get_current_user)
):
    """Get current user's learning progress"""
    try:
        from ..models.course import ModuleProgress
        
        query = {"user_id": current_user.did}
        if course_id:
            query["course_id"] = course_id
        
        progress_records = await ModuleProgress.find(query).to_list()
        return {
            "progress": [progress.dict() for progress in progress_records]
        }
    except Exception as e:
        logger.error(f"User progress retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Progress retrieval failed")