# API Endpoints Summary - Lessons, Achievements, and Quizzes

## Overview

This document provides a comprehensive summary of all API endpoints for the Lessons, Achievements, and Quizzes modules in the LearnTwinChain system. The APIs support full CRUD operations, filtering, pagination, and role-based access control.

## Base URL
- **Development**: `http://localhost:8000`
- **API Base**: `/api/v1`

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Lessons API

### Core Endpoints

#### 1. Get All Lessons
```http
GET /api/v1/lessons/
```

**Query Parameters:**
- `module_id` (optional): Filter by module ID
- `course_id` (optional): Filter by course ID
- `content_type` (optional): Filter by content type (video, text, interactive, quiz, assignment)
- `status` (optional): Filter by status (draft, review, published, archived)
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 20, max: 100)

**Response:**
```json
{
  "lessons": [...],
  "total": 150,
  "skip": 0,
  "limit": 20
}
```

#### 2. Get Lesson by ID
```http
GET /api/v1/lessons/{lesson_id}
```

**Query Parameters:**
- `include_content` (optional): Include IPFS content data (default: false)

**Response:**
```json
{
  "lesson": {
    "lesson_id": "lesson_001",
    "module_id": "module_001",
    "course_id": "course_001",
    "title": "Introduction to Python",
    "description": "Learn the basics of Python programming",
    "content_type": "video",
    "content_url": "https://youtube.com/watch?v=...",
    "duration_minutes": 30,
    "order": 1,
    "learning_objectives": ["Understand basic syntax", "Write simple programs"],
    "keywords": ["python", "programming", "basics"],
    "is_mandatory": true,
    "status": "published",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. Get Lessons for Module
```http
GET /api/v1/lessons/module/{module_id}
```

**Query Parameters:**
- `include_progress` (optional): Include user progress data (default: false)

**Response:**
```json
{
  "lessons": [...],
  "module": {
    "module_id": "module_001",
    "title": "Python Basics",
    "description": "Introduction to Python programming"
  }
}
```

#### 4. Get Lessons for Course
```http
GET /api/v1/lessons/course/{course_id}
```

**Query Parameters:**
- `include_progress` (optional): Include user progress data (default: false)

**Response:**
```json
{
  "lessons": [...],
  "course": {
    "course_id": "course_001",
    "title": "Python Programming",
    "description": "Complete Python course"
  },
  "total_lessons": 25
}
```

#### 5. Get All Lessons Across All Courses
```http
GET /api/v1/lessons/all/courses
```

**Query Parameters:**
- `include_progress` (optional): Include user progress data (default: false)
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 50, max: 200)

**Response:**
```json
{
  "lessons": [...],
  "total": 500,
  "skip": 0,
  "limit": 50
}
```

### Management Endpoints

#### Create Lesson
```http
POST /api/v1/lessons/
```

**Required Permissions:** `create_lesson`

**Request Body:**
```json
{
  "title": "New Lesson",
  "description": "Lesson description",
  "module_id": "module_001",
  "content_type": "video",
  "content_url": "https://youtube.com/watch?v=...",
  "duration_minutes": 30,
  "order": 1,
  "learning_objectives": ["Objective 1", "Objective 2"],
  "keywords": ["keyword1", "keyword2"],
  "is_mandatory": true,
  "prerequisites": []
}
```

#### Update Lesson
```http
PUT /api/v1/lessons/{lesson_id}
```

**Required Permissions:** `update_lesson`

#### Delete Lesson
```http
DELETE /api/v1/lessons/{lesson_id}
```

**Required Permissions:** `delete_lesson`

#### Publish Lesson
```http
POST /api/v1/lessons/{lesson_id}/publish
```

**Required Permissions:** `publish_lesson`

### Progress Tracking

#### Update Lesson Progress
```http
POST /api/v1/lessons/{lesson_id}/progress
```

**Request Body:**
```json
{
  "completion_percentage": 75.5,
  "time_spent_minutes": 25,
  "notes": "User notes about progress"
}
```

#### Get Lesson Progress
```http
GET /api/v1/lessons/{lesson_id}/progress
```

## Achievements API

### Core Endpoints

#### 1. Get All Achievements
```http
GET /api/v1/achievements/
```

**Query Parameters:**
- `achievement_type` (optional): Filter by achievement type
- `tier` (optional): Filter by tier (bronze, silver, gold, platinum)
- `category` (optional): Filter by category
- `course_id` (optional): Filter by course ID
- `module_id` (optional): Filter by module ID
- `status` (optional): Filter by status (active, inactive, deprecated)
- `include_hidden` (optional): Include hidden achievements (default: false)
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 20, max: 100)

**Response:**
```json
{
  "achievements": [...],
  "total": 50,
  "skip": 0,
  "limit": 20
}
```

#### 2. Get Achievement by ID
```http
GET /api/v1/achievements/{achievement_id}
```

**Response:**
```json
{
  "achievement": {
    "achievement_id": "achievement_001",
    "title": "Python Master",
    "description": "Complete Python programming course",
    "achievement_type": "course_completion",
    "tier": "gold",
    "category": "programming",
    "icon_url": "https://example.com/icon.png",
    "badge_color": "#FFD700",
    "criteria": {
      "type": "course_completion",
      "target_value": 100.0,
      "comparison": "gte"
    },
    "is_repeatable": false,
    "is_hidden": false,
    "course_id": "course_001",
    "points_reward": 100,
    "nft_enabled": true,
    "created_by": "teacher_did",
    "tags": ["python", "programming"],
    "rarity": "rare",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. Get Achievements for Course
```http
GET /api/v1/achievements/course/{course_id}
```

**Query Parameters:**
- `include_hidden` (optional): Include hidden achievements (default: false)

**Response:**
```json
{
  "achievements": [...],
  "course": {
    "course_id": "course_001",
    "title": "Python Programming",
    "description": "Complete Python course"
  },
  "total_achievements": 10
}
```

#### 4. Get All Achievements Across All Courses
```http
GET /api/v1/achievements/all/courses
```

**Query Parameters:**
- `include_hidden` (optional): Include hidden achievements (default: false)
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 50, max: 200)

**Response:**
```json
{
  "achievements": [...],
  "total": 200,
  "skip": 0,
  "limit": 50
}
```

#### 5. Get User's Earned Achievements
```http
GET /api/v1/achievements/my/earned
```

**Query Parameters:**
- `achievement_type` (optional): Filter by achievement type
- `course_id` (optional): Filter by course ID
- `showcased_only` (optional): Show only showcased achievements (default: false)

**Response:**
```json
{
  "achievements": [
    {
      "achievement_id": "achievement_001",
      "title": "Python Master",
      "earned": true,
      "earned_at": "2024-01-15T10:30:00Z",
      "earned_through": "course_completion",
      "is_showcased": true
    }
  ]
}
```

#### 6. Get Achievement Leaderboard
```http
GET /api/v1/achievements/leaderboard
```

**Query Parameters:**
- `achievement_type` (optional): Filter by achievement type
- `course_id` (optional): Filter by course ID
- `timeframe` (optional): Timeframe for leaderboard (week, month, year, all) (default: all)
- `limit` (optional): Number of top users to return (default: 10, max: 100)

**Response:**
```json
{
  "leaderboard": [
    {
      "user_id": "user_001",
      "name": "John Doe",
      "total_achievements": 25,
      "total_points": 2500,
      "rank": 1
    }
  ]
}
```

#### 7. Get Achievement Statistics
```http
GET /api/v1/achievements/statistics
```

**Query Parameters:**
- `course_id` (optional): Filter by course ID

**Response:**
```json
{
  "statistics": {
    "total_achievements": 50,
    "earned_achievements": 15,
    "completion_rate": 0.3,
    "average_points": 150,
    "most_common_type": "course_completion",
    "rarest_achievement": "achievement_001"
  }
}
```

### Management Endpoints

#### Create Achievement
```http
POST /api/v1/achievements/
```

**Required Permissions:** `create_achievement`

#### Update Achievement
```http
PUT /api/v1/achievements/{achievement_id}
```

**Required Permissions:** `update_achievement`

#### Award Achievement to User
```http
POST /api/v1/achievements/earn
```

**Request Body:**
```json
{
  "achievement_id": "achievement_001",
  "earned_through": "course_completion",
  "course_id": "course_001",
  "module_id": "module_001",
  "quiz_id": "quiz_001",
  "earned_value": 95.5,
  "bonus_points": 10
}
```

#### Toggle Achievement Showcase
```http
PUT /api/v1/achievements/my/earned/{user_achievement_id}/showcase
```

**Request Body:**
```json
{
  "showcase": true
}
```

#### Check Achievement Eligibility
```http
POST /api/v1/achievements/check-eligibility/{achievement_id}
```

## Quizzes API

### Core Endpoints

#### 1. Get All Quizzes
```http
GET /api/v1/quizzes/
```

**Query Parameters:**
- `course_id` (optional): Filter by course ID
- `module_id` (optional): Filter by module ID
- `status` (optional): Filter by status (draft, published, archived)
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 20, max: 100)

