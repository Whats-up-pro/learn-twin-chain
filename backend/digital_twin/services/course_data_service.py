#!/usr/bin/env python3
"""
Course Data Service for Decentralized Learning Platform
Handles course content storage on IPFS and blockchain verification
"""

import os
import json
import hashlib
import time
from typing import Dict, Any, List, Optional
from pathlib import Path
from web3 import Web3
from .ipfs_service import IPFSService
from .blockchain_service import BlockchainService

class CourseDataService:
    """
    Course Data Service
    Manages course content, modules, lessons, and assessments on IPFS
    """
    
    def __init__(self):
        self.ipfs_service = IPFSService()
        self.blockchain_service = None
        self.courses_data_path = Path("data/courses")
        
    def initialize_blockchain(self, blockchain_service: BlockchainService):
        """Initialize blockchain service and contracts"""
        self.blockchain_service = blockchain_service
        
    def load_course_structure(self) -> Dict[str, Any]:
        """Load course structure template"""
        try:
            structure_file = self.courses_data_path / "course_structure.json"
            with open(structure_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error loading course structure: {str(e)}")
            return {}
    
    def load_all_courses(self) -> List[Dict[str, Any]]:
        """Load all course data from local files"""
        courses = []
        try:
            for course_file in self.courses_data_path.glob("*.json"):
                if course_file.name not in ["course_structure.json", "ipfs_migration_results.json", "course_catalog.json"]:
                    with open(course_file, 'r', encoding='utf-8') as f:
                        course_data = json.load(f)
                        # Check if it's a valid course (has course_id)
                        if "course_id" in course_data:
                            courses.append(course_data)
            print(f"✅ Loaded {len(courses)} courses from local files")
            return courses
        except Exception as e:
            print(f"❌ Error loading courses: {str(e)}")
            return []
    
    def upload_course_to_ipfs(self, course_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Upload complete course data to IPFS
        Returns course with IPFS CIDs
        """
        try:
            print(f"📚 Uploading course '{course_data.get('title', 'Unknown')}' to IPFS...")
            
            # Step 1: Upload course metadata
            course_metadata = {
                "course_id": course_data["course_id"],
                "title": course_data["title"],
                "description": course_data["description"],
                "instructor": course_data["instructor"],
                "institution": course_data["institution"],
                "difficulty": course_data["difficulty"],
                "estimated_hours": course_data["estimated_hours"],
                "learning_objectives": course_data["learning_objectives"],
                "tags": course_data["tags"],
                "metadata": course_data["metadata"]
            }
            
            course_metadata_cid = self.ipfs_service.upload_json(course_metadata)
            print(f"✅ Course metadata uploaded: {course_metadata_cid}")
            
            # Step 2: Upload each module separately
            module_cids = []
            for module in course_data.get("modules", []):
                module_cid = self.upload_module_to_ipfs(module)
                module_cids.append(module_cid)
                print(f"✅ Module '{module['title']}' uploaded: {module_cid}")
            
            # Step 3: Create course index with all CIDs
            course_index = {
                "course_id": course_data["course_id"],
                "course_metadata_cid": course_metadata_cid,
                "module_cids": module_cids,
                "total_modules": len(module_cids),
                "uploaded_at": int(time.time()),
                "version": "1.0"
            }
            
            course_index_cid = self.ipfs_service.upload_json(course_index)
            print(f"✅ Course index uploaded: {course_index_cid}")
            
            return {
                "success": True,
                "course_id": course_data["course_id"],
                "course_metadata_cid": course_metadata_cid,
                "course_index_cid": course_index_cid,
                "module_cids": module_cids,
                "total_modules": len(module_cids)
            }
            
        except Exception as e:
            print(f"❌ Error uploading course to IPFS: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def upload_module_to_ipfs(self, module_data: Dict[str, Any]) -> str:
        """
        Upload module data to IPFS
        Returns module CID
        """
        try:
            # Step 1: Upload module metadata
            module_metadata = {
                "module_id": module_data["module_id"],
                "title": module_data["title"],
                "description": module_data["description"],
                "category": module_data["category"],
                "difficulty": module_data["difficulty"],
                "estimated_hours": module_data["estimated_hours"],
                "learning_objectives": module_data["learning_objectives"],
                "tags": module_data["tags"],
                "verification": module_data["verification"]
            }
            
            module_metadata_cid = self.ipfs_service.upload_json(module_metadata)
            
            # Step 2: Upload content separately
            content_cids = self.upload_module_content_to_ipfs(module_data["content"])
            
            # Step 3: Create module index
            module_index = {
                "module_id": module_data["module_id"],
                "module_metadata_cid": module_metadata_cid,
                "content_cids": content_cids,
                "uploaded_at": int(time.time())
            }
            
            module_index_cid = self.ipfs_service.upload_json(module_index)
            return module_index_cid
            
        except Exception as e:
            print(f"❌ Error uploading module to IPFS: {str(e)}")
            raise e
    
    def upload_module_content_to_ipfs(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Upload module content (lessons, exercises, assessments) to IPFS
        Returns content CIDs
        """
        try:
            content_cids = {
                "lessons": [],
                "exercises": [],
                "assessments": []
            }
            
            # Upload lessons
            for lesson in content_data.get("lessons", []):
                lesson_cid = self.ipfs_service.upload_json(lesson)
                content_cids["lessons"].append({
                    "lesson_id": lesson["lesson_id"],
                    "cid": lesson_cid
                })
            
            # Upload exercises
            for exercise in content_data.get("exercises", []):
                exercise_cid = self.ipfs_service.upload_json(exercise)
                content_cids["exercises"].append({
                    "exercise_id": exercise["exercise_id"],
                    "cid": exercise_cid
                })
            
            # Upload assessments
            for assessment in content_data.get("assessments", []):
                assessment_cid = self.ipfs_service.upload_json(assessment)
                content_cids["assessments"].append({
                    "assessment_id": assessment["assessment_id"],
                    "cid": assessment_cid
                })
            
            return content_cids
            
        except Exception as e:
            print(f"❌ Error uploading module content to IPFS: {str(e)}")
            raise e
    
    def get_course_from_ipfs(self, course_index_cid: str) -> Dict[str, Any]:
        """
        Retrieve complete course data from IPFS
        """
        try:
            # Step 1: Get course index
            course_index = self.ipfs_service.get_json(course_index_cid)
            
            # Step 2: Get course metadata
            course_metadata = self.ipfs_service.get_json(course_index["course_metadata_cid"])
            
            # Step 3: Get all modules
            modules = []
            for module_cid in course_index["module_cids"]:
                module_data = self.get_module_from_ipfs(module_cid)
                modules.append(module_data)
            
            # Step 4: Combine into complete course
            complete_course = {
                **course_metadata,
                "modules": modules,
                "storage": {
                    "course_metadata_cid": course_index["course_metadata_cid"],
                    "course_index_cid": course_index_cid,
                    "module_cids": course_index["module_cids"]
                }
            }
            
            return {
                "success": True,
                "course": complete_course
            }
            
        except Exception as e:
            print(f"❌ Error retrieving course from IPFS: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_module_from_ipfs(self, module_index_cid: str) -> Dict[str, Any]:
        """
        Retrieve module data from IPFS
        """
        try:
            # Step 1: Get module index
            module_index = self.ipfs_service.get_json(module_index_cid)
            
            # Step 2: Get module metadata
            module_metadata = self.ipfs_service.get_json(module_index["module_metadata_cid"])
            
            # Step 3: Get content
            content = self.get_module_content_from_ipfs(module_index["content_cids"])
            
            # Step 4: Combine
            complete_module = {
                **module_metadata,
                "content": content
            }
            
            return complete_module
            
        except Exception as e:
            print(f"❌ Error retrieving module from IPFS: {str(e)}")
            raise e
    
    def get_module_content_from_ipfs(self, content_cids: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retrieve module content from IPFS
        """
        try:
            content = {
                "lessons": [],
                "exercises": [],
                "assessments": []
            }
            
            # Get lessons
            for lesson_ref in content_cids["lessons"]:
                lesson_data = self.ipfs_service.get_json(lesson_ref["cid"])
                content["lessons"].append(lesson_data)
            
            # Get exercises
            for exercise_ref in content_cids["exercises"]:
                exercise_data = self.ipfs_service.get_json(exercise_ref["cid"])
                content["exercises"].append(exercise_data)
            
            # Get assessments
            for assessment_ref in content_cids["assessments"]:
                assessment_data = self.ipfs_service.get_json(assessment_ref["cid"])
                content["assessments"].append(assessment_data)
            
            return content
            
        except Exception as e:
            print(f"❌ Error retrieving module content from IPFS: {str(e)}")
            raise e
    
    def migrate_all_courses_to_ipfs(self) -> Dict[str, Any]:
        """
        Migrate all local course data to IPFS
        """
        try:
            print("🚀 Starting course migration to IPFS...")
            
            # Load all courses
            courses = self.load_all_courses()
            if not courses:
                return {"success": False, "error": "No courses found"}
            
            migration_results = []
            
            for course in courses:
                print(f"\n📚 Migrating course: {course.get('title', 'Unknown')}")
                result = self.upload_course_to_ipfs(course)
                migration_results.append(result)
                
                if result["success"]:
                    print(f"✅ Course '{course.get('title')}' migrated successfully")
                else:
                    print(f"❌ Failed to migrate course '{course.get('title')}': {result.get('error')}")
            
            # Save migration results
            migration_summary = {
                "migration_date": int(time.time()),
                "total_courses": len(courses),
                "successful_migrations": len([r for r in migration_results if r["success"]]),
                "failed_migrations": len([r for r in migration_results if not r["success"]]),
                "results": migration_results
            }
            
            # Save to file
            migration_file = self.courses_data_path / "ipfs_migration_results.json"
            with open(migration_file, 'w', encoding='utf-8') as f:
                json.dump(migration_summary, f, indent=2, ensure_ascii=False)
            
            print(f"\n🎉 Course migration completed!")
            print(f"   Total courses: {migration_summary['total_courses']}")
            print(f"   Successful: {migration_summary['successful_migrations']}")
            print(f"   Failed: {migration_summary['failed_migrations']}")
            print(f"   Results saved to: {migration_file}")
            
            return {
                "success": True,
                "migration_summary": migration_summary
            }
            
        except Exception as e:
            print(f"❌ Error during course migration: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def verify_course_integrity(self, course_index_cid: str) -> Dict[str, Any]:
        """
        Verify that all course data is accessible on IPFS
        """
        try:
            print(f"🔍 Verifying course integrity for CID: {course_index_cid}")
            
            # Get course index
            course_index = self.ipfs_service.get_json(course_index_cid)
            
            verification_results = {
                "course_index": True,
                "course_metadata": False,
                "modules": [],
                "total_modules": len(course_index["module_cids"]),
                "accessible_modules": 0
            }
            
            # Verify course metadata
            try:
                course_metadata = self.ipfs_service.get_json(course_index["course_metadata_cid"])
                verification_results["course_metadata"] = True
                print(f"✅ Course metadata accessible")
            except Exception as e:
                print(f"❌ Course metadata not accessible: {str(e)}")
            
            # Verify each module
            for i, module_cid in enumerate(course_index["module_cids"]):
                module_verification = {
                    "module_index": i + 1,
                    "module_cid": module_cid,
                    "accessible": False,
                    "error": None
                }
                
                try:
                    module_data = self.get_module_from_ipfs(module_cid)
                    module_verification["accessible"] = True
                    verification_results["accessible_modules"] += 1
                    print(f"✅ Module {i + 1} accessible")
                except Exception as e:
                    module_verification["error"] = str(e)
                    print(f"❌ Module {i + 1} not accessible: {str(e)}")
                
                verification_results["modules"].append(module_verification)
            
            # Calculate integrity score
            total_components = 1 + 1 + len(course_index["module_cids"])  # index + metadata + modules
            accessible_components = (
                (1 if verification_results["course_index"] else 0) +
                (1 if verification_results["course_metadata"] else 0) +
                verification_results["accessible_modules"]
            )
            integrity_score = (accessible_components / total_components) * 100
            
            verification_results["integrity_score"] = integrity_score
            verification_results["verification_date"] = int(time.time())
            
            print(f"📊 Course integrity score: {integrity_score:.1f}%")
            
            return {
                "success": True,
                "verification_results": verification_results
            }
            
        except Exception as e:
            print(f"❌ Error verifying course integrity: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_course_catalog(self) -> Dict[str, Any]:
        """
        Get catalog of all available courses with actual IPFS CIDs
        """
        try:
            # Load migration results to get actual IPFS CIDs
            migration_file = Path("data/courses/ipfs_migration_results.json")
            migration_results = {}
            
            if migration_file.exists():
                with open(migration_file, 'r', encoding='utf-8') as f:
                    migration_results = json.load(f)
            
            # Load original course data
            courses = self.load_all_courses()
            
            catalog = {
                "total_courses": len(courses),
                "courses": []
            }
            
            for course in courses:
                course_id = course["course_id"]
                
                # Find migration result for this course
                migration_data = None
                if "results" in migration_results:
                    for result in migration_results["results"]:
                        if result.get("course_id") == course_id and result.get("success"):
                            migration_data = result
                            break
                
                # Create catalog entry with actual IPFS CIDs if available
                catalog_entry = {
                    "course_id": course["course_id"],
                    "title": course["title"],
                    "description": course["description"],
                    "instructor": course["instructor"],
                    "institution": course["institution"],
                    "difficulty": course["difficulty"],
                    "estimated_hours": course["estimated_hours"],
                    "tags": course["tags"],
                    "total_modules": len(course.get("modules", [])),
                    "storage": {}
                }
                
                # Use actual IPFS CIDs from migration if available
                if migration_data:
                    catalog_entry["storage"] = {
                        "course_metadata_cid": migration_data["course_metadata_cid"],
                        "course_index_cid": migration_data["course_index_cid"],
                        "module_content_cids": migration_data["module_cids"],
                        "migrated_at": migration_data.get("uploaded_at", int(time.time())),
                        "blockchain_registry": f"{course_id}_hash"
                    }
                else:
                    # Fallback to original storage data
                    catalog_entry["storage"] = course.get("storage", {})
                
                catalog["courses"].append(catalog_entry)
            
            return {
                "success": True,
                "catalog": catalog
            }
            
        except Exception as e:
            print(f"❌ Error getting course catalog: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 