"""
IPFS service for decentralized content storage
"""
import os
import json
import hashlib
import logging
from typing import Dict, Any, Optional, List, BinaryIO
from datetime import datetime, timezone
import requests
from requests_toolbelt.multipart.encoder import MultipartEncoder
import ipfshttpclient

logger = logging.getLogger(__name__)

class IPFSService:
    """IPFS service for content storage and retrieval"""
    
    def __init__(self):
        # Pinata configuration
        self.pinata_api_key = os.getenv("PINATA_API_KEY")
        self.pinata_secret_key = os.getenv("PINATA_SECRET_KEY")
        self.pinata_base_url = "https://api.pinata.cloud"
        
        # Web3.Storage configuration
        self.web3_storage_token = os.getenv("WEB3_STORAGE_TOKEN")
        
        # IPFS gateway configuration
        self.ipfs_gateway = os.getenv("IPFS_GATEWAY_URL", "https://gateway.pinata.cloud")
        self.cloudflare_gateway = os.getenv("CLOUDFLARE_IPFS_GATEWAY", "https://cloudflare-ipfs.com")
        
        # Local IPFS node configuration
        self.local_ipfs_url = os.getenv("IPFS_API_URL", "/ip4/127.0.0.1/tcp/5001")
        self.use_local_ipfs = False
        
        # Skip local IPFS node connection (using Pinata only)
        self.ipfs_client = None
        self.use_local_ipfs = False
        logger.info("Using Pinata IPFS service (local node disabled)")
    
    async def pin_json(self, data: Dict[str, Any], name: str = None, metadata: Dict[str, Any] = None) -> str:
        """Pin JSON data to IPFS and return CID"""
        try:
            # Serialize JSON with deterministic ordering
            json_str = json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
            json_bytes = json_str.encode('utf-8')
            
            # Generate content hash for verification
            content_hash = hashlib.sha256(json_bytes).hexdigest()
            
            # Use Pinata directly
            if self.pinata_api_key:
                cid = await self._pin_json_pinata(json_bytes, name, metadata, content_hash)
                if cid:
                    return cid
            
            # Fallback to Web3.Storage
            if self.web3_storage_token:
                cid = await self._pin_json_web3storage(json_bytes, name)
                if cid:
                    return cid
            
            raise Exception("No IPFS service available")
            
        except Exception as e:
            logger.error(f"JSON pinning failed: {e}")
            raise
    
    async def _pin_json_pinata(self, json_bytes: bytes, name: str = None, metadata: Dict[str, Any] = None, content_hash: str = None) -> str:
        """Pin JSON to Pinata"""
        try:
            url = f"{self.pinata_base_url}/pinning/pinJSONToIPFS"
            
            headers = {
                "pinata_api_key": self.pinata_api_key,
                "pinata_secret_api_key": self.pinata_secret_key,
                "Content-Type": "application/json"
            }
            
            # Parse JSON back for Pinata API
            data = json.loads(json_bytes.decode('utf-8'))
            
            payload = {
                "pinataContent": data,
                "pinataMetadata": {
                    "name": name or f"json_{datetime.now(timezone.utc).isoformat()}",
                    "keyvalues": {
                        "content_hash": content_hash,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        **(metadata or {})
                    }
                },
                "pinataOptions": {
                    "cidVersion": 1
                }
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            cid = result["IpfsHash"]
            
            logger.info(f"JSON pinned to Pinata: {cid}")
            return cid
            
        except Exception as e:
            logger.error(f"Pinata JSON pinning failed: {e}")
            return None
    
    async def _pin_json_web3storage(self, json_bytes: bytes, name: str = None) -> str:
        """Pin JSON to Web3.Storage"""
        try:
            url = "https://api.web3.storage/upload"
            
            headers = {
                "Authorization": f"Bearer {self.web3_storage_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, data=json_bytes, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            cid = result["cid"]
            
            logger.info(f"JSON pinned to Web3.Storage: {cid}")
            return cid
            
        except Exception as e:
            logger.error(f"Web3.Storage JSON pinning failed: {e}")
            return None
    
    async def pin_file(self, file_data: bytes, filename: str, metadata: Dict[str, Any] = None) -> str:
        """Pin file to IPFS and return CID"""
        try:
            # Use Pinata directly
            if self.pinata_api_key:
                cid = await self._pin_file_pinata(file_data, filename, metadata)
                if cid:
                    return cid
            
            # Fallback to Web3.Storage
            if self.web3_storage_token:
                cid = await self._pin_file_web3storage(file_data, filename)
                if cid:
                    return cid
            
            raise Exception("No IPFS service available")
            
        except Exception as e:
            logger.error(f"File pinning failed: {e}")
            raise
    
    async def _pin_file_pinata(self, file_data: bytes, filename: str, metadata: Dict[str, Any] = None) -> str:
        """Pin file to Pinata"""
        try:
            url = f"{self.pinata_base_url}/pinning/pinFileToIPFS"
            
            # Create multipart form data
            form_data = MultipartEncoder({
                'file': (filename, file_data, 'application/octet-stream'),
                'pinataMetadata': json.dumps({
                    "name": filename,
                    "keyvalues": {
                        "filename": filename,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        **(metadata or {})
                    }
                }),
                'pinataOptions': json.dumps({
                    "cidVersion": 1
                })
            })
            
            headers = {
                "pinata_api_key": self.pinata_api_key,
                "pinata_secret_api_key": self.pinata_secret_key,
                "Content-Type": form_data.content_type
            }
            
            response = requests.post(url, data=form_data, headers=headers, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            cid = result["IpfsHash"]
            
            logger.info(f"File pinned to Pinata: {cid}")
            return cid
            
        except Exception as e:
            logger.error(f"Pinata file pinning failed: {e}")
            return None
    
    async def _pin_file_web3storage(self, file_data: bytes, filename: str) -> str:
        """Pin file to Web3.Storage"""
        try:
            url = "https://api.web3.storage/upload"
            
            headers = {
                "Authorization": f"Bearer {self.web3_storage_token}",
            }
            
            files = {
                'file': (filename, file_data, 'application/octet-stream')
            }
            
            response = requests.post(url, files=files, headers=headers, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            cid = result["cid"]
            
            logger.info(f"File pinned to Web3.Storage: {cid}")
            return cid
            
        except Exception as e:
            logger.error(f"Web3.Storage file pinning failed: {e}")
            return None
    
    async def get_content(self, cid: str, use_gateway: str = "pinata") -> Optional[bytes]:
        """Retrieve content from IPFS by CID"""
        try:
            # Use gateway directly
            if use_gateway == "cloudflare":
                url = f"{self.cloudflare_gateway}/ipfs/{cid}"
            else:
                url = f"{self.ipfs_gateway}/ipfs/{cid}"
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            logger.debug(f"Content retrieved from gateway: {cid}")
            return response.content
            
        except Exception as e:
            logger.error(f"Content retrieval failed for CID {cid}: {e}")
            return None
    
    async def get_json(self, cid: str, use_gateway: str = "pinata") -> Optional[Dict[str, Any]]:
        """Retrieve JSON content from IPFS by CID"""
        try:
            content = await self.get_content(cid, use_gateway)
            if content:
                return json.loads(content.decode('utf-8'))
            return None
            
        except Exception as e:
            logger.error(f"JSON retrieval failed for CID {cid}: {e}")
            return None
    
    async def pin_directory(self, directory_path: str, name: str = None) -> str:
        """Pin entire directory to IPFS"""
        raise Exception("Directory pinning not supported with Pinata-only configuration")
    
    async def unpin_content(self, cid: str) -> bool:
        """Unpin content from IPFS"""
        try:
            # For Pinata, use their unpin API
            if self.pinata_api_key:
                url = f"{self.pinata_base_url}/pinning/unpin/{cid}"
                headers = {
                    "pinata_api_key": self.pinata_api_key,
                    "pinata_secret_api_key": self.pinata_secret_key
                }
                
                response = requests.delete(url, headers=headers, timeout=30)
                if response.status_code == 200:
                    logger.info(f"Content unpinned from Pinata: {cid}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Content unpinning failed for CID {cid}: {e}")
            return False
    
    async def get_pin_status(self, cid: str) -> Dict[str, Any]:
        """Get pinning status for CID"""
        try:
            status_info = {
                "cid": cid,
                "pinned": False,
                "size": None,
                "pin_date": None,
                "gateways": []
            }
            
            # Skip local IPFS check (using Pinata only)
            
            # Check if accessible via gateways
            for gateway_name, gateway_url in [("pinata", self.ipfs_gateway), ("cloudflare", self.cloudflare_gateway)]:
                try:
                    url = f"{gateway_url}/ipfs/{cid}"
                    response = requests.head(url, timeout=10)
                    if response.status_code == 200:
                        status_info["gateways"].append(gateway_name)
                        if "content-length" in response.headers:
                            status_info["size"] = int(response.headers["content-length"])
                except Exception:
                    pass
            
            return status_info
            
        except Exception as e:
            logger.error(f"Pin status check failed for CID {cid}: {e}")
            return {"cid": cid, "pinned": False, "error": str(e)}
    
    async def generate_metadata_for_nft(self, nft_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate standardized metadata for NFT"""
        try:
            metadata = {
                "name": nft_data.get("name", "Learning Achievement"),
                "description": nft_data.get("description", "Verified learning achievement on LearnTwinChain"),
                "image": nft_data.get("image_url", ""),
                "external_url": nft_data.get("external_url", ""),
                "attributes": nft_data.get("attributes", []),
                "animation_url": nft_data.get("animation_url", ""),
                "background_color": nft_data.get("background_color", ""),
                
                # Custom fields for educational NFTs
                "educational_data": {
                    "achievement_type": nft_data.get("achievement_type", ""),
                    "course_id": nft_data.get("course_id", ""),
                    "module_id": nft_data.get("module_id", ""),
                    "skill_name": nft_data.get("skill_name", ""),
                    "issuer": nft_data.get("issuer", ""),
                    "issue_date": nft_data.get("issue_date", ""),
                    "verification_method": "ipfs_storage"
                },
                
                # Verification data
                "verification": {
                    "verifiable_credential_cid": nft_data.get("vc_cid", ""),
                    "proof_cid": nft_data.get("proof_cid", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "version": "1.0"
                }
            }
            
            return metadata
            
        except Exception as e:
            logger.error(f"NFT metadata generation failed: {e}")
            raise
    
    async def create_nft_image(self, template_data: Dict[str, Any]) -> bytes:
        """Generate NFT image (placeholder implementation)"""
        # This would integrate with image generation service
        # For now, return placeholder
        try:
            # Create a simple text-based image or use template
            # In production, this would call an image generation service
            
            placeholder_svg = f"""
            <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="400" fill="#667eea"/>
                <text x="200" y="150" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
                    LearnTwinChain
                </text>
                <text x="200" y="200" text-anchor="middle" fill="white" font-size="18" font-family="Arial">
                    {template_data.get('achievement_type', 'Achievement')}
                </text>
                <text x="200" y="250" text-anchor="middle" fill="white" font-size="16" font-family="Arial">
                    {template_data.get('skill_name', template_data.get('course_name', 'Learning Achievement'))}
                </text>
                <text x="200" y="300" text-anchor="middle" fill="white" font-size="12" font-family="Arial">
                    Issued: {template_data.get('issue_date', datetime.now().strftime('%Y-%m-%d'))}
                </text>
            </svg>
            """
            
            return placeholder_svg.encode('utf-8')
            
        except Exception as e:
            logger.error(f"NFT image generation failed: {e}")
            raise
    
    def get_gateway_url(self, cid: str, gateway: str = "pinata") -> str:
        """Get gateway URL for CID"""
        if gateway == "cloudflare":
            return f"{self.cloudflare_gateway}/ipfs/{cid}"
        else:
            return f"{self.ipfs_gateway}/ipfs/{cid}"
    
    async def health_check(self) -> Dict[str, Any]:
        """Check IPFS service health"""
        health = {
            "local_ipfs": False,
            "pinata": False,
            "web3_storage": False,
            "gateways": {}
        }
        
        # Skip local IPFS check (disabled)
        health["local_ipfs"] = False
        
        # Check Pinata
        if self.pinata_api_key:
            try:
                url = f"{self.pinata_base_url}/data/testAuthentication"
                headers = {
                    "pinata_api_key": self.pinata_api_key,
                    "pinata_secret_api_key": self.pinata_secret_key
                }
                response = requests.get(url, headers=headers, timeout=10)
                health["pinata"] = response.status_code == 200
            except Exception:
                health["pinata"] = False
        
        # Check Web3.Storage
        if self.web3_storage_token:
            try:
                url = "https://api.web3.storage/"
                headers = {"Authorization": f"Bearer {self.web3_storage_token}"}
                response = requests.get(url, headers=headers, timeout=10)
                health["web3_storage"] = response.status_code == 200
            except Exception:
                health["web3_storage"] = False
        
        # Check gateways
        test_cid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"  # Hello World CID
        for gateway_name, gateway_url in [("pinata", self.ipfs_gateway), ("cloudflare", self.cloudflare_gateway)]:
            try:
                url = f"{gateway_url}/ipfs/{test_cid}"
                response = requests.head(url, timeout=10)
                health["gateways"][gateway_name] = response.status_code == 200
            except Exception:
                health["gateways"][gateway_name] = False
        
        return health
    
    # Backward compatibility methods
    def upload_json(self, data: Dict[str, Any], name: str = None) -> str:
        """Synchronous wrapper for pin_json - DEPRECATED"""
        import asyncio
        
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(self.pin_json(data, name))
            loop.close()
            return result
        except Exception as e:
            logger.error(f"Synchronous JSON upload failed: {e}")
            raise