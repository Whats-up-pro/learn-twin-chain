"""
Test file for Lessons API endpoints
"""
import pytest
import asyncio
from httpx import AsyncClient
from datetime import datetime, timezone
import json

# Test data
TEST_COURSE_ID = "test_course_001"
TEST_MODULE_ID = "test_module_001"
TEST_LESSON_ID = "test_lesson_001"

@pytest.fixture
async def test_lesson_data():
    return {
        "lesson_id": TEST_LESSON_ID,
        "module_id": TEST_MODULE_ID,
        "course_id": TEST_COURSE_ID,
        "title": "Test Lesson",
        "description": "A test lesson for API testing",
        "content_type": "video",
        "content_url": "https://www.youtube.com/watch?v=test",
        "duration_minutes": 30,
        "order": 1,
        "learning_objectives": ["Understand basic concepts", "Complete exercises"],
        "keywords": ["test", "learning", "api"],
        "is_mandatory": True,
        "prerequisites": [],
        "status": "published"
    }

@pytest.fixture
async def test_module_data():
    return {
        "module_id": TEST_MODULE_ID,
        "course_id": TEST_COURSE_ID,
        "title": "Test Module",
        "description": "A test module",
        "order": 1,
        "status": "published"
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

class TestLessonsAPI:
    """Test class for Lessons API endpoints"""
    
    async def test_get_all_lessons(self, client: AsyncClient, auth_headers):
        """Test getting all lessons"""
        response = await client.get("/api/v1/lessons/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert "total" in data
        assert isinstance(data["lessons"], list)
    
    async def test_get_lessons_by_module_id(self, client: AsyncClient, auth_headers):
        """Test getting lessons filtered by module ID"""
        response = await client.get(
            f"/api/v1/lessons/?module_id={TEST_MODULE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        # All returned lessons should belong to the specified module
        for lesson in data["lessons"]:
            assert lesson["module_id"] == TEST_MODULE_ID
    
    async def test_get_lessons_by_course_id(self, client: AsyncClient, auth_headers):
        """Test getting lessons filtered by course ID"""
        response = await client.get(
            f"/api/v1/lessons/?course_id={TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        # All returned lessons should belong to the specified course
        for lesson in data["lessons"]:
            assert lesson["course_id"] == TEST_COURSE_ID
    
    async def test_get_lessons_by_content_type(self, client: AsyncClient, auth_headers):
        """Test getting lessons filtered by content type"""
        content_type = "video"
        response = await client.get(
            f"/api/v1/lessons/?content_type={content_type}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        # All returned lessons should have the specified content type
        for lesson in data["lessons"]:
            assert lesson["content_type"] == content_type
    
    async def test_get_lessons_pagination(self, client: AsyncClient, auth_headers):
        """Test lessons pagination"""
        skip = 0
        limit = 5
        response = await client.get(
            f"/api/v1/lessons/?skip={skip}&limit={limit}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert "skip" in data
        assert "limit" in data
        assert data["skip"] == skip
        assert data["limit"] == limit
        assert len(data["lessons"]) <= limit
    
    async def test_get_lesson_by_id(self, client: AsyncClient, auth_headers):
        """Test getting a specific lesson by ID"""
        response = await client.get(
            f"/api/v1/lessons/{TEST_LESSON_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lesson" in data
        assert data["lesson"]["lesson_id"] == TEST_LESSON_ID
    
    async def test_get_lesson_with_content(self, client: AsyncClient, auth_headers):
        """Test getting a lesson with IPFS content included"""
        response = await client.get(
            f"/api/v1/lessons/{TEST_LESSON_ID}?include_content=true", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lesson" in data
        # Should include content_data if available
        assert "content_data" in data["lesson"] or data["lesson"]["content_cid"] is None
    
    async def test_get_module_lessons(self, client: AsyncClient, auth_headers):
        """Test getting all lessons for a specific module"""
        response = await client.get(
            f"/api/v1/lessons/module/{TEST_MODULE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert "module" in data
        # All returned lessons should belong to the specified module
        for lesson in data["lessons"]:
            assert lesson["module_id"] == TEST_MODULE_ID
    
    async def test_get_module_lessons_with_progress(self, client: AsyncClient, auth_headers):
        """Test getting module lessons with user progress"""
        response = await client.get(
            f"/api/v1/lessons/module/{TEST_MODULE_ID}?include_progress=true", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        # Each lesson should have progress data
        for lesson in data["lessons"]:
            assert "progress" in lesson
            assert "completion_percentage" in lesson["progress"]
            assert "completed" in lesson["progress"]
    
    async def test_get_course_lessons(self, client: AsyncClient, auth_headers):
        """Test getting all lessons for a specific course"""
        response = await client.get(
            f"/api/v1/lessons/course/{TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert "course" in data
        assert "total_lessons" in data
        # All returned lessons should belong to the specified course
        for lesson in data["lessons"]:
            assert lesson["course_id"] == TEST_COURSE_ID
    
    async def test_get_course_lessons_with_progress(self, client: AsyncClient, auth_headers):
        """Test getting course lessons with user progress"""
        response = await client.get(
            f"/api/v1/lessons/course/{TEST_COURSE_ID}?include_progress=true", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        # Each lesson should have progress data
        for lesson in data["lessons"]:
            assert "progress" in lesson
            assert "completion_percentage" in lesson["progress"]
            assert "completed" in lesson["progress"]
    
    async def test_get_all_courses_lessons(self, client: AsyncClient, auth_headers):
        """Test getting all lessons across all courses"""
        response = await client.get(
            "/api/v1/lessons/all/courses", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert "total" in data
        assert isinstance(data["lessons"], list)
    
    async def test_get_all_courses_lessons_with_progress(self, client: AsyncClient, auth_headers):
        """Test getting all courses lessons with user progress"""
        response = await client.get(
            "/api/v1/lessons/all/courses?include_progress=true", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        # Each lesson should have progress data
        for lesson in data["lessons"]:
            assert "progress" in lesson
            assert "completion_percentage" in lesson["progress"]
            assert "completed" in lesson["progress"]
    
    async def test_get_all_courses_lessons_pagination(self, client: AsyncClient, auth_headers):
        """Test pagination for all courses lessons"""
        skip = 0
        limit = 10
        response = await client.get(
            f"/api/v1/lessons/all/courses?skip={skip}&limit={limit}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert data["skip"] == skip
        assert data["limit"] == limit
        assert len(data["lessons"]) <= limit
    
    async def test_lesson_not_found(self, client: AsyncClient, auth_headers):
        """Test getting a non-existent lesson"""
        non_existent_lesson_id = "non_existent_lesson"
        response = await client.get(
            f"/api/v1/lessons/{non_existent_lesson_id}", 
            headers=auth_headers
        )
        assert response.status_code == 404
    
    async def test_module_not_found(self, client: AsyncClient, auth_headers):
        """Test getting lessons for a non-existent module"""
        non_existent_module_id = "non_existent_module"
        response = await client.get(
            f"/api/v1/lessons/module/{non_existent_module_id}", 
            headers=auth_headers
        )
        assert response.status_code == 404
    
    async def test_course_not_found(self, client: AsyncClient, auth_headers):
        """Test getting lessons for a non-existent course"""
        non_existent_course_id = "non_existent_course"
        response = await client.get(
            f"/api/v1/lessons/course/{non_existent_course_id}", 
            headers=auth_headers
        )
        assert response.status_code == 404
    
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test accessing lessons without authentication"""
        response = await client.get("/api/v1/lessons/")
        assert response.status_code == 401
    
    async def test_student_access_restrictions(self, client: AsyncClient, student_auth_headers):
        """Test that students can only access published lessons"""
        response = await client.get("/api/v1/lessons/", headers=student_auth_headers)
        assert response.status_code == 200
        data = response.json()
        # All returned lessons should be published
        for lesson in data["lessons"]:
            assert lesson["status"] == "published"

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
