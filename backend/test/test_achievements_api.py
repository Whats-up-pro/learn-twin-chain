#!/usr/bin/env python3
"""
Comprehensive test suite for Achievements API
Tests all achievement-related endpoints with detailed debugging
"""

import requests
import json
import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_achievements_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AchievementsAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.user_data = None
        
        # Test user credentials
        self.test_email = "22520183@gm.uit.edu.vn"
        self.test_password = "Minhdai100504@"
        
        # Test data storage
        self.created_achievement_id = None
        self.earned_achievement_id = None
        
        logger.info(f"🚀 Initializing Achievements API Tester for {base_url}")
    
    def authenticate(self) -> bool:
        """Authenticate user for testing"""
        logger.info("🔐 Authenticating user for achievement tests...")
        
        login_data = {
            "identifier": self.test_email,
            "password": self.test_password
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                response_data = response.json()
                self.access_token = response_data.get("access_token")
                self.user_data = response_data.get("user")
                logger.info("✅ Authentication successful")
                return True
            else:
                logger.error(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def log_request(self, method: str, endpoint: str, data: Optional[Dict] = None, headers: Optional[Dict] = None):
        """Log request details"""
        logger.info(f"📤 {method} {endpoint}")
        if data:
            logger.debug(f"📦 Request Data: {json.dumps(data, indent=2)}")
        if headers:
            logger.debug(f"📋 Headers: {json.dumps(headers, indent=2)}")
    
    def log_response(self, response: requests.Response):
        """Log response details"""
        logger.info(f"📥 Status: {response.status_code}")
        try:
            response_data = response.json()
            logger.debug(f"📦 Response: {json.dumps(response_data, indent=2)}")
        except:
            logger.debug(f"📦 Response: {response.text}")
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    def test_search_achievements(self) -> bool:
        """Test achievement search functionality"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING ACHIEVEMENT SEARCH")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/achievements/"
        headers = self.get_auth_headers()
        
        params = {
            "achievement_type": "course_completion",
            "tier": "bronze",
            "category": "learning",
            "include_hidden": False,
            "skip": 0,
            "limit": 10
        }
        
        self.log_request("GET", endpoint, params=params, headers=headers)
        
        try:
            response = self.session.get(endpoint, params=params, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                achievements = response.json()
                logger.info("✅ Achievement search successful")
                logger.info(f"🏆 Found {len(achievements.get('achievements', []))} achievements")
                return True
            else:
                logger.error(f"❌ Achievement search failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Achievement search error: {e}")
            return False
    
    def test_create_achievement(self) -> bool:
        """Test achievement creation"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING ACHIEVEMENT CREATION")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/achievements/"
        headers = self.get_auth_headers()
        
        achievement_data = {
            "title": "Python Master",
            "description": "Complete advanced Python programming course with excellence",
            "achievement_type": "course_completion",
            "tier": "gold",
            "category": "programming",
            "icon_url": "https://example.com/python_master.png",
            "badge_color": "#FFD700",
            "criteria": {
                "course_id": "python_advanced_001",
                "min_score": 90,
                "completion_time": "within_30_days",
                "required_modules": ["async_programming", "design_patterns"]
            },
            "is_repeatable": False,
            "is_hidden": False,
            "course_id": "python_advanced_001",
            "module_id": None,
            "points_reward": 100,
            "nft_enabled": True,
            "tags": ["python", "programming", "advanced"],
            "rarity": "rare"
        }
        
        self.log_request("POST", endpoint, achievement_data, headers)
        
        try:
            response = self.session.post(endpoint, json=achievement_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 201:
                achievement_info = response.json()
                self.created_achievement_id = achievement_info.get("achievement", {}).get("achievement_id")
                logger.info("✅ Achievement creation successful")
                logger.info(f"🏆 Achievement ID: {self.created_achievement_id}")
                return True
            else:
                logger.error(f"❌ Achievement creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Achievement creation error: {e}")
            return False
    
    def test_get_achievement(self) -> bool:
        """Test getting achievement details"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET ACHIEVEMENT DETAILS")
        logger.info("=" * 60)
        
        if not self.created_achievement_id:
            logger.warning("⚠️ No achievement ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/achievements/{self.created_achievement_id}"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                achievement_info = response.json()
                logger.info("✅ Get achievement details successful")
                logger.info(f"🏆 Achievement: {achievement_info.get('title')}")
                logger.info(f"📝 Description: {achievement_info.get('description')[:100]}...")
                return True
            else:
                logger.error(f"❌ Get achievement details failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get achievement details error: {e}")
            return False
    
    def test_award_achievement(self) -> bool:
        """Test awarding achievement to user"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING AWARD ACHIEVEMENT")
        logger.info("=" * 60)
        
        if not self.created_achievement_id:
            logger.warning("⚠️ No achievement ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/achievements/earn"
        headers = self.get_auth_headers()
        
        award_data = {
            "achievement_id": self.created_achievement_id,
            "earned_through": "course_completion",
            "course_id": "python_advanced_001",
            "module_id": None,
            "quiz_id": None,
            "earned_value": 95.5,
            "bonus_points": 10
        }
        
        self.log_request("POST", endpoint, award_data, headers)
        
        try:
            response = self.session.post(endpoint, json=award_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                award_info = response.json()
                self.earned_achievement_id = award_info.get("user_achievement", {}).get("user_achievement_id")
                logger.info("✅ Award achievement successful")
                logger.info(f"🏆 Earned Achievement ID: {self.earned_achievement_id}")
                return True
            else:
                logger.error(f"❌ Award achievement failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Award achievement error: {e}")
            return False
    
    def test_get_my_achievements(self) -> bool:
        """Test getting user's earned achievements"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET MY ACHIEVEMENTS")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/achievements/my/earned"
        headers = self.get_auth_headers()
        
        params = {
            "achievement_type": "course_completion",
            "course_id": "python_advanced_001",
            "showcased_only": False
        }
        
        self.log_request("GET", endpoint, params=params, headers=headers)
        
        try:
            response = self.session.get(endpoint, params=params, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                achievements = response.json()
                logger.info("✅ Get my achievements successful")
                logger.info(f"🏆 Earned {len(achievements.get('achievements', []))} achievements")
                return True
            else:
                logger.error(f"❌ Get my achievements failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get my achievements error: {e}")
            return False
    
    def test_toggle_achievement_showcase(self) -> bool:
        """Test toggling achievement showcase status"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING TOGGLE ACHIEVEMENT SHOWCASE")
        logger.info("=" * 60)
        
        if not self.earned_achievement_id:
            logger.warning("⚠️ No earned achievement ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/achievements/my/earned/{self.earned_achievement_id}/showcase"
        headers = self.get_auth_headers()
        
        showcase_data = {
            "showcase": True
        }
        
        self.log_request("PUT", endpoint, showcase_data, headers)
        
        try:
            response = self.session.put(endpoint, json=showcase_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                logger.info("✅ Toggle achievement showcase successful")
                return True
            else:
                logger.error(f"❌ Toggle achievement showcase failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Toggle achievement showcase error: {e}")
            return False
    
    def test_get_achievement_leaderboard(self) -> bool:
        """Test getting achievement leaderboard"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET ACHIEVEMENT LEADERBOARD")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/achievements/leaderboard"
        
        params = {
            "achievement_type": "course_completion",
            "course_id": "python_advanced_001",
            "timeframe": "all",
            "limit": 10
        }
        
        self.log_request("GET", endpoint, params=params)
        
        try:
            response = self.session.get(endpoint, params=params)
            self.log_response(response)
            
            if response.status_code == 200:
                leaderboard = response.json()
                logger.info("✅ Get achievement leaderboard successful")
                logger.info(f"🏆 Leaderboard has {len(leaderboard.get('leaderboard', []))} entries")
                return True
            else:
                logger.error(f"❌ Get achievement leaderboard failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get achievement leaderboard error: {e}")
            return False
    
    def test_check_achievement_eligibility(self) -> bool:
        """Test checking achievement eligibility"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING CHECK ACHIEVEMENT ELIGIBILITY")
        logger.info("=" * 60)
        
        if not self.created_achievement_id:
            logger.warning("⚠️ No achievement ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/achievements/check-eligibility/{self.created_achievement_id}"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                eligibility_info = response.json()
                logger.info("✅ Check achievement eligibility successful")
                logger.info(f"🏆 Eligible: {eligibility_info.get('eligible', False)}")
                return True
            else:
                logger.error(f"❌ Check achievement eligibility failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Check achievement eligibility error: {e}")
            return False
    
    def test_get_achievement_statistics(self) -> bool:
        """Test getting achievement statistics"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET ACHIEVEMENT STATISTICS")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/achievements/statistics"
        headers = self.get_auth_headers()
        
        params = {
            "course_id": "python_advanced_001"
        }
        
        self.log_request("GET", endpoint, params=params, headers=headers)
        
        try:
            response = self.session.get(endpoint, params=params, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                stats = response.json()
                logger.info("✅ Get achievement statistics successful")
                logger.info(f"📊 Total achievements: {stats.get('total_achievements', 0)}")
                logger.info(f"📊 Earned achievements: {stats.get('earned_achievements', 0)}")
                return True
            else:
                logger.error(f"❌ Get achievement statistics failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get achievement statistics error: {e}")
            return False
    
    def test_update_achievement(self) -> bool:
        """Test updating achievement"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING UPDATE ACHIEVEMENT")
        logger.info("=" * 60)
        
        if not self.created_achievement_id:
            logger.warning("⚠️ No achievement ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/achievements/{self.created_achievement_id}"
        headers = self.get_auth_headers()
        
        update_data = {
            "title": "Python Master - Updated",
            "description": "Updated achievement for completing advanced Python programming course",
            "tier": "platinum",
            "points_reward": 150,
            "tags": ["python", "programming", "advanced", "updated"],
            "rarity": "epic"
        }
        
        self.log_request("PUT", endpoint, update_data, headers)
        
        try:
            response = self.session.put(endpoint, json=update_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                logger.info("✅ Update achievement successful")
                return True
            else:
                logger.error(f"❌ Update achievement failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Update achievement error: {e}")
            return False
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all achievement-related tests"""
        logger.info("🚀 STARTING COMPREHENSIVE ACHIEVEMENTS API TESTS")
        logger.info(f"📅 Test started at: {datetime.now()}")
        
        # First authenticate
        if not self.authenticate():
            logger.error("❌ Authentication failed, cannot proceed with tests")
            return {"authentication": False}
        
        test_results = {}
        
        # Test sequence
        tests = [
            ("search_achievements", self.test_search_achievements),
            ("create_achievement", self.test_create_achievement),
            ("get_achievement", self.test_get_achievement),
            ("award_achievement", self.test_award_achievement),
            ("get_my_achievements", self.test_get_my_achievements),
            ("toggle_achievement_showcase", self.test_toggle_achievement_showcase),
            ("get_achievement_leaderboard", self.test_get_achievement_leaderboard),
            ("check_achievement_eligibility", self.test_check_achievement_eligibility),
            ("get_achievement_statistics", self.test_get_achievement_statistics),
            ("update_achievement", self.test_update_achievement),
        ]
        
        for test_name, test_func in tests:
            try:
                logger.info(f"\n{'='*20} Running {test_name} {'='*20}")
                result = test_func()
                test_results[test_name] = result
                
                if result:
                    logger.info(f"✅ {test_name}: PASSED")
                else:
                    logger.error(f"❌ {test_name}: FAILED")
                    
            except Exception as e:
                logger.error(f"❌ {test_name}: ERROR - {e}")
                test_results[test_name] = False
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("📊 TEST SUMMARY")
        logger.info("="*60)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            logger.info(f"{test_name}: {status}")
        
        logger.info(f"\n🎯 Overall: {passed}/{total} tests passed")
        logger.info(f"📅 Test completed at: {datetime.now()}")
        
        return test_results

def main():
    """Main test runner"""
    # Test with default localhost URL
    tester = AchievementsAPITester("http://localhost:8000")
    
    # Run all tests
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if all(results.values()):
        logger.info("🎉 All tests passed!")
        exit(0)
    else:
        logger.error("💥 Some tests failed!")
        exit(1)

if __name__ == "__main__":
    main()
