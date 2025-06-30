from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from ..services.ipfs_service import IPFSService
import json
import os

router = APIRouter()
ipfs_service = IPFSService()

# Mock public key for UIT (in production, this should be stored securely)
UIT_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE8tKwV1FQ9yDjMZrfsWyCACmOP5rDFCRx
I9CzHvAcbxfiVy6KtTnmRVEhmLjK65O+mONHRU4gZq/2r72mwt1z8Q==
-----END PUBLIC KEY-----"""

@router.get("/school-public-key")
async def get_school_public_key():
    """Get school's public key for verification"""
    try:
        return {
            "status": "success",
            "institution": "UIT",
            "public_key": UIT_PUBLIC_KEY,
            "algorithm": "ES256K"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get public key: {str(e)}")

@router.post("/upload")
async def upload_to_ipfs(data: Dict[str, Any] = Body(...), name: str = Body(None)):
    """Upload JSON data to IPFS"""
    try:
        cid = ipfs_service.upload_json(data, name)
        return {
            "status": "success",
            "message": "Data uploaded to IPFS successfully",
            "cid": cid,
            "url": ipfs_service.get_file_url(cid)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/url/{cid}")
async def get_ipfs_url(cid: str):
    """Get full URL for IPFS file"""
    try:
        url = ipfs_service.get_file_url(cid)
        return {
            "cid": cid,
            "url": url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get URL: {str(e)}")

@router.get("/download/{cid}")
async def download_from_ipfs(cid: str):
    """Download JSON data from IPFS"""
    try:
        data = ipfs_service.download_json(cid)
        return {
            "status": "success",
            "cid": cid,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.post("/upload-vc")
async def upload_verifiable_credential(vc_data: Dict[str, Any] = Body(...), student_did: str = Body(...), skill: str = Body(...)):
    """Upload Verifiable Credential to IPFS"""
    try:
        name = f"VC_{student_did}_{skill}"
        cid = ipfs_service.upload_json(vc_data, name)
        return {
            "status": "success",
            "message": "Verifiable Credential uploaded to IPFS",
            "cid": cid,
            "url": ipfs_service.get_file_url(cid),
            "name": name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VC upload failed: {str(e)}")

@router.post("/upload-did")
async def upload_did_document(did_document: Dict[str, Any] = Body(...), did: str = Body(...)):
    """Upload DID Document to IPFS"""
    try:
        name = f"DID_{did}"
        cid = ipfs_service.upload_json(did_document, name)
        return {
            "status": "success",
            "message": "DID Document uploaded to IPFS",
            "cid": cid,
            "url": ipfs_service.get_file_url(cid),
            "name": name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DID upload failed: {str(e)}") 