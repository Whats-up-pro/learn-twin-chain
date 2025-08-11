"""
Quiz management API endpoints
"""
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
import logging
from datetime import datetime, timezone

from ..models.quiz_achievement import Quiz, QuizAttempt, QuizQuestion, QuizType, QuestionType
from ..models.user import User
from ..dependencies import get_current_user, require_permission
from ..services.ipfs_service import IPFSService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quizzes", tags=["quizzes"])

ipfs_service = IPFSService()

# Pydantic models
class QuizCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    course_id: str = Field(..., description="Parent course identifier")
    module_id: Optional[str] = Field(default=None, description="Associated module identifier")
    quiz_type: QuizType = Field(default=QuizType.MULTIPLE_CHOICE)
    questions: List[Dict[str, Any]] = Field(..., min_items=1, description="Quiz questions")
    passing_score: float = Field(default=70.0, ge=0, le=100)
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)
    max_attempts: int = Field(default=3, ge=1)
    shuffle_questions: bool = Field(default=True)
    shuffle_options: bool = Field(default=True)
    is_required: bool = Field(default=False)
    instructions: Optional[str] = None

class QuizUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[Dict[str, Any]]] = None
    passing_score: Optional[float] = None
    time_limit_minutes: Optional[int] = None
    max_attempts: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    is_required: Optional[bool] = None
    instructions: Optional[str] = None
    status: Optional[str] = None

class QuizAttemptRequest(BaseModel):
    answers: Dict[str, Any] = Field(..., description="Student answers")
    time_spent_minutes: Optional[int] = None

