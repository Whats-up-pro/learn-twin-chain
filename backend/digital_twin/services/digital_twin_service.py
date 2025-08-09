"""
Digital Twin service with hybrid storage (MongoDB + IPFS + on-chain)
"""
import os
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
import logging

from ..models.digital_twin import DigitalTwin, DigitalTwinVersion, LearningProgress, SkillAssessment
from ..models.user import User
from ..services.ipfs_service import IPFSService
from ..services.blockchain_service import BlockchainService
from ..services.redis_service import RedisService

logger = logging.getLogger(__name__)

class DigitalTwinService:
    """Digital Twin service with hybrid storage"""
    
    def __init__(self):
        self.ipfs_service = IPFSService()
        self.blockchain_service = BlockchainService()
        self.redis_service = RedisService()
        
    async def create_digital_twin(self, user: User, initial_data: Dict[str, Any] = None) -> DigitalTwin:
        """Create a new digital twin for a user"""
        try:
            twin_id = f"did:learntwin:{user.did.replace('did:learntwin:', '')}"
            
            # Create initial twin data
            twin_data = {
                "twin_id": twin_id,
                "owner_did": user.did,
                "version": 1,
                "profile": {
                    "full_name": user.name,
                    "birth_year": user.birth_year,
                    "institution": user.institution,
                    "program": user.program,
                    "enrollment_date": user.enrollment_date.isoformat() if user.enrollment_date else None,
                    "role": user.role
                }
            }
            
            # Merge with initial data if provided
            if initial_data:
                twin_data.update(initial_data)
            
            # Create digital twin document
            digital_twin = DigitalTwin(
                twin_id=twin_id,
                owner_did=user.did,
                version=1,
                profile=twin_data.get("profile", {}),
                current_modules=[],
                completed_modules=[],
                learning_progress=[],
                skill_assessments=[],
                verified_skills=[],
                learning_style="balanced",
                preferred_topics=[],
                activity_pattern={},
                checkpoint_history=[],
                ai_insights={},
                privacy_level="private",
                sharing_permissions={}
            )
            
            await digital_twin.insert()
            
            # Pin initial state to IPFS
            canonical_payload = digital_twin.get_canonical_payload()
            cid = await self.ipfs_service.pin_json(
                canonical_payload,
                name=f"digital_twin_{twin_id}_v1",
                metadata={
                    "twin_id": twin_id,
                    "version": 1,
                    "type": "digital_twin_state"
                }
            )
            
            # Update with CID
            digital_twin.latest_cid = cid
            digital_twin.previous_cids = []
            await digital_twin.save()
            
            # Create version record
            version_record = DigitalTwinVersion(
                twin_id=twin_id,
                version=1,
                cid=cid,
                created_by=user.did,
                change_description="Initial digital twin creation",
                change_type="creation"
            )
            await version_record.insert()
            
            # Cache in Redis
            await self.redis_service.set_cache(f"twin:{twin_id}", canonical_payload, 3600)
            
            # Schedule blockchain anchoring
            await self._schedule_blockchain_anchor(twin_id, cid, "creation")
            
            logger.info(f"Digital twin created: {twin_id}")
            return digital_twin
            
        except Exception as e:
            logger.error(f"Digital twin creation failed: {e}")
            raise
    
    async def update_digital_twin(self, twin_id: str, updates: Dict[str, Any], updated_by: str, change_description: str = None) -> DigitalTwin:
        """Update digital twin with new data"""
        try:
            # Get current twin
            digital_twin = await DigitalTwin.find_one({"twin_id": twin_id})
            if not digital_twin:
                raise ValueError(f"Digital twin not found: {twin_id}")
            
            # Store previous CID
            if digital_twin.latest_cid:
                digital_twin.previous_cids.append(digital_twin.latest_cid)
            
            # Apply updates
            for key, value in updates.items():
                if hasattr(digital_twin, key):
                    setattr(digital_twin, key, value)
            
            # Increment version
            digital_twin.version += 1
            digital_twin.update_timestamp()
            
            # Generate new canonical payload
            canonical_payload = digital_twin.get_canonical_payload()
            
            # Pin to IPFS
            cid = await self.ipfs_service.pin_json(
                canonical_payload,
                name=f"digital_twin_{twin_id}_v{digital_twin.version}",
                metadata={
                    "twin_id": twin_id,
                    "version": digital_twin.version,
                    "type": "digital_twin_state",
                    "updated_by": updated_by
                }
            )
            
            # Update CID
            digital_twin.latest_cid = cid
            await digital_twin.save()
            
            # Create version record
            version_record = DigitalTwinVersion(
                twin_id=twin_id,
                version=digital_twin.version,
                cid=cid,
                created_by=updated_by,
                change_description=change_description or "Digital twin update",
                change_type="update"
            )
            await version_record.insert()
            
            # Update cache
            await self.redis_service.set_cache(f"twin:{twin_id}", canonical_payload, 3600)
            
            # Schedule blockchain anchoring for major updates
            if digital_twin.version % 5 == 0:  # Anchor every 5 versions
                await self._schedule_blockchain_anchor(twin_id, cid, "update")
            
            logger.info(f"Digital twin updated: {twin_id} v{digital_twin.version}")
            return digital_twin
            
        except Exception as e:
            logger.error(f"Digital twin update failed: {e}")
            raise
    
    async def update_learning_progress(self, twin_id: str, module_id: str, completion_percentage: float, time_spent: int = 0, quiz_scores: List[float] = None) -> DigitalTwin:
        """Update learning progress for a specific module"""
        try:
            digital_twin = await DigitalTwin.find_one({"twin_id": twin_id})
            if not digital_twin:
                raise ValueError(f"Digital twin not found: {twin_id}")
            
            # Update progress
            digital_twin.update_learning_progress(module_id, completion_percentage, time_spent)
            
            # Add quiz scores if provided
            if quiz_scores:
                for progress in digital_twin.learning_progress:
                    if progress.module_id == module_id:
                        progress.quiz_scores.extend(quiz_scores)
                        break
            
            # Create checkpoint if module completed
            if completion_percentage >= 100:
                checkpoint_id = f"module_completion_{module_id}_{int(datetime.now().timestamp())}"
                canonical_payload = digital_twin.get_canonical_payload()
                
                # Pin checkpoint state
                cid = await self.ipfs_service.pin_json(
                    canonical_payload,
                    name=f"checkpoint_{checkpoint_id}",
                    metadata={
                        "twin_id": twin_id,
                        "checkpoint_type": "module_completion",
                        "module_id": module_id
                    }
                )
                
                digital_twin.add_checkpoint(checkpoint_id, cid, "module_completion", {"module_id": module_id})
            
            return await self.update_digital_twin(
                twin_id,
                {
                    "learning_progress": digital_twin.learning_progress,
                    "current_modules": digital_twin.current_modules,
                    "completed_modules": digital_twin.completed_modules,
                    "checkpoint_history": digital_twin.checkpoint_history
                },
                digital_twin.owner_did,
                f"Learning progress updated for module {module_id}"
            )
            
        except Exception as e:
            logger.error(f"Learning progress update failed: {e}")
            raise
    
    async def update_skill_assessment(self, twin_id: str, skill_name: str, proficiency_level: str, score: float, verified: bool = False, verified_by: str = None, evidence_cids: List[str] = None) -> DigitalTwin:
        """Update skill assessment"""
        try:
            digital_twin = await DigitalTwin.find_one({"twin_id": twin_id})
            if not digital_twin:
                raise ValueError(f"Digital twin not found: {twin_id}")
            
            # Update skill assessment
            digital_twin.update_skill_assessment(skill_name, proficiency_level, score, verified, verified_by)
            
            # Add evidence CIDs if provided
            if evidence_cids:
                for assessment in digital_twin.skill_assessments:
                    if assessment.skill_name == skill_name:
                        assessment.evidence_cids.extend(evidence_cids)
                        break
            
            # Create checkpoint for verified skills
            if verified:
                checkpoint_id = f"skill_verification_{skill_name}_{int(datetime.now().timestamp())}"
                canonical_payload = digital_twin.get_canonical_payload()
                
                # Pin checkpoint state
                cid = await self.ipfs_service.pin_json(
                    canonical_payload,
                    name=f"checkpoint_{checkpoint_id}",
                    metadata={
                        "twin_id": twin_id,
                        "checkpoint_type": "skill_verification",
                        "skill_name": skill_name,
                        "verified_by": verified_by
                    }
                )
                
                digital_twin.add_checkpoint(checkpoint_id, cid, "skill_verification", {
                    "skill_name": skill_name,
                    "verified_by": verified_by,
                    "proficiency_level": proficiency_level,
                    "score": score
                })
            
            return await self.update_digital_twin(
                twin_id,
                {
                    "skill_assessments": digital_twin.skill_assessments,
                    "verified_skills": digital_twin.verified_skills,
                    "checkpoint_history": digital_twin.checkpoint_history
                },
                verified_by or digital_twin.owner_did,
                f"Skill assessment updated for {skill_name}"
            )
            
        except Exception as e:
            logger.error(f"Skill assessment update failed: {e}")
            raise
    
    async def get_digital_twin(self, twin_id: str, version: int = None) -> Optional[DigitalTwin]:
        """Get digital twin by ID and optionally specific version"""
        try:
            if version is None:
                # Get latest version from cache first
                cached_data = await self.redis_service.get_cache(f"twin:{twin_id}")
                if cached_data:
                    return cached_data
                
                # Get from database
                digital_twin = await DigitalTwin.find_one({"twin_id": twin_id})
                if digital_twin:
                    # Cache for future requests
                    canonical_payload = digital_twin.get_canonical_payload()
                    await self.redis_service.set_cache(f"twin:{twin_id}", canonical_payload, 3600)
                
                return digital_twin
            else:
                # Get specific version from IPFS
                version_record = await DigitalTwinVersion.find_one({"twin_id": twin_id, "version": version})
                if version_record:
                    twin_data = await self.ipfs_service.get_json(version_record.cid)
                    return twin_data
                
                return None
                
        except Exception as e:
            logger.error(f"Digital twin retrieval failed: {e}")
            return None
    
    async def get_twin_history(self, twin_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get digital twin version history"""
        try:
            versions = await DigitalTwinVersion.find(
                {"twin_id": twin_id}
            ).sort("-version").limit(limit).to_list()
            
            history = []
            for version in versions:
                history.append({
                    "version": version.version,
                    "cid": version.cid,
                    "created_at": version.created_at.isoformat(),
                    "created_by": version.created_by,
                    "change_description": version.change_description,
                    "change_type": version.change_type,
                    "verified": version.verified
                })
            
            return history
            
        except Exception as e:
            logger.error(f"Twin history retrieval failed: {e}")
            return []
    
    async def create_learning_checkpoint(self, twin_id: str, trigger_event: str, metadata: Dict[str, Any] = None) -> str:
        """Create a learning checkpoint"""
        try:
            digital_twin = await DigitalTwin.find_one({"twin_id": twin_id})
            if not digital_twin:
                raise ValueError(f"Digital twin not found: {twin_id}")
            
            checkpoint_id = f"checkpoint_{trigger_event}_{int(datetime.now().timestamp())}"
            canonical_payload = digital_twin.get_canonical_payload()
            
            # Pin checkpoint state to IPFS
            cid = await self.ipfs_service.pin_json(
                canonical_payload,
                name=f"checkpoint_{checkpoint_id}",
                metadata={
                    "twin_id": twin_id,
                    "checkpoint_type": trigger_event,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    **(metadata or {})
                }
            )
            
            # Add checkpoint to twin
            digital_twin.add_checkpoint(checkpoint_id, cid, trigger_event, metadata or {})
            await digital_twin.save()
            
            logger.info(f"Learning checkpoint created: {checkpoint_id}")
            return checkpoint_id
            
        except Exception as e:
            logger.error(f"Checkpoint creation failed: {e}")
            raise
    
    async def analyze_learning_patterns(self, twin_id: str) -> Dict[str, Any]:
        """Analyze learning patterns and generate insights"""
        try:
            digital_twin = await DigitalTwin.find_one({"twin_id": twin_id})
            if not digital_twin:
                raise ValueError(f"Digital twin not found: {twin_id}")
            
            insights = {
                "learning_style_analysis": {},
                "performance_trends": {},
                "skill_development": {},
                "recommendations": []
            }
            
            # Analyze learning style
            if digital_twin.learning_progress:
                completion_times = []
                quiz_scores = []
                
                for progress in digital_twin.learning_progress:
                    if progress.completion_date and progress.start_date:
                        duration = (progress.completion_date - progress.start_date).days
                        completion_times.append(duration)
                    
                    quiz_scores.extend(progress.quiz_scores)
                
                if completion_times:
                    avg_completion_time = sum(completion_times) / len(completion_times)
                    insights["learning_style_analysis"]["avg_completion_time_days"] = avg_completion_time
                    
                    if avg_completion_time < 7:
                        insights["learning_style_analysis"]["pace"] = "fast"
                    elif avg_completion_time < 14:
                        insights["learning_style_analysis"]["pace"] = "moderate"
                    else:
                        insights["learning_style_analysis"]["pace"] = "deliberate"
                
                if quiz_scores:
                    avg_quiz_score = sum(quiz_scores) / len(quiz_scores)
                    insights["performance_trends"]["avg_quiz_score"] = avg_quiz_score
                    insights["performance_trends"]["quiz_attempts"] = len(quiz_scores)
            
            # Analyze skill development
            if digital_twin.skill_assessments:
                skill_levels = {}
                for assessment in digital_twin.skill_assessments:
                    skill_levels[assessment.skill_name] = {
                        "proficiency": assessment.proficiency_level,
                        "score": assessment.assessment_score,
                        "verified": assessment.verified
                    }
                
                insights["skill_development"]["skills"] = skill_levels
                insights["skill_development"]["verified_count"] = len(digital_twin.verified_skills)
                insights["skill_development"]["total_skills"] = len(digital_twin.skill_assessments)
            
            # Generate recommendations
            recommendations = []
            
            if digital_twin.current_modules:
                recommendations.append({
                    "type": "continue_learning",
                    "message": f"You have {len(digital_twin.current_modules)} modules in progress. Continue learning!",
                    "priority": "high"
                })
            
            if len(digital_twin.verified_skills) < 3:
                recommendations.append({
                    "type": "skill_verification",
                    "message": "Consider getting your skills verified to earn NFT certificates",
                    "priority": "medium"
                })
            
            insights["recommendations"] = recommendations
            
            # Update AI insights in twin
            digital_twin.ai_insights = insights
            await digital_twin.save()
            
            return insights
            
        except Exception as e:
            logger.error(f"Learning pattern analysis failed: {e}")
            return {}
    
    async def _schedule_blockchain_anchor(self, twin_id: str, cid: str, operation_type: str):
        """Schedule blockchain anchoring operation"""
        try:
            # For now, we'll just log this. In production, this would queue a blockchain operation
            anchor_data = {
                "twin_id": twin_id,
                "cid": cid,
                "operation": operation_type,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "scheduled"
            }
            
            # Store in Redis queue for blockchain worker
            await self.redis_service.set_cache(f"anchor_queue:{twin_id}:{cid}", anchor_data, 86400)
            
            logger.info(f"Blockchain anchoring scheduled: {twin_id} -> {cid}")
            
        except Exception as e:
            logger.error(f"Blockchain anchoring scheduling failed: {e}")
    
    async def verify_twin_integrity(self, twin_id: str) -> Dict[str, Any]:
        """Verify digital twin data integrity"""
        try:
            digital_twin = await DigitalTwin.find_one({"twin_id": twin_id})
            if not digital_twin:
                return {"valid": False, "error": "Twin not found"}
            
            integrity_check = {
                "valid": True,
                "checks": {
                    "database_twin_exists": True,
                    "latest_cid_accessible": False,
                    "ipfs_data_matches": False,
                    "blockchain_anchored": False
                },
                "issues": []
            }
            
            # Check if latest CID is accessible
            if digital_twin.latest_cid:
                ipfs_data = await self.ipfs_service.get_json(digital_twin.latest_cid)
                if ipfs_data:
                    integrity_check["checks"]["latest_cid_accessible"] = True
                    
                    # Check if IPFS data matches database
                    current_payload = digital_twin.get_canonical_payload()
                    if self._compare_twin_data(ipfs_data, current_payload):
                        integrity_check["checks"]["ipfs_data_matches"] = True
                    else:
                        integrity_check["issues"].append("IPFS data doesn't match database")
                        integrity_check["valid"] = False
                else:
                    integrity_check["issues"].append("Latest CID not accessible on IPFS")
                    integrity_check["valid"] = False
            else:
                integrity_check["issues"].append("No CID found for twin")
                integrity_check["valid"] = False
            
            # Check blockchain anchoring status
            if digital_twin.on_chain_tx_hash:
                integrity_check["checks"]["blockchain_anchored"] = True
            
            return integrity_check
            
        except Exception as e:
            logger.error(f"Twin integrity verification failed: {e}")
            return {"valid": False, "error": str(e)}
    
    def _compare_twin_data(self, data1: Dict[str, Any], data2: Dict[str, Any]) -> bool:
        """Compare two twin data structures for equality"""
        try:
            # Normalize timestamps and compare structure
            def normalize_data(data):
                if isinstance(data, dict):
                    return {k: normalize_data(v) for k, v in sorted(data.items()) if k != "timestamp"}
                elif isinstance(data, list):
                    return [normalize_data(item) for item in data]
                else:
                    return data
            
            norm_data1 = normalize_data(data1)
            norm_data2 = normalize_data(data2)
            
            return norm_data1 == norm_data2
            
        except Exception:
            return False
    
    async def export_twin_data(self, twin_id: str, format: str = "json") -> Dict[str, Any]:
        """Export complete twin data"""
        try:
            digital_twin = await DigitalTwin.find_one({"twin_id": twin_id})
            if not digital_twin:
                raise ValueError(f"Digital twin not found: {twin_id}")
            
            export_data = {
                "twin_metadata": {
                    "twin_id": twin_id,
                    "owner_did": digital_twin.owner_did,
                    "version": digital_twin.version,
                    "export_timestamp": datetime.now(timezone.utc).isoformat(),
                    "latest_cid": digital_twin.latest_cid
                },
                "twin_data": digital_twin.get_canonical_payload(),
                "version_history": await self.get_twin_history(twin_id, 100),
                "integrity_check": await self.verify_twin_integrity(twin_id)
            }
            
            if format == "json":
                return export_data
            else:
                # Could add other formats like XML, CSV, etc.
                raise ValueError(f"Unsupported export format: {format}")
                
        except Exception as e:
            logger.error(f"Twin data export failed: {e}")
            raise

# Standalone wrapper functions for backward compatibility
async def update_twin_and_pin_to_ipfs(twin_data: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy wrapper function for updating and pinning twin data"""
    try:
        service = DigitalTwinService()
        
        # Extract twin_id from data
        twin_id = twin_data.get('twin_id')
        if not twin_id:
            raise ValueError("twin_id is required in twin_data")
        
        # Find existing twin
        existing_twin = await DigitalTwin.find_one({"twin_id": twin_id})
        if not existing_twin:
            raise ValueError(f"Digital twin {twin_id} not found")
        
        # Update the twin
        updated_twin = await service.update_digital_twin(
            twin_id=twin_id,
            updates=twin_data,
            updated_by="system",
            change_description="Legacy API update"
        )
        
        return {
            "status": "success",
            "pinned_payload": updated_twin.dict() if updated_twin else twin_data,
            "version": updated_twin.version if updated_twin else 1,
            "ipfs_cid": updated_twin.latest_cid if updated_twin else None
        }
        
    except Exception as e:
        logger.error(f"Legacy twin update failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "pinned_payload": twin_data,
            "version": 1,
            "ipfs_cid": None
        }

def update_digital_twin(data: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy synchronous wrapper - DEPRECATED"""
    import asyncio
    
    try:
        # Run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(update_twin_and_pin_to_ipfs(data))
        loop.close()
        return result
    except Exception as e:
        return {"status": "error", "error": str(e)}