"""
Script to find and delete generic/fallback records from MongoDB
These are records with generic titles like "Lesson 1", "Module 1", etc.
"""
import os
import sys
import asyncio
import re
from typing import List, Dict, Any
from dotenv import load_dotenv

# Add the parent directory to sys.path to import from digital_twin
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from digital_twin.models.course import Course, Module, Lesson
from digital_twin.models.quiz_achievement import Quiz, Achievement

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class GenericRecordCleaner:
    """Clean up generic/fallback records from MongoDB"""
    
    def __init__(self):
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb+srv://tranduongminhdai:mutoyugi@cluster0.f6gxr5y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
        self.mongodb_db_name = os.getenv('MONGODB_DB_NAME', 'learntwinchain')
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
        print("✅ Database connected successfully")
    
    def is_generic_lesson(self, lesson: Lesson) -> bool:
        """Check if lesson has generic title/description"""
        generic_patterns = [
            r'^Lesson \d+$',  # "Lesson 1", "Lesson 2", etc.
            r'^Description for Lesson \d+$',  # "Description for Lesson 1", etc.
        ]
        
        title_generic = any(re.match(pattern, lesson.title) for pattern in generic_patterns[:1])
        desc_generic = any(re.match(pattern, lesson.description) for pattern in generic_patterns[1:])
        
        return title_generic or desc_generic
    
    def is_generic_module(self, module: Module) -> bool:
        """Check if module has generic title/description"""
        generic_patterns = [
            r'^Module \d+$',  # "Module 1", "Module 2", etc.
            r'^Module description$',  # "Module description"
        ]
        
        title_generic = re.match(generic_patterns[0], module.title)
        desc_generic = module.description == "Module description"
        
        return title_generic or desc_generic
    
    def is_generic_quiz(self, quiz: Quiz) -> bool:
        """Check if quiz has generic title/description"""
        generic_patterns = [
            r'^Module \d+ - Assessment$',  # "Module 1 - Assessment"
            r'^Test your knowledge of Module \d+$',  # "Test your knowledge of Module 1"
        ]
        
        title_generic = any(re.match(pattern, quiz.title) for pattern in generic_patterns[:1])
        desc_generic = any(re.match(pattern, quiz.description) for pattern in generic_patterns[1:])
        
        return title_generic or desc_generic
    
    async def find_generic_records(self) -> Dict[str, List]:
        """Find all generic records in the database"""
        print("🔍 Scanning for generic records...")
        
        generic_records = {
            "lessons": [],
            "modules": [],
            "quizzes": [],
            "courses": []
        }
        
        # Find generic lessons
        lessons = await Lesson.find_all().to_list()
        for lesson in lessons:
            if self.is_generic_lesson(lesson):
                generic_records["lessons"].append(lesson)
        
        # Find generic modules
        modules = await Module.find_all().to_list()
        for module in modules:
            if self.is_generic_module(module):
                generic_records["modules"].append(module)
        
        # Find generic quizzes
        quizzes = await Quiz.find_all().to_list()
        for quiz in quizzes:
            if self.is_generic_quiz(quiz):
                generic_records["quizzes"].append(quiz)
        
        # Find courses with few or no real content
        courses = await Course.find_all().to_list()
        for course in courses:
            # Check if course has mostly generic content
            course_modules = await Module.find(Module.course_id == course.course_id).to_list()
            course_lessons = await Lesson.find(Lesson.course_id == course.course_id).to_list()
            
            generic_modules_count = sum(1 for m in course_modules if self.is_generic_module(m))
            generic_lessons_count = sum(1 for l in course_lessons if self.is_generic_lesson(l))
            
            total_modules = len(course_modules)
            total_lessons = len(course_lessons)
            
            # If more than 80% of content is generic, mark course for cleanup
            if total_modules > 0 and total_lessons > 0:
                generic_ratio = (generic_modules_count + generic_lessons_count) / (total_modules + total_lessons)
                if generic_ratio > 0.8:
                    generic_records["courses"].append(course)
        
        return generic_records
    
    async def display_generic_records(self, generic_records: Dict[str, List]):
        """Display found generic records"""
        print("\n📊 Generic Records Found:")
        print("=" * 50)
        
        for record_type, records in generic_records.items():
            print(f"\n{record_type.upper()}: {len(records)} records")
            for i, record in enumerate(records[:5], 1):  # Show first 5 examples
                if record_type == "lessons":
                    print(f"  {i}. Lesson: '{record.title}' - '{record.description}'")
                elif record_type == "modules":
                    print(f"  {i}. Module: '{record.title}' - '{record.description}'")
                elif record_type == "quizzes":
                    print(f"  {i}. Quiz: '{record.title}' - '{record.description}'")
                elif record_type == "courses":
                    print(f"  {i}. Course: '{record.title}' - Course ID: {record.course_id}")
            
            if len(records) > 5:
                print(f"  ... and {len(records) - 5} more")
    
    async def delete_generic_records(self, generic_records: Dict[str, List], confirm: bool = False):
        """Delete generic records from database"""
        if not confirm:
            print("\n⚠️  This will DELETE the above records from the database!")
            response = input("Are you sure you want to continue? (yes/no): ").lower().strip()
            if response != 'yes':
                print("❌ Operation cancelled")
                return
        
        print("\n🗑️  Deleting generic records...")
        deleted_counts = {}
        
        # Delete lessons
        lesson_count = 0
        for lesson in generic_records["lessons"]:
            await lesson.delete()
            lesson_count += 1
        deleted_counts["lessons"] = lesson_count
        
        # Delete modules
        module_count = 0
        for module in generic_records["modules"]:
            await module.delete()
            module_count += 1
        deleted_counts["modules"] = module_count
        
        # Delete quizzes
        quiz_count = 0
        for quiz in generic_records["quizzes"]:
            await quiz.delete()
            quiz_count += 1
        deleted_counts["quizzes"] = quiz_count
        
        # Delete courses and all related content
        course_count = 0
        for course in generic_records["courses"]:
            # Delete all related lessons
            course_lessons = await Lesson.find(Lesson.course_id == course.course_id).to_list()
            for lesson in course_lessons:
                await lesson.delete()
            
            # Delete all related modules
            course_modules = await Module.find(Module.course_id == course.course_id).to_list()
            for module in course_modules:
                await module.delete()
            
            # Delete all related quizzes
            course_quizzes = await Quiz.find(Quiz.course_id == course.course_id).to_list()
            for quiz in course_quizzes:
                await quiz.delete()
            
            # Delete all related achievements
            course_achievements = await Achievement.find(Achievement.course_id == course.course_id).to_list()
            for achievement in course_achievements:
                await achievement.delete()
            
            # Delete the course itself
            await course.delete()
            course_count += 1
        
        deleted_counts["courses"] = course_count
        
        print("\n✅ Deletion completed:")
        for record_type, count in deleted_counts.items():
            print(f"  - {record_type}: {count} deleted")
    
    async def close_database(self):
        """Close database connection"""
        if self.db_client:
            self.db_client.close()

async def main():
    """Main function"""
    cleaner = GenericRecordCleaner()
    
    try:
        # Initialize database
        await cleaner.init_database()
        
        # Find generic records
        generic_records = await cleaner.find_generic_records()
        
        # Display results
        await cleaner.display_generic_records(generic_records)
        
        # Check if any records found
        total_records = sum(len(records) for records in generic_records.values())
        if total_records == 0:
            print("\n🎉 No generic records found! Database is clean.")
        else:
            print(f"\n📊 Total generic records found: {total_records}")
            
            # Ask user if they want to delete
            await cleaner.delete_generic_records(generic_records)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await cleaner.close_database()

if __name__ == "__main__":
    print("🧹 Generic Record Cleaner")
    print("=" * 30)
    asyncio.run(main())
