"""
Script to export course data from MongoDB to JSON files
Creates organized folder structure with courses, modules, lessons, quizzes, achievements
"""
import os
import sys
import asyncio
import json
from datetime import datetime
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
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'config', 'deployment.env'))

class DataExporter:
    """Export MongoDB data to JSON files"""
    
    def __init__(self):
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb+srv://tranduongminhdai:mutoyugi@cluster0.f6gxr5y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
        self.mongodb_db_name = os.getenv('MONGODB_DB_NAME', 'learntwinchain')
        self.db_client = None
        self.db = None
        
        # Create output directories
        self.base_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        self.directories = {
            'courses': os.path.join(self.base_dir, 'courses'),
            'modules': os.path.join(self.base_dir, 'modules'),
            'lessons': os.path.join(self.base_dir, 'lessons'),
            'quizzes': os.path.join(self.base_dir, 'quizzes'),
            'achievements': os.path.join(self.base_dir, 'achievements')
        }
        
        # Create directories if they don't exist
        for dir_path in self.directories.values():
            os.makedirs(dir_path, exist_ok=True)
    
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
    
    def serialize_document(self, doc) -> Dict[str, Any]:
        """Convert Beanie document to JSON-serializable dict"""
        doc_dict = doc.dict()
        
        # Convert datetime objects to ISO strings
        for key, value in doc_dict.items():
            if isinstance(value, datetime):
                doc_dict[key] = value.isoformat()
        
        return doc_dict
    
    async def export_courses(self) -> List[Dict[str, Any]]:
        """Export all courses to JSON files"""
        print("📚 Exporting courses...")
        courses = await Course.find_all().to_list()
        
        courses_data = []
        for course in courses:
            course_data = self.serialize_document(course)
            courses_data.append(course_data)
            
            # Save individual course file
            filename = f"course_{course.course_id}.json"
            filepath = os.path.join(self.directories['courses'], filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(course_data, f, indent=2, ensure_ascii=False)
        
        # Save all courses index
        index_path = os.path.join(self.directories['courses'], 'courses_index.json')
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(courses_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(courses)} courses")
        return courses_data
    
    async def export_modules(self) -> List[Dict[str, Any]]:
        """Export all modules to JSON files"""
        print("📖 Exporting modules...")
        modules = await Module.find_all().to_list()
        
        modules_data = []
        for module in modules:
            module_data = self.serialize_document(module)
            modules_data.append(module_data)
            
            # Save individual module file
            filename = f"module_{module.module_id}.json"
            filepath = os.path.join(self.directories['modules'], filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(module_data, f, indent=2, ensure_ascii=False)
        
        # Save all modules index
        index_path = os.path.join(self.directories['modules'], 'modules_index.json')
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(modules_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(modules)} modules")
        return modules_data
    
    async def export_lessons(self) -> List[Dict[str, Any]]:
        """Export all lessons to JSON files"""
        print("📝 Exporting lessons...")
        lessons = await Lesson.find_all().to_list()
        
        lessons_data = []
        for lesson in lessons:
            lesson_data = self.serialize_document(lesson)
            lessons_data.append(lesson_data)
            
            # Save individual lesson file
            filename = f"lesson_{lesson.lesson_id}.json"
            filepath = os.path.join(self.directories['lessons'], filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(lesson_data, f, indent=2, ensure_ascii=False)
        
        # Save all lessons index
        index_path = os.path.join(self.directories['lessons'], 'lessons_index.json')
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(lessons_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(lessons)} lessons")
        return lessons_data
    
    async def export_quizzes(self) -> List[Dict[str, Any]]:
        """Export all quizzes to JSON files"""
        print("❓ Exporting quizzes...")
        quizzes = await Quiz.find_all().to_list()
        
        quizzes_data = []
        for quiz in quizzes:
            quiz_data = self.serialize_document(quiz)
            quizzes_data.append(quiz_data)
            
            # Save individual quiz file
            filename = f"quiz_{quiz.quiz_id}.json"
            filepath = os.path.join(self.directories['quizzes'], filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(quiz_data, f, indent=2, ensure_ascii=False)
        
        # Save all quizzes index
        index_path = os.path.join(self.directories['quizzes'], 'quizzes_index.json')
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(quizzes_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(quizzes)} quizzes")
        return quizzes_data
    
    async def export_achievements(self) -> List[Dict[str, Any]]:
        """Export all achievements to JSON files"""
        print("🏆 Exporting achievements...")
        achievements = await Achievement.find_all().to_list()
        
        achievements_data = []
        for achievement in achievements:
            achievement_data = self.serialize_document(achievement)
            achievements_data.append(achievement_data)
            
            # Save individual achievement file
            filename = f"achievement_{achievement.achievement_id}.json"
            filepath = os.path.join(self.directories['achievements'], filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(achievement_data, f, indent=2, ensure_ascii=False)
        
        # Save all achievements index
        index_path = os.path.join(self.directories['achievements'], 'achievements_index.json')
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(achievements_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exported {len(achievements)} achievements")
        return achievements_data
    
    async def export_all(self):
        """Export all data to JSON files"""
        print("🚀 Starting data export...")
        print(f"📁 Output directory: {self.base_dir}")
        
        # Export all collections
        courses_data = await self.export_courses()
        modules_data = await self.export_modules()
        lessons_data = await self.export_lessons()
        quizzes_data = await self.export_quizzes()
        achievements_data = await self.export_achievements()
        
        # Create summary file
        summary = {
            "export_timestamp": datetime.now().isoformat(),
            "total_records": {
                "courses": len(courses_data),
                "modules": len(modules_data),
                "lessons": len(lessons_data),
                "quizzes": len(quizzes_data),
                "achievements": len(achievements_data)
            },
            "directories": self.directories
        }
        
        summary_path = os.path.join(self.base_dir, 'export_summary.json')
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print("\n📊 Export Summary:")
        print("=" * 30)
        for collection, count in summary["total_records"].items():
            print(f"{collection.capitalize()}: {count} records")
        
        print(f"\n✅ Export completed! Files saved to: {self.base_dir}")
    
    async def close_database(self):
        """Close database connection"""
        if self.db_client:
            self.db_client.close()

async def main():
    """Main function"""
    exporter = DataExporter()
    
    try:
        # Initialize database
        await exporter.init_database()
        
        # Export all data
        await exporter.export_all()
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await exporter.close_database()

if __name__ == "__main__":
    print("📦 Course Data Exporter")
    print("=" * 25)
    asyncio.run(main())

