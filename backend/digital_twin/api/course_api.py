"""
Course and Module API endpoints
"""
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
import logging
from datetime import datetime, timezone

from ..services.course_service import CourseService
from ..models.user import User
from ..dependencies import get_current_user, require_permission, require_teacher, get_optional_user
from ..models.course import Course, Module, Enrollment, ModuleProgress

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

@router.get("/debug/all")
async def get_all_courses_debug():
    """Debug endpoint to get all courses in database"""
    try:
        # Get all courses without any filters
        all_courses = await Course.find({}).to_list()
        logger.info(f"Debug: Found {len(all_courses)} total courses in database")
        
        # Get basic info about each course
        course_info = []
        for course in all_courses:
            course_info.append({
                "course_id": course.course_id,
                "title": course.title,
                "status": course.status,
                "institution": course.institution,
                "is_public": course.is_public,
                "created_at": course.created_at
            })
        
        return {
            "total_courses": len(all_courses),
            "courses": course_info
        }
    except Exception as e:
        logger.error(f"Debug endpoint failed: {e}")
        raise HTTPException(status_code=500, detail="Debug endpoint failed")

@router.get("/debug/search-test")
async def debug_search_test():
    """Debug endpoint to test search criteria"""
    try:
        # Test different search criteria
        results = {}
        
        # Test 1: All courses
        all_courses = await Course.find({}).to_list()
        results["all_courses"] = len(all_courses)
        
        # Test 2: Published courses
        published_courses = await Course.find({"status": "published"}).to_list()
        results["published_courses"] = len(published_courses)
        
        # Test 3: Public courses
        public_courses = await Course.find({"is_public": True}).to_list()
        results["public_courses"] = len(public_courses)
        
        # Test 4: Published AND public courses
        published_public_courses = await Course.find({"status": "published", "is_public": True}).to_list()
        results["published_public_courses"] = len(published_public_courses)
        
        # Test 5: Python search
        python_courses = await Course.find({
            "$or": [
                {"title": {"$regex": "Python", "$options": "i"}},
                {"description": {"$regex": "Python", "$options": "i"}}
            ]
        }).to_list()
        results["python_courses"] = len(python_courses)
        
        # Test 6: Python + published + public
        python_published_public = await Course.find({
            "status": "published",
            "is_public": True,
            "$or": [
                {"title": {"$regex": "Python", "$options": "i"}},
                {"description": {"$regex": "Python", "$options": "i"}}
            ]
        }).to_list()
        results["python_published_public"] = len(python_published_public)
        
        # Get details of first few courses
        course_details = []
        for course in all_courses[:3]:
            course_details.append({
                "course_id": course.course_id,
                "title": course.title,
                "status": course.status,
                "is_public": course.is_public,
                "institution": course.institution,
                "metadata": course.metadata.dict() if course.metadata else {}
            })
        
        return {
            "search_tests": results,
            "sample_courses": course_details
        }
    except Exception as e:
        logger.error(f"Debug search test failed: {e}")
        raise HTTPException(status_code=500, detail="Debug search test failed")

