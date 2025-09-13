"""
DID (Decentralized Identifier) utilities for blockchain-standard digital twin management
"""
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# DID format: did:method:identifier
# Our format: did:learntwin:username
DID_PATTERN = re.compile(r'^did:learntwin:[a-zA-Z0-9_]+$')

def create_learner_did(username: str) -> str:
    """
    Create a standardized DID for a learner based on username
    
    Args:
        username: Alphanumeric username (can include underscores)
    
    Returns:
        Standardized DID string
        
    Raises:
        ValueError: If username format is invalid
    """
    if not username:
        raise ValueError("Username cannot be empty")
    
    # Validate username format
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValueError("Username must contain only letters, numbers, and underscores")
    
    # Create DID
    did = f"did:learntwin:{username}"
    
    # Validate created DID
    if not is_valid_learner_did(did):
        raise ValueError(f"Generated DID is invalid: {did}")
    
    return did

def is_valid_learner_did(did: str) -> bool:
    """
    Validate if a DID follows our blockchain standard format
    
    Args:
        did: DID string to validate
    
    Returns:
        True if valid, False otherwise
    """
    if not did or not isinstance(did, str):
        return False
    
    return bool(DID_PATTERN.match(did))

def extract_username_from_did(did: str) -> Optional[str]:
    """
    Extract username from a learner DID
    
    Args:
        did: DID string (did:learntwin:username)
    
    Returns:
        Username if valid DID, None otherwise
    """
    if not is_valid_learner_did(did):
        return None
    
    # Split DID and return the username part
    parts = did.split(':')
    if len(parts) == 3 and parts[0] == 'did' and parts[1] == 'learntwin':
        return parts[2]
    
    return None

def normalize_did(did: str) -> str:
    """
    Normalize a DID to ensure consistent format
    
    Args:
        did: DID string (may have redundant did:learntwin: prefix)
    
    Returns:
        Properly formatted DID
    """
    if not did:
        return did
    
    # Remove redundant did:learntwin: prefixes
    if did.startswith('did:learntwin:did:learntwin:'):
        did = did.replace('did:learntwin:did:learntwin:', 'did:learntwin:', 1)
    
    # Ensure proper format
    if did.startswith('did:learntwin:'):
        return did
    else:
        # If it's just a username, create proper DID
        if re.match(r'^[a-zA-Z0-9_]+$', did):
            return f"did:learntwin:{did}"
    
    return did

def create_digital_twin_id(user_did: str) -> str:
    """
    Create a consistent digital twin ID from user DID
    
    Args:
        user_did: User's DID
    
    Returns:
        Digital twin ID (same as user DID in our system)
    """
    normalized_did = normalize_did(user_did)
    
    if not is_valid_learner_did(normalized_did):
        raise ValueError(f"Invalid user DID for digital twin creation: {user_did}")
    
    return normalized_did

def validate_blockchain_compatibility(did: str) -> dict:
    """
    Validate DID for blockchain compatibility and return detailed info
    
    Args:
        did: DID to validate
    
    Returns:
        Dict with validation results and blockchain compatibility info
    """
    result = {
        "valid": False,
        "blockchain_compatible": False,
        "format_correct": False,
        "username_valid": False,
        "issues": []
    }
    
    if not did or not isinstance(did, str):
        result["issues"].append("DID is empty or not a string")
        return result
    
    # Check format
    if is_valid_learner_did(did):
        result["format_correct"] = True
        
        # Extract and validate username
        username = extract_username_from_did(did)
        if username:
            result["username_valid"] = True
            result["username"] = username
            
            # Check blockchain compatibility
            # Username should be reasonable length for blockchain storage
            if len(username) <= 32:  # Reasonable limit for blockchain
                result["blockchain_compatible"] = True
                result["valid"] = True
            else:
                result["issues"].append("Username too long for blockchain storage (max 32 chars)")
        else:
            result["issues"].append("Could not extract valid username from DID")
    else:
        result["issues"].append("DID format does not match required pattern: did:learntwin:<username>")
    
    return result

def get_did_metadata(did: str) -> dict:
    """
    Get metadata about a DID for debugging and logging
    
    Args:
        did: DID string
    
    Returns:
        Dict with DID metadata
    """
    validation = validate_blockchain_compatibility(did)
    
    metadata = {
        "did": did,
        "method": "learntwin",
        "valid": validation["valid"],
        "blockchain_compatible": validation["blockchain_compatible"],
        "length": len(did) if did else 0
    }
    
    if validation.get("username"):
        metadata["username"] = validation["username"]
        metadata["username_length"] = len(validation["username"])
    
    if validation["issues"]:
        metadata["issues"] = validation["issues"]
    
    return metadata

# Blockchain-specific utilities

def get_blockchain_address_from_did(did: str) -> Optional[str]:
    """
    Generate a deterministic blockchain address representation from DID
    
    Args:
        did: Valid learner DID
    
    Returns:
        Blockchain-compatible address string or None if invalid
    """
    if not is_valid_learner_did(did):
        return None
    
    username = extract_username_from_did(did)
    if not username:
        return None
    
    # For blockchain compatibility, we could hash the username
    # or use it directly depending on the blockchain requirements
    # For now, we'll use the username directly
    return username

def create_twin_registry_key(did: str) -> str:
    """
    Create a blockchain registry key for digital twin storage
    
    Args:
        did: Valid learner DID
    
    Returns:
        Registry key for blockchain storage
    
    Raises:
        ValueError: If DID is invalid
    """
    if not is_valid_learner_did(did):
        raise ValueError(f"Invalid DID for registry key creation: {did}")
    
    username = extract_username_from_did(did)
    return f"twin_{username}"
