"""
Course and Module service with IPFS content storage
"""
import os
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
import logging

from ..models.course import Course, Module, Enrollment, ModuleProgress, CourseMetadata, ModuleContent, Assessment
from ..models.user import User
from ..services.ipfs_service import IPFSService
from ..services.redis_service import RedisService
from ..services.digital_twin_service import DigitalTwinService

logger = logging.getLogger(__name__)

class CourseService:
    """Course and Module management service with IPFS integration"""
    
    def __init__(self):
        self.ipfs_service = IPFSService()
        self.redis_service = RedisService()
        try:
            self.digital_twin_service = DigitalTwinService()
        except Exception as e:
            logger.warning(f"Digital twin service initialization failed: {e}")
            self.digital_twin_service = None
    
    # Course management
    async def create_course(self, course_data: Dict[str, Any], creator_did: str) -> Course:
        """Create a new course"""
        try:
            # Generate course ID
            course_id = f"course_{int(datetime.now().timestamp())}_{creator_did.split(':')[-1]}"
            
            # Prepare course metadata
            metadata = CourseMetadata(**course_data.get("metadata", {}))
            
            # Create course document
            course = Course(
                course_id=course_id,
                title=course_data["title"],
                description=course_data["description"],
                created_by=creator_did,
                institution=course_data.get("institution", ""),
                instructors=course_data.get("instructors", [creator_did]),
                metadata=metadata,
                enrollment_start=course_data.get("enrollment_start"),
                enrollment_end=course_data.get("enrollment_end"),
                course_start=course_data.get("course_start"),
                course_end=course_data.get("course_end"),
                max_enrollments=course_data.get("max_enrollments"),
                is_public=course_data.get("is_public", True),
                requires_approval=course_data.get("requires_approval", False),
                completion_nft_enabled=course_data.get("completion_nft_enabled", True)
            )
            
            await course.insert()
            
            # Pin syllabus to IPFS if provided
            if "syllabus" in course_data:
                syllabus_cid = await self.ipfs_service.pin_json(
                    course_data["syllabus"],
                    name=f"syllabus_{course_id}",
                    metadata={
                        "course_id": course_id,
                        "type": "syllabus",
                        "created_by": creator_did
                    }
                )
                course.syllabus_cid = syllabus_cid
                await course.save()
            
            # Cache course data
            await self.redis_service.set_cache(f"course:{course_id}", course.dict(), 3600)
            
            logger.info(f"Course created: {course_id}")
            return course
            
        except Exception as e:
            logger.error(f"Course creation failed: {e}")
            raise
    
    async def update_course(self, course_id: str, updates: Dict[str, Any], updated_by: str) -> Course:
        """Update course information"""
        try:
            course = await Course.find_one({"course_id": course_id})
            if not course:
                raise ValueError(f"Course not found: {course_id}")
            
            # Check permissions (instructor or admin)
            if updated_by not in course.instructors and updated_by != course.created_by:
                user = await User.find_one({"did": updated_by})
                if not user or user.role not in ["admin", "institution_admin"]:
                    raise PermissionError("Insufficient permissions to update course")
            
            # Apply updates
            for key, value in updates.items():
                if key == "metadata" and isinstance(value, dict):
                    # Update metadata fields
                    for meta_key, meta_value in value.items():
                        if hasattr(course.metadata, meta_key):
                            setattr(course.metadata, meta_key, meta_value)
                elif hasattr(course, key):
                    setattr(course, key, value)
            
            course.update_timestamp()
            await course.save()
            
            # Update cache
            await self.redis_service.set_cache(f"course:{course_id}", course.dict(), 3600)
            
            logger.info(f"Course updated: {course_id}")
            return course
            
        except Exception as e:
            logger.error(f"Course update failed: {e}")
            raise
    
    async def publish_course(self, course_id: str, published_by: str) -> Course:
        """Publish a course"""
        try:
            course = await Course.find_one({"course_id": course_id})
            if not course:
                raise ValueError(f"Course not found: {course_id}")
            
            # Check permissions
            if published_by not in course.instructors and published_by != course.created_by:
                user = await User.find_one({"did": published_by})
                if not user or user.role not in ["admin", "institution_admin"]:
                    raise PermissionError("Insufficient permissions to publish course")
            
            # Validate course has modules
            modules = await Module.find({"course_id": course_id}).to_list()
            if not modules:
                raise ValueError("Cannot publish course without modules")
            
            course.status = "published"
            course.published_at = datetime.now(timezone.utc)
            course.update_timestamp()
            await course.save()
            
            # Pin complete course content to IPFS
            await self._pin_course_content(course)
            
            # Clear cache to force refresh
            await self.redis_service.delete_cache(f"course:{course_id}")
            
            logger.info(f"Course published: {course_id}")
            return course
            
        except Exception as e:
            logger.error(f"Course publishing failed: {e}")
            raise
    
    async def _pin_course_content(self, course: Course):
        """Pin complete course content to IPFS"""
        try:
            # Get all modules for the course
            modules = await Module.find({"course_id": course.course_id}).to_list()
            
            course_content = {
                "course_info": {
                    "course_id": course.course_id,
                    "title": course.title,
                    "description": course.description,
                    "metadata": course.metadata.dict()
                },
                "modules": []
            }
            
            for module in modules:
                module_data = {
                    "module_id": module.module_id,
                    "title": module.title,
                    "description": module.description,
                    "order": module.order,
                    "content": [content.dict() for content in module.content],
                    "assessments": [assessment.dict() for assessment in module.assessments]
                }
                course_content["modules"].append(module_data)
            
            # Pin to IPFS
            content_cid = await self.ipfs_service.pin_json(
                course_content,
                name=f"course_content_{course.course_id}",
                metadata={
                    "course_id": course.course_id,
                    "type": "complete_course_content",
                    "published_at": course.published_at.isoformat() if course.published_at else None
                }
            )
            
            course.content_cid = content_cid
            await course.save()
            
            logger.info(f"Course content pinned to IPFS: {course.course_id} -> {content_cid}")
            
        except Exception as e:
            logger.error(f"Course content pinning failed: {e}")
    
    # Module management
    async def create_module(self, module_data: Dict[str, Any], creator_did: str) -> Module:
        """Create a new module"""
        try:
            # Verify course exists and creator has permissions
            course = await Course.find_one({"course_id": module_data["course_id"]})
            if not course:
                raise ValueError(f"Course not found: {module_data['course_id']}")
            
            if creator_did not in course.instructors and creator_did != course.created_by:
                user = await User.find_one({"did": creator_did})
                if not user or user.role not in ["admin", "institution_admin"]:
                    raise PermissionError("Insufficient permissions to create module")
            
            # Generate module ID
            module_id = f"module_{int(datetime.now().timestamp())}_{module_data['course_id']}"
            
            # Process module content
            content_list = []
            for content_item in module_data.get("content", []):
                if isinstance(content_item, dict):
                    # Pin content to IPFS if it's substantial
                    if content_item.get("content_data"):
                        content_cid = await self.ipfs_service.pin_json(
                            content_item["content_data"],
                            name=f"module_content_{module_id}_{content_item.get('order', 0)}",
                            metadata={
                                "module_id": module_id,
                                "content_type": content_item.get("content_type", "text")
                            }
                        )
                        content_item["content_cid"] = content_cid
                        del content_item["content_data"]  # Remove raw data after pinning
                    
                    content_list.append(ModuleContent(**content_item))
            
            # Process assessments
            assessments = []
            for assessment_data in module_data.get("assessments", []):
                if isinstance(assessment_data, dict):
                    # Pin assessment questions to IPFS
                    if assessment_data.get("questions"):
                        questions_cid = await self.ipfs_service.pin_json(
                            assessment_data["questions"],
                            name=f"assessment_questions_{module_id}_{assessment_data['assessment_id']}",
                            metadata={
                                "module_id": module_id,
                                "assessment_id": assessment_data["assessment_id"],
                                "type": "assessment_questions"
                            }
                        )
                        assessment_data["questions_cid"] = questions_cid
                        del assessment_data["questions"]
                    
                    # Pin rubric to IPFS if provided
                    if assessment_data.get("rubric"):
                        rubric_cid = await self.ipfs_service.pin_json(
                            assessment_data["rubric"],
                            name=f"assessment_rubric_{module_id}_{assessment_data['assessment_id']}",
                            metadata={
                                "module_id": module_id,
                                "assessment_id": assessment_data["assessment_id"],
                                "type": "assessment_rubric"
                            }
                        )
                        assessment_data["rubric_cid"] = rubric_cid
                        del assessment_data["rubric"]
                    
                    assessments.append(Assessment(**assessment_data))
            
            # Create module
            module = Module(
                module_id=module_id,
                course_id=module_data["course_id"],
                title=module_data["title"],
                description=module_data["description"],
                content=content_list,
                order=module_data.get("order", 0),
                parent_module=module_data.get("parent_module"),
                learning_objectives=module_data.get("learning_objectives", []),
                estimated_duration=module_data.get("estimated_duration", 60),
                assessments=assessments,
                completion_criteria=module_data.get("completion_criteria", {}),
                is_mandatory=module_data.get("is_mandatory", True),
                prerequisites=module_data.get("prerequisites", []),
                completion_nft_enabled=module_data.get("completion_nft_enabled", False)
            )
            
            await module.insert()
            
            # Pin complete module content to IPFS
            await self._pin_module_content(module)
            
            logger.info(f"Module created: {module_id}")
            return module
            
        except Exception as e:
            logger.error(f"Module creation failed: {e}")
            raise
    
    async def _pin_module_content(self, module: Module):
        """Pin complete module content to IPFS"""
        try:
            module_content = {
                "module_info": {
                    "module_id": module.module_id,
                    "course_id": module.course_id,
                    "title": module.title,
                    "description": module.description,
                    "learning_objectives": module.learning_objectives,
                    "estimated_duration": module.estimated_duration
                },
                "content": [content.dict() for content in module.content],
                "assessments": [assessment.dict() for assessment in module.assessments],
                "completion_criteria": module.completion_criteria
            }
            
            content_cid = await self.ipfs_service.pin_json(
                module_content,
                name=f"module_content_{module.module_id}",
                metadata={
                    "module_id": module.module_id,
                    "course_id": module.course_id,
                    "type": "complete_module_content"
                }
            )
            
            module.content_cid = content_cid
            await module.save()
            
            logger.info(f"Module content pinned to IPFS: {module.module_id} -> {content_cid}")
            
        except Exception as e:
            logger.error(f"Module content pinning failed: {e}")
    
    # Enrollment management
    async def enroll_student(self, course_id: str, student_did: str) -> Enrollment:
        """Enroll a student in a course"""
        try:
            # Check if course exists and enrollment is allowed
            course = await Course.find_one({"course_id": course_id, "status": "published"})
            if not course:
                raise ValueError(f"Course not found or not published: {course_id}")
            
            # Check enrollment period
            now = datetime.now(timezone.utc)

            # Normalize potential naive datetimes from DB to UTC-aware
            def _ensure_aware(dt_value: Optional[datetime]) -> Optional[datetime]:
                if not dt_value:
                    return None
                # If naive, assume UTC
                return dt_value.replace(tzinfo=timezone.utc) if dt_value.tzinfo is None else dt_value

            start_dt = _ensure_aware(course.enrollment_start)
            end_dt = _ensure_aware(course.enrollment_end)

            if start_dt and now < start_dt:
                raise ValueError("Enrollment has not started yet")
            if end_dt and now > end_dt:
                raise ValueError("Enrollment period has ended")
            
            # Check capacity
            if course.max_enrollments:
                current_enrollments = await Enrollment.find({
                    "course_id": course_id,
                    "status": "active"
                }).count()
                if current_enrollments >= course.max_enrollments:
                    raise ValueError("Course is full")
            
            # Check if already enrolled
            existing_enrollment = await Enrollment.find_one({
                "user_id": student_did,
                "course_id": course_id
            })
            if existing_enrollment:
                if existing_enrollment.status == "active":
                    raise ValueError("Already enrolled in this course")
                else:
                    # Reactivate enrollment
                    existing_enrollment.status = "active"
                    existing_enrollment.enrolled_at = now
                    await existing_enrollment.save()
                    
                    # Update user enrollments list if not already there
                    try:
                        from ..models.user import User
                        user = await User.find_one({"did": student_did})
                        if user and course_id not in user.enrollments:
                            user.enrollments.append(course_id)
                            await user.save()
                            logger.info(f"Updated user enrollments list for reactivated enrollment: {student_did}")
                    except Exception as user_error:
                        logger.warning(f"User enrollments update failed for reactivation (non-critical): {user_error}")
                    
                    return existing_enrollment
            
            # Create enrollment
            enrollment = Enrollment(
                user_id=student_did,
                course_id=course_id,
                enrolled_at=now,
                status="active"
            )
            
            await enrollment.insert()
            
            # Update user enrollments list
            try:
                from ..models.user import User
                user = await User.find_one({"did": student_did})
                if user and course_id not in user.enrollments:
                    user.enrollments.append(course_id)
                    await user.save()
                    logger.info(f"Updated user enrollments list for {student_did}")
            except Exception as user_error:
                logger.warning(f"User enrollments update failed (non-critical): {user_error}")
            
            logger.info(f"Student enrolled: {student_did} -> {course_id}")
            return enrollment
            
        except Exception as e:
            logger.error(f"Student enrollment failed: {e}")
            raise
    
    async def update_module_progress(self, user_id: str, module_id: str, progress_data: Dict[str, Any]) -> ModuleProgress:
        """Update student progress in a module"""
        try:
            # Get or create module progress
            module_progress = await ModuleProgress.find_one({
                "user_id": user_id,
                "module_id": module_id
            })
            
            if not module_progress:
                # Get module and course info
                module = await Module.find_one({"module_id": module_id})
                if not module:
                    raise ValueError(f"Module not found: {module_id}")
                
                module_progress = ModuleProgress(
                    user_id=user_id,
                    course_id=module.course_id,
                    module_id=module_id
                )
                await module_progress.insert()
            
            # Update progress data
            if "content_progress" in progress_data:
                module_progress.content_progress.update(progress_data["content_progress"])
            
            if "time_spent" in progress_data:
                module_progress.time_spent_minutes += progress_data["time_spent"]
            
            if "assessment_score" in progress_data:
                assessment_id = progress_data.get("assessment_id", "default")
                module_progress.assessment_scores[assessment_id] = progress_data["assessment_score"]
                module_progress.attempts += 1
                
                # Update best score
                scores = list(module_progress.assessment_scores.values())
                module_progress.best_score = max(scores) if scores else 0
            
            # Calculate completion percentage
            total_content = len(module_progress.content_progress) if module_progress.content_progress else 1
            completed_content = sum(1 for progress in module_progress.content_progress.values() if progress >= 100)
            module_progress.completion_percentage = (completed_content / total_content) * 100
            
            # Check if module is completed
            if module_progress.completion_percentage >= 100 and not module_progress.completed_at:
                module_progress.status = "completed"
                module_progress.completed_at = datetime.now(timezone.utc)
                
                # Update enrollment progress
                await self._update_enrollment_progress(user_id, module.course_id, module_id)
                
                # Update digital twin
                if self.digital_twin_service:
                    try:
                        twin_id = f"did:learntwin:{user_id.replace('did:learntwin:', '')}"
                        await self.digital_twin_service.update_learning_progress(
                            twin_id,
                            module_id,
                            100,
                            progress_data.get("time_spent", 0),
                            [progress_data.get("assessment_score")] if "assessment_score" in progress_data else None
                        )
                    except Exception as twin_error:
                        logger.warning(f"Digital twin update failed (non-critical): {twin_error}")
                else:
                    logger.info("Digital twin service not available, skipping update")
            
            module_progress.last_accessed = datetime.now(timezone.utc)
            await module_progress.save()
            
            logger.info(f"Module progress updated: {user_id} -> {module_id}")
            return module_progress
            
        except Exception as e:
            logger.error(f"Module progress update failed: {e}")
            raise
    
    async def _update_enrollment_progress(self, user_id: str, course_id: str, completed_module_id: str):
        """Update overall course enrollment progress"""
        try:
            enrollment = await Enrollment.find_one({
                "user_id": user_id,
                "course_id": course_id,
                "status": "active"
            })
            
            if not enrollment:
                return
            
            # Add completed module
            if completed_module_id not in enrollment.completed_modules:
                enrollment.completed_modules.append(completed_module_id)
            
            # Get total modules for course
            total_modules = await Module.find({
                "course_id": course_id,
                "is_mandatory": True
            }).count()
            
            if total_modules > 0:
                enrollment.completion_percentage = (len(enrollment.completed_modules) / total_modules) * 100
                
                # Check if course is completed
                if enrollment.completion_percentage >= 100 and not enrollment.completed_at:
                    enrollment.status = "completed"
                    enrollment.completed_at = datetime.now(timezone.utc)
                    
                    # Calculate final grade (average of best scores)
                    module_progresses = await ModuleProgress.find({
                        "user_id": user_id,
                        "course_id": course_id,
                        "status": "completed"
                    }).to_list()
                    
                    if module_progresses:
                        total_score = sum(mp.best_score for mp in module_progresses)
                        enrollment.final_grade = total_score / len(module_progresses)
            
            await enrollment.save()
            
        except Exception as e:
            logger.error(f"Enrollment progress update failed: {e}")
    
    # Query methods
    async def get_course(self, course_id: str, include_modules: bool = False) -> Optional[Course]:
        """Get course by ID"""
        try:
            # Try cache first
            cached_course = await self.redis_service.get_cache(f"course:{course_id}")
            if cached_course and not include_modules:
                return Course(**cached_course)
            
            course = await Course.find_one({"course_id": course_id})
            if not course:
                return None
            
            # Note: modules are stored separately in the modules collection
            # They are retrieved separately when needed
            
            return course
            
        except Exception as e:
            logger.error(f"Course retrieval failed: {e}")
            return None
    
    async def get_student_enrollments(self, student_did: str) -> List[Dict[str, Any]]:
        """Get all enrollments for a student"""
        try:
            # First try to get enrollments from Enrollment collection
            enrollments = await Enrollment.find({"user_id": student_did}).to_list()
            
            # If no enrollments found, check user's enrollments list as fallback
            if not enrollments:
                try:
                    from ..models.user import User
                    user = await User.find_one({"did": student_did})
                    if user and user.enrollments:
                        logger.info(f"Found {len(user.enrollments)} enrollments in user model for {student_did}")
                        # Create enrollment records from user's enrollments list
                        for course_id in user.enrollments:
                            course = await self.get_course(course_id)
                            if course:
                                # Create a basic enrollment record
                                enrollment_data = {
                                    "user_id": student_did,
                                    "course_id": course_id,
                                    "enrolled_at": user.created_at,
                                    "status": "active",
                                    "completed_modules": [],
                                    "completion_percentage": 0.0
                                }
                                enrollments.append(type('Enrollment', (), enrollment_data)())
                except Exception as user_error:
                    logger.warning(f"Failed to get enrollments from user model: {user_error}")
            
            enrollment_data = []
            for enrollment in enrollments:
                try:
                    course = await self.get_course(enrollment.course_id)
                    if course:
                        enrollment_info = {
                            "enrollment": enrollment.dict() if hasattr(enrollment, 'dict') else enrollment.__dict__,
                            "course": course.dict()
                        }
                        enrollment_data.append(enrollment_info)
                    else:
                        # Course not found, still include enrollment
                        logger.warning(f"Course {enrollment.course_id} not found for enrollment")
                        enrollment_info = {
                            "enrollment": enrollment.dict() if hasattr(enrollment, 'dict') else enrollment.__dict__,
                            "course": None
                        }
                        enrollment_data.append(enrollment_info)
                except Exception as course_error:
                    logger.warning(f"Non-critical error processing course {enrollment.course_id}: {course_error}")
                    # Still include enrollment even if course fails
                    enrollment_info = {
                        "enrollment": enrollment.dict() if hasattr(enrollment, 'dict') else enrollment.__dict__,
                        "course": None
                    }
                    enrollment_data.append(enrollment_info)
            
            return enrollment_data
            
        except Exception as e:
            logger.error(f"Student enrollments retrieval failed: {e}")
            # Return empty list instead of raising exception
            return []
    
    async def sync_user_enrollments(self, student_did: str) -> bool:
        """Sync enrollments between User model and Enrollment collection"""
        try:
            from ..models.user import User
            user = await User.find_one({"did": student_did})
            if not user:
                logger.warning(f"User not found for enrollment sync: {student_did}")
                return False
            
            # Get existing enrollments from Enrollment collection
            existing_enrollments = await Enrollment.find({"user_id": student_did}).to_list()
            existing_course_ids = {e.course_id for e in existing_enrollments}
            
            # Update user's enrollments list with existing enrollments
            user.enrollments = list(existing_course_ids)
            await user.save()
            
            logger.info(f"Synced {len(user.enrollments)} enrollments for user {student_did}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to sync user enrollments for {student_did}: {e}")
            return False
    
    async def search_courses(self, query: str = None, filters: Dict[str, Any] = None, skip: int = 0, limit: int = 20, current_user: Dict[str, Any] = None) -> Dict[str, Any]:
        """Search courses with filters"""
        try:
            logger.debug(f"Search courses: query='{query}', filters={filters}, skip={skip}, limit={limit}")
            
            # Start with a more permissive search criteria
            search_criteria = {}
            
            # Add basic filters for published and public courses
            search_criteria["status"] = "published"
            search_criteria["is_public"] = True
            
            logger.debug(f"Initial search criteria: {search_criteria}")
            
            if query:
                search_criteria["$or"] = [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"metadata.tags": {"$in": [query]}}
                ]
                logger.debug(f"Added query filter")
            
            if filters:
                if "difficulty_level" in filters:
                    search_criteria["metadata.difficulty_level"] = filters["difficulty_level"]
                    logger.debug(f"Added difficulty filter: {filters['difficulty_level']}")
                if "institution" in filters:
                    search_criteria["institution"] = filters["institution"]
                    logger.debug(f"Added institution filter: {filters['institution']}")
                if "tags" in filters:
                    search_criteria["metadata.tags"] = {"$in": filters["tags"]}
                    logger.debug(f"Added tags filter: {filters['tags']}")
            
            logger.debug(f"Final search criteria: {search_criteria}")
            
            # Get courses from MongoDB
            courses = await Course.find(search_criteria).skip(skip).limit(limit).to_list()
            total = await Course.find(search_criteria).count()
            
            logger.debug(f"Found {len(courses)} courses matching criteria")
            
            # If no courses found and this is the first page, try to create sample courses
            if not courses and skip == 0:
                logger.debug("No courses found, creating sample courses for testing")
                await self._create_sample_courses()
                # Try search again
                courses = await Course.find(search_criteria).skip(skip).limit(limit).to_list()
                total = await Course.find(search_criteria).count()
                logger.debug(f"After creating sample courses: Found {len(courses)} courses")
            
            # If still no courses found, try without status filter to see what's in database
            if not courses and skip == 0:
                logger.debug("Still no courses found, checking all courses in database")
                all_courses = await Course.find({}).to_list()
                logger.debug(f"Total courses in database (any status): {len(all_courses)}")
                
                # Try search without status filter
                search_criteria_no_status = search_criteria.copy()
                if "status" in search_criteria_no_status:
                    del search_criteria_no_status["status"]
                if "is_public" in search_criteria_no_status:
                    del search_criteria_no_status["is_public"]
                
                logger.debug(f"Trying without status filter: {search_criteria_no_status}")
                courses = await Course.find(search_criteria_no_status).skip(skip).limit(limit).to_list()
                total = await Course.find(search_criteria_no_status).count()
                logger.debug(f"Found {len(courses)} courses without status filter")
            
            # Get user enrollments if authenticated
            user_enrollments = set()
            if current_user:
                try:
                    # Handle both User object and dict formats
                    user_did = current_user.did if hasattr(current_user, 'did') else current_user.get("did")
                    
                    # Method 1: Check Enrollment collection
                    enrollments = await Enrollment.find({"user_id": user_did}).to_list()
                    enrolled_from_collection = {e.course_id for e in enrollments if e.status == "active"}
                    user_enrollments.update(enrolled_from_collection)
                    
                    # Method 2: Check user.enrollments field as fallback
                    from ..models.user import User
                    user_obj = await User.find_one({"did": user_did})
                    if user_obj and user_obj.enrollments:
                        user_enrollments.update(user_obj.enrollments)
                    
                    logger.debug(f"User {user_did} enrolled in: {user_enrollments}")
                except Exception as e:
                    logger.debug(f"Could not load enrollments: {e}")
                    user_enrollments = set()
            
            # Transform courses to match frontend expectations
            transformed_courses = []
            for course in courses:
                try:
                    # Convert course to dict and handle ObjectId serialization
                    course_dict = course.dict()
                    
                    # Transform to match frontend interface
                    transformed_course = {
                        "id": course_dict.get("course_id"),
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
                        "is_enrolled": course_dict.get("course_id") in user_enrollments if current_user else False
                    }
                    transformed_courses.append(transformed_course)
                except Exception as e:
                    logger.error(f"Error transforming course {course.course_id}: {e}")
                    continue
            
            logger.debug(f"Returning {len(transformed_courses)} transformed courses")
            
            return {
                "items": transformed_courses,
                "total": total,
                "skip": skip,
                "limit": limit
            }
            
        except Exception as e:
            logger.error(f"Course search failed: {e}")
            return {"items": [], "total": 0, "skip": skip, "limit": limit}
    
    async def _create_sample_courses(self):
        """Create sample courses for testing"""
        try:
            from ..models.user import User
            
            # Get or create a sample instructor
            instructor = await User.find_one({"role": "teacher"})
            if not instructor:
                # Create a sample instructor
                instructor = User(
                    did="did:learntwin:sample_teacher",
                    email="teacher@uit.edu.vn",
                    username="sample_teacher",
                    role="teacher",
                    is_email_verified=True
                )
                await instructor.insert()
            
            sample_courses = [
                {
                    "course_id": "course_python_basics",
                    "title": "Python Programming Basics",
                    "description": "Learn the fundamentals of Python programming language. Perfect for beginners who want to start their coding journey.",
                    "created_by": instructor.did,
                    "institution": "UIT - University of Information Technology",
                    "instructors": [instructor.did],
                    "metadata": {
                        "difficulty_level": "beginner",
                        "tags": ["python", "programming", "basics"],
                        "prerequisites": ["No prior programming experience required"],
                        "estimated_duration_minutes": 480,
                        "category": "Programming"
                    },
                    "enrollment_start": "2024-01-01T00:00:00Z",
                    "enrollment_end": "2024-12-31T23:59:59Z",
                    "course_start": "2024-02-01T00:00:00Z",
                    "course_end": "2024-03-31T23:59:59Z",
                    "max_enrollments": 100,
                    "is_public": True,
                    "requires_approval": False,
                    "completion_nft_enabled": True,
                    "status": "published",
                    "enrollment_count": 25,
                    "rating": 4.5,
                    "thumbnail_url": "https://example.com/python-basics.jpg"
                },
                {
                    "course_id": "course_web_development",
                    "title": "Web Development with React",
                    "description": "Build modern web applications using React.js. Learn component-based architecture and state management.",
                    "created_by": instructor.did,
                    "institution": "UIT - University of Information Technology",
                    "instructors": [instructor.did],
                    "metadata": {
                        "difficulty_level": "intermediate",
                        "tags": ["react", "javascript", "web-development"],
                        "prerequisites": ["Basic JavaScript knowledge"],
                        "estimated_duration_minutes": 600,
                        "category": "Web Development"
                    },
                    "enrollment_start": "2024-01-01T00:00:00Z",
                    "enrollment_end": "2024-12-31T23:59:59Z",
                    "course_start": "2024-02-01T00:00:00Z",
                    "course_end": "2024-03-31T23:59:59Z",
                    "max_enrollments": 50,
                    "is_public": True,
                    "requires_approval": False,
                    "completion_nft_enabled": True,
                    "status": "published",
                    "enrollment_count": 15,
                    "rating": 4.8,
                    "thumbnail_url": "https://example.com/react-web.jpg"
                },
                {
                    "course_id": "course_data_science",
                    "title": "Data Science Fundamentals",
                    "description": "Introduction to data science concepts, tools, and methodologies. Learn to analyze and visualize data.",
                    "created_by": instructor.did,
                    "institution": "UIT - University of Information Technology",
                    "instructors": [instructor.did],
                    "metadata": {
                        "difficulty_level": "intermediate",
                        "tags": ["data-science", "python", "analytics"],
                        "prerequisites": ["Python basics", "Basic statistics"],
                        "estimated_duration_minutes": 720,
                        "category": "Data Science"
                    },
                    "enrollment_start": "2024-01-01T00:00:00Z",
                    "enrollment_end": "2024-12-31T23:59:59Z",
                    "course_start": "2024-02-01T00:00:00Z",
                    "course_end": "2024-03-31T23:59:59Z",
                    "max_enrollments": 30,
                    "is_public": True,
                    "requires_approval": False,
                    "completion_nft_enabled": True,
                    "status": "published",
                    "enrollment_count": 8,
                    "rating": 4.6,
                    "thumbnail_url": "https://example.com/data-science.jpg"
                }
            ]
            
            for course_data in sample_courses:
                # Check if course already exists
                existing_course = await Course.find_one({"course_id": course_data["course_id"]})
                if not existing_course:
                    # Remove fields that are not in the Course model
                    course_model_data = {k: v for k, v in course_data.items() 
                                       if k not in ["enrollment_count", "rating", "thumbnail_url"]}
                    course = Course(**course_model_data)
                    await course.insert()
                    logger.info(f"Created sample course: {course_data['course_id']}")
            
        except Exception as e:
            logger.error(f"Failed to create sample courses: {e}")