@router.get("/all")
async def get_all_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get all published and public courses with enrollment status in one call"""
    try:
        logger.debug(f"Getting all courses: skip={skip}, limit={limit}")
        
        # Get all published and public courses
        search_criteria = {
            "status": "published",
            "is_public": True
        }
        
        courses = await Course.find(search_criteria).skip(skip).limit(limit).to_list()
        total = await Course.find(search_criteria).count()
        
        logger.debug(f"Found {len(courses)} courses out of {total} total")
        
        # Get user enrollments if authenticated (check both sources)
        user_enrollments = set()
        if current_user:
            try:
                # Method 1: Check Enrollment collection
                enrollments = await Enrollment.find({"user_id": current_user.did}).to_list()
                enrolled_from_collection = {e.course_id for e in enrollments if e.status == "active"}
                user_enrollments.update(enrolled_from_collection)
                
                # Method 2: Check user.enrollments field as fallback
                user_enrolled_course_ids = current_user.enrollments or []
                user_enrollments.update(user_enrolled_course_ids)
                
                logger.debug(f"User {current_user.did} enrolled in: {user_enrollments}")
            except Exception as e:
                logger.debug(f"Could not load enrollments: {e}")
                user_enrollments = set()
        
        # Transform courses to match frontend expectations
        transformed_courses = []
        for course in courses:
            try:
                course_dict = course.dict()
                
                course_id = course_dict.get("course_id")
                transformed_course = {
                    "id": course_id,
                    "title": course_dict.get("title"),
                    "description": course_dict.get("description"),
                    "instructor_name": course_dict.get("instructors", [""])[0] if course_dict.get("instructors") else "Unknown",
                    "duration_minutes": course_dict.get("metadata", {}).get("estimated_hours", 0) * 60,
                    "difficulty_level": course_dict.get("metadata", {}).get("difficulty_level", "beginner"),
                    "enrollment_count": 0,  # Will be calculated separately
                    "rating": 4.5,  # Default rating
                    "thumbnail_url": course_dict.get("thumbnail_url") or f"https://via.placeholder.com/300x200/4F46E5/FFFFFF?text={course_dict.get('title', 'Course').replace(' ', '+')[:20]}",
                    "institution": course_dict.get("institution", "Unknown"),
                    "tags": course_dict.get("metadata", {}).get("tags", []),
                    "status": course_dict.get("status", "published"),
                    "created_at": course_dict.get("created_at"),
                    "updated_at": course_dict.get("updated_at"),
                    "is_enrolled": course_id in user_enrollments if current_user else False
                }
                transformed_courses.append(transformed_course)
            except Exception as e:
                logger.error(f"Error transforming course {course.course_id}: {e}")
                continue
        
        return {
            "items": transformed_courses,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Get all courses failed: {e}")
        raise HTTPException(status_code=500, detail="Get all courses failed")

@router.get("/")
async def search_courses(
    q: Optional[str] = Query(None, description="Search query"),
    difficulty_level: Optional[str] = Query(None, description="Difficulty level filter"),
    institution: Optional[str] = Query(None, description="Institution filter"),
    tags: Optional[List[str]] = Query(None, description="Tags filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    include_enrollment: bool = Query(False, description="Include user enrollment status"),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Search and filter courses with enrollment status"""
    try:
        filters = {}
        if difficulty_level:
            filters["difficulty_level"] = difficulty_level
        if institution:
            filters["institution"] = institution
        if tags:
            filters["tags"] = tags
        
        # If include_enrollment is requested but no user is authenticated, 
        # try to get authenticated user instead of optional user
        user_for_enrollment = None
        if include_enrollment:
            user_for_enrollment = current_user
            logger.debug(f"Including enrollment status for user: {user_for_enrollment.did if user_for_enrollment else 'None'}")
        
        result = await course_service.search_courses(q, filters, skip, limit, user_for_enrollment)
        
        # The service now returns the correct format with "items" key
        return result
        
    except Exception as e:
        logger.error(f"Course search failed: {e}")
        raise HTTPException(status_code=500, detail="Course search failed")

