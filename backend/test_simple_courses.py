#!/usr/bin/env python3
"""
Simple test script to verify course API fixes
"""
import requests
import json

def test_course_search():
    """Test course search endpoint"""
    try:
        # Test course search without authentication
        response = requests.get("http://localhost:8000/api/v1/courses/")
        print(f"Course search status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data.get('items', []))} courses")
            for course in data.get('items', [])[:2]:  # Show first 2 courses
                print(f"- {course.get('title')} ({course.get('difficulty_level')})")
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_authentication():
    """Test authentication"""
    try:
        login_data = {
            "identifier": "22520183@gm.uit.edu.vn",
            "password": "Minhdai100504@"
        }
        
        response = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)
        print(f"Auth status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("Authentication successful")
            return token
        else:
            print(f"Auth error: {response.text}")
            return None
    except Exception as e:
        print(f"Auth exception: {e}")
        return None

def test_enrollments(token):
    """Test enrollments endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8000/api/v1/courses/my/enrollments", headers=headers)
        print(f"Enrollments status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data.get('enrollments', []))} enrollments")
            return True
        else:
            print(f"Enrollments error: {response.text}")
            return False
    except Exception as e:
        print(f"Enrollments exception: {e}")
        return False

def test_achievements(token):
    """Test achievements endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8000/api/v1/achievements/my/earned", headers=headers)
        print(f"Achievements status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data.get('achievements', []))} achievements")
            return True
        else:
            print(f"Achievements error: {response.text}")
            return False
    except Exception as e:
        print(f"Achievements exception: {e}")
        return False

def main():
    print("=== Testing Course API Fixes ===")
    
    # Test 1: Course search
    print("\n1. Testing course search...")
    search_ok = test_course_search()
    
    # Test 2: Authentication
    print("\n2. Testing authentication...")
    token = test_authentication()
    
    if token:
        # Test 3: Enrollments
        print("\n3. Testing enrollments...")
        enrollments_ok = test_enrollments(token)
        
        # Test 4: Achievements
        print("\n4. Testing achievements...")
        achievements_ok = test_achievements(token)
        
        print(f"\n=== Results ===")
        print(f"Course search: {'✅' if search_ok else '❌'}")
        print(f"Authentication: ✅")
        print(f"Enrollments: {'✅' if enrollments_ok else '❌'}")
        print(f"Achievements: {'✅' if achievements_ok else '❌'}")
    else:
        print("\n❌ Authentication failed, skipping other tests")

if __name__ == "__main__":
    main()
