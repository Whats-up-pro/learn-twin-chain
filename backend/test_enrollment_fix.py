#!/usr/bin/env python3
"""
Test script to verify enrollment fix
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from digital_twin.config.database import connect_to_mongo, close_mongo_connection
from digital_twin.models.user import User
from digital_twin.models.course import Course, Enrollment
from digital_twin.models.digital_twin import DigitalTwin
from digital_twin.services.course_service import CourseService

async def test_enrollment_fix():
    """Test the enrollment fix"""
    print("🔧 Testing Enrollment Fix")
    print("=" * 50)
    
    # Connect to database
    await connect_to_mongo()
    
    try:
        # Initialize course service
        course_service = CourseService()
        
        # Test user DID
        test_user_did = "did:learntwin:student001"
        
        print(f"👤 Testing with user: {test_user_did}")
        
        # Check if user exists
        user = await User.find_one({"did": test_user_did})
        if not user:
            print("❌ User not found")
            return False
        
        print(f"✅ User found: {user.name}")
        print(f"📚 Current enrollments in user model: {user.enrollments}")
        
        # Check digital twin
        digital_twin = await DigitalTwin.find_one({"owner_did": test_user_did})
        if digital_twin:
            print(f"✅ Digital twin found: {digital_twin.twin_id}")
            print(f"📚 Current enrollments in digital twin: {[e.course_id for e in digital_twin.enrollments]}")
        else:
            print("⚠️  Digital twin not found")
        
        # Check enrollment collection
        enrollments = await Enrollment.find({"user_id": test_user_did}).to_list()
        print(f"📚 Current enrollments in collection: {[e.course_id for e in enrollments]}")
        
        # Test enrollment sync
        print("\n🔄 Testing enrollment sync...")
        success = await course_service.sync_user_enrollments(test_user_did)
        if success:
            print("✅ Enrollment sync successful")
        else:
            print("❌ Enrollment sync failed")
        
        # Check enrollments after sync
        user_after = await User.find_one({"did": test_user_did})
        print(f"📚 Enrollments after sync: {user_after.enrollments}")
        
        # Test getting enrollments
        print("\n📋 Testing get_student_enrollments...")
        enrollment_data = await course_service.get_student_enrollments(test_user_did)
        print(f"📚 Retrieved {len(enrollment_data)} enrollments")
        
        for i, enrollment_info in enumerate(enrollment_data):
            enrollment = enrollment_info.get("enrollment", {})
            course = enrollment_info.get("course", {})
            print(f"  {i+1}. Course: {course.get('title', 'Unknown')} (ID: {enrollment.get('course_id', 'Unknown')})")
        
        print("\n✅ Enrollment fix test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_enrollment_fix())
