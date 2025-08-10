"""
Simple script to find and delete generic records
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    # Connect to MongoDB
    uri = "mongodb+srv://tranduongminhdai:mutoyugi@cluster0.f6gxr5y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    client = AsyncIOMotorClient(uri)
    db = client["learntwinchain"]
    
    print("🔍 Checking database collections...")
    
    # Check collections
    collections = await db.list_collection_names()
    print(f"Available collections: {collections}")
    
    # Count documents in each collection
    for collection_name in ["courses", "modules", "lessons", "quizzes", "achievements"]:
        if collection_name in collections:
            count = await db[collection_name].count_documents({})
            print(f"{collection_name}: {count} documents")
            
            # Show sample documents
            if count > 0:
                sample = await db[collection_name].find().limit(1).to_list(1)
                if sample:
                    doc = sample[0]
                    title = doc.get("title", "No title")
                    description = doc.get("description", "No description")
                    print(f"  Sample: '{title}' - '{description}'")
    
    # Find generic lessons
    print("\n🔍 Looking for generic lessons...")
    generic_lessons = await db.lessons.find({
        "$or": [
            {"title": {"$regex": "^Lesson \\d+$"}},
            {"description": {"$regex": "^Description for Lesson \\d+$"}}
        ]
    }).to_list(100)
    
    print(f"Found {len(generic_lessons)} generic lessons")
    for lesson in generic_lessons[:5]:  # Show first 5
        print(f"  - '{lesson.get('title')}' - '{lesson.get('description')}'")
    
    # Find generic modules
    print("\n🔍 Looking for generic modules...")
    generic_modules = await db.modules.find({
        "$or": [
            {"title": {"$regex": "^Module \\d+$"}},
            {"description": "Module description"}
        ]
    }).to_list(100)
    
    print(f"Found {len(generic_modules)} generic modules")
    for module in generic_modules[:5]:  # Show first 5
        print(f"  - '{module.get('title')}' - '{module.get('description')}'")
    
    # Find generic quizzes
    print("\n🔍 Looking for generic quizzes...")
    generic_quizzes = await db.quizzes.find({
        "$or": [
            {"title": {"$regex": "^Module \\d+ - Assessment$"}},
            {"description": {"$regex": "^Test your knowledge of Module \\d+$"}}
        ]
    }).to_list(100)
    
    print(f"Found {len(generic_quizzes)} generic quizzes")
    for quiz in generic_quizzes[:5]:  # Show first 5
        print(f"  - '{quiz.get('title')}' - '{quiz.get('description')}'")
    
    # Ask if user wants to delete
    total_generic = len(generic_lessons) + len(generic_modules) + len(generic_quizzes)
    print(f"\n📊 Total generic records: {total_generic}")
    
    if total_generic > 0:
        response = input("\nDo you want to delete these generic records? (yes/no): ").lower().strip()
        if response == 'yes':
            print("🗑️  Deleting generic records...")
            
            # Delete generic lessons
            if generic_lessons:
                lesson_ids = [lesson["_id"] for lesson in generic_lessons]
                result = await db.lessons.delete_many({"_id": {"$in": lesson_ids}})
                print(f"✅ Deleted {result.deleted_count} generic lessons")
            
            # Delete generic modules
            if generic_modules:
                module_ids = [module["_id"] for module in generic_modules]
                result = await db.modules.delete_many({"_id": {"$in": module_ids}})
                print(f"✅ Deleted {result.deleted_count} generic modules")
            
            # Delete generic quizzes
            if generic_quizzes:
                quiz_ids = [quiz["_id"] for quiz in generic_quizzes]
                result = await db.quizzes.delete_many({"_id": {"$in": quiz_ids}})
                print(f"✅ Deleted {result.deleted_count} generic quizzes")
            
            print("🎉 Cleanup completed!")
        else:
            print("❌ Cleanup cancelled")
    else:
        print("🎉 No generic records found! Database is clean.")
    
    client.close()

if __name__ == "__main__":
    print("🧹 Simple Generic Record Cleaner")
    print("=" * 35)
    asyncio.run(main())

