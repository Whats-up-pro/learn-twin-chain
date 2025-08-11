"""
Test file for Quizzes API endpoints
"""
import pytest
import asyncio
from httpx import AsyncClient
from datetime import datetime, timezone
import json

# Test data
TEST_COURSE_ID = "test_course_001"
TEST_MODULE_ID = "test_module_001"
TEST_QUIZ_ID = "test_quiz_001"

@pytest.fixture
async def test_quiz_data():
    return {
        "quiz_id": TEST_QUIZ_ID,
        "title": "Test Quiz",
        "description": "A test quiz for API testing",
        "course_id": TEST_COURSE_ID,
        "module_id": TEST_MODULE_ID,
        "quiz_type": "multiple_choice",
        "questions": [
            {
                "question_id": "q1",
                "question_text": "What is the capital of France?",
                "question_type": "multiple_choice",
                "options": ["London", "Berlin", "Paris", "Madrid"],
                "correct_answer": "Paris",
                "explanation": "Paris is the capital of France",
                "points": 1.0,
                "order": 0
            }
        ],
        "total_points": 1.0,
        "passing_score": 70.0,
        "time_limit_minutes": 30,
        "max_attempts": 3,
        "shuffle_questions": True,
        "shuffle_options": True,
        "is_required": False,
        "status": "published",
        "created_by": "test_teacher_did",
        "instructions": "Answer all questions correctly"
    }

@pytest.fixture
async def test_course_data():
    return {
        "course_id": TEST_COURSE_ID,
        "title": "Test Course",
        "description": "A test course for API testing",
        "created_by": "test_teacher_did",
        "institution": "test_institution",
        "status": "published"
    }

