import os
import requests
import json
import time
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class IPFSService:
    def __init__(self):
        self.api_key = os.getenv('PINATA_API_KEY')
        self.secret_key = os.getenv('PINATA_SECRET_KEY')
        self.gateway = os.getenv('IPFS_GATEWAY', 'https://gateway.pinata.cloud/ipfs/')
        
    def upload_file(self, file_path: str, metadata: Dict[str, Any] = None) -> str:
        """Upload file to IPFS"""
        if not self.api_key:
            raise Exception("Pinata API key not configured")
            
        headers = {
            'pinata_api_key': self.api_key,
            'pinata_secret_api_key': self.secret_key
        }
        
        with open(file_path, 'rb') as f:
            files = {'file': f}
            
            if metadata:
                metadata_json = json.dumps(metadata)
                files['pinataMetadata'] = (None, metadata_json)
            
            response = requests.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                files=files,
                headers=headers
            )
            
        if response.status_code == 200:
            return response.json()['IpfsHash']
        else:
            raise Exception(f"Upload failed: {response.text}")
    
    def upload_json(self, data: Dict[str, Any], name: str = None) -> str:
        """Upload JSON data to IPFS"""
        if not self.api_key:
            raise Exception("Pinata API key not configured")
            
        headers = {
            'pinata_api_key': self.api_key,
            'pinata_secret_api_key': self.secret_key,
            'Content-Type': 'application/json'
        }
        
        metadata = {
            'pinataMetadata': {
                'name': name or f'data_{int(time.time())}',
                'keyvalues': {
                    'type': 'json_data',
                    'timestamp': str(int(time.time()))
                }
            },
            'pinataContent': data
        }
        
        response = requests.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            json=metadata,
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()['IpfsHash']
        else:
            raise Exception(f"Upload failed: {response.text}")
    
    def get_file_url(self, cid: str) -> str:
        """Get full URL for IPFS file"""
        return f"{self.gateway}{cid}"
    
    def download_json(self, cid: str) -> Dict[str, Any]:
        """Download JSON from IPFS"""
        url = self.get_file_url(cid)
        response = requests.get(url)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Download failed: {response.status_code}")