# Quiz endpoints
@router.post("/", dependencies=[Depends(require_permission("create_quiz"))])
async def create_quiz(
    request: QuizCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new quiz"""
    try:
        # Validate course exists
        from ..models.course import Course
        course = await Course.find_one({"course_id": request.course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Check permissions
        if current_user.did not in course.instructors and current_user.did != course.created_by:
            if current_user.role not in ["admin", "institution_admin"]:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Generate quiz ID
        quiz_id = f"quiz_{int(datetime.now().timestamp())}_{request.course_id}"
        
        # Process questions
        questions_list = []
        total_points = 0
        
        for i, q_data in enumerate(request.questions):
            try:
                question = QuizQuestion(
                    question_id=q_data.get("question_id", f"q_{i+1}"),
                    question_text=q_data["question_text"],
                    question_type=QuestionType(q_data.get("question_type", "multiple_choice")),
                    options=q_data.get("options", []),
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data.get("explanation"),
                    points=q_data.get("points", 1.0),
                    order=i
                )
                questions_list.append(question)
                total_points += question.points
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid question data at index {i}: {str(e)}")
        
        # Create quiz
        quiz = Quiz(
            quiz_id=quiz_id,
            title=request.title,
            description=request.description,
            course_id=request.course_id,
            module_id=request.module_id,
            quiz_type=request.quiz_type,
            questions=questions_list,
            total_points=total_points,
            passing_score=request.passing_score,
            time_limit_minutes=request.time_limit_minutes,
            max_attempts=request.max_attempts,
            shuffle_questions=request.shuffle_questions,
            shuffle_options=request.shuffle_options,
            is_required=request.is_required,
            created_by=current_user.did,
            instructions=request.instructions
        )
        
        await quiz.insert()
        
        logger.info(f"Quiz created: {quiz_id}")
        return {
            "message": "Quiz created successfully",
            "quiz": quiz.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz creation failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz creation failed")

@router.get("/")
async def search_quizzes(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    module_id: Optional[str] = Query(None, description="Filter by module ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Search and filter quizzes"""
    try:
        filters = {"status": {"$ne": "archived"}}
        
        if course_id:
            filters["course_id"] = course_id
        if module_id:
            filters["module_id"] = module_id
        if status:
            filters["status"] = status
        
        # Only show published quizzes to students
        if current_user.role == "student":
            filters["status"] = "published"
        
        quizzes = await Quiz.find(filters).skip(skip).limit(limit).to_list()
        total = await Quiz.count_documents(filters)
        
        return {
            "quizzes": [quiz.dict() for quiz in quizzes],
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Quiz search failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz search failed")

@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get quiz by ID"""
    try:
        quiz = await Quiz.find_one({"quiz_id": quiz_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Check if student can access this quiz
        if current_user.role == "student" and quiz.status != "published":
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        quiz_data = quiz.dict()
        
        # For students, shuffle questions/options if enabled and don't show correct answers
        if current_user.role == "student":
            import random
            
            questions = quiz_data["questions"].copy()
            
            # Shuffle questions if enabled
            if quiz.shuffle_questions:
                random.shuffle(questions)
            
            # Shuffle options and remove correct answers
            for question in questions:
                if quiz.shuffle_options and question.get("options"):
                    random.shuffle(question["options"])
                # Remove correct answer for students
                question.pop("correct_answer", None)
                question.pop("explanation", None)
            
            quiz_data["questions"] = questions
        
        return {"quiz": quiz_data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz retrieval failed")

@router.put("/{quiz_id}", dependencies=[Depends(require_permission("update_quiz"))])
async def update_quiz(
    quiz_id: str,
    request: QuizUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update quiz"""
    try:
        quiz = await Quiz.find_one({"quiz_id": quiz_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Check permissions
        if current_user.did != quiz.created_by and current_user.role not in ["admin", "institution_admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Apply updates
        update_data = request.dict(exclude_none=True)
        
        if "questions" in update_data:
            questions_list = []
            total_points = 0
            
            for i, q_data in enumerate(update_data["questions"]):
                question = QuizQuestion(
                    question_id=q_data.get("question_id", f"q_{i+1}"),
                    question_text=q_data["question_text"],
                    question_type=QuestionType(q_data.get("question_type", "multiple_choice")),
                    options=q_data.get("options", []),
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data.get("explanation"),
                    points=q_data.get("points", 1.0),
                    order=i
                )
                questions_list.append(question)
                total_points += question.points
            
            quiz.questions = questions_list
            quiz.total_points = total_points
            del update_data["questions"]
        
        for key, value in update_data.items():
            if hasattr(quiz, key):
                setattr(quiz, key, value)
        
        quiz.update_timestamp()
        await quiz.save()
        
        logger.info(f"Quiz updated: {quiz_id}")
        return {
            "message": "Quiz updated successfully",
            "quiz": quiz.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz update failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz update failed")

@router.post("/{quiz_id}/publish", dependencies=[Depends(require_permission("publish_quiz"))])
async def publish_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user)
):
    """Publish a quiz"""
    try:
        quiz = await Quiz.find_one({"quiz_id": quiz_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Check permissions
        if current_user.did != quiz.created_by and current_user.role not in ["admin", "institution_admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        quiz.status = "published"
        quiz.update_timestamp()
        await quiz.save()
        
        logger.info(f"Quiz published: {quiz_id}")
        return {
            "message": "Quiz published successfully",
            "quiz": quiz.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz publishing failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz publishing failed")

# Quiz attempt endpoints
@router.post("/{quiz_id}/attempt")
async def start_quiz_attempt(
    quiz_id: str,
    current_user: User = Depends(get_current_user)
):
    """Start a new quiz attempt"""
    try:
        quiz = await Quiz.find_one({"quiz_id": quiz_id, "status": "published"})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found or not published")
        
        # Check max attempts
        existing_attempts = await QuizAttempt.count_documents({
            "user_id": current_user.did,
            "quiz_id": quiz_id
        })
        
        if existing_attempts >= quiz.max_attempts:
            raise HTTPException(status_code=400, detail="Maximum attempts exceeded")
        
        # Create attempt
        attempt_id = f"attempt_{quiz_id}_{current_user.did}_{int(datetime.now().timestamp())}"
        
        attempt = QuizAttempt(
            attempt_id=attempt_id,
            user_id=current_user.did,
            quiz_id=quiz_id,
            attempt_number=existing_attempts + 1
        )
        
        await attempt.insert()
        
        logger.info(f"Quiz attempt started: {attempt_id}")
        return {
            "message": "Quiz attempt started",
            "attempt": attempt.dict(),
            "quiz": quiz.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz attempt start failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz attempt start failed")

@router.post("/{quiz_id}/attempt/{attempt_id}/submit")
async def submit_quiz_attempt(
    quiz_id: str,
    attempt_id: str,
    request: QuizAttemptRequest,
    current_user: User = Depends(get_current_user)
):
    """Submit a quiz attempt"""
    try:
        # Get quiz and attempt
        quiz = await Quiz.find_one({"quiz_id": quiz_id})
        attempt = await QuizAttempt.find_one({
            "attempt_id": attempt_id,
            "user_id": current_user.did,
            "quiz_id": quiz_id,
            "status": "in_progress"
        })
        
        if not quiz or not attempt:
            raise HTTPException(status_code=404, detail="Quiz or attempt not found")
        
        # Grade the quiz
        correct_count = 0
        total_points = 0
        earned_points = 0
        
        for question in quiz.questions:
            user_answer = request.answers.get(question.question_id)
            if user_answer == question.correct_answer:
                correct_count += 1
                earned_points += question.points
            total_points += question.points
        
        score = (earned_points / total_points) * 100 if total_points > 0 else 0
        passed = score >= quiz.passing_score
        
        # Update attempt
        attempt.answers = request.answers
        attempt.score = earned_points
        attempt.percentage = score
        attempt.passed = passed
        attempt.status = "submitted"
        attempt.submitted_at = datetime.now(timezone.utc)
        attempt.time_spent_minutes = request.time_spent_minutes
        
        await attempt.save()
        
        # Update course progress if quiz is linked to a module
        if quiz.module_id and passed:
            from ..services.course_service import CourseService
            course_service = CourseService()
            await course_service.update_module_progress(
                current_user.did,
                quiz.module_id,
                {
                    "assessment_score": score,
                    "assessment_id": quiz_id
                }
            )
        
        logger.info(f"Quiz attempt submitted: {attempt_id}, Score: {score}%")
        return {
            "message": "Quiz submitted successfully",
            "attempt": attempt.dict(),
            "score": score,
            "passed": passed,
            "correct_answers": correct_count,
            "total_questions": len(quiz.questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz submission failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz submission failed")

@router.get("/{quiz_id}/attempts")
async def get_quiz_attempts(
    quiz_id: str,
    user_id: Optional[str] = Query(None, description="Filter by user ID (admin only)"),
    current_user: User = Depends(get_current_user)
):
    """Get quiz attempts"""
    try:
        # Check permissions
        if user_id and current_user.role not in ["admin", "institution_admin", "teacher"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        filters = {"quiz_id": quiz_id}
        if user_id:
            filters["user_id"] = user_id
        else:
            filters["user_id"] = current_user.did
        
        attempts = await QuizAttempt.find(filters).sort([("started_at", -1)]).to_list()
        
        return {
            "attempts": [attempt.dict() for attempt in attempts]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz attempts retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz attempts retrieval failed")

@router.get("/my/attempts")
async def get_my_quiz_attempts(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    current_user: User = Depends(get_current_user)
):
    """Get current user's quiz attempts"""
    try:
        pipeline = [
            {"$match": {"user_id": current_user.did}},
            {"$lookup": {
                "from": "quizzes",
                "localField": "quiz_id",
                "foreignField": "quiz_id",
                "as": "quiz"
            }},
            {"$unwind": "$quiz"}
        ]
        
        if course_id:
            pipeline.append({"$match": {"quiz.course_id": course_id}})
        
        pipeline.append({"$sort": {"started_at": -1}})
        
        attempts = await QuizAttempt.aggregate(pipeline).to_list()
        
        return {
            "attempts": attempts
        }
        
    except Exception as e:
        logger.error(f"User quiz attempts retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Quiz attempts retrieval failed")

@router.get("/course/{course_id}")
async def get_course_quizzes(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all quizzes for a specific course"""
    try:
        # Verify course exists
        from ..models.course import Course
        course = await Course.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get quizzes
        filters = {"course_id": course_id}
        if current_user.role == "student":
            filters["status"] = "published"
        
        quizzes = await Quiz.find(filters).to_list()
        
        quizzes_data = []
        for quiz in quizzes:
            quiz_data = quiz.dict()
            
            # For students, don't show correct answers
            if current_user.role == "student":
                for question in quiz_data["questions"]:
                    question.pop("correct_answer", None)
                    question.pop("explanation", None)
            
            quizzes_data.append(quiz_data)
        
        return {
            "quizzes": quizzes_data,
            "course": course.dict(),
            "total_quizzes": len(quizzes_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Course quizzes retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Course quizzes retrieval failed")

@router.get("/all/courses")
async def get_all_courses_quizzes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """Get all quizzes across all courses"""
    try:
        # Get quizzes
        filters = {}
        if current_user.role == "student":
            filters["status"] = "published"
        
        quizzes = await Quiz.find(filters).skip(skip).limit(limit).to_list()
        total = await Quiz.count_documents(filters)
        
        quizzes_data = []
        for quiz in quizzes:
            quiz_data = quiz.dict()
            
            # For students, don't show correct answers
            if current_user.role == "student":
                for question in quiz_data["questions"]:
                    question.pop("correct_answer", None)
                    question.pop("explanation", None)
            
            quizzes_data.append(quiz_data)
        
        return {
            "quizzes": quizzes_data,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"All courses quizzes retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="All courses quizzes retrieval failed")
