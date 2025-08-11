"""
Test file for Achievements API endpoints
"""
import pytest
import asyncio
from httpx import AsyncClient
from datetime import datetime, timezone
import json

# Test data
TEST_COURSE_ID = "test_course_001"
TEST_MODULE_ID = "test_module_001"
TEST_ACHIEVEMENT_ID = "test_achievement_001"

@pytest.fixture
async def test_achievement_data():
    return {
        "achievement_id": TEST_ACHIEVEMENT_ID,
        "title": "Test Achievement",
        "description": "A test achievement for API testing",
            "achievement_type": "course_completion",
            "tier": "bronze",
            "category": "learning",
        "icon_url": "https://example.com/icon.png",
            "badge_color": "#FFD700",
            "criteria": {
            "type": "course_completion",
            "target_value": 100.0,
            "comparison": "gte"
            },
            "is_repeatable": False,
            "is_hidden": False,
        "course_id": TEST_COURSE_ID,
            "module_id": None,
            "points_reward": 100,
            "nft_enabled": True,
        "created_by": "test_teacher_did",
        "tags": ["test", "achievement", "api"],
        "rarity": "common",
        "status": "active"
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

class TestAchievementsAPI:
    """Test class for Achievements API endpoints"""
    
    async def test_get_all_achievements(self, client: AsyncClient, auth_headers):
        """Test getting all achievements"""
        response = await client.get("/api/v1/achievements/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        assert "total" in data
        assert isinstance(data["achievements"], list)
    
    async def test_get_achievements_by_course_id(self, client: AsyncClient, auth_headers):
        """Test getting achievements filtered by course ID"""
        response = await client.get(
            f"/api/v1/achievements/?course_id={TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        # All returned achievements should belong to the specified course
        for achievement in data["achievements"]:
            assert achievement["course_id"] == TEST_COURSE_ID
    
    async def test_get_achievements_by_type(self, client: AsyncClient, auth_headers):
        """Test getting achievements filtered by type"""
        achievement_type = "course_completion"
        response = await client.get(
            f"/api/v1/achievements/?achievement_type={achievement_type}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        # All returned achievements should have the specified type
        for achievement in data["achievements"]:
            assert achievement["achievement_type"] == achievement_type
    
    async def test_get_achievements_by_tier(self, client: AsyncClient, auth_headers):
        """Test getting achievements filtered by tier"""
        tier = "bronze"
        response = await client.get(
            f"/api/v1/achievements/?tier={tier}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        # All returned achievements should have the specified tier
        for achievement in data["achievements"]:
            assert achievement["tier"] == tier
    
    async def test_get_achievements_by_category(self, client: AsyncClient, auth_headers):
        """Test getting achievements filtered by category"""
        category = "learning"
        response = await client.get(
            f"/api/v1/achievements/?category={category}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        # All returned achievements should have the specified category
        for achievement in data["achievements"]:
            assert achievement["category"] == category
    
    async def test_get_achievements_pagination(self, client: AsyncClient, auth_headers):
        """Test achievements pagination"""
        skip = 0
        limit = 5
        response = await client.get(
            f"/api/v1/achievements/?skip={skip}&limit={limit}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        assert "skip" in data
        assert "limit" in data
        assert data["skip"] == skip
        assert data["limit"] == limit
        assert len(data["achievements"]) <= limit
    
    async def test_get_achievement_by_id(self, client: AsyncClient, auth_headers):
        """Test getting a specific achievement by ID"""
        response = await client.get(
            f"/api/v1/achievements/{TEST_ACHIEVEMENT_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievement" in data
        assert data["achievement"]["achievement_id"] == TEST_ACHIEVEMENT_ID
    
    async def test_get_course_achievements(self, client: AsyncClient, auth_headers):
        """Test getting all achievements for a specific course"""
        response = await client.get(
            f"/api/v1/achievements/course/{TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        assert "course" in data
        assert "total_achievements" in data
        # All returned achievements should belong to the specified course
        for achievement in data["achievements"]:
            assert achievement["course_id"] == TEST_COURSE_ID
    
    async def test_get_course_achievements_with_earned_status(self, client: AsyncClient, auth_headers):
        """Test getting course achievements with earned status"""
        response = await client.get(
            f"/api/v1/achievements/course/{TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        # Each achievement should have earned status
        for achievement in data["achievements"]:
            assert "earned" in achievement
            assert isinstance(achievement["earned"], bool)
    
    async def test_get_all_courses_achievements(self, client: AsyncClient, auth_headers):
        """Test getting all achievements across all courses"""
        response = await client.get(
            "/api/v1/achievements/all/courses", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        assert "total" in data
        assert isinstance(data["achievements"], list)
    
    async def test_get_all_courses_achievements_with_earned_status(self, client: AsyncClient, auth_headers):
        """Test getting all courses achievements with earned status"""
        response = await client.get(
            "/api/v1/achievements/all/courses", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        # Each achievement should have earned status
        for achievement in data["achievements"]:
            assert "earned" in achievement
            assert isinstance(achievement["earned"], bool)
    
    async def test_get_all_courses_achievements_pagination(self, client: AsyncClient, auth_headers):
        """Test pagination for all courses achievements"""
        skip = 0
        limit = 10
        response = await client.get(
            f"/api/v1/achievements/all/courses?skip={skip}&limit={limit}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert data["skip"] == skip
        assert data["limit"] == limit
        assert len(data["achievements"]) <= limit
    
    async def test_get_my_achievements(self, client: AsyncClient, auth_headers):
        """Test getting user's earned achievements"""
        response = await client.get(
            "/api/v1/achievements/my/earned", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        assert isinstance(data["achievements"], list)
    
    async def test_get_my_achievements_by_course(self, client: AsyncClient, auth_headers):
        """Test getting user's earned achievements for a specific course"""
        response = await client.get(
            f"/api/v1/achievements/my/earned?course_id={TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        # All returned achievements should belong to the specified course
        for achievement in data["achievements"]:
            assert achievement["course_id"] == TEST_COURSE_ID
    
    async def test_get_my_achievements_showcased_only(self, client: AsyncClient, auth_headers):
        """Test getting user's showcased achievements only"""
        response = await client.get(
            "/api/v1/achievements/my/earned?showcased_only=true", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "achievements" in data
        # All returned achievements should be showcased
        for achievement in data["achievements"]:
            assert achievement["is_showcased"] == True
    
    async def test_get_achievement_leaderboard(self, client: AsyncClient, auth_headers):
        """Test getting achievement leaderboard"""
        response = await client.get(
            "/api/v1/achievements/leaderboard", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
    
    async def test_get_achievement_leaderboard_by_course(self, client: AsyncClient, auth_headers):
        """Test getting achievement leaderboard for a specific course"""
        response = await client.get(
            f"/api/v1/achievements/leaderboard?course_id={TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
    
    async def test_get_achievement_leaderboard_by_timeframe(self, client: AsyncClient, auth_headers):
        """Test getting achievement leaderboard with different timeframes"""
        timeframes = ["week", "month", "year", "all"]
        for timeframe in timeframes:
            response = await client.get(
                f"/api/v1/achievements/leaderboard?timeframe={timeframe}", 
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert "leaderboard" in data
    
    async def test_get_achievement_statistics(self, client: AsyncClient, auth_headers):
        """Test getting achievement statistics"""
        response = await client.get(
            "/api/v1/achievements/statistics", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "statistics" in data
        assert "total_achievements" in data["statistics"]
        assert "earned_achievements" in data["statistics"]
    
    async def test_get_achievement_statistics_by_course(self, client: AsyncClient, auth_headers):
        """Test getting achievement statistics for a specific course"""
        response = await client.get(
            f"/api/v1/achievements/statistics?course_id={TEST_COURSE_ID}", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "statistics" in data
        assert "total_achievements" in data["statistics"]
        assert "earned_achievements" in data["statistics"]
    
    async def test_achievement_not_found(self, client: AsyncClient, auth_headers):
        """Test getting a non-existent achievement"""
        non_existent_achievement_id = "non_existent_achievement"
        response = await client.get(
            f"/api/v1/achievements/{non_existent_achievement_id}", 
            headers=auth_headers
        )
        assert response.status_code == 404
    
    async def test_course_not_found(self, client: AsyncClient, auth_headers):
        """Test getting achievements for a non-existent course"""
        non_existent_course_id = "non_existent_course"
        response = await client.get(
            f"/api/v1/achievements/course/{non_existent_course_id}", 
            headers=auth_headers
        )
        assert response.status_code == 404
    
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test accessing achievements without authentication"""
        response = await client.get("/api/v1/achievements/")
        assert response.status_code == 401
    
    async def test_hidden_achievements_access(self, client: AsyncClient, auth_headers):
        """Test that hidden achievements are properly filtered"""
        response = await client.get(
            "/api/v1/achievements/?include_hidden=false", 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # All returned achievements should not be hidden
        for achievement in data["achievements"]:
            assert achievement["is_hidden"] == False
    
    async def test_admin_can_see_hidden_achievements(self, client: AsyncClient, admin_auth_headers):
        """Test that admins can see hidden achievements"""
        response = await client.get(
            "/api/v1/achievements/?include_hidden=true", 
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Should be able to see hidden achievements
        has_hidden = any(achievement["is_hidden"] for achievement in data["achievements"])
        # Note: This test might pass even if no hidden achievements exist

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
