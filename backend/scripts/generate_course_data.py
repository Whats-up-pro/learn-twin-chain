"""
Script to generate comprehensive course data using Gemini AI
"""
import os
import sys
import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import requests
from dotenv import load_dotenv

# Add the parent directory to sys.path to import from digital_twin
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from digital_twin.models.course import Course, Module, Lesson, CourseMetadata, ModuleContent, Assessment
from digital_twin.models.quiz_achievement import (
    Quiz, QuizQuestion, QuestionType, QuizType,
    Achievement, AchievementType, AchievementTier, AchievementCriteria
)
from scripts.real_youtube_database import find_real_youtube_videos
from scripts.youtube_api_service import search_youtube_videos

# Load environment variables from multiple possible locations
load_dotenv()  # Load from current directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))  # Load from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'config', 'deployment.env'))  # Load from backend/config/deployment.env

class CourseDataGenerator:
    """Generate course data using Gemini AI"""
    
    def __init__(self):
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb+srv://tranduongminhdai:mutoyugi@cluster0.f6gxr5y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
        self.mongodb_db_name = os.getenv('MONGODB_DB_NAME', 'learntwinchain')
        
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Configure Gemini
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        # MongoDB client
        self.db_client = None
        self.db = None
    
    async def init_database(self):
        """Initialize database connection"""
        self.db_client = AsyncIOMotorClient(self.mongodb_uri)
        self.db = self.db_client[self.mongodb_db_name]
        
        # Initialize Beanie
        await init_beanie(
            database=self.db,
            document_models=[Course, Module, Lesson, Quiz, Achievement]
        )
        print("✅ Database initialized successfully")
    
    def search_youtube_videos(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search for real YouTube videos using hybrid approach (curated + API)"""
        try:
            print(f"🔍 Searching for YouTube videos: {query}")
            
            # Method 1: Try curated database first (fastest, most reliable)
            curated_videos = find_real_youtube_videos(query, max_results)
            
            if curated_videos:
                print(f"📚 Found {len(curated_videos)} curated videos for: {query}")
                for video in curated_videos:
                    print(f"   - {video['title'][:50]}... ({video['channel']}) - {video['duration']}")
                return curated_videos
            
            # Method 2: Try YouTube API search (if API key available)
            print(f"🌐 No curated videos found, trying YouTube API search...")
            api_videos = search_youtube_videos(query, max_results)
            
            if api_videos:
                print(f"🎥 Found {len(api_videos)} videos via YouTube API for: {query}")
                for video in api_videos:
                    print(f"   - {video['title'][:50]}... ({video['channel']}) - {video['duration']}")
                return api_videos
            
            # Method 3: Fallback to safe real videos
            print(f"⚠️  No videos found via API, using fallback videos")
            fallback_videos = self._get_fallback_videos(query)
            return fallback_videos
            
        except Exception as e:
            print(f"❌ Error searching YouTube videos: {e}")
            return self._get_fallback_videos(query)
    
    def _get_fallback_videos(self, query: str) -> List[Dict[str, Any]]:
        """Get safe fallback videos based on query topic"""
        
        # High-quality fallback videos by topic
        fallback_database = {
            "python": [
                {
                    "title": f"Python {query} - Complete Tutorial",
                    "url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
                    "channel": "freeCodeCamp.org",
                    "duration": "4:26:52"
                },
                {
                    "title": f"Python {query} Tutorial",
                    "url": "https://www.youtube.com/watch?v=Y8Tko2YC5hA",
                    "channel": "Programming with Mosh",
                    "duration": "6:14:07"
                }
            ],
            "javascript": [
                {
                    "title": f"JavaScript {query} Course",
                    "url": "https://www.youtube.com/watch?v=PkZNo7MFNFg",
                    "channel": "freeCodeCamp.org",
                    "duration": "3:26:42"
                },
                {
                    "title": f"JavaScript {query} Tutorial",
                    "url": "https://www.youtube.com/watch?v=hdI2bqOjy3c",
                    "channel": "Traversy Media",
                    "duration": "1:42:35"
                }
            ],
            "react": [
                {
                    "title": f"React {query} Tutorial",
                    "url": "https://www.youtube.com/watch?v=bMknfKXIFA8",
                    "channel": "freeCodeCamp.org",
                    "duration": "11:55:27"
                }
            ],
            "machine_learning": [
                {
                    "title": f"Machine Learning {query} Course",
                    "url": "https://www.youtube.com/watch?v=NWONeJKn6kc",
                    "channel": "freeCodeCamp.org",
                    "duration": "2:50:23"
                }
            ],
            "blockchain": [
                {
                    "title": f"Blockchain {query} Tutorial",
                    "url": "https://www.youtube.com/watch?v=qOVAbKKSH10",
                    "channel": "edureka!",
                    "duration": "1:01:35"
                }
            ]
        }
        
        query_lower = query.lower()
        
        # Find appropriate fallback based on query content
        for topic, videos in fallback_database.items():
            if topic in query_lower:
                return videos[:1]  # Return first video for the topic
        
        # Default fallback - general programming
        return [
            {
                "title": f"{query} - Programming Tutorial",
                "url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
                "channel": "freeCodeCamp.org",
                "duration": "30:00"
            }
        ]
    
    async def generate_course_outline(self, course_topic: str, difficulty: str = "beginner") -> Dict[str, Any]:
        """Generate a comprehensive course outline using Gemini"""
        
        prompt = f"""
        Create a comprehensive course outline for "{course_topic}" at {difficulty} level.
        
        IMPORTANT: Respond ONLY with valid JSON, no additional text before or after.
        
        Required JSON structure:
        {{
            "course_info": {{
                "title": "Specific meaningful course title",
                "description": "Detailed course description", 
                "difficulty": "{difficulty}",
                "estimated_hours": 30,
                "learning_objectives": ["objective1", "objective2", "objective3"],
                "tags": ["tag1", "tag2", "tag3"]
            }},
            "modules": [
                {{
                    "title": "Specific meaningful module title",
                    "description": "Detailed module description",
                    "lessons": [
                        {{
                            "title": "Specific meaningful lesson title",
                            "description": "Detailed lesson description",
                            "duration": 30
                        }}
                    ],
                    "estimated_hours": 8
                }}
            ],
            "quiz_points": [1, 3, 5],
            "achievements": [
                {{
                    "title": "Achievement name",
                    "description": "Achievement description",
                    "type": "module_completion",
                    "tier": "bronze"
                }}
            ]
        }}
        
        Create 5-8 modules with 3-5 specific, practical lessons each. Use meaningful, descriptive titles and descriptions.
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            print(f"🤖 Gemini Response Length: {len(response_text)} characters")
            print(f"🤖 Gemini Response Preview: {response_text[:200]}...")
            
            # Try to parse the entire response as JSON first
            try:
                course_outline = json.loads(response_text)
                print(f"✅ Successfully parsed JSON directly")
                return course_outline
            except json.JSONDecodeError:
                print(f"⚠️ Direct JSON parse failed, trying to extract JSON...")
                
                # Try to extract JSON from the response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                
                if json_start != -1 and json_end != -1:
                    json_str = response_text[json_start:json_end]
                    print(f"🔍 Extracted JSON: {json_str[:100]}...")
                    course_outline = json.loads(json_str)
                    print(f"✅ Successfully parsed extracted JSON")
                    return course_outline
                else:
                    print(f"❌ No JSON structure found in response")
                    return self.create_fallback_course_outline(course_topic, difficulty)
                
        except Exception as e:
            print(f"❌ Error generating course outline: {e}")
            print(f"🔄 Falling back to predefined outline")
            return self.create_fallback_course_outline(course_topic, difficulty)
    
    def create_fallback_course_outline(self, course_topic: str, difficulty: str) -> Dict[str, Any]:
        """Create a fallback course outline if Gemini fails"""
        
        print(f"🔄 Creating fallback course outline for: {course_topic}")
        
        if "python" in course_topic.lower():
            return {
                "course_info": {
                    "title": "Python Programming Fundamentals",
                    "description": "Learn Python programming from scratch with hands-on exercises and real-world projects",
                    "difficulty": difficulty,
                    "estimated_hours": 40,
                    "learning_objectives": [
                        "Understand Python syntax and basic concepts",
                        "Master data types and variables",
                        "Learn control structures and functions",
                        "Work with data structures and file handling",
                        "Build real-world Python applications"
                    ],
                    "tags": ["python", "programming", "beginner", "fundamentals"]
                },
                "modules": [
                    {
                        "title": "Introduction to Python",
                        "description": "Get started with Python programming language",
                        "lessons": [
                            {"title": "What is Python?", "duration": 15},
                            {"title": "Setting up Python Environment", "duration": 20},
                            {"title": "Your First Python Program", "duration": 25}
                        ],
                        "estimated_hours": 6
                    },
                    {
                        "title": "Variables and Data Types",
                        "description": "Learn about variables, data types, and basic operations",
                        "lessons": [
                            {"title": "Variables in Python", "duration": 20},
                            {"title": "Numbers and Basic Operations", "duration": 25},
                            {"title": "Strings and String Methods", "duration": 30},
                            {"title": "Boolean and Type Conversion", "duration": 20}
                        ],
                        "estimated_hours": 8
                    },
                    {
                        "title": "Control Structures",
                        "description": "Learn about conditional statements and loops",
                        "lessons": [
                            {"title": "Conditional Statements", "duration": 25},
                            {"title": "For Loops", "duration": 30},
                            {"title": "While Loops", "duration": 25}
                        ],
                        "estimated_hours": 10
                    },
                    {
                        "title": "Functions and Modules",
                        "description": "Create reusable code with functions and modules",
                        "lessons": [
                            {"title": "Defining Functions", "duration": 30},
                            {"title": "Parameters and Arguments", "duration": 25},
                            {"title": "Return Values and Scope", "duration": 25},
                            {"title": "Modules and Packages", "duration": 30}
                        ],
                        "estimated_hours": 12
                    },
                    {
                        "title": "Object-Oriented Programming",
                        "description": "Learn classes, objects, and OOP principles",
                        "lessons": [
                            {"title": "Classes and Objects", "duration": 35},
                            {"title": "Inheritance and Polymorphism", "duration": 40},
                            {"title": "Encapsulation and Data Hiding", "duration": 30}
                        ],
                        "estimated_hours": 15
                    }
                ],
                "quiz_points": [1, 3, 5],  # After modules 1, 3, and 5
                "achievements": [
                    {
                        "title": "Python Rookie",
                        "description": "Complete your first Python module",
                        "type": "module_completion",
                        "tier": "bronze"
                    },
                    {
                        "title": "Code Master",
                        "description": "Complete all modules with 90% or higher",
                        "type": "course_completion", 
                        "tier": "gold"
                    },
                    {
                        "title": "Quiz Champion",
                        "description": "Score 100% on any quiz",
                        "type": "quiz_mastery",
                        "tier": "silver"
                    }
                ]
            }
        
        # Default course structure for other topics
        return {
            "course_info": {
                "title": f"{course_topic} Fundamentals",
                "description": f"Comprehensive course on {course_topic}",
                "difficulty": difficulty,
                "estimated_hours": 30,
                "learning_objectives": [
                    f"Understand {course_topic} fundamentals",
                    f"Apply {course_topic} concepts",
                    f"Build projects using {course_topic}"
                ],
                "tags": [course_topic.lower(), "fundamentals", difficulty]
            },
            "modules": [
                {
                    "title": f"Introduction to {course_topic}",
                    "description": f"Get started with {course_topic}",
                    "lessons": [
                        {"title": f"What is {course_topic}?", "duration": 20},
                        {"title": f"Setting up {course_topic}", "duration": 25},
                        {"title": f"Basic {course_topic} Concepts", "duration": 30}
                    ],
                    "estimated_hours": 8
                }
            ],
            "quiz_points": [1],
            "achievements": [
                {
                    "title": f"{course_topic} Beginner",
                    "description": f"Complete your first {course_topic} module",
                    "type": "module_completion",
                    "tier": "bronze"
                }
            ]
        }
    
    async def generate_quiz_questions(self, module_title: str, learning_objectives: List[str], num_questions: int = 10) -> List[Dict[str, Any]]:
        """Generate quiz questions for a module using Gemini"""
        
        prompt = f"""
        Create {num_questions} multiple-choice quiz questions for the module "{module_title}".
        
        Learning objectives:
        {chr(10).join(f"- {obj}" for obj in learning_objectives)}
        
        Requirements:
        - Mix of difficulty levels (easy, medium, hard)
        - Each question should have 4 options (A, B, C, D)
        - Include clear explanations for correct answers
        - Cover all learning objectives
        - Questions should be practical and test understanding, not just memorization
        
        Return as JSON array with this structure:
        [
            {{
                "question_text": "Question here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option B",
                "explanation": "Explanation of why this is correct",
                "difficulty": "easy|medium|hard",
                "points": 1.0
            }}
        ]
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                questions = json.loads(json_str)
                return questions
            else:
                return self.create_fallback_quiz_questions(module_title, num_questions)
                
        except Exception as e:
            print(f"Error generating quiz questions: {e}")
            return self.create_fallback_quiz_questions(module_title, num_questions)
    
    def create_fallback_quiz_questions(self, module_title: str, num_questions: int) -> List[Dict[str, Any]]:
        """Create fallback quiz questions"""
        questions = []
        
        for i in range(num_questions):
            questions.append({
                "question_text": f"Sample question {i+1} for {module_title}?",
                "options": [
                    f"Option A for question {i+1}",
                    f"Option B for question {i+1}",
                    f"Option C for question {i+1}",
                    f"Option D for question {i+1}"
                ],
                "correct_answer": f"Option A for question {i+1}",
                "explanation": f"This is the correct answer because it demonstrates understanding of {module_title} concepts.",
                "difficulty": "medium",
                "points": 1.0
            })
        
        return questions
    
    async def create_course_documents(self, course_outline: Dict[str, Any]) -> Dict[str, Any]:
        """Create MongoDB documents from course outline"""
        
        course_info = course_outline.get("course_info", {})
        modules_data = course_outline.get("modules", [])
        quiz_points = course_outline.get("quiz_points", [])
        achievements_data = course_outline.get("achievements", [])
        
        # Generate unique IDs
        course_id = f"course_{uuid.uuid4().hex[:8]}"
        
        # Create course metadata
        metadata = CourseMetadata(
            difficulty_level=course_info.get("difficulty", "beginner"),
            estimated_hours=course_info.get("estimated_hours", 30),
            learning_objectives=course_info.get("learning_objectives", []),
            tags=course_info.get("tags", [])
        )
        
        # Create course document
        course = Course(
            course_id=course_id,
            title=course_info.get("title", "Course Title"),
            description=course_info.get("description", "Course Description"),
            created_by="did:learntwin:ai_generator",
            institution="LearnTwinChain AI",
            metadata=metadata,
            status="published"
        )
        
        # Save course
        await course.insert()
        print(f"✅ Created course: {course.title}")
        
        # Create modules and lessons
        modules = []
        lessons = []
        quizzes = []
        
        for idx, module_data in enumerate(modules_data):
            module_id = f"{course_id}_module_{idx+1:02d}"
            
            # Create module (without embedded content)
            module = Module(
                module_id=module_id,
                course_id=course_id,
                title=module_data.get("title", f"Module {idx + 1}"),
                description=module_data.get("description", "Module description"),
                content=[],  # Empty content - lessons stored separately
                order=idx + 1,
                learning_objectives=course_info.get("learning_objectives", [])[:3],  # Use first 3 objectives
                estimated_duration=module_data.get("estimated_hours", 8) * 60,
                status="published"
            )
            
            await module.insert()
            modules.append(module)
            print(f"✅ Created module: {module.title}")
            
            # Create individual lessons for this module
            for lesson_idx, lesson in enumerate(module_data.get("lessons", [])):
                lesson_id = f"{module_id}_lesson_{lesson_idx+1:02d}"
                
                # Safely get lesson details
                lesson_title = lesson.get('title', f'Lesson {lesson_idx + 1}')
                lesson_description = lesson.get('description', f'Description for {lesson_title}')
                course_title = course_info.get('title', 'Course')
                
                # Search for YouTube video
                video_results = self.search_youtube_videos(f"{lesson_title} {course_title}")
                video_url = video_results[0]["url"] if video_results else None
                
                # Create lesson document
                lesson_doc = Lesson(
                    lesson_id=lesson_id,
                    module_id=module_id,
                    course_id=course_id,
                    title=lesson_title,
                    description=lesson_description,
                    content_type="video",
                    content_url=video_url,
                    content_cid=None,  # Can be added later for IPFS content
                    duration_minutes=lesson.get("duration", 30),
                    order=lesson_idx + 1,
                    learning_objectives=course_info.get("learning_objectives", [])[:2],  # Use first 2 objectives per lesson
                    keywords=course_info.get("tags", []),
                    status="published",
                    is_mandatory=True
                )
                
                await lesson_doc.insert()
                lessons.append(lesson_doc)
                print(f"✅ Created lesson: {lesson_doc.title}")
            
            # Create quiz for EVERY module (mandatory)
            quiz_id = f"{module_id}_quiz"
            
            # Generate quiz questions for each module
            questions_data = await self.generate_quiz_questions(
                module_data.get("title", f"Module {idx + 1}"),
                course_info.get("learning_objectives", [])[:3],
                8  # 8 questions per module quiz
            )
            
            # Create quiz questions
            quiz_questions = []
            total_points = 0
            
            for q_idx, q_data in enumerate(questions_data):
                question = QuizQuestion(
                    question_id=f"{quiz_id}_q_{q_idx+1}",
                    question_text=q_data.get("question_text", f"Question {q_idx + 1}"),
                    question_type=QuestionType.MULTIPLE_CHOICE,
                    options=q_data.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                    correct_answer=q_data.get("correct_answer", "Option A"),
                    explanation=q_data.get("explanation", "Explanation not available"),
                    points=q_data.get("points", 1.0),
                    order=q_idx + 1
                )
                quiz_questions.append(question)
                total_points += question.points
            
            # Create module quiz
            module_title = module_data.get('title', f'Module {idx + 1}')
            quiz = Quiz(
                quiz_id=quiz_id,
                title=f"{module_title} - Assessment",
                description=f"Test your knowledge of {module_title}",
                course_id=course_id,
                module_id=module_id,
                quiz_type=QuizType.MULTIPLE_CHOICE,
                questions=quiz_questions,
                total_points=total_points,
                passing_score=70.0,
                time_limit_minutes=30,
                status="published",
                is_required=True,
                created_by="did:learntwin:ai_generator"
            )
            
            await quiz.insert()
            quizzes.append(quiz)
            print(f"✅ Created module quiz: {quiz.title}")
        
        # Create achievements
        achievements = []
        for ach_data in achievements_data:
            # Skip if ach_data is not a dictionary
            if not isinstance(ach_data, dict):
                print(f"⚠️ Skipping invalid achievement data: {ach_data}")
                continue
                
            achievement_id = f"{course_id}_achievement_{uuid.uuid4().hex[:6]}"
            
            # Create achievement criteria based on type
            ach_type = ach_data.get("type", "general")
            if ach_type == "module_completion":
                criteria = AchievementCriteria(
                    type="module_completion",
                    target_value=1.0,
                    comparison="gte"
                )
            elif ach_type == "course_completion":
                criteria = AchievementCriteria(
                    type="course_completion_percentage",
                    target_value=90.0,
                    comparison="gte"
                )
            elif ach_type == "quiz_mastery":
                criteria = AchievementCriteria(
                    type="quiz_score_percentage",
                    target_value=100.0,
                    comparison="eq"
                )
            else:
                criteria = AchievementCriteria(
                    type="general",
                    target_value=1.0,
                    comparison="gte"
                )
            
            achievement = Achievement(
                achievement_id=achievement_id,
                title=ach_data.get("title", "Achievement"),
                description=ach_data.get("description", "Achievement description"),
                achievement_type=getattr(AchievementType, ach_data.get("type", "COURSE_COMPLETION").upper(), AchievementType.COURSE_COMPLETION),
                tier=getattr(AchievementTier, ach_data.get("tier", "BRONZE").upper(), AchievementTier.BRONZE),
                category="learning",
                criteria=criteria,
                course_id=course_id,
                points_reward=50 if ach_data.get("tier", "bronze") == "gold" else 30 if ach_data.get("tier", "bronze") == "silver" else 10,
                created_by="did:learntwin:ai_generator",
                status="active"
            )
            
            await achievement.insert()
            achievements.append(achievement)
            print(f"✅ Created achievement: {achievement.title}")
        
        # Create FINAL TEST for the course (comprehensive exam)
        final_test_id = f"{course_id}_final_test"
        course_title = course_info.get("title", "Course")
        
        # Generate comprehensive final test questions
        final_questions_data = await self.generate_quiz_questions(
            f"Final Test - {course_title}",
            course_info.get("learning_objectives", []),
            15  # 15 questions for final test
        )
        
        # Create final test questions
        final_quiz_questions = []
        final_total_points = 0
        
        for q_idx, q_data in enumerate(final_questions_data):
            question = QuizQuestion(
                question_id=f"{final_test_id}_q_{q_idx+1}",
                question_text=q_data.get("question_text", f"Final Question {q_idx + 1}"),
                question_type=QuestionType.MULTIPLE_CHOICE,
                options=q_data.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                correct_answer=q_data.get("correct_answer", "Option A"),
                explanation=q_data.get("explanation", "Explanation not available"),
                points=q_data.get("points", 2.0),  # Higher points for final test
                order=q_idx + 1
            )
            final_quiz_questions.append(question)
            final_total_points += question.points
        
        # Create final test
        final_test = Quiz(
            quiz_id=final_test_id,
            title=f"{course_title} - Final Examination",
            description=f"Comprehensive final test covering all topics in {course_title}",
            course_id=course_id,
            module_id=None,  # Course-level quiz, not module-specific
            quiz_type=QuizType.MULTIPLE_CHOICE,
            questions=final_quiz_questions,
            total_points=final_total_points,
            passing_score=75.0,  # Higher passing score for final test
            time_limit_minutes=60,  # Longer time for final test
            status="published",
            is_required=True,
            created_by="did:learntwin:ai_generator"
        )
        
        await final_test.insert()
        quizzes.append(final_test)
        print(f"✅ Created final test: {final_test.title}")
        
        # Check if we have at least 10 quizzes, if not create additional quizzes
        total_quizzes = len(quizzes)
        if total_quizzes < 10:
            additional_needed = 10 - total_quizzes
            print(f"🔄 Creating {additional_needed} additional quizzes to meet minimum requirement...")
            
            for i in range(additional_needed):
                bonus_quiz_id = f"{course_id}_bonus_quiz_{i+1}"
                
                # Generate bonus quiz questions
                bonus_questions_data = await self.generate_quiz_questions(
                    f"Bonus Quiz {i+1} - {course_title}",
                    course_info.get("learning_objectives", []),
                    6  # 6 questions for bonus quizzes
                )
                
                # Create bonus quiz questions
                bonus_quiz_questions = []
                bonus_total_points = 0
                
                for q_idx, q_data in enumerate(bonus_questions_data):
                    question = QuizQuestion(
                        question_id=f"{bonus_quiz_id}_q_{q_idx+1}",
                        question_text=q_data.get("question_text", f"Bonus Question {q_idx + 1}"),
                        question_type=QuestionType.MULTIPLE_CHOICE,
                        options=q_data.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                        correct_answer=q_data.get("correct_answer", "Option A"),
                        explanation=q_data.get("explanation", "Explanation not available"),
                        points=q_data.get("points", 1.0),
                        order=q_idx + 1
                    )
                    bonus_quiz_questions.append(question)
                    bonus_total_points += question.points
                
                # Create bonus quiz
                bonus_quiz = Quiz(
                    quiz_id=bonus_quiz_id,
                    title=f"{course_title} - Bonus Quiz {i+1}",
                    description=f"Additional practice quiz for {course_title}",
                    course_id=course_id,
                    module_id=None,  # Course-level bonus quiz
                    quiz_type=QuizType.MULTIPLE_CHOICE,
                    questions=bonus_quiz_questions,
                    total_points=bonus_total_points,
                    passing_score=70.0,
                    time_limit_minutes=25,
                    status="published",
                    is_required=False,  # Bonus quizzes are optional
                    created_by="did:learntwin:ai_generator"
                )
                
                await bonus_quiz.insert()
                quizzes.append(bonus_quiz)
                print(f"✅ Created bonus quiz: {bonus_quiz.title}")
        
        print(f"📊 Total quizzes created for {course_title}: {len(quizzes)}")
        
        return {
            "course": course,
            "modules": modules,
            "lessons": lessons,
            "quizzes": quizzes,
            "achievements": achievements
        }
    
    async def generate_multiple_courses(self, course_topics: List[str], difficulty: str = "beginner") -> List[Dict[str, Any]]:
        """Generate multiple courses"""
        generated_courses = []
        
        for topic in course_topics:
            print(f"\n🚀 Generating course: {topic}")
            
            # Generate course outline
            course_outline = await self.generate_course_outline(topic, difficulty)
            
            # Create course documents
            course_docs = await self.create_course_documents(course_outline)
            
            generated_courses.append({
                "topic": topic,
                "course_data": course_docs
            })
            
            print(f"✅ Completed course generation for: {topic}")
        
        return generated_courses
    
    async def close_database(self):
        """Close database connection"""
        if self.db_client:
            self.db_client.close()

async def main():
    """Main function to run the course data generator"""
    
    # Course topics to generate
    course_topics = [
        "Python Programming Fundamentals",
        "JavaScript Web Development",
        "Data Science with Python", 
        "Machine Learning Basics",
        "Blockchain Development",
        "React Frontend Development"
    ]
    
    generator = CourseDataGenerator()
    
    try:
        # Initialize database
        await generator.init_database()
        
        # Generate courses
        print("🎯 Starting course data generation...")
        generated_courses = await generator.generate_multiple_courses(course_topics, "beginner")
        
        # Summary
        print(f"\n🎉 Successfully generated {len(generated_courses)} courses!")
        for course_info in generated_courses:
            course = course_info["course_data"]["course"]
            modules_count = len(course_info["course_data"]["modules"])
            lessons_count = len(course_info["course_data"]["lessons"])
            quizzes_count = len(course_info["course_data"]["quizzes"])
            achievements_count = len(course_info["course_data"]["achievements"])
            
            print(f"📚 {course.title}:")
            print(f"   - {modules_count} modules")
            print(f"   - {lessons_count} lessons")
            print(f"   - {quizzes_count} quizzes")
            print(f"   - {achievements_count} achievements")
        
    except Exception as e:
        print(f"❌ Error during generation: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await generator.close_database()

if __name__ == "__main__":
    asyncio.run(main())
