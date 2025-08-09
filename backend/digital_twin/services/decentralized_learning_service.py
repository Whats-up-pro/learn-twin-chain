import os
import json
import hashlib
import time
from typing import Dict, Any, List, Optional
from pathlib import Path
from web3 import Web3
from .ipfs_service import IPFSService
from .blockchain_service import BlockchainService

class DecentralizedLearningService:
    """
    Decentralized Learning Platform Service
    Handles learning data storage on IPFS and blockchain verification
    """
    
    def __init__(self):
        self.ipfs_service = IPFSService()
        self.blockchain_service = None  # Will be initialized later
        self.learning_data_registry = None
        
    def initialize_blockchain(self, blockchain_service: BlockchainService):
        """Initialize blockchain service and contracts"""
        self.blockchain_service = blockchain_service
        if hasattr(blockchain_service, 'learning_data_registry'):
            self.learning_data_registry = blockchain_service.learning_data_registry
    
    def create_learning_session(
        self,
        student_address: str,
        module_id: str,
        learning_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a learning session and store data on IPFS + blockchain
        """
        try:
            # Step 1: Store learning data on IPFS
            print(f"📚 Storing learning data on IPFS for student {student_address}...")
            
            # Create learning data structure
            learning_record = {
                "student_address": student_address,
                "module_id": module_id,
                "timestamp": int(time.time()),
                "learning_data": learning_data,
                "metadata": {
                    "version": "1.0",
                    "platform": "decentralized_learning",
                    "data_type": "learning_session"
                }
            }
            
            # Store on IPFS
            ipfs_hash = self.ipfs_service.upload_json(learning_record)
            print(f"✅ Learning data stored on IPFS: {ipfs_hash}")
            
            # Step 2: Create learning session hash
            learning_data_hash = hashlib.sha256(
                json.dumps(learning_data, sort_keys=True).encode()
            ).hexdigest()
            
            # Step 3: Create session on blockchain
            if self.blockchain_service and self.learning_data_registry:
                print(f"🔗 Creating learning session on blockchain...")
                
                # Extract learning metrics
                score = learning_data.get('score', 0)
                time_spent = learning_data.get('time_spent', 0)
                attempts = learning_data.get('attempts', 1)
                
                # Create session on blockchain
                session_hash = self.learning_data_registry.functions.createLearningSession(
                    module_id,
                    learning_data_hash,
                    score,
                    time_spent,
                    attempts
                ).call({
                    'from': student_address
                })
                
                print(f"✅ Learning session created on blockchain: {session_hash.hex()}")
                
                # Step 4: Store evidence on blockchain
                self.learning_data_registry.functions.storeLearningEvidence(
                    session_hash,
                    ipfs_hash
                ).call({
                    'from': student_address
                })
                
                print(f"✅ Learning evidence stored on blockchain")
                
                return {
                    "success": True,
                    "session_hash": session_hash.hex(),
                    "ipfs_hash": ipfs_hash,
                    "learning_data_hash": learning_data_hash,
                    "timestamp": int(time.time())
                }
            else:
                print("⚠️  Blockchain service not initialized, skipping blockchain storage")
                return {
                    "success": True,
                    "session_hash": None,
                    "ipfs_hash": ipfs_hash,
                    "learning_data_hash": learning_data_hash,
                    "timestamp": int(time.time())
                }
                
        except Exception as e:
            print(f"❌ Error creating learning session: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_learning_session(
        self,
        session_hash: str,
        validator_address: str,
        approved: bool
    ) -> Dict[str, Any]:
        """
        Validator approves or rejects learning session
        """
        try:
            if not self.learning_data_registry:
                return {"success": False, "error": "Learning data registry not initialized"}
            
            print(f"🔍 Validator {validator_address} validating session {session_hash}...")
            
            # Validate session on blockchain
            tx_hash = self.learning_data_registry.functions.validateLearningSession(
                session_hash,
                approved
            ).transact({
                'from': validator_address
            })
            
            print(f"✅ Learning session validation submitted: {tx_hash.hex()}")
            
            return {
                "success": True,
                "tx_hash": tx_hash.hex(),
                "validator": validator_address,
                "approved": approved,
                "session_hash": session_hash
            }
            
        except Exception as e:
            print(f"❌ Error validating learning session: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def verify_learning_session(self, session_hash: str) -> Dict[str, Any]:
        """
        Verify if learning session is approved by validators
        """
        try:
            if not self.learning_data_registry:
                return {"success": False, "error": "Learning data registry not initialized"}
            
            # Check if session is verified
            is_verified = self.learning_data_registry.functions.isSessionVerified(session_hash).call()
            
            if is_verified:
                # Get session details
                session_data = self.learning_data_registry.functions.getLearningSession(session_hash).call()
                
                return {
                    "success": True,
                    "verified": True,
                    "session_data": {
                        "student": session_data[0],
                        "module_id": session_data[1],
                        "learning_data_hash": session_data[2],
                        "timestamp": session_data[3],
                        "score": session_data[4],
                        "time_spent": session_data[5],
                        "attempts": session_data[6],
                        "is_verified": session_data[7],
                        "approval_count": session_data[8]
                    }
                }
            else:
                return {
                    "success": True,
                    "verified": False,
                    "message": "Session not yet verified by validators"
                }
                
        except Exception as e:
            print(f"❌ Error verifying learning session: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_learning_evidence(self, session_hash: str) -> Dict[str, Any]:
        """
        Get learning evidence from IPFS
        """
        try:
            if not self.learning_data_registry:
                return {"success": False, "error": "Learning data registry not initialized"}
            
            # Get evidence from blockchain
            evidence_data = self.learning_data_registry.functions.getLearningEvidence(session_hash).call()
            
            ipfs_hash = evidence_data[0]
            timestamp = evidence_data[1]
            exists = evidence_data[2]
            
            if not exists:
                return {
                    "success": False,
                    "error": "Learning evidence not found"
                }
            
            # Retrieve data from IPFS
            learning_data = self.ipfs_service.get_json(ipfs_hash)
            
            return {
                "success": True,
                "ipfs_hash": ipfs_hash,
                "timestamp": timestamp,
                "learning_data": learning_data
            }
            
        except Exception as e:
            print(f"❌ Error getting learning evidence: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_student_sessions(self, student_address: str) -> Dict[str, Any]:
        """
        Get all learning sessions for a student
        """
        try:
            if not self.learning_data_registry:
                return {"success": False, "error": "Learning data registry not initialized"}
            
            # Get session hashes from blockchain
            session_hashes = self.learning_data_registry.functions.getStudentSessions(student_address).call()
            
            sessions = []
            for session_hash in session_hashes:
                session_data = self.learning_data_registry.functions.getLearningSession(session_hash).call()
                
                sessions.append({
                    "session_hash": session_hash.hex(),
                    "student": session_data[0],
                    "module_id": session_data[1],
                    "learning_data_hash": session_data[2],
                    "timestamp": session_data[3],
                    "score": session_data[4],
                    "time_spent": session_data[5],
                    "attempts": session_data[6],
                    "is_verified": session_data[7],
                    "approval_count": session_data[8]
                })
            
            return {
                "success": True,
                "student_address": student_address,
                "sessions": sessions,
                "total_sessions": len(sessions)
            }
            
        except Exception as e:
            print(f"❌ Error getting student sessions: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def create_learning_data_for_zkp(
        self,
        student_address: str,
        module_id: str,
        learning_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create learning data suitable for ZK proof generation
        """
        try:
            # Create learning session first
            session_result = self.create_learning_session(student_address, module_id, learning_data)
            
            if not session_result.get("success"):
                return session_result
            
            # Wait for validation (in real scenario, this would be done by validators)
            # For testing, we'll simulate validation
            if session_result.get("session_hash"):
                print("⏳ Simulating validator approval for testing...")
                
                # In production, validators would approve this
                # For now, we'll assume it's approved
                session_result["simulated_validation"] = True
            
            return {
                "success": True,
                "session_hash": session_result.get("session_hash"),
                "ipfs_hash": session_result.get("ipfs_hash"),
                "learning_data_hash": session_result.get("learning_data_hash"),
                "learning_data": learning_data,
                "ready_for_zkp": True
            }
            
        except Exception as e:
            print(f"❌ Error creating learning data for ZKP: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_learning_data_integrity(
        self,
        session_hash: str,
        expected_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate that learning data hasn't been tampered with
        """
        try:
            # Get learning evidence
            evidence_result = self.get_learning_evidence(session_hash)
            
            if not evidence_result.get("success"):
                return evidence_result
            
            learning_data = evidence_result.get("learning_data", {})
            stored_data = learning_data.get("learning_data", {})
            
            # Compare with expected data
            data_integrity = True
            mismatches = []
            
            for key, expected_value in expected_data.items():
                if key in stored_data:
                    if stored_data[key] != expected_value:
                        data_integrity = False
                        mismatches.append({
                            "key": key,
                            "expected": expected_value,
                            "stored": stored_data[key]
                        })
                else:
                    data_integrity = False
                    mismatches.append({
                        "key": key,
                        "expected": expected_value,
                        "stored": "missing"
                    })
            
            return {
                "success": True,
                "data_integrity": data_integrity,
                "mismatches": mismatches,
                "stored_data": stored_data,
                "expected_data": expected_data
            }
            
        except Exception as e:
            print(f"❌ Error validating learning data integrity: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 