**Response:**
```json
{
  "quizzes": [...],
  "total": 30,
  "skip": 0,
  "limit": 20
}
```

#### 2. Get Quiz by ID
```http
GET /api/v1/quizzes/{quiz_id}
```

**Response:**
```json
{
  "quiz": {
    "quiz_id": "quiz_001",
    "title": "Python Basics Quiz",
    "description": "Test your Python knowledge",
    "course_id": "course_001",
    "module_id": "module_001",
    "quiz_type": "multiple_choice",
    "questions": [
      {
        "question_id": "q1",
        "question_text": "What is the capital of France?",
        "question_type": "multiple_choice",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "correct_answer": "Paris",
        "explanation": "Paris is the capital of France",
        "points": 1.0,
        "order": 0
      }
    ],
    "total_points": 10.0,
    "passing_score": 70.0,
    "time_limit_minutes": 30,
    "max_attempts": 3,
    "shuffle_questions": true,
    "shuffle_options": true,
    "is_required": false,
    "status": "published",
    "created_by": "teacher_did",
    "instructions": "Answer all questions correctly",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. Get Quizzes for Course
```http
GET /api/v1/quizzes/course/{course_id}
```

**Response:**
```json
{
  "quizzes": [...],
  "course": {
    "course_id": "course_001",
    "title": "Python Programming",
    "description": "Complete Python course"
  },
  "total_quizzes": 5
}
```

#### 4. Get All Quizzes Across All Courses
```http
GET /api/v1/quizzes/all/courses
```

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 50, max: 200)

**Response:**
```json
{
  "quizzes": [...],
  "total": 100,
  "skip": 0,
  "limit": 50
}
```

### Quiz Attempts

#### Start Quiz Attempt
```http
POST /api/v1/quizzes/{quiz_id}/attempt
```

**Response:**
```json
{
  "attempt_id": "attempt_001",
  "quiz_id": "quiz_001",
  "started_at": "2024-01-15T10:00:00Z",
  "status": "in_progress",
  "attempt_number": 1
}
```

#### Submit Quiz Attempt
```http
POST /api/v1/quizzes/{quiz_id}/attempt/{attempt_id}/submit
```

**Request Body:**
```json
{
  "answers": {
    "q1": "Paris",
    "q2": "True",
    "q3": "Python"
  },
  "time_spent_minutes": 25
}
```

**Response:**
```json
{
  "attempt_id": "attempt_001",
  "score": 8.5,
  "percentage": 85.0,
  "passed": true,
  "status": "submitted",
  "feedback": "Great job! You passed the quiz.",
  "submitted_at": "2024-01-15T10:25:00Z"
}
```

#### Get Quiz Attempts
```http
GET /api/v1/quizzes/{quiz_id}/attempts
```

**Query Parameters:**
- `user_id` (optional): Filter by user ID (admin only)

#### Get User's Quiz Attempts
```http
GET /api/v1/quizzes/my/attempts
```

**Query Parameters:**
- `course_id` (optional): Filter by course ID

### Management Endpoints

#### Create Quiz
```http
POST /api/v1/quizzes/
```

**Required Permissions:** `create_quiz`

#### Update Quiz
```http
PUT /api/v1/quizzes/{quiz_id}
```

**Required Permissions:** `update_quiz`

#### Publish Quiz
```http
POST /api/v1/quizzes/{quiz_id}/publish
```

**Required Permissions:** `publish_quiz`

## Role-Based Access Control

### Student Access
- Can only access published lessons, achievements, and quizzes
- Cannot see correct answers in quizzes
- Cannot see hidden achievements unless earned
- Cannot access management endpoints

### Teacher/Admin Access
- Can access all lessons, achievements, and quizzes regardless of status
- Can see correct answers in quizzes
- Can see hidden achievements
- Can access all management endpoints with appropriate permissions

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Testing

### Running Tests
```bash
# Run all API tests
python backend/test/run_api_tests.py

