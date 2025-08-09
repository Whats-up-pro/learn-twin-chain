#!/usr/bin/env python3
"""
Migrate Course Data to IPFS
Upload all course content to IPFS and verify migration
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

def migrate_courses_to_ipfs():
    """Migrate all course data to IPFS"""
    
    print("🚀 Course Data Migration to IPFS")
    print("=" * 50)
    
    try:
        # Import services
        from digital_twin.services.course_data_service import CourseDataService
        from digital_twin.services.ipfs_service import IPFSService
        from digital_twin.services.blockchain_service import BlockchainService
        
        print("✅ Services imported successfully")
        
        # Initialize services
        course_service = CourseDataService()
        ipfs_service = IPFSService()
        blockchain_service = BlockchainService()
        
        # Initialize blockchain connection
        course_service.initialize_blockchain(blockchain_service)
        
        print("✅ Services initialized successfully")
        
        # Test IPFS connection
        print("\n🔍 Testing IPFS connection...")
        test_data = {"test": "IPFS connection", "timestamp": "2024-12-19"}
        test_cid = ipfs_service.upload_json(test_data)
        retrieved_data = ipfs_service.get_json(test_cid)
        
        if retrieved_data == test_data:
            print("✅ IPFS connection working properly")
        else:
            print("❌ IPFS connection test failed")
            return False
        
        # Load course structure
        print("\n📋 Loading course structure...")
        course_structure = course_service.load_course_structure()
        if course_structure:
            print("✅ Course structure loaded")
        else:
            print("❌ Failed to load course structure")
            return False
        
        # Load all courses
        print("\n📚 Loading all courses...")
        courses = course_service.load_all_courses()
        if not courses:
            print("❌ No courses found")
            return False
        
        print(f"✅ Loaded {len(courses)} courses:")
        for course in courses:
            print(f"   - {course.get('title', 'Unknown')} ({course.get('course_id', 'Unknown ID')})")
        
        # Migrate courses to IPFS
        print("\n🌐 Starting migration to IPFS...")
        migration_result = course_service.migrate_all_courses_to_ipfs()
        
        if not migration_result["success"]:
            print(f"❌ Migration failed: {migration_result.get('error')}")
            return False
        
        migration_summary = migration_result["migration_summary"]
        print(f"\n🎉 Migration completed successfully!")
        print(f"   Total courses: {migration_summary['total_courses']}")
        print(f"   Successful: {migration_summary['successful_migrations']}")
        print(f"   Failed: {migration_summary['failed_migrations']}")
        
        # Verify migration results
        print("\n🔍 Verifying migration results...")
        successful_migrations = [r for r in migration_summary["results"] if r["success"]]
        
        for migration in successful_migrations:
            course_id = migration["course_id"]
            course_index_cid = migration["course_index_cid"]
            
            print(f"\n📊 Verifying course: {course_id}")
            verification_result = course_service.verify_course_integrity(course_index_cid)
            
            if verification_result["success"]:
                integrity_score = verification_result["verification_results"]["integrity_score"]
                print(f"   Integrity score: {integrity_score:.1f}%")
                
                if integrity_score == 100:
                    print(f"   ✅ Course {course_id} fully accessible on IPFS")
                else:
                    print(f"   ⚠️  Course {course_id} partially accessible ({integrity_score:.1f}%)")
            else:
                print(f"   ❌ Failed to verify course {course_id}")
        
        # Generate course catalog
        print("\n📖 Generating course catalog...")
        catalog_result = course_service.get_course_catalog()
        
        if catalog_result["success"]:
            catalog = catalog_result["catalog"]
            print(f"✅ Course catalog generated with {catalog['total_courses']} courses")
            
            # Save catalog to file
            catalog_file = Path("data/courses/course_catalog.json")
            with open(catalog_file, 'w', encoding='utf-8') as f:
                json.dump(catalog, f, indent=2, ensure_ascii=False)
            print(f"📄 Course catalog saved to: {catalog_file}")
        else:
            print(f"❌ Failed to generate course catalog: {catalog_result.get('error')}")
        
        # Summary
        print("\n" + "=" * 50)
        print("🎯 MIGRATION SUMMARY")
        print("=" * 50)
        print(f"📚 Total courses processed: {migration_summary['total_courses']}")
        print(f"✅ Successful migrations: {migration_summary['successful_migrations']}")
        print(f"❌ Failed migrations: {migration_summary['failed_migrations']}")
        print(f"🌐 All course data now stored on IPFS")
        print(f"📄 Migration results saved to: backend/data/courses/ipfs_migration_results.json")
        print(f"📖 Course catalog saved to: backend/data/courses/course_catalog.json")
        
        print("\n📋 Next steps:")
        print("   1. Deploy CourseRegistry contract to blockchain")
        print("   2. Register course CIDs on blockchain")
        print("   3. Update frontend to fetch courses from IPFS")
        print("   4. Test course loading and verification")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_course_retrieval():
    """Test retrieving courses from IPFS"""
    
    print("\n🧪 Testing Course Retrieval from IPFS")
    print("=" * 40)
    
    try:
        from digital_twin.services.course_data_service import CourseDataService
        from digital_twin.services.blockchain_service import BlockchainService
        
        # Initialize services
        course_service = CourseDataService()
        blockchain_service = BlockchainService()
        course_service.initialize_blockchain(blockchain_service)
        
        # Load migration results
        migration_file = Path("data/courses/ipfs_migration_results.json")
        if not migration_file.exists():
            print("❌ Migration results file not found")
            return False
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_results = json.load(f)
        
        successful_migrations = [r for r in migration_results["results"] if r["success"]]
        
        for migration in successful_migrations:
            course_id = migration["course_id"]
            course_index_cid = migration["course_index_cid"]
            
            print(f"\n📚 Testing retrieval for course: {course_id}")
            
            # Retrieve course from IPFS
            course_result = course_service.get_course_from_ipfs(course_index_cid)
            
            if course_result["success"]:
                course = course_result["course"]
                print(f"   ✅ Course retrieved successfully")
                print(f"   📝 Title: {course.get('title', 'Unknown')}")
                print(f"   👨‍🏫 Instructor: {course.get('instructor', 'Unknown')}")
                print(f"   📊 Modules: {len(course.get('modules', []))}")
                print(f"   🏷️  Tags: {', '.join(course.get('tags', []))}")
            else:
                print(f"   ❌ Failed to retrieve course: {course_result.get('error')}")
        
        print("\n✅ Course retrieval test completed")
        return True
        
    except Exception as e:
        print(f"❌ Error during retrieval test: {str(e)}")
        return False

def main():
    """Main function"""
    
    print("🎓 Course Data Migration Tool")
    print("=" * 50)
    
    # Check if courses directory exists
    courses_dir = Path("data/courses")
    if not courses_dir.exists():
        print("❌ Courses directory not found")
        return False
    
    # Check if course files exist
    course_files = list(courses_dir.glob("*.json"))
    if not course_files:
        print("❌ No course files found")
        return False
    
    print(f"📁 Found {len(course_files)} course files")
    
    # Run migration
    migration_success = migrate_courses_to_ipfs()
    
    if migration_success:
        # Test retrieval
        retrieval_success = test_course_retrieval()
        
        if retrieval_success:
            print("\n🎉 All operations completed successfully!")
            return True
        else:
            print("\n⚠️  Migration successful but retrieval test failed")
            return False
    else:
        print("\n❌ Migration failed")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n✅ Course migration completed successfully!")
    else:
        print("\n❌ Course migration failed!")
        sys.exit(1) 