@router.get("/{course_id}")
async def get_course(
    course_id: str,
    include_modules: bool = Query(False),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get course details by ID"""
    try:
        course_service = CourseService()
        course = await course_service.get_course(course_id, include_modules)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Check if course is public or user has access
        if not course.is_public:
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Check if user is instructor or enrolled
            if (current_user.did not in course.instructors and 
                current_user.did != course.created_by):
                # Check if user is enrolled
                enrollment = await Enrollment.find_one({
                    "user_id": current_user.did,
                    "course_id": course_id,
                    "status": "active"
                })
                if not enrollment:
                    raise HTTPException(status_code=403, detail="Access denied")
        
        # Transform course data
        course_dict = course.dict()
        
        # Add enrollment info if user is authenticated
        if current_user:
            enrollment = await Enrollment.find_one({
                "user_id": current_user.did,
                "course_id": course_id
            })
            if enrollment:
                course_dict["user_enrollment"] = enrollment.dict()
                course_dict["is_enrolled"] = enrollment.status == "active"
            else:
                course_dict["is_enrolled"] = False
        else:
            course_dict["is_enrolled"] = False
        
        return {
            "success": True,
            "course": course_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get course failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get course")

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
        logger.debug(f"Enrolling user {current_user.did} in course {course_id}")
        
        # Check if course exists
        course = await Course.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Check if course is published
        if course.status != "published":
            raise HTTPException(status_code=400, detail="Course is not published")
        
        # Check if course is public or user has access
        if not course.is_public:
            if (current_user.did not in course.instructors and 
                current_user.did != course.created_by):
                raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if user is already enrolled
        existing_enrollment = await Enrollment.find_one({
            "user_id": current_user.did,
            "course_id": course_id
        })
        
        if existing_enrollment:
            if existing_enrollment.status == "active":
                return {
                    "message": "Already enrolled in this course",
                    "enrollment": existing_enrollment.dict()
                }
            else:
                # Reactivate enrollment
                existing_enrollment.status = "active"
                existing_enrollment.enrolled_at = datetime.now(timezone.utc)
                await existing_enrollment.save()
                
                return {
                    "message": "Enrollment reactivated",
                    "enrollment": existing_enrollment.dict()
                }
        
        enrollment = await course_service.enroll_student(course_id, current_user.did)
        
        return {
            "message": "Successfully enrolled in course",
            "enrollment": enrollment.dict()
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Enrollment validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Course enrollment failed: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Enrollment error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Course enrollment failed: {str(e)}")

@router.get("/{course_id}/enrollments")
async def get_course_enrollments(
    course_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get course enrollments (teacher/admin only)"""
    try:
        # Check if user is instructor or admin
        course = await course_service.get_course(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Only allow instructors, admins, or institution admins to view enrollments
        if (current_user.did not in course.instructors and 
            current_user.did != course.created_by and 
            current_user.role not in ["admin", "institution_admin"]):
            raise HTTPException(status_code=403, detail="Insufficient permissions to view course enrollments")
        
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
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get modules for a course"""
    try:
        # Check if course exists and is public
        course = await Course.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Check if course is public or user has access
        if not course.is_public:
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Check if user is instructor or enrolled
            if (current_user.did not in course.instructors and 
                current_user.did != course.created_by):
                # Check if user is enrolled
                enrollment = await Enrollment.find_one({
                    "user_id": current_user.did,
                    "course_id": course_id,
                    "status": "active"
                })
                if not enrollment:
                    raise HTTPException(status_code=403, detail="Access denied")
        
        # Get modules from modules collection using course_id
        modules = await Module.find({"course_id": course_id}).sort("order").to_list()
        
        # Transform modules
        module_list = []
        for module in modules:
            module_dict = module.dict()
            # Add progress info if user is authenticated
            if current_user:
                progress = await ModuleProgress.find_one({
                    "user_id": current_user.did,
                    "module_id": module.module_id
                })
                if progress:
                    module_dict["user_progress"] = progress.dict()
            
            module_list.append(module_dict)
        
        return {
            "success": True,
            "modules": module_list,
            "total": len(module_list)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get course modules failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get course modules")

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
# DEPRECATED: Use /auth/me/enrollments instead (working endpoint)
# This endpoint was causing 500 errors, now all services use the working /auth/me/enrollments
"""
@router.get("/my/enrollments")
async def get_my_enrollments(current_user: User = Depends(get_current_user)):
    # REMOVED: All services now use /auth/me/enrollments which works correctly
    pass
"""

@router.post("/sync-enrollments")
async def sync_enrollments(current_user: User = Depends(get_current_user)):
    """Sync user enrollments between User model and Enrollment collection"""
    try:
        success = await course_service.sync_user_enrollments(current_user.did)
        if success:
            return {
                "success": True,
                "message": "Enrollments synced successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to sync enrollments")
    except Exception as e:
        logger.error(f"Enrollment sync failed: {e}")
        raise HTTPException(status_code=500, detail="Enrollment sync failed")

@router.get("/my/progress")
async def get_my_progress(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    current_user: User = Depends(get_current_user)
):
    """Get current user's learning progress"""
    try:
        query = {"user_id": current_user.did}
        if course_id:
            query["course_id"] = course_id
        
        try:
            progress_records = await ModuleProgress.find(query).to_list()
        except Exception as db_error:
            logger.debug(f"Progress retrieval failed, returning empty list: {db_error}")
            progress_records = []
        
        return {
            "progress": [progress.dict() for progress in progress_records]
        }
    except Exception as e:
        logger.error(f"User progress retrieval error: {e}")
        # Return empty result instead of throwing error
        return {
            "progress": []
        }