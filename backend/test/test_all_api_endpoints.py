"""
Comprehensive test runner for all API endpoints
Tests lessons, achievements, and quizzes APIs
"""
import pytest
import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from httpx import AsyncClient
import json
from datetime import datetime, timezone

# Test configuration
BASE_URL = "http://localhost:8000"
API_BASE = "/api/v1"

class TestAllAPIEndpoints:
    """Comprehensive test class for all API endpoints"""
    
    @pytest.fixture
    async def client(self):
        """Create async HTTP client"""
        async with AsyncClient(base_url=BASE_URL) as client:
            yield client
    
    @pytest.fixture
    async def auth_headers(self):
        """Get authentication headers for teacher/admin"""
        # This would normally get a real token from login
        # For testing, we'll use a mock token
        return {
            "Authorization": "Bearer test_teacher_token",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture
    async def student_auth_headers(self):
        """Get authentication headers for student"""
        return {
            "Authorization": "Bearer test_student_token",
            "Content-Type": "application/json"
        }
    
    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint"""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    async def test_api_documentation(self, client: AsyncClient):
        """Test API documentation endpoints"""
        # Test OpenAPI docs
        response = await client.get(f"{API_BASE}/docs")
        assert response.status_code == 200
        
        # Test OpenAPI JSON
        response = await client.get(f"{API_BASE}/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "paths" in data

class TestLessonsAPIComprehensive:
    """Comprehensive tests for Lessons API"""
    
    async def test_lessons_endpoints_comprehensive(self, client: AsyncClient, auth_headers):
        """Test all lessons endpoints comprehensively"""
        
        # 1. Get all lessons
        response = await client.get(f"{API_BASE}/lessons/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert "total" in data
        
        # 2. Get lessons by module ID
        if data["lessons"]:
            module_id = data["lessons"][0]["module_id"]
            response = await client.get(
                f"{API_BASE}/lessons/?module_id={module_id}", 
                headers=auth_headers
            )
            assert response.status_code == 200
            module_data = response.json()
            for lesson in module_data["lessons"]:
                assert lesson["module_id"] == module_id
        
        # 3. Get lessons by course ID
        if data["lessons"]:
            course_id = data["lessons"][0]["course_id"]
            response = await client.get(
                f"{API_BASE}/lessons/?course_id={course_id}", 
                headers=auth_headers
            )
            assert response.status_code == 200
            course_data = response.json()
            for lesson in course_data["lessons"]:
                assert lesson["course_id"] == course_id
        
        # 4. Get lessons by content type
        response = await client.get(
            f"{API_BASE}/lessons/?content_type=video", 
            headers=auth_headers
        )
        assert response.status_code == 200
        video_data = response.json()
        for lesson in video_data["lessons"]:
            assert lesson["content_type"] == "video"
        
        # 5. Test pagination
        response = await client.get(
            f"{API_BASE}/lessons/?skip=0&limit=5", 
            headers=auth_headers
        )
        assert response.status_code == 200
        pagination_data = response.json()
        assert len(pagination_data["lessons"]) <= 5
        
        # 6. Get module lessons
        if data["lessons"]:
            module_id = data["lessons"][0]["module_id"]
            response = await client.get(
                f"{API_BASE}/lessons/module/{module_id}", 
                headers=auth_headers
            )
            assert response.status_code == 200
            module_lessons_data = response.json()
            assert "lessons" in module_lessons_data
            assert "module" in module_lessons_data
        
        # 7. Get course lessons
        if data["lessons"]:
            course_id = data["lessons"][0]["course_id"]
            response = await client.get(
                f"{API_BASE}/lessons/course/{course_id}", 
                headers=auth_headers
            )
            assert response.status_code == 200
            course_lessons_data = response.json()
            assert "lessons" in course_lessons_data
            assert "course" in course_lessons_data
            assert "total_lessons" in course_lessons_data
        
        # 8. Get all courses lessons
        response = await client.get(
            f"{API_BASE}/lessons/all/courses", 
            headers=auth_headers
        )
        assert response.status_code == 200
        all_courses_data = response.json()
        assert "lessons" in all_courses_data
        assert "total" in all_courses_data
        
        # 9. Test with progress
        if data["lessons"]:
            module_id = data["lessons"][0]["module_id"]
            response = await client.get(
                f"{API_BASE}/lessons/module/{module_id}?include_progress=true", 
                headers=auth_headers
            )
            assert response.status_code == 200
            progress_data = response.json()
            for lesson in progress_data["lessons"]:
                assert "progress" in lesson

class TestAchievementsAPIComprehensive:
    """Comprehensive tests for Achievements API"""
    
    async def test_achievements_endpoints_comprehensive(self, client: AsyncClient, auth_headers):
        """Test all achievements endpoints comprehensively"""
        
        # 1. Get all achievements
        response = await client.get(f"{API_BASE}/achievements/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        assert "total" in data
        
        # 2. Get achievements by course ID
        if data["achievements"]:
            course_id = data["achievements"][0]["course_id"]
            if course_id:
                response = await client.get(
                    f"{API_BASE}/achievements/?course_id={course_id}", 
                    headers=auth_headers
                )
                assert response.status_code == 200
                course_data = response.json()
                for achievement in course_data["achievements"]:
                    assert achievement["course_id"] == course_id
        
        # 3. Get achievements by type
        response = await client.get(
            f"{API_BASE}/achievements/?achievement_type=course_completion", 
            headers=auth_headers
        )
        assert response.status_code == 200
        type_data = response.json()
        for achievement in type_data["achievements"]:
            assert achievement["achievement_type"] == "course_completion"
        
        # 4. Get achievements by tier
        response = await client.get(
            f"{API_BASE}/achievements/?tier=bronze", 
            headers=auth_headers
        )
        assert response.status_code == 200
        tier_data = response.json()
        for achievement in tier_data["achievements"]:
            assert achievement["tier"] == "bronze"
        
        # 5. Test pagination
        response = await client.get(
            f"{API_BASE}/achievements/?skip=0&limit=5", 
            headers=auth_headers
        )
        assert response.status_code == 200
        pagination_data = response.json()
        assert len(pagination_data["achievements"]) <= 5
        
        # 6. Get course achievements
        if data["achievements"]:
            course_id = data["achievements"][0]["course_id"]
            if course_id:
                response = await client.get(
                    f"{API_BASE}/achievements/course/{course_id}", 
                    headers=auth_headers
                )
                assert response.status_code == 200
                course_achievements_data = response.json()
                assert "achievements" in course_achievements_data
                assert "course" in course_achievements_data
                assert "total_achievements" in course_achievements_data
        
        # 7. Get all courses achievements
        response = await client.get(
            f"{API_BASE}/achievements/all/courses", 
            headers=auth_headers
        )
        assert response.status_code == 200
        all_courses_data = response.json()
        assert "achievements" in all_courses_data
        assert "total" in all_courses_data
        
        # 8. Get my achievements
        response = await client.get(
            f"{API_BASE}/achievements/my/earned", 
            headers=auth_headers
        )
        assert response.status_code == 200
        my_data = response.json()
        assert "achievements" in my_data
        
        # 9. Get leaderboard
        response = await client.get(
            f"{API_BASE}/achievements/leaderboard", 
            headers=auth_headers
        )
        assert response.status_code == 200
        leaderboard_data = response.json()
        assert "leaderboard" in leaderboard_data
        
        # 10. Get statistics
        response = await client.get(
            f"{API_BASE}/achievements/statistics", 
            headers=auth_headers
        )
        assert response.status_code == 200
        stats_data = response.json()
        assert "statistics" in stats_data

class TestQuizzesAPIComprehensive:
    """Comprehensive tests for Quizzes API"""
    
    async def test_quizzes_endpoints_comprehensive(self, client: AsyncClient, auth_headers):
        """Test all quizzes endpoints comprehensively"""
        
        # 1. Get all quizzes
        response = await client.get(f"{API_BASE}/quizzes/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        assert "total" in data
        
        # 2. Get quizzes by course ID
        if data["quizzes"]:
            course_id = data["quizzes"][0]["course_id"]
            response = await client.get(
                f"{API_BASE}/quizzes/?course_id={course_id}", 
                headers=auth_headers
            )
            assert response.status_code == 200
            course_data = response.json()
            for quiz in course_data["quizzes"]:
                assert quiz["course_id"] == course_id
        
        # 3. Get quizzes by module ID
        if data["quizzes"]:
            module_id = data["quizzes"][0]["module_id"]
            if module_id:
                response = await client.get(
                    f"{API_BASE}/quizzes/?module_id={module_id}", 
                    headers=auth_headers
                )
                assert response.status_code == 200
                module_data = response.json()
                for quiz in module_data["quizzes"]:
                    assert quiz["module_id"] == module_id
        
        # 4. Get quizzes by status
        response = await client.get(
            f"{API_BASE}/quizzes/?status=published", 
            headers=auth_headers
        )
        assert response.status_code == 200
        status_data = response.json()
        for quiz in status_data["quizzes"]:
            assert quiz["status"] == "published"
        
        # 5. Test pagination
        response = await client.get(
            f"{API_BASE}/quizzes/?skip=0&limit=5", 
            headers=auth_headers
        )
        assert response.status_code == 200
        pagination_data = response.json()
        assert len(pagination_data["quizzes"]) <= 5
        
        # 6. Get course quizzes
        if data["quizzes"]:
            course_id = data["quizzes"][0]["course_id"]
            response = await client.get(
                f"{API_BASE}/quizzes/course/{course_id}", 
                headers=auth_headers
            )
            assert response.status_code == 200
            course_quizzes_data = response.json()
            assert "quizzes" in course_quizzes_data
            assert "course" in course_quizzes_data
            assert "total_quizzes" in course_quizzes_data
        
        # 7. Get all courses quizzes
        response = await client.get(
            f"{API_BASE}/quizzes/all/courses", 
            headers=auth_headers
        )
        assert response.status_code == 200
        all_courses_data = response.json()
        assert "quizzes" in all_courses_data
        assert "total" in all_courses_data
        
        # 8. Get my quiz attempts
        response = await client.get(
            f"{API_BASE}/quizzes/my/attempts", 
            headers=auth_headers
        )
        assert response.status_code == 200
        attempts_data = response.json()
        assert "attempts" in attempts_data

class TestStudentAccessRestrictions:
    """Test student access restrictions"""
    
    async def test_student_lessons_access(self, client: AsyncClient, student_auth_headers):
        """Test that students can only access published lessons"""
        response = await client.get(f"{API_BASE}/lessons/", headers=student_auth_headers)
        assert response.status_code == 200
        data = response.json()
        for lesson in data["lessons"]:
            assert lesson["status"] == "published"
    
    async def test_student_achievements_access(self, client: AsyncClient, student_auth_headers):
        """Test that students can only access non-hidden achievements"""
        response = await client.get(f"{API_BASE}/achievements/", headers=student_auth_headers)
        assert response.status_code == 200
        data = response.json()
        for achievement in data["achievements"]:
            assert achievement["is_hidden"] == False
    
    async def test_student_quizzes_access(self, client: AsyncClient, student_auth_headers):
        """Test that students can only access published quizzes"""
        response = await client.get(f"{API_BASE}/quizzes/", headers=student_auth_headers)
        assert response.status_code == 200
        data = response.json()
        for quiz in data["quizzes"]:
            assert quiz["status"] == "published"

class TestErrorHandling:
    """Test error handling for all APIs"""
    
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test unauthorized access to all endpoints"""
        endpoints = [
            f"{API_BASE}/lessons/",
            f"{API_BASE}/achievements/",
            f"{API_BASE}/quizzes/",
            f"{API_BASE}/lessons/all/courses",
            f"{API_BASE}/achievements/all/courses",
            f"{API_BASE}/quizzes/all/courses"
        ]
        
        for endpoint in endpoints:
            response = await client.get(endpoint)
            assert response.status_code == 401
    
    async def test_not_found_resources(self, client: AsyncClient, auth_headers):
        """Test accessing non-existent resources"""
        # Test non-existent lesson
        response = await client.get(
            f"{API_BASE}/lessons/non_existent_lesson", 
            headers=auth_headers
        )
        assert response.status_code == 404
        
        # Test non-existent achievement
        response = await client.get(
            f"{API_BASE}/achievements/non_existent_achievement", 
            headers=auth_headers
        )
        assert response.status_code == 404
        
        # Test non-existent quiz
        response = await client.get(
            f"{API_BASE}/quizzes/non_existent_quiz", 
            headers=auth_headers
        )
        assert response.status_code == 404
        
        # Test non-existent course
        response = await client.get(
            f"{API_BASE}/lessons/course/non_existent_course", 
            headers=auth_headers
        )
        assert response.status_code == 404

def run_comprehensive_tests():
    """Run all comprehensive tests"""
    print("🚀 Starting comprehensive API tests...")
    
    # Test configuration
    test_config = {
        "base_url": BASE_URL,
        "api_base": API_BASE,
        "test_categories": [
            "Health Check",
            "API Documentation", 
            "Lessons API",
            "Achievements API",
            "Quizzes API",
            "Student Access Restrictions",
            "Error Handling"
        ]
    }
    
    print(f"📋 Test Configuration:")
    print(f"   Base URL: {test_config['base_url']}")
    print(f"   API Base: {test_config['api_base']}")
    print(f"   Test Categories: {len(test_config['test_categories'])}")
    
    # Run tests
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--disable-warnings"
    ])

if __name__ == "__main__":
    run_comprehensive_tests()