# Run individual test files
python -m pytest backend/test/test_lessons_api.py -v
python -m pytest backend/test/test_achievements_api.py -v
python -m pytest backend/test/test_quizzes_api.py -v

# Run comprehensive tests
python -m pytest backend/test/test_all_api_endpoints.py -v
```

### Test Coverage
The test suite covers:
- ✅ All CRUD operations
- ✅ Filtering and pagination
- ✅ Role-based access control
- ✅ Error handling
- ✅ Student vs teacher access differences
- ✅ Progress tracking
- ✅ Quiz attempts and scoring
- ✅ Achievement earning and showcasing

## Notes

1. **IPFS Integration**: Lessons can store content on IPFS using the `content_data` field
2. **NFT Integration**: Achievements can be minted as NFTs when `nft_enabled` is true
3. **Progress Tracking**: All progress is tracked per user and can be included in responses
4. **Shuffling**: Quiz questions and options can be shuffled for students
5. **Privacy**: Students cannot see correct answers or explanations in quizzes
6. **Pagination**: All list endpoints support pagination with skip/limit parameters
7. **Filtering**: Comprehensive filtering options for all endpoints
8. **Authentication**: JWT-based authentication required for all endpoints
9. **Permissions**: Fine-grained permission system for management operations
10. **Validation**: All input data is validated using Pydantic models
