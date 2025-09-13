#!/usr/bin/env python3
"""
Script to create missing digital twins for existing users
Run this to fix the "Digital twin not found" errors
"""
import asyncio
import logging
from typing import List

# Setup paths
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from digital_twin.config.database import connect_to_mongo
from digital_twin.models.user import User
from digital_twin.models.digital_twin import DigitalTwin
from digital_twin.services.digital_twin_service import DigitalTwinService
from digital_twin.utils.did_utils import create_digital_twin_id, validate_blockchain_compatibility

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def find_users_without_digital_twins() -> List[User]:
    """Find all users who don't have digital twins"""
    logger.info("Finding users without digital twins...")
    
    # Get all users
    all_users = await User.find().to_list()
    logger.info(f"Found {len(all_users)} total users")
    
    users_without_twins = []
    
    for user in all_users:
        try:
            # Try to find digital twin for this user
            twin_id = create_digital_twin_id(user.did)
            existing_twin = await DigitalTwin.find_one({"twin_id": twin_id})
            
            if not existing_twin:
                users_without_twins.append(user)
                logger.info(f"User {user.did} ({user.name}) missing digital twin")
            else:
                logger.debug(f"User {user.did} has digital twin")
                
        except Exception as e:
            logger.error(f"Error checking user {user.did}: {e}")
            users_without_twins.append(user)  # Add to fix list if there's an error
    
    logger.info(f"Found {len(users_without_twins)} users without digital twins")
    return users_without_twins

async def create_missing_digital_twins(users: List[User]) -> dict:
    """Create digital twins for users who don't have them"""
    twin_service = DigitalTwinService()
    results = {
        "created": 0,
        "failed": 0,
        "errors": []
    }
    
    for user in users:
        try:
            logger.info(f"Creating digital twin for {user.did} ({user.name})")
            
            # Validate user DID first
            validation = validate_blockchain_compatibility(user.did)
            if not validation["valid"]:
                logger.warning(f"Invalid DID for user {user.did}: {validation['issues']}")
                results["failed"] += 1
                results["errors"].append({
                    "user": user.did,
                    "error": f"Invalid DID: {validation['issues']}"
                })
                continue
            
            # Create digital twin
            digital_twin = await twin_service.create_digital_twin(user)
            
            logger.info(f"✅ Successfully created digital twin for {user.did}")
            logger.info(f"   Twin ID: {digital_twin.twin_id}")
            logger.info(f"   IPFS CID: {digital_twin.latest_cid}")
            
            results["created"] += 1
            
        except Exception as e:
            logger.error(f"❌ Failed to create digital twin for {user.did}: {e}")
            results["failed"] += 1
            results["errors"].append({
                "user": user.did,
                "error": str(e)
            })
    
    return results

async def verify_digital_twin_integrity():
    """Verify that all digital twins are properly created and accessible"""
    logger.info("Verifying digital twin integrity...")
    
    all_twins = await DigitalTwin.find().to_list()
    logger.info(f"Found {len(all_twins)} digital twins to verify")
    
    twin_service = DigitalTwinService()
    verification_results = {
        "valid": 0,
        "invalid": 0,
        "issues": []
    }
    
    for twin in all_twins:
        try:
            integrity_check = await twin_service.verify_twin_integrity(twin.twin_id)
            
            if integrity_check["valid"]:
                verification_results["valid"] += 1
                logger.debug(f"✅ {twin.twin_id} - integrity OK")
            else:
                verification_results["invalid"] += 1
                verification_results["issues"].append({
                    "twin_id": twin.twin_id,
                    "issues": integrity_check["issues"]
                })
                logger.warning(f"⚠️  {twin.twin_id} - integrity issues: {integrity_check['issues']}")
                
        except Exception as e:
            verification_results["invalid"] += 1
            verification_results["issues"].append({
                "twin_id": twin.twin_id,
                "error": str(e)
            })
            logger.error(f"❌ Error verifying {twin.twin_id}: {e}")
    
    return verification_results

async def main():
    """Main function to fix missing digital twins"""
    logger.info("🚀 Starting Digital Twin Fix Script")
    
    try:
        # Initialize database
        await connect_to_mongo()
        logger.info("✅ Database initialized")
        
        # Find users without digital twins
        users_without_twins = await find_users_without_digital_twins()
        
        if not users_without_twins:
            logger.info("🎉 All users already have digital twins!")
            
            # Still run verification
            verification_results = await verify_digital_twin_integrity()
            logger.info(f"Verification results: {verification_results['valid']} valid, {verification_results['invalid']} with issues")
            
            if verification_results["issues"]:
                logger.warning("Some digital twins have integrity issues:")
                for issue in verification_results["issues"]:
                    logger.warning(f"  - {issue}")
            
            return
        
        # Create missing digital twins
        logger.info(f"🔧 Creating digital twins for {len(users_without_twins)} users")
        creation_results = await create_missing_digital_twins(users_without_twins)
        
        # Report results
        logger.info("📊 Digital Twin Creation Results:")
        logger.info(f"  ✅ Successfully created: {creation_results['created']}")
        logger.info(f"  ❌ Failed: {creation_results['failed']}")
        
        if creation_results["errors"]:
            logger.info("📝 Errors encountered:")
            for error in creation_results["errors"]:
                logger.info(f"  - {error['user']}: {error['error']}")
        
        # Verify integrity
        verification_results = await verify_digital_twin_integrity()
        logger.info(f"🔍 Verification: {verification_results['valid']} valid, {verification_results['invalid']} with issues")
        
        logger.info("🏁 Digital twin fix script completed")
        
    except Exception as e:
        logger.error(f"💥 Script failed with error: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
