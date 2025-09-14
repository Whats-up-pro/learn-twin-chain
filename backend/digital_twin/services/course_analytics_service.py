"""
Course Analytics Service for handling ratings, enrollments, and statistics
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import logging

from ..models.course import Course, Enrollment, CourseRating
from ..models.user import User

logger = logging.getLogger(__name__)

class CourseAnalyticsService:
    """Service for course analytics and statistics"""
    
    async def update_course_analytics(self, course_id: str) -> Dict[str, Any]:
        """Update course analytics including enrollment count, completion count, and ratings"""
        try:
            course = await Course.find_one({"course_id": course_id})
            if not course:
                raise ValueError(f"Course {course_id} not found")
            
            # Get enrollment statistics
            enrollments = await Enrollment.find({"course_id": course_id}).to_list()
            total_enrollments = len(enrollments)
            completed_enrollments = len([e for e in enrollments if e.status == "completed"])
            
            # Get rating statistics
            ratings = await CourseRating.find({"course_id": course_id}).to_list()
            total_ratings = len(ratings)
            average_rating = 0.0
            
            if total_ratings > 0:
                total_score = sum(rating.rating for rating in ratings)
                average_rating = round(total_score / total_ratings, 1)
            
            # Update course with new analytics
            course.enrollment_count = total_enrollments
            course.completion_count = completed_enrollments
            course.total_ratings = total_ratings
            course.average_rating = average_rating
            course.update_timestamp()
            
            await course.save()
            
            return {
                "enrollment_count": total_enrollments,
                "completion_count": completed_enrollments,
                "total_ratings": total_ratings,
                "average_rating": average_rating
            }
            
        except Exception as e:
            logger.error(f"Failed to update course analytics for {course_id}: {e}")
            raise
    
    async def add_course_rating(
        self, 
        course_id: str, 
        user_id: str, 
        rating: int, 
        review: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add or update a course rating"""
        try:
            # Check if user is enrolled in the course
            enrollment = await Enrollment.find_one({
                "course_id": course_id,
                "user_id": user_id
            })
            
            if not enrollment:
                raise ValueError("User must be enrolled in the course to rate it")
            
            # Check if user already rated this course
            existing_rating = await CourseRating.find_one({
                "course_id": course_id,
                "user_id": user_id
            })
            
            rating_id = f"rating_{uuid.uuid4().hex[:12]}"
            
            if existing_rating:
                # Update existing rating
                existing_rating.rating = rating
                existing_rating.review = review
                existing_rating.updated_at = datetime.now(timezone.utc)
                existing_rating.is_verified = enrollment.status == "completed"
                await existing_rating.save()
                rating_id = existing_rating.rating_id
            else:
                # Create new rating
                new_rating = CourseRating(
                    rating_id=rating_id,
                    course_id=course_id,
                    user_id=user_id,
                    rating=rating,
                    review=review,
                    is_verified=enrollment.status == "completed"
                )
                await new_rating.save()
            
            # Update course analytics
            await self.update_course_analytics(course_id)
            
            return {
                "rating_id": rating_id,
                "rating": rating,
                "review": review,
                "is_verified": enrollment.status == "completed"
            }
            
        except Exception as e:
            logger.error(f"Failed to add course rating: {e}")
            raise
    
    async def get_course_ratings(
        self, 
        course_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get course ratings with pagination"""
        try:
            ratings = await CourseRating.find({"course_id": course_id})\
                .sort("-created_at")\
                .skip(skip)\
                .limit(limit)\
                .to_list()
            
            total_ratings = await CourseRating.find({"course_id": course_id}).count()
            
            # Get user names for ratings (you might want to optimize this with aggregation)
            rating_data = []
            for rating in ratings:
                rating_data.append({
                    "rating_id": rating.rating_id,
                    "rating": rating.rating,
                    "review": rating.review,
                    "is_verified": rating.is_verified,
                    "helpful_votes": rating.helpful_votes,
                    "created_at": rating.created_at,
                    "user_id": rating.user_id  # You might want to include user name here
                })
            
            return {
                "ratings": rating_data,
                "total": total_ratings,
                "skip": skip,
                "limit": limit
            }
            
        except Exception as e:
            logger.error(f"Failed to get course ratings: {e}")
            raise
    
    async def get_course_statistics(self, course_id: str) -> Dict[str, Any]:
        """Get comprehensive course statistics"""
        try:
            course = await Course.find_one({"course_id": course_id})
            if not course:
                raise ValueError(f"Course {course_id} not found")
            
            # Get enrollment statistics
            enrollments = await Enrollment.find({"course_id": course_id}).to_list()
            
            # Calculate enrollment trends (last 30 days)
            thirty_days_ago = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            thirty_days_ago = thirty_days_ago.replace(day=thirty_days_ago.day - 30)
            
            recent_enrollments = len([
                e for e in enrollments 
                if e.enrolled_at >= thirty_days_ago
            ])
            
            # Get completion rate
            total_enrollments = len(enrollments)
            completed_enrollments = len([e for e in enrollments if e.status == "completed"])
            completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
            
            # Get rating distribution
            ratings = await CourseRating.find({"course_id": course_id}).to_list()
            rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for rating in ratings:
                rating_distribution[rating.rating] += 1
            
            return {
                "course_id": course_id,
                "title": course.title,
                "enrollment_count": course.enrollment_count,
                "completion_count": course.completion_count,
                "completion_rate": round(completion_rate, 1),
                "average_rating": course.average_rating,
                "total_ratings": course.total_ratings,
                "recent_enrollments": recent_enrollments,
                "rating_distribution": rating_distribution,
                "status": course.status,
                "created_at": course.created_at,
                "updated_at": course.updated_at
            }
            
        except Exception as e:
            logger.error(f"Failed to get course statistics: {e}")
            raise
    
    async def get_popular_courses(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most popular courses based on enrollments and ratings"""
        try:
            courses = await Course.find({
                "status": "published",
                "is_public": True
            })\
            .sort([("enrollment_count", -1), ("average_rating", -1)])\
            .limit(limit)\
            .to_list()
            
            return [
                {
                    "course_id": course.course_id,
                    "title": course.title,
                    "description": course.description,
                    "thumbnail_url": course.thumbnail_url,
                    "enrollment_count": course.enrollment_count,
                    "average_rating": course.average_rating,
                    "total_ratings": course.total_ratings,
                    "difficulty_level": course.metadata.difficulty_level,
                    "estimated_hours": course.metadata.estimated_hours,
                    "tags": course.metadata.tags
                }
                for course in courses
            ]
            
        except Exception as e:
            logger.error(f"Failed to get popular courses: {e}")
            raise
    
    async def get_highly_rated_courses(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get highly rated courses"""
        try:
            courses = await Course.find({
                "status": "published",
                "is_public": True,
                "total_ratings": {"$gte": 5}  # At least 5 ratings
            })\
            .sort([("average_rating", -1), ("total_ratings", -1)])\
            .limit(limit)\
            .to_list()
            
            return [
                {
                    "course_id": course.course_id,
                    "title": course.title,
                    "description": course.description,
                    "thumbnail_url": course.thumbnail_url,
                    "enrollment_count": course.enrollment_count,
                    "average_rating": course.average_rating,
                    "total_ratings": course.total_ratings,
                    "difficulty_level": course.metadata.difficulty_level,
                    "estimated_hours": course.metadata.estimated_hours,
                    "tags": course.metadata.tags
                }
                for course in courses
            ]
            
        except Exception as e:
            logger.error(f"Failed to get highly rated courses: {e}")
            raise