class TestQuizzesAPI:
    """Test class for Quizzes API endpoints"""
    
    async def test_get_all_quizzes(self, client: AsyncClient, auth_headers):
        """Test getting all quizzes"""
        response = await client.get("/api/v1/quizzes/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        assert "total" in data
        assert isinstance(data["quizzes"], list)
    
    async def test_get_quizzes_by_course_id(self, client: AsyncClient, auth_headers):
        """Test getting quizzes filtered by course ID"""
        response = await client.get(
            f"/api/v1/quizzes/?course_id={TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        # All returned quizzes should belong to the specified course
        for quiz in data["quizzes"]:
            assert quiz["course_id"] == TEST_COURSE_ID
    
    async def test_get_quizzes_by_module_id(self, client: AsyncClient, auth_headers):
        """Test getting quizzes filtered by module ID"""
        response = await client.get(
            f"/api/v1/quizzes/?module_id={TEST_MODULE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        # All returned quizzes should belong to the specified module
        for quiz in data["quizzes"]:
            assert quiz["module_id"] == TEST_MODULE_ID
    
    async def test_get_quizzes_by_status(self, client: AsyncClient, auth_headers):
        """Test getting quizzes filtered by status"""
        status = "published"
        response = await client.get(
            f"/api/v1/quizzes/?status={status}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        # All returned quizzes should have the specified status
        for quiz in data["quizzes"]:
            assert quiz["status"] == status
    
    async def test_get_quizzes_pagination(self, client: AsyncClient, auth_headers):
        """Test quizzes pagination"""
        skip = 0
        limit = 5
        response = await client.get(
            f"/api/v1/quizzes/?skip={skip}&limit={limit}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        assert "skip" in data
        assert "limit" in data
        assert data["skip"] == skip
        assert data["limit"] == limit
        assert len(data["quizzes"]) <= limit
    
    async def test_get_quiz_by_id(self, client: AsyncClient, auth_headers):
        """Test getting a specific quiz by ID"""
        response = await client.get(
            f"/api/v1/quizzes/{TEST_QUIZ_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quiz" in data
        assert data["quiz"]["quiz_id"] == TEST_QUIZ_ID
    
    async def test_get_quiz_for_student(self, client: AsyncClient, student_auth_headers):
        """Test getting a quiz for a student (should hide correct answers)"""
        response = await client.get(
            f"/api/v1/quizzes/{TEST_QUIZ_ID}", 
            headers=student_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quiz" in data
        # For students, correct answers should be hidden
        for question in data["quiz"]["questions"]:
            assert "correct_answer" not in question
            assert "explanation" not in question
    
    async def test_get_quiz_for_teacher(self, client: AsyncClient, auth_headers):
        """Test getting a quiz for a teacher (should show correct answers)"""
        response = await client.get(
            f"/api/v1/quizzes/{TEST_QUIZ_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quiz" in data
        # For teachers, correct answers should be visible
        for question in data["quiz"]["questions"]:
            assert "correct_answer" in question
            assert "explanation" in question
    
    async def test_get_course_quizzes(self, client: AsyncClient, auth_headers):
        """Test getting all quizzes for a specific course"""
        response = await client.get(
            f"/api/v1/quizzes/course/{TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        assert "course" in data
        assert "total_quizzes" in data
        # All returned quizzes should belong to the specified course
        for quiz in data["quizzes"]:
            assert quiz["course_id"] == TEST_COURSE_ID
    
    async def test_get_course_quizzes_for_student(self, client: AsyncClient, student_auth_headers):
        """Test getting course quizzes for a student (should hide correct answers)"""
        response = await client.get(
            f"/api/v1/quizzes/course/{TEST_COURSE_ID}", 
            headers=student_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        # For students, correct answers should be hidden
        for quiz in data["quizzes"]:
            for question in quiz["questions"]:
                assert "correct_answer" not in question
                assert "explanation" not in question
    
    async def test_get_all_courses_quizzes(self, client: AsyncClient, auth_headers):
        """Test getting all quizzes across all courses"""
        response = await client.get(
            "/api/v1/quizzes/all/courses", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        assert "total" in data
        assert isinstance(data["quizzes"], list)
    
    async def test_get_all_courses_quizzes_for_student(self, client: AsyncClient, student_auth_headers):
        """Test getting all courses quizzes for a student (should hide correct answers)"""
        response = await client.get(
            "/api/v1/quizzes/all/courses", 
            headers=student_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        # For students, correct answers should be hidden
        for quiz in data["quizzes"]:
            for question in quiz["questions"]:
                assert "correct_answer" not in question
                assert "explanation" not in question
    
    async def test_get_all_courses_quizzes_pagination(self, client: AsyncClient, auth_headers):
        """Test pagination for all courses quizzes"""
        skip = 0
        limit = 10
        response = await client.get(
            f"/api/v1/quizzes/all/courses?skip={skip}&limit={limit}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert data["skip"] == skip
        assert data["limit"] == limit
        assert len(data["quizzes"]) <= limit
    
    async def test_start_quiz_attempt(self, client: AsyncClient, auth_headers):
        """Test starting a quiz attempt"""
        response = await client.post(
            f"/api/v1/quizzes/{TEST_QUIZ_ID}/attempt", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "attempt_id" in data
        assert "started_at" in data
        assert data["status"] == "in_progress"
    
    async def test_submit_quiz_attempt(self, client: AsyncClient, auth_headers):
        """Test submitting a quiz attempt"""
        # First start an attempt
        start_response = await client.post(
            f"/api/v1/quizzes/{TEST_QUIZ_ID}/attempt", 
            headers=auth_headers
        )
        assert start_response.status_code == 200
        attempt_data = start_response.json()
        attempt_id = attempt_data["attempt_id"]
        
        # Submit the attempt
        submit_data = {
            "answers": {"q1": "Paris"},
            "time_spent_minutes": 15
        }
        response = await client.post(
            f"/api/v1/quizzes/{TEST_QUIZ_ID}/attempt/{attempt_id}/submit",
            json=submit_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "percentage" in data
        assert "passed" in data
        assert data["status"] == "submitted"
    
    async def test_get_quiz_attempts(self, client: AsyncClient, auth_headers):
        """Test getting quiz attempts"""
        response = await client.get(
            f"/api/v1/quizzes/{TEST_QUIZ_ID}/attempts", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "attempts" in data
        assert isinstance(data["attempts"], list)
    
    async def test_get_my_quiz_attempts(self, client: AsyncClient, auth_headers):
        """Test getting user's quiz attempts"""
        response = await client.get(
            "/api/v1/quizzes/my/attempts", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "attempts" in data
        assert isinstance(data["attempts"], list)
    
    async def test_get_my_quiz_attempts_by_course(self, client: AsyncClient, auth_headers):
        """Test getting user's quiz attempts for a specific course"""
        response = await client.get(
            f"/api/v1/quizzes/my/attempts?course_id={TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "attempts" in data
        # All returned attempts should belong to the specified course
        for attempt in data["attempts"]:
            assert attempt["course_id"] == TEST_COURSE_ID
    
    async def test_quiz_not_found(self, client: AsyncClient, auth_headers):
        """Test getting a non-existent quiz"""
        non_existent_quiz_id = "non_existent_quiz"
        response = await client.get(
            f"/api/v1/quizzes/{non_existent_quiz_id}", 
            headers=auth_headers
        )
        assert response.status_code == 404
    
    async def test_course_not_found(self, client: AsyncClient, auth_headers):
        """Test getting quizzes for a non-existent course"""
        non_existent_course_id = "non_existent_course"
        response = await client.get(
            f"/api/v1/quizzes/course/{non_existent_course_id}", 
            headers=auth_headers
        )
        assert response.status_code == 404
    
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test accessing quizzes without authentication"""
        response = await client.get("/api/v1/quizzes/")
        assert response.status_code == 401
    
    async def test_student_access_restrictions(self, client: AsyncClient, student_auth_headers):
        """Test that students can only access published quizzes"""
        response = await client.get("/api/v1/quizzes/", headers=student_auth_headers)
        assert response.status_code == 200
        data = response.json()
        # All returned quizzes should be published
        for quiz in data["quizzes"]:
            assert quiz["status"] == "published"
    
    async def test_quiz_question_shuffling(self, client: AsyncClient, student_auth_headers):
        """Test that quiz questions are shuffled for students when enabled"""
        response = await client.get(
            f"/api/v1/quizzes/{TEST_QUIZ_ID}", 
            headers=student_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "quiz" in data
        # Note: Shuffling is random, so we can't test specific order
        # But we can verify that questions exist
        assert len(data["quiz"]["questions"]) > 0

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
