#!/usr/bin/env python3
"""
Script to update null values in courses collection and add thumbnail_url field
"""
import os
import sys
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import random
from dotenv import load_dotenv

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, '.env'))

from motor.motor_asyncio import AsyncIOMotorClient
from digital_twin.models.course import Course, CourseMetadata

class CourseDataUpdater:
    def __init__(self):
        self.mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/learntwinchain")
        self.database_name = os.getenv("MONGODB_DB_NAME", "learntwinchain")
        self.client = None
        self.db = None
        
        # Thumbnail URLs based on course content
        self.thumbnail_urls = {
            "python": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=300&fit=crop",
            "javascript": "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop",
            "java": "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
            "blockchain": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
            "web": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
            "mobile": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop",
            "data": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
            "ai": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
            "machine": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
            "deep": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
            "cybersecurity": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop",
            "network": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop",
            "database": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=300&fit=crop",
            "sql": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=300&fit=crop",
            "react": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop",
            "vue": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop",
            "angular": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop",
            "node": "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop",
            "docker": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=300&fit=crop",
            "kubernetes": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=300&fit=crop",
            "aws": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop",
            "azure": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop",
            "google": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop",
            "cloud": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop",
            "devops": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=300&fit=crop",
            "git": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=300&fit=crop",
            "linux": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=300&fit=crop",
            "algorithm": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
            "structure": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
            "math": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
            "statistics": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
            "default": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
        }
        
        # Sample data for different fields
        self.sample_instructors = [
            "did:learntwin:instructor_001",
            "did:learntwin:instructor_002", 
            "did:learntwin:instructor_003",
            "did:learntwin:instructor_004",
            "did:learntwin:instructor_005"
        ]
        
        self.sample_institutions = [
            "LearnTwinChain AI",
            "Tech Academy",
            "Digital Learning Institute",
            "Blockchain Education Center",
            "AI Learning Platform"
        ]

    async def connect_to_mongodb(self):
        """Connect to MongoDB"""
        try:
            print(f"🔌 Connecting to MongoDB at {self.mongodb_uri}")
            self.client = AsyncIOMotorClient(self.mongodb_uri)
            self.db = self.client[self.database_name]
            
            # Test connection
            await self.client.admin.command('ping')
            print("✅ Successfully connected to MongoDB")
            
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            raise e

    def get_thumbnail_url(self, title: str, description: str) -> str:
        """Get appropriate thumbnail URL based on course content"""
        text = (title + " " + description).lower()
        
        for keyword, url in self.thumbnail_urls.items():
            if keyword in text:
                return url
        
        return self.thumbnail_urls["default"]

    def generate_realistic_metadata(self, title: str, description: str) -> Dict[str, Any]:
        """Generate realistic metadata based on course content"""
        text = (title + " " + description).lower()
        
        # Determine difficulty level
        if any(word in text for word in ["beginner", "basic", "fundamental", "introduction"]):
            difficulty = "beginner"
        elif any(word in text for word in ["advanced", "expert", "master", "professional"]):
            difficulty = "advanced"
        else:
            difficulty = "intermediate"
        
        # Estimate hours based on content
        if "fundamental" in text or "basic" in text:
            hours = random.randint(8, 20)
        elif "advanced" in text or "master" in text:
            hours = random.randint(30, 60)
        else:
            hours = random.randint(15, 35)
        
        # Generate skills and tags
        skills = []
        tags = []
        
        if "python" in text:
            skills.extend(["Python Programming", "Object-Oriented Programming"])
            tags.extend(["python", "programming", "coding"])
        if "javascript" in text:
            skills.extend(["JavaScript", "Web Development"])
            tags.extend(["javascript", "web", "frontend"])
        if "blockchain" in text:
            skills.extend(["Blockchain Technology", "Smart Contracts"])
            tags.extend(["blockchain", "cryptocurrency", "web3"])
        if "ai" in text or "machine" in text:
            skills.extend(["Artificial Intelligence", "Machine Learning"])
            tags.extend(["ai", "machine-learning", "data-science"])
        if "web" in text:
            skills.extend(["Web Development", "HTML/CSS"])
            tags.extend(["web-development", "frontend", "backend"])
        if "data" in text:
            skills.extend(["Data Analysis", "Statistics"])
            tags.extend(["data-analysis", "statistics", "analytics"])
        
        # Add generic skills if none found
        if not skills:
            skills = ["Problem Solving", "Critical Thinking"]
            tags = ["education", "learning"]
        
        return {
            "difficulty_level": difficulty,
            "estimated_hours": hours,
            "prerequisites": [],
            "learning_objectives": [
                f"Master {skills[0] if skills else 'the subject'}",
                "Apply knowledge in practical projects",
                "Develop problem-solving skills"
            ],
            "skills_taught": skills,
            "tags": tags,
            "language": "en"
        }

    def generate_realistic_dates(self) -> Dict[str, datetime]:
        """Generate realistic course dates"""
        now = datetime.now(timezone.utc)
        
        # Course dates
        course_start = now + timedelta(days=random.randint(7, 30))
        course_end = course_start + timedelta(days=random.randint(30, 90))
        
        # Enrollment dates
        enrollment_start = now - timedelta(days=random.randint(1, 7))
        enrollment_end = course_start - timedelta(days=random.randint(1, 3))
        
        return {
            "enrollment_start": enrollment_start,
            "enrollment_end": enrollment_end,
            "course_start": course_start,
            "course_end": course_end,
            "published_at": now - timedelta(days=random.randint(1, 14))
        }

    async def update_course(self, course_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Update a single course document"""
        course_id = course_doc.get("course_id")
        title = course_doc.get("title", "")
        description = course_doc.get("description", "")
        
        print(f"📝 Updating course: {title}")
        
        # Generate realistic data
        dates = self.generate_realistic_dates()
        metadata = self.generate_realistic_metadata(title, description)
        thumbnail_url = self.get_thumbnail_url(title, description)
        
        # Prepare update data
        update_data = {
            "$set": {
                "thumbnail_url": thumbnail_url,
                "instructors": random.sample(self.sample_instructors, random.randint(1, 2)),
                "institution": random.choice(self.sample_institutions),
                "published_at": dates["published_at"],
                "enrollment_start": dates["enrollment_start"],
                "enrollment_end": dates["enrollment_end"],
                "course_start": dates["course_start"],
                "course_end": dates["course_end"],
                "max_enrollments": random.randint(50, 200),
                "metadata": metadata,
                "updated_at": datetime.now(timezone.utc)
            }
        }
        
        # Keep existing values for fields that shouldn't be changed
        if course_doc.get("nft_contract_address") is not None:
            update_data["$set"]["nft_contract_address"] = course_doc["nft_contract_address"]
        
        if course_doc.get("syllabus_cid") is not None:
            update_data["$set"]["syllabus_cid"] = course_doc["syllabus_cid"]
            
        if course_doc.get("content_cid") is not None:
            update_data["$set"]["content_cid"] = course_doc["content_cid"]
        
        return update_data

    async def update_all_courses(self):
        """Update all courses in the collection"""
        try:
            collection = self.db.courses
            
            # Get all courses
            cursor = collection.find({})
            courses = await cursor.to_list(length=None)
            
            print(f"📊 Found {len(courses)} courses to update")
            
            updated_count = 0
            skipped_count = 0
            
            for course in courses:
                try:
                    # Check if course needs updating (has null values)
                    needs_update = (
                        course.get("instructors") is None or 
                        course.get("institution") is None or
                        course.get("published_at") is None or
                        course.get("enrollment_start") is None or
                        course.get("enrollment_end") is None or
                        course.get("course_start") is None or
                        course.get("course_end") is None or
                        course.get("max_enrollments") is None or
                        course.get("metadata") is None or
                        "thumbnail_url" not in course
                    )
                    
                    if needs_update:
                        update_data = await self.update_course(course)
                        
                        # Update the course
                        result = await collection.update_one(
                            {"_id": course["_id"]},
                            update_data
                        )
                        
                        if result.modified_count > 0:
                            updated_count += 1
                            print(f"✅ Updated course: {course.get('title', 'Unknown')}")
                        else:
                            print(f"⚠️ No changes made to course: {course.get('title', 'Unknown')}")
                    else:
                        skipped_count += 1
                        print(f"⏭️ Skipped course (already complete): {course.get('title', 'Unknown')}")
                        
                except Exception as e:
                    print(f"❌ Error updating course {course.get('title', 'Unknown')}: {e}")
                    continue
            
            print(f"\n📈 Update Summary:")
            print(f"   ✅ Updated: {updated_count} courses")
            print(f"   ⏭️ Skipped: {skipped_count} courses")
            print(f"   📊 Total processed: {len(courses)} courses")
            
        except Exception as e:
            print(f"❌ Error updating courses: {e}")
            raise e

    async def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("🔌 MongoDB connection closed")

async def main():
    """Main function"""
    updater = CourseDataUpdater()
    
    try:
        # Connect to MongoDB
        await updater.connect_to_mongodb()
        
        # Update all courses
        await updater.update_all_courses()
        
        print("\n🎉 Course data update completed successfully!")
        
    except Exception as e:
        print(f"❌ Error in main execution: {e}")
        raise e
    
    finally:
        # Close connection
        await updater.close_connection()

if __name__ == "__main__":
    print("🚀 Starting Course Data Update Script")
    print("=" * 50)
    
    # Run the script
    asyncio.run(main())
    
    print("\n✨ Script execution completed!")
