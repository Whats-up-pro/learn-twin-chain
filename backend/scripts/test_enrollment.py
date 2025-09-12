#!/usr/bin/env python3
"""
Script to test enrollment functionality
"""
import os
import sys
import asyncio
import requests
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, '.env'))

class EnrollmentTester:
    def __init__(self):
        self.base_url = "http://localhost:8000/api/v1"
        self.session = requests.Session()
        self.access_token = None
        
    def login(self, identifier: str, password: str) -> bool:
        """Login and get access token"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json={
                "identifier": identifier,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                if self.access_token:
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.access_token}"
                    })
                    print(f"✅ Login successful for {identifier}")
                    return True
                else:
                    print(f"❌ No access token in response")
                    return False
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def get_courses(self) -> list:
        """Get available courses"""
        try:
            response = self.session.get(f"{self.base_url}/courses/all")
            if response.status_code == 200:
                data = response.json()
                courses = data.get("items", [])
                print(f"✅ Found {len(courses)} courses")
                return courses
            else:
                print(f"❌ Failed to get courses: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"❌ Error getting courses: {e}")
            return []
    
    def get_course_detail(self, course_id: str) -> dict:
        """Get course detail"""
        try:
            response = self.session.get(f"{self.base_url}/courses/{course_id}")
            if response.status_code == 200:
                data = response.json()
                course = data.get("course", {})
                print(f"✅ Got course detail for {course_id}")
                return course
            else:
                print(f"❌ Failed to get course detail: {response.status_code} - {response.text}")
                return {}
        except Exception as e:
            print(f"❌ Error getting course detail: {e}")
            return {}
    
    def enroll_in_course(self, course_id: str) -> bool:
        """Enroll in a course"""
        try:
            response = self.session.post(f"{self.base_url}/courses/{course_id}/enroll")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Successfully enrolled in course {course_id}")
                print(f"   Message: {data.get('message', 'No message')}")
                return True
            else:
                print(f"❌ Enrollment failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error enrolling: {e}")
            return False
    
    def get_my_enrollments(self) -> list:
        """Get user's enrollments"""
        try:
            response = self.session.get(f"{self.base_url}/courses/my/enrollments")
            if response.status_code == 200:
                data = response.json()
                enrollments = data.get("enrollments", [])
                print(f"✅ Found {len(enrollments)} enrollments")
                return enrollments
            else:
                print(f"❌ Failed to get enrollments: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"❌ Error getting enrollments: {e}")
            return []
    
    def test_enrollment_flow(self, identifier: str, password: str):
        """Test complete enrollment flow"""
        print("🚀 Starting enrollment test...")
        print("=" * 50)
        
        # Step 1: Login
        print("Step 1: Login")
        if not self.login(identifier, password):
            print("❌ Cannot proceed without login")
            return
        
        # Step 2: Get courses
        print("\nStep 2: Get available courses")
        courses = self.get_courses()
        if not courses:
            print("❌ No courses available")
            return
        
        # Step 3: Get first course detail
        print("\nStep 3: Get course detail")
        first_course = courses[0]
        course_id = first_course.get("id")
        course_detail = self.get_course_detail(course_id)
        
        if not course_detail:
            print("❌ Cannot get course detail")
            return
        
        # Step 4: Check if already enrolled
        is_enrolled = course_detail.get("is_enrolled", False)
        print(f"   Already enrolled: {is_enrolled}")
        
        # Step 5: Enroll in course
        print("\nStep 4: Enroll in course")
        if not is_enrolled:
            success = self.enroll_in_course(course_id)
            if not success:
                print("❌ Enrollment failed")
                return
        else:
            print("   Already enrolled, skipping enrollment")
        
        # Step 6: Get enrollments
        print("\nStep 5: Get my enrollments")
        enrollments = self.get_my_enrollments()
        
        # Step 7: Verify enrollment
        print("\nStep 6: Verify enrollment")
        enrolled_course_ids = []
        for enrollment in enrollments:
            enrollment_data = enrollment.get("enrollment", {})
            enrolled_course_id = enrollment_data.get("course_id")
            if enrolled_course_id:
                enrolled_course_ids.append(enrolled_course_id)
        
        if course_id in enrolled_course_ids:
            print(f"✅ Course {course_id} found in enrollments")
        else:
            print(f"❌ Course {course_id} not found in enrollments")
        
        # Step 8: Get course detail again to check enrollment status
        print("\nStep 7: Check enrollment status")
        updated_course_detail = self.get_course_detail(course_id)
        updated_is_enrolled = updated_course_detail.get("is_enrolled", False)
        print(f"   Enrollment status: {updated_is_enrolled}")
        
        print("\n🎉 Enrollment test completed!")

async def main():
    """Main function"""
    tester = EnrollmentTester()
    
    # Test with sample user
    identifier = "did:learntwin:student001"  # Change this to your test user
    password = "password123"  # Change this to your test password
    
    tester.test_enrollment_flow(identifier, password)

if __name__ == "__main__":
    print("🧪 Enrollment Test Script")
    print("=" * 50)
    
    # Run the test
    asyncio.run(main())
    
    print("\n✨ Test completed!")
