#!/usr/bin/env python3
"""
Comprehensive test suite for Courses API
Tests all course-related endpoints with detailed debugging
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
        logging.FileHandler('test_courses_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CoursesAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.user_data = None
        
        # Test user credentials
        self.test_email = "22520183@gm.uit.edu.vn"
        self.test_password = "Minhdai100504@"
        
        # Test data storage
        self.created_course_id = None
        self.created_module_id = None
        
        logger.info(f"🚀 Initializing Courses API Tester for {base_url}")
    
    def authenticate(self) -> bool:
        """Authenticate user for testing"""
        logger.info("🔐 Authenticating user for course tests...")
        
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
    
    def test_search_courses(self) -> bool:
        """Test course search functionality"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING COURSE SEARCH")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/courses/"
        params = {
            "q": "Python",
            "difficulty_level": "beginner",
            "skip": 0,
            "limit": 10
        }
        
        self.log_request("GET", endpoint, params=params)
        
        try:
            response = self.session.get(endpoint, params=params)
            self.log_response(response)
            
            if response.status_code == 200:
                courses = response.json()
                logger.info("✅ Course search successful")
                logger.info(f"📚 Found {len(courses.get('courses', []))} courses")
                return True
            else:
                logger.error(f"❌ Course search failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Course search error: {e}")
            return False
    
    def test_create_course(self) -> bool:
        """Test course creation"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING COURSE CREATION")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/courses/"
        headers = self.get_auth_headers()
        
        course_data = {
            "title": "Advanced Python Programming",
            "description": "Comprehensive course on advanced Python concepts including async programming, decorators, and design patterns",
            "institution": "UIT - University of Information Technology",
            "metadata": {
                "difficulty_level": "advanced",
                "tags": ["python", "programming", "advanced"],
                "prerequisites": ["Basic Python knowledge"],
                "estimated_duration": "8 weeks"
            },
            "enrollment_start": "2024-01-01T00:00:00Z",
            "enrollment_end": "2024-12-31T23:59:59Z",
            "course_start": "2024-02-01T00:00:00Z",
            "course_end": "2024-03-31T23:59:59Z",
            "max_enrollments": 50,
            "is_public": True,
            "requires_approval": False,
            "completion_nft_enabled": True,
            "syllabus": {
                "modules": [
                    {
                        "title": "Async Programming",
                        "description": "Learn async/await patterns",
                        "duration": "2 weeks"
                    },
                    {
                        "title": "Advanced Decorators",
                        "description": "Master Python decorators",
                        "duration": "2 weeks"
                    }
                ]
            }
        }
        
        self.log_request("POST", endpoint, course_data, headers)
        
        try:
            response = self.session.post(endpoint, json=course_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 201:
                course_info = response.json()
                self.created_course_id = course_info.get("course", {}).get("course_id")
                logger.info("✅ Course creation successful")
                logger.info(f"📚 Course ID: {self.created_course_id}")
                return True
            else:
                logger.error(f"❌ Course creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Course creation error: {e}")
            return False
    
    def test_get_course(self) -> bool:
        """Test getting course details"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET COURSE DETAILS")
        logger.info("=" * 60)
        
        if not self.created_course_id:
            logger.warning("⚠️ No course ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/courses/{self.created_course_id}"
        params = {"include_modules": True}
        
        self.log_request("GET", endpoint, params=params)
        
        try:
            response = self.session.get(endpoint, params=params)
            self.log_response(response)
            
            if response.status_code == 200:
                course_info = response.json()
                logger.info("✅ Get course details successful")
                logger.info(f"📚 Course: {course_info.get('title')}")
                logger.info(f"📝 Description: {course_info.get('description')[:100]}...")
                return True
            else:
                logger.error(f"❌ Get course details failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get course details error: {e}")
            return False
    
    def test_create_module(self) -> bool:
        """Test module creation"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING MODULE CREATION")
        logger.info("=" * 60)
        
        if not self.created_course_id:
            logger.warning("⚠️ No course ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/courses/{self.created_course_id}/modules"
        headers = self.get_auth_headers()
        
        module_data = {
            "course_id": self.created_course_id,
            "title": "Async Programming Fundamentals",
            "description": "Learn the basics of asynchronous programming in Python",
            "content": [
                {
                    "type": "video",
                    "title": "Introduction to Async Programming",
                    "url": "https://example.com/video1.mp4",
                    "duration": 1800
                },
                {
                    "type": "text",
                    "title": "Async/Await Syntax",
                    "content": "Detailed explanation of async/await syntax..."
                },
                {
                    "type": "quiz",
                    "title": "Async Programming Quiz",
                    "questions": [
                        {
                            "question": "What is the purpose of async/await?",
                            "options": ["Speed up code", "Handle concurrent operations", "Reduce memory usage"],
                            "correct_answer": 1
                        }
                    ]
                }
            ],
            "order": 1,
            "learning_objectives": [
                "Understand async programming concepts",
                "Master async/await syntax",
                "Build concurrent applications"
            ],
            "estimated_duration": 120,
            "assessments": [
                {
                    "type": "quiz",
                    "weight": 0.3,
                    "passing_score": 70
                }
            ],
            "completion_criteria": {
                "min_score": 70,
                "required_content": ["video", "text", "quiz"]
            },
            "is_mandatory": True,
            "prerequisites": [],
            "completion_nft_enabled": True
        }
        
        self.log_request("POST", endpoint, module_data, headers)
        
        try:
            response = self.session.post(endpoint, json=module_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 201:
                module_info = response.json()
                self.created_module_id = module_info.get("module", {}).get("module_id")
                logger.info("✅ Module creation successful")
                logger.info(f"📚 Module ID: {self.created_module_id}")
                return True
            else:
                logger.error(f"❌ Module creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Module creation error: {e}")
            return False
    
    def test_get_course_modules(self) -> bool:
        """Test getting course modules"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET COURSE MODULES")
        logger.info("=" * 60)
        
        if not self.created_course_id:
            logger.warning("⚠️ No course ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/courses/{self.created_course_id}/modules"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                modules = response.json()
                logger.info("✅ Get course modules successful")
                logger.info(f"📚 Found {len(modules.get('modules', []))} modules")
                return True
            else:
                logger.error(f"❌ Get course modules failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get course modules error: {e}")
            return False
    
    def test_update_module_progress(self) -> bool:
        """Test updating module progress"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING UPDATE MODULE PROGRESS")
        logger.info("=" * 60)
        
        if not self.created_module_id:
            logger.warning("⚠️ No module ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/courses/modules/{self.created_module_id}/progress"
        headers = self.get_auth_headers()
        
        progress_data = {
            "content_progress": {
                "video": 0.75,
                "text": 1.0,
                "quiz": 0.5
            },
            "time_spent": 1800,
            "assessment_score": 85.5,
            "assessment_id": "quiz_001"
        }
        
        self.log_request("PUT", endpoint, progress_data, headers)
        
        try:
            response = self.session.put(endpoint, json=progress_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                logger.info("✅ Update module progress successful")
                return True
            else:
                logger.error(f"❌ Update module progress failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Update module progress error: {e}")
            return False
    
    def test_get_module_progress(self) -> bool:
        """Test getting module progress"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET MODULE PROGRESS")
        logger.info("=" * 60)
        
        if not self.created_module_id:
            logger.warning("⚠️ No module ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/courses/modules/{self.created_module_id}/progress"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                progress_info = response.json()
                logger.info("✅ Get module progress successful")
                logger.info(f"📊 Progress: {progress_info.get('overall_progress', 0)}%")
                return True
            else:
                logger.error(f"❌ Get module progress failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get module progress error: {e}")
            return False
    
    def test_enroll_in_course(self) -> bool:
        """Test course enrollment"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING COURSE ENROLLMENT")
        logger.info("=" * 60)
        
        if not self.created_course_id:
            logger.warning("⚠️ No course ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/courses/{self.created_course_id}/enroll"
        headers = self.get_auth_headers()
        
        self.log_request("POST", endpoint, headers=headers)
        
        try:
            response = self.session.post(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                logger.info("✅ Course enrollment successful")
                return True
            else:
                logger.error(f"❌ Course enrollment failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Course enrollment error: {e}")
            return False
    
    def test_get_my_enrollments(self) -> bool:
        """Test getting user enrollments"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET MY ENROLLMENTS")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/courses/my/enrollments"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                enrollments = response.json()
                logger.info("✅ Get my enrollments successful")
                logger.info(f"📚 Enrolled in {len(enrollments.get('enrollments', []))} courses")
                return True
            else:
                logger.error(f"❌ Get my enrollments failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get my enrollments error: {e}")
            return False
    
    def test_get_my_progress(self) -> bool:
        """Test getting user progress"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET MY PROGRESS")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/courses/my/progress"
        headers = self.get_auth_headers()
        
        params = {}
        if self.created_course_id:
            params["course_id"] = self.created_course_id
        
        self.log_request("GET", endpoint, params=params, headers=headers)
        
        try:
            response = self.session.get(endpoint, params=params, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                progress_info = response.json()
                logger.info("✅ Get my progress successful")
                logger.info(f"📊 Overall progress: {progress_info.get('overall_progress', 0)}%")
                return True
            else:
                logger.error(f"❌ Get my progress failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get my progress error: {e}")
            return False
    
    def test_publish_course(self) -> bool:
        """Test publishing a course"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING PUBLISH COURSE")
        logger.info("=" * 60)
        
        if not self.created_course_id:
            logger.warning("⚠️ No course ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/courses/{self.created_course_id}/publish"
        headers = self.get_auth_headers()
        
        self.log_request("POST", endpoint, headers=headers)
        
        try:
            response = self.session.post(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                logger.info("✅ Course publish successful")
                return True
            else:
                logger.error(f"❌ Course publish failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Course publish error: {e}")
            return False
    
    def test_update_course(self) -> bool:
        """Test updating course"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING UPDATE COURSE")
        logger.info("=" * 60)
        
        if not self.created_course_id:
            logger.warning("⚠️ No course ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/courses/{self.created_course_id}"
        headers = self.get_auth_headers()
        
        update_data = {
            "title": "Advanced Python Programming - Updated",
            "description": "Updated comprehensive course on advanced Python concepts",
            "metadata": {
                "difficulty_level": "advanced",
                "tags": ["python", "programming", "advanced", "updated"],
                "prerequisites": ["Basic Python knowledge", "OOP concepts"],
                "estimated_duration": "10 weeks"
            }
        }
        
        self.log_request("PUT", endpoint, update_data, headers)
        
        try:
            response = self.session.put(endpoint, json=update_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                logger.info("✅ Course update successful")
                return True
            else:
                logger.error(f"❌ Course update failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Course update error: {e}")
            return False
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all course-related tests"""
        logger.info("🚀 STARTING COMPREHENSIVE COURSES API TESTS")
        logger.info(f"📅 Test started at: {datetime.now()}")
        
        # First authenticate
        if not self.authenticate():
            logger.error("❌ Authentication failed, cannot proceed with tests")
            return {"authentication": False}
        
        test_results = {}
        
        # Test sequence
        tests = [
            ("search_courses", self.test_search_courses),
            ("create_course", self.test_create_course),
            ("get_course", self.test_get_course),
            ("create_module", self.test_create_module),
            ("get_course_modules", self.test_get_course_modules),
            ("update_module_progress", self.test_update_module_progress),
            ("get_module_progress", self.test_get_module_progress),
            ("enroll_in_course", self.test_enroll_in_course),
            ("get_my_enrollments", self.test_get_my_enrollments),
            ("get_my_progress", self.test_get_my_progress),
            ("publish_course", self.test_publish_course),
            ("update_course", self.test_update_course),
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
    tester = CoursesAPITester("http://localhost:8000")
    
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
