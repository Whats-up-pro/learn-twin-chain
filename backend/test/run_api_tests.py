#!/usr/bin/env python3
"""
Simple script to run API tests and show results
"""
import subprocess
import sys
import os
from pathlib import Path

def run_tests():
    """Run all API tests"""
    print("🧪 Running API Tests for Lessons, Achievements, and Quizzes")
    print("=" * 60)
    
    # Get the test directory
    test_dir = Path(__file__).parent
    
    # List of test files to run
    test_files = [
        "test_lessons_api.py",
        "test_achievements_api.py", 
        "test_quizzes_api.py",
        "test_all_api_endpoints.py"
    ]
    
    results = {}
    
    for test_file in test_files:
        test_path = test_dir / test_file
        if test_path.exists():
            print(f"\n📋 Running tests from: {test_file}")
            print("-" * 40)
            
            try:
                # Run the test file
                result = subprocess.run([
                    sys.executable, "-m", "pytest", str(test_path),
                    "-v", "--tb=short", "--disable-warnings"
                ], capture_output=True, text=True, cwd=test_dir)
                
                if result.returncode == 0:
                    print("✅ Tests passed!")
                    results[test_file] = "PASSED"
                else:
                    print("❌ Tests failed!")
                    print("Error output:")
                    print(result.stderr)
                    results[test_file] = "FAILED"
                    
            except Exception as e:
                print(f"❌ Error running tests: {e}")
                results[test_file] = "ERROR"
        else:
            print(f"⚠️  Test file not found: {test_file}")
            results[test_file] = "NOT_FOUND"
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    for test_file, status in results.items():
        status_icon = {
            "PASSED": "✅",
            "FAILED": "❌", 
            "ERROR": "⚠️",
            "NOT_FOUND": "🔍"
        }.get(status, "❓")
        print(f"{status_icon} {test_file}: {status}")
    
    # Count results
    passed = sum(1 for status in results.values() if status == "PASSED")
    total = len(results)
    
    print(f"\n📈 Overall: {passed}/{total} test suites passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return 1

def show_api_endpoints():
    """Show the new API endpoints that were implemented"""
    print("\n" + "=" * 60)
    print("🔗 NEW API ENDPOINTS IMPLEMENTED")
    print("=" * 60)
    
    endpoints = {
        "Lessons API": [
            "GET /api/v1/lessons/ - Get all lessons with filters",
            "GET /api/v1/lessons/{lesson_id} - Get specific lesson",
            "GET /api/v1/lessons/module/{module_id} - Get lessons for module",
            "GET /api/v1/lessons/course/{course_id} - Get lessons for course",
            "GET /api/v1/lessons/all/courses - Get all lessons across courses"
        ],
        "Achievements API": [
            "GET /api/v1/achievements/ - Get all achievements with filters",
            "GET /api/v1/achievements/{achievement_id} - Get specific achievement",
            "GET /api/v1/achievements/course/{course_id} - Get achievements for course",
            "GET /api/v1/achievements/all/courses - Get all achievements across courses",
            "GET /api/v1/achievements/my/earned - Get user's earned achievements",
            "GET /api/v1/achievements/leaderboard - Get achievement leaderboard",
            "GET /api/v1/achievements/statistics - Get achievement statistics"
        ],
        "Quizzes API": [
            "GET /api/v1/quizzes/ - Get all quizzes with filters",
            "GET /api/v1/quizzes/{quiz_id} - Get specific quiz",
            "GET /api/v1/quizzes/course/{course_id} - Get quizzes for course",
            "GET /api/v1/quizzes/all/courses - Get all quizzes across courses",
            "GET /api/v1/quizzes/my/attempts - Get user's quiz attempts",
            "POST /api/v1/quizzes/{quiz_id}/attempt - Start quiz attempt",
            "POST /api/v1/quizzes/{quiz_id}/attempt/{attempt_id}/submit - Submit quiz attempt"
        ]
    }
    
    for category, category_endpoints in endpoints.items():
        print(f"\n📚 {category}:")
        for endpoint in category_endpoints:
            print(f"   • {endpoint}")

def show_test_instructions():
    """Show instructions for running tests"""
    print("\n" + "=" * 60)
    print("📖 TEST INSTRUCTIONS")
    print("=" * 60)
    
    instructions = [
        "1. Make sure the backend server is running on localhost:8000",
        "2. Ensure you have test data in the database",
        "3. Run this script to execute all tests",
        "4. Check the output for any failures",
        "5. Individual test files can be run separately if needed"
    ]
    
    for instruction in instructions:
        print(f"   {instruction}")
    
    print("\n🔧 To run individual test files:")
    print("   python -m pytest test/test_lessons_api.py -v")
    print("   python -m pytest test/test_achievements_api.py -v")
    print("   python -m pytest test/test_quizzes_api.py -v")

if __name__ == "__main__":
    print("🚀 API Test Runner for LearnTwinChain")
    print("Testing Lessons, Achievements, and Quizzes APIs")
    
    # Show API endpoints
    show_api_endpoints()
    
    # Show test instructions
    show_test_instructions()
    
    # Ask user if they want to run tests
    try:
        response = input("\n❓ Do you want to run the tests now? (y/n): ").lower().strip()
        if response in ['y', 'yes']:
            exit_code = run_tests()
            sys.exit(exit_code)
        else:
            print("👋 Tests not run. You can run them manually later.")
    except KeyboardInterrupt:
        print("\n👋 Tests cancelled by user.")
        sys.exit(0)
