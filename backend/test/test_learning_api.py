#!/usr/bin/env python3
"""
Comprehensive test suite for Learning API
Tests all learning-related endpoints with detailed debugging
"""

import requests
import json
import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_learning_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class LearningAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.user_data = None
        
        # Test user credentials
        self.test_email = "22520183@gm.uit.edu.vn"
        self.test_password = "Minhdai100504@"
        
        # Test data storage
        self.created_twin_id = None
        
        logger.info(f"🚀 Initializing Learning API Tester for {base_url}")
    
    def authenticate(self) -> bool:
        """Authenticate user for testing"""
        logger.info("🔐 Authenticating user for learning tests...")
        
        login_data = {
            "identifier": self.test_email,
            "password": self.test_password
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                response_data = response.json()
                self.access_token = response_data.get("access_token")
                self.user_data = response_data.get("user")
                logger.info("✅ Authentication successful")
                return True
            else:
                logger.error(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def log_request(self, method: str, endpoint: str, data: Optional[Dict] = None, headers: Optional[Dict] = None):
        """Log request details"""
        logger.info(f"📤 {method} {endpoint}")
        if data:
            logger.debug(f"📦 Request Data: {json.dumps(data, indent=2)}")
        if headers:
            logger.debug(f"📋 Headers: {json.dumps(headers, indent=2)}")
    
    def log_response(self, response: requests.Response):
        """Log response details"""
        logger.info(f"📥 Status: {response.status_code}")
        try:
            response_data = response.json()
            logger.debug(f"📦 Response: {json.dumps(response_data, indent=2)}")
        except:
            logger.debug(f"📦 Response: {response.text}")
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    def test_create_student_twin(self) -> bool:
        """Test creating student digital twin"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING CREATE STUDENT TWIN")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/students"
        headers = self.get_auth_headers()
        
        twin_data = {
            "twin_id": "student_twin_001",
            "config": {
                "learning_style": "visual",
                "preferred_pace": "moderate",
                "difficulty_preference": "adaptive",
                "interests": ["python", "machine_learning", "web_development"]
            },
            "profile": {
                "academic_level": "intermediate",
                "prior_knowledge": ["python_basics", "data_structures"],
                "learning_goals": ["master_async_programming", "build_ml_models"],
                "time_availability": "10_hours_per_week"
            }
        }
        
        self.log_request("POST", endpoint, twin_data, headers)
        
        try:
            response = self.session.post(endpoint, json=twin_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                twin_info = response.json()
                self.created_twin_id = twin_data["twin_id"]
                logger.info("✅ Create student twin successful")
                logger.info(f"🤖 Twin ID: {self.created_twin_id}")
                return True
            else:
                logger.error(f"❌ Create student twin failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Create student twin error: {e}")
            return False
    
    def test_get_student_twin(self) -> bool:
        """Test getting student digital twin"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET STUDENT TWIN")
        logger.info("=" * 60)
        
        if not self.created_twin_id:
            logger.warning("⚠️ No twin ID available, skipping test")
            return True
        
        endpoint = f"{self.base_url}/learning/students/{self.created_twin_id}"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                twin_info = response.json()
                logger.info("✅ Get student twin successful")
                logger.info(f"🤖 Twin ID: {twin_info.get('twin_id')}")
                logger.info(f"📊 Learning Style: {twin_info.get('config', {}).get('learning_style')}")
                return True
            else:
                logger.error(f"❌ Get student twin failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get student twin error: {e}")
            return False
    
    def test_list_student_twins(self) -> bool:
        """Test listing student digital twins"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING LIST STUDENT TWINS")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/students"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                twins = response.json()
                logger.info("✅ List student twins successful")
                logger.info(f"🤖 Found {len(twins.get('twins', []))} twins")
                return True
            else:
                logger.error(f"❌ List student twins failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ List student twins error: {e}")
            return False
    
    def test_verify_and_mint_skill(self) -> bool:
        """Test verifying and minting skill"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING VERIFY AND MINT SKILL")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/skills/verify-and-mint"
        headers = self.get_auth_headers()
        
        skill_data = {
            "student_did": "did:learntwin:student001",
            "student_address": "0x1234567890123456789012345678901234567890",
            "skill": "Python Programming",
            "metadata": {
                "course_id": "python_advanced_001",
                "completion_date": "2024-01-15",
                "score": 95,
                "institution": "UIT",
                "certificate_url": "https://example.com/certificate.pdf"
            }
        }
        
        self.log_request("POST", endpoint, skill_data, headers)
        
        try:
            response = self.session.post(endpoint, json=skill_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Verify and mint skill successful")
                logger.info(f"🎖️ Skill: {skill_data['skill']}")
                logger.info(f"🔗 Token ID: {result.get('token_id')}")
                return True
            else:
                logger.error(f"❌ Verify and mint skill failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Verify and mint skill error: {e}")
            return False
    
    def test_verify_and_mint_skill_demo(self) -> bool:
        """Test verifying and minting skill (demo version)"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING VERIFY AND MINT SKILL (DEMO)")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/skills/verify-and-mint-demo"
        headers = self.get_auth_headers()
        
        skill_data = {
            "student_did": "did:learntwin:student001",
            "skill": "Machine Learning Fundamentals",
            "metadata": {
                "course_id": "ml_basics_001",
                "completion_date": "2024-01-20",
                "score": 88,
                "institution": "UIT",
                "certificate_url": "https://example.com/ml_certificate.pdf"
            }
        }
        
        self.log_request("POST", endpoint, skill_data, headers)
        
        try:
            response = self.session.post(endpoint, json=skill_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Verify and mint skill demo successful")
                logger.info(f"🎖️ Skill: {skill_data['skill']}")
                logger.info(f"🔗 Token ID: {result.get('token_id')}")
                return True
            else:
                logger.error(f"❌ Verify and mint skill demo failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Verify and mint skill demo error: {e}")
            return False
    
    def test_update_did_data(self) -> bool:
        """Test updating DID data"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING UPDATE DID DATA")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/did/update"
        headers = self.get_auth_headers()
        
        update_data = {
            "student_did": "did:learntwin:student001",
            "student_address": "0x1234567890123456789012345678901234567890",
            "skill": "Advanced Python Programming",
            "token_id": "12345",
            "cid_nft": "QmExampleCID123456789"
        }
        
        self.log_request("POST", endpoint, update_data, headers)
        
        try:
            response = self.session.post(endpoint, json=update_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Update DID data successful")
                logger.info(f"🆔 DID: {update_data['student_did']}")
                logger.info(f"🎖️ Skill: {update_data['skill']}")
                return True
            else:
                logger.error(f"❌ Update DID data failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Update DID data error: {e}")
            return False
    
    def test_query_ai_tutor(self) -> bool:
        """Test querying AI tutor"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING QUERY AI TUTOR")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/ai-tutor/query"
        headers = self.get_auth_headers()
        
        query_data = {
            "question": "What is the difference between async and sync programming in Python?",
            "context_type": "learning",
            "max_tokens": 1024,
            "temperature": 0.1,
            "top_k": 5
        }
        
        self.log_request("POST", endpoint, query_data, headers)
        
        try:
            response = self.session.post(endpoint, json=query_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Query AI tutor successful")
                logger.info(f"❓ Question: {query_data['question'][:50]}...")
                logger.info(f"🤖 Answer length: {len(result.get('answer', ''))} characters")
                return True
            else:
                logger.error(f"❌ Query AI tutor failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Query AI tutor error: {e}")
            return False
    
    def test_upload_document_to_knowledge_base(self) -> bool:
        """Test uploading document to knowledge base"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING UPLOAD DOCUMENT TO KNOWLEDGE BASE")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/ai-tutor/upload-document"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Create a simple text file for testing
        test_content = "This is a test document about Python programming concepts."
        
        files = {
            'file': ('test_document.txt', test_content, 'text/plain')
        }
        
        data = {
            'metadata': json.dumps({
                'title': 'Python Programming Test Document',
                'category': 'programming',
                'tags': ['python', 'programming', 'test']
            })
        }
        
        self.log_request("POST", endpoint, data=data, headers=headers)
        
        try:
            response = self.session.post(endpoint, files=files, data=data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Upload document to knowledge base successful")
                logger.info(f"📄 Document ID: {result.get('document_id')}")
                return True
            else:
                logger.error(f"❌ Upload document to knowledge base failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Upload document to knowledge base error: {e}")
            return False
    
    def test_search_documents_in_knowledge_base(self) -> bool:
        """Test searching documents in knowledge base"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING SEARCH DOCUMENTS IN KNOWLEDGE BASE")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/ai-tutor/search-documents"
        headers = self.get_auth_headers()
        
        search_data = {
            "query": "Python programming concepts",
            "k": 5,
            "document_type": "text"
        }
        
        self.log_request("POST", endpoint, search_data, headers)
        
        try:
            response = self.session.post(endpoint, json=search_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Search documents in knowledge base successful")
                logger.info(f"🔍 Query: {search_data['query']}")
                logger.info(f"📄 Found {len(result.get('documents', []))} documents")
                return True
            else:
                logger.error(f"❌ Search documents in knowledge base failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Search documents in knowledge base error: {e}")
            return False
    
    def test_get_knowledge_base_stats(self) -> bool:
        """Test getting knowledge base statistics"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET KNOWLEDGE BASE STATS")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/ai-tutor/knowledge-base/stats"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                stats = response.json()
                logger.info("✅ Get knowledge base stats successful")
                logger.info(f"📊 Total documents: {stats.get('total_documents', 0)}")
                logger.info(f"📊 Document types: {stats.get('document_types', [])}")
                return True
            else:
                logger.error(f"❌ Get knowledge base stats failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get knowledge base stats error: {e}")
            return False
    
    def test_list_document_types(self) -> bool:
        """Test listing document types"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING LIST DOCUMENT TYPES")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/ai-tutor/document-types"
        headers = self.get_auth_headers()
        
        self.log_request("GET", endpoint, headers=headers)
        
        try:
            response = self.session.get(endpoint, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                types = response.json()
                logger.info("✅ List document types successful")
                logger.info(f"📄 Document types: {types.get('document_types', [])}")
                return True
            else:
                logger.error(f"❌ List document types failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ List document types error: {e}")
            return False
    
    def test_get_learning_assistance(self) -> bool:
        """Test getting learning assistance"""
        logger.info("=" * 60)
        logger.info("🧪 TESTING GET LEARNING ASSISTANCE")
        logger.info("=" * 60)
        
        endpoint = f"{self.base_url}/learning/ai-tutor/learning-assistance"
        headers = self.get_auth_headers()
        
        assistance_data = {
            "student_did": "did:learntwin:student001",
            "question": "How can I improve my Python async programming skills?",
            "context_type": "learning",
            "current_topic": "async_programming",
            "difficulty_level": "intermediate"
        }
        
        self.log_request("POST", endpoint, assistance_data, headers)
        
        try:
            response = self.session.post(endpoint, json=assistance_data, headers=headers)
            self.log_response(response)
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Get learning assistance successful")
                logger.info(f"❓ Question: {assistance_data['question'][:50]}...")
                logger.info(f"🤖 Assistance provided: {len(result.get('assistance', ''))} characters")
                return True
            else:
                logger.error(f"❌ Get learning assistance failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Get learning assistance error: {e}")
            return False
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all learning-related tests"""
        logger.info("🚀 STARTING COMPREHENSIVE LEARNING API TESTS")
        logger.info(f"📅 Test started at: {datetime.now()}")
        
        # First authenticate
        if not self.authenticate():
            logger.error("❌ Authentication failed, cannot proceed with tests")
            return {"authentication": False}
        
        test_results = {}
        
        # Test sequence
        tests = [
            ("create_student_twin", self.test_create_student_twin),
            ("get_student_twin", self.test_get_student_twin),
            ("list_student_twins", self.test_list_student_twins),
            ("verify_and_mint_skill", self.test_verify_and_mint_skill),
            ("verify_and_mint_skill_demo", self.test_verify_and_mint_skill_demo),
            ("update_did_data", self.test_update_did_data),
            ("query_ai_tutor", self.test_query_ai_tutor),
            ("upload_document_to_knowledge_base", self.test_upload_document_to_knowledge_base),
            ("search_documents_in_knowledge_base", self.test_search_documents_in_knowledge_base),
            ("get_knowledge_base_stats", self.test_get_knowledge_base_stats),
            ("list_document_types", self.test_list_document_types),
            ("get_learning_assistance", self.test_get_learning_assistance),
        ]
        
        for test_name, test_func in tests:
            try:
                logger.info(f"\n{'='*20} Running {test_name} {'='*20}")
                result = test_func()
                test_results[test_name] = result
                
                if result:
                    logger.info(f"✅ {test_name}: PASSED")
                else:
                    logger.error(f"❌ {test_name}: FAILED")
                    
            except Exception as e:
                logger.error(f"❌ {test_name}: ERROR - {e}")
                test_results[test_name] = False
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("📊 TEST SUMMARY")
        logger.info("="*60)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            logger.info(f"{test_name}: {status}")
        
        logger.info(f"\n🎯 Overall: {passed}/{total} tests passed")
        logger.info(f"📅 Test completed at: {datetime.now()}")
        
        return test_results

def main():
    """Main test runner"""
    # Test with default localhost URL
    tester = LearningAPITester("http://localhost:8000")
    
    # Run all tests
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if all(results.values()):
        logger.info("🎉 All tests passed!")
        exit(0)
    else:
        logger.error("💥 Some tests failed!")
        exit(1)

if __name__ == "__main__":
    main()
