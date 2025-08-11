#!/usr/bin/env python3
"""
Debug script to test course search functionality
"""

import asyncio
import sys
import os

# Add the digital_twin directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'digital_twin'))

from digital_twin.models.course import Course
from digital_twin.services.course_service import CourseService

async def debug_search():
    """Debug the search functionality"""
    print("=== DEBUGGING COURSE SEARCH ===")
    
    # Initialize course service
    course_service = CourseService()
    
    # Test 1: Get all courses
    print("\n1. Testing get all courses...")
    all_courses = await Course.find({}).to_list()
    print(f"Total courses in database: {len(all_courses)}")
    
    for course in all_courses:
        print(f"  - {course.course_id}: {course.title}")
        print(f"    Status: {course.status}, Public: {course.is_public}")
        print(f"    Institution: {course.institution}")
        if course.metadata:
            print(f"    Difficulty: {course.metadata.difficulty_level}")
            print(f"    Tags: {course.metadata.tags}")
        print()
    
    # Test 2: Search with Python query
    print("\n2. Testing search with Python query...")
    result = await course_service.search_courses(query="Python", skip=0, limit=10)
    print(f"Search result: {result}")
    
    # Test 3: Search with difficulty filter
    print("\n3. Testing search with difficulty filter...")
    result = await course_service.search_courses(
        query="Python", 
        filters={"difficulty_level": "beginner"}, 
        skip=0, 
        limit=10
    )
    print(f"Search result with difficulty filter: {result}")
    
    # Test 4: Direct MongoDB query
    print("\n4. Testing direct MongoDB query...")
    search_criteria = {
        "status": "published",
        "is_public": True,
        "$or": [
            {"title": {"$regex": "Python", "$options": "i"}},
            {"description": {"$regex": "Python", "$options": "i"}},
            {"metadata.tags": {"$in": ["Python"]}}
        ]
    }
    print(f"Search criteria: {search_criteria}")
    
    courses = await Course.find(search_criteria).to_list()
    print(f"Direct query found {len(courses)} courses")
    
    for course in courses:
        print(f"  - {course.course_id}: {course.title}")

if __name__ == "__main__":
    asyncio.run(debug_search())
