"""
Unified Search API for courses, lessons, modules, quizzes, and achievements
"""
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
import logging

from ..models.user import User
from ..dependencies import get_optional_user
from ..models.course import Course, Module, Lesson
from ..models.quiz_achievement import Quiz, Achievement

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["search"])

class SearchResult(BaseModel):
    id: str
    type: str  # 'course', 'module', 'lesson', 'quiz', 'achievement'
    title: str
    description: Optional[str] = None
    course_id: Optional[str] = None
    course_name: Optional[str] = None
    module_id: Optional[str] = None
    module_name: Optional[str] = None
    tags: List[str] = []
    difficulty_level: Optional[str] = None
    duration_minutes: Optional[int] = None
    url: str
    metadata: Dict[str, Any] = {}
    # Additional fields for achievements
    achievement_type: Optional[str] = None
    tier: Optional[str] = None

@router.get("/")
async def unified_search(
    q: str = Query(..., min_length=2, description="Search query"),
    type: Optional[str] = Query(None, description="Filter by content type"),
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    difficulty_level: Optional[str] = Query(None, description="Filter by difficulty level"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    current_user: User = Depends(get_optional_user)
):
    """Unified search across all content types"""
    try:
        search_query = q.lower().strip()
        all_results: List[SearchResult] = []
        
        # Search courses
        if not type or type == "course":
            course_filter = {"status": "published", "is_public": True}
            if difficulty_level:
                course_filter["metadata.difficulty_level"] = difficulty_level
            
            courses = await Course.find(course_filter).to_list()
            
            for course in courses:
                if (search_query in course.title.lower() or 
                    search_query in course.description.lower() or
                    any(search_query in tag.lower() for tag in course.metadata.tags)):
                    
                    all_results.append(SearchResult(
                        id=course.course_id,
                        type="course",
                        title=course.title,
                        description=course.description,
                        tags=course.metadata.tags,
                        difficulty_level=course.metadata.difficulty_level,
                        duration_minutes=course.metadata.estimated_hours * 60,
                        url=f"/course/{course.course_id}",
                        metadata={
                            "institution": course.institution,
                            "enrollment_count": course.enrollment_count,
                            "average_rating": course.average_rating,
                            "total_ratings": course.total_ratings
                        }
                    ))
        
        # Search modules
        if not type or type == "module":
            module_filter = {}
            if course_id:
                module_filter["course_id"] = course_id
            
            modules = await Module.find(module_filter).to_list()
            
            for module in modules:
                if (search_query in module.title.lower() or 
                    search_query in module.description.lower() or
                    any(search_query in tag.lower() for tag in module.tags)):
                    
                    # Get course info for context
                    course = await Course.find_one({"course_id": module.course_id})
                    course_name = course.title if course else "Unknown Course"
                    
                    all_results.append(SearchResult(
                        id=module.module_id,
                        type="module",
                        title=module.title,
                        description=module.description,
                        course_id=module.course_id,
                        course_name=course_name,
                        tags=module.tags,
                        difficulty_level=module.difficulty_level,
                        duration_minutes=module.estimated_duration,
                        url=f"/course/{module.course_id}/module/{module.module_id}",
                        metadata={
                            "order": module.order,
                            "is_mandatory": module.is_mandatory,
                            "completion_criteria": module.completion_criteria
                        }
                    ))
        
        # Search lessons
        if not type or type == "lesson":
            lesson_filter = {}
            if course_id:
                lesson_filter["course_id"] = course_id
            
            lessons = await Lesson.find(lesson_filter).to_list()
            
            for lesson in lessons:
                if (search_query in lesson.title.lower() or 
                    search_query in lesson.description.lower() or
                    any(search_query in keyword.lower() for keyword in lesson.keywords)):
                    
                    # Get course and module info for context
                    course = await Course.find_one({"course_id": lesson.course_id})
                    module = await Module.find_one({"module_id": lesson.module_id})
                    
                    course_name = course.title if course else "Unknown Course"
                    module_name = module.title if module else "Unknown Module"
                    
                    all_results.append(SearchResult(
                        id=lesson.lesson_id,
                        type="lesson",
                        title=lesson.title,
                        description=lesson.description,
                        course_id=lesson.course_id,
                        course_name=course_name,
                        module_id=lesson.module_id,
                        module_name=module_name,
                        tags=lesson.keywords,
                        difficulty_level=lesson.difficulty_level,
                        duration_minutes=lesson.duration_minutes,
                        url=f"/course/{lesson.course_id}/lesson/{lesson.lesson_id}",
                        metadata={
                            "content_type": lesson.content_type,
                            "order": lesson.order,
                            "is_mandatory": lesson.is_mandatory,
                            "learning_objectives": lesson.learning_objectives
                        }
                    ))
        
        # Search quizzes
        if not type or type == "quiz":
            quiz_filter = {"status": "published"}
            if course_id:
                quiz_filter["course_id"] = course_id
            
            quizzes = await Quiz.find(quiz_filter).to_list()
            
            for quiz in quizzes:
                if (search_query in quiz.title.lower() or 
                    search_query in quiz.description.lower()):
                    
                    # Get course info for context
                    course = await Course.find_one({"course_id": quiz.course_id})
                    course_name = course.title if course else "Unknown Course"
                    
                    all_results.append(SearchResult(
                        id=quiz.quiz_id,
                        type="quiz",
                        title=quiz.title,
                        description=quiz.description,
                        course_id=quiz.course_id,
                        course_name=course_name,
                        module_id=quiz.module_id,
                        tags=[],
                        duration_minutes=quiz.time_limit_minutes,
                        url=f"/course/{quiz.course_id}/quiz/{quiz.quiz_id}",
                        metadata={
                            "quiz_type": quiz.quiz_type,
                            "total_points": quiz.total_points,
                            "passing_score": quiz.passing_score,
                            "max_attempts": quiz.max_attempts
                        }
                    ))
        
        # Search achievements
        if not type or type == "achievement":
            achievement_filter = {"status": "active"}
            if course_id:
                achievement_filter["course_id"] = course_id
            
            achievements = await Achievement.find(achievement_filter).to_list()
            
            for achievement in achievements:
                if (search_query in achievement.title.lower() or 
                    search_query in achievement.description.lower() or
                    any(search_query in tag.lower() for tag in achievement.tags)):
                    
                    # Get course info for context
                    course = await Course.find_one({"course_id": achievement.course_id})
                    course_name = course.title if course else "Unknown Course"
                    
                    all_results.append(SearchResult(
                        id=achievement.achievement_id,
                        type="achievement",
                        title=achievement.title,
                        description=achievement.description,
                        course_id=achievement.course_id,
                        course_name=course_name,
                        tags=achievement.tags,
                        url=f"/achievements/{achievement.achievement_id}",
                        achievement_type=achievement.achievement_type,
                        tier=achievement.tier,
                        metadata={
                            "achievement_type": achievement.achievement_type,
                            "tier": achievement.tier,
                            "points_reward": achievement.points_reward,
                            "nft_enabled": achievement.nft_enabled,
                            "rarity": achievement.rarity
                        }
                    ))
        
        # Sort results by relevance (exact matches first, then by type priority)
        def sort_key(result: SearchResult) -> tuple:
            title_match = search_query in result.title.lower()
            description_match = result.description and search_query in result.description.lower()
            tag_match = any(search_query in tag.lower() for tag in result.tags)
            
            # Relevance score (higher is better)
            relevance = 0
            if title_match:
                relevance += 3
            if description_match:
                relevance += 2
            if tag_match:
                relevance += 1
            
            # Type priority (courses first, then modules, lessons, quizzes, achievements)
            type_priority = {
                "course": 5,
                "module": 4,
                "lesson": 3,
                "quiz": 2,
                "achievement": 1
            }.get(result.type, 0)
            
            return (-relevance, -type_priority, result.title.lower())
        
        all_results.sort(key=sort_key)
        
        # Apply pagination
        total_results = len(all_results)
        paginated_results = all_results[skip:skip + limit]
        
        # Count results by type
        type_counts = {}
        for result in all_results:
            type_counts[result.type] = type_counts.get(result.type, 0) + 1
        
        return {
            "query": q,
            "results": [result.dict() for result in paginated_results],
            "total": total_results,
            "skip": skip,
            "limit": limit,
            "type_counts": type_counts,
            "filters": {
                "type": type,
                "course_id": course_id,
                "difficulty_level": difficulty_level
            }
        }
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Search query for suggestions"),
    limit: int = Query(10, ge=1, le=20, description="Number of suggestions to return"),
    current_user: User = Depends(get_optional_user)
):
    """Get search suggestions based on partial query"""
    try:
        search_query = q.lower().strip()
        suggestions = set()
        
        # Get course title suggestions
        courses = await Course.find({
            "status": "published",
            "is_public": True,
            "title": {"$regex": search_query, "$options": "i"}
        }).limit(5).to_list()
        
        for course in courses:
            suggestions.add(course.title)
        
        # Get module title suggestions
        modules = await Module.find({
            "title": {"$regex": search_query, "$options": "i"}
        }).limit(5).to_list()
        
        for module in modules:
            suggestions.add(module.title)
        
        # Get lesson title suggestions
        lessons = await Lesson.find({
            "title": {"$regex": search_query, "$options": "i"}
        }).limit(5).to_list()
        
        for lesson in lessons:
            suggestions.add(lesson.title)
        
        # Get tag suggestions
        all_courses = await Course.find({"status": "published", "is_public": True}).to_list()
        for course in all_courses:
            for tag in course.metadata.tags:
                if search_query in tag.lower():
                    suggestions.add(tag)
        
        # Convert to list and limit
        suggestion_list = list(suggestions)[:limit]
        
        return {
            "query": q,
            "suggestions": suggestion_list
        }
        
    except Exception as e:
        logger.error(f"Search suggestions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get search suggestions")

@router.get("/stats")
async def get_search_stats(
    current_user: User = Depends(get_optional_user)
):
    """Get search statistics"""
    try:
        # Count total content
        course_count = await Course.find({"status": "published", "is_public": True}).count()
        module_count = await Module.find({}).count()
        lesson_count = await Lesson.find({}).count()
        quiz_count = await Quiz.find({"status": "published"}).count()
        achievement_count = await Achievement.find({"status": "active"}).count()
        
        return {
            "total_content": {
                "courses": course_count,
                "modules": module_count,
                "lessons": lesson_count,
                "quizzes": quiz_count,
                "achievements": achievement_count
            },
            "total_items": course_count + module_count + lesson_count + quiz_count + achievement_count
        }
        
    except Exception as e:
        logger.error(f"Search stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get search statistics")
