# Pinata IPFS Setup Guide

## 1. Đăng ký Pinata Account

1. Truy cập https://app.pinata.cloud/
2. Click "Sign Up" và tạo tài khoản
3. Verify email

## 2. Tạo API Keys cho IPFS

### Bước 1: Vào API Keys
1. Login vào Pinata Dashboard
2. Click "API Keys" trong menu bên trái
3. Click "Create New Key"

### Bước 2: Cấu hình API Key
1. **Name:** `LearnTwinChain-IPFS`
2. **Key Permissions:**
   - ✅ Pin File to IPFS
   - ✅ Pin JSON to IPFS
   - ✅ Unpin
   - ❌ Admin (không cần)
3. **Max Size:** 100MB (hoặc theo nhu cầu)
4. Click "Create"

### Bước 3: Lưu API Keys
Sau khi tạo, bạn sẽ thấy:
- **API Key:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Secret Key:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Lưu ý:** Secret Key chỉ hiển thị 1 lần, hãy copy ngay!

## 3. Cấu hình Environment Variables

### Tạo .env file:
```env
# Pinata IPFS Configuration
IPFS_PROVIDER=pinata
IPFS_API_URL=https://api.pinata.cloud
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_CHAIN_ID=31337
BLOCKCHAIN_PRIVATE_KEY=0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e

# Contract Addresses
DIGITAL_TWIN_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
LEARNING_ACHIEVEMENT_NFT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
MODULE_PROGRESS_NFT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ZKP_CERTIFICATE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_V1_STR=/api/v1
```

## 4. Test Configuration

### Test API Keys:
```bash
# Test authentication
curl -H "pinata_api_key: YOUR_API_KEY" \
     -H "pinata_secret_api_key: YOUR_SECRET_KEY" \
     https://api.pinata.cloud/data/testAuthentication
```

### Test với Python:
```python
import requests

headers = {
    'pinata_api_key': 'YOUR_API_KEY',
    'pinata_secret_api_key': 'YOUR_SECRET_KEY'
}

response = requests.get('https://api.pinata.cloud/data/testAuthentication', headers=headers)
print(response.json())
```

## 5. Upload Test

### Upload JSON:
```python
import requests
import json

data = {
    "name": "Test Certificate",
    "description": "Test certificate for Pinata",
    "student_did": "did:learntwin:student001",
    "certificate_type": "SKILL_ACHIEVEMENT",
    "metadata": {
        "skill": "Python Programming",
        "level": "Advanced",
        "score": 95
    }
}

headers = {
    'pinata_api_key': 'YOUR_API_KEY',
    'pinata_secret_api_key': 'YOUR_SECRET_KEY',
    'Content-Type': 'application/json'
}

metadata = {
    'pinataMetadata': {
        'name': 'test_certificate.json',
        'keyvalues': {
            'type': 'zkp_certificate',
            'timestamp': '2024-01-15'
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
    result = response.json()
    print(f"✅ Uploaded: {result['IpfsHash']}")
    print(f"🔗 Gateway URL: https://gateway.pinata.cloud/ipfs/{result['IpfsHash']}")
else:
    print(f"❌ Upload failed: {response.text}")
```

## 6. Troubleshooting

### Lỗi thường gặp:

1. **"Invalid API key"**
   - Kiểm tra API key và secret key
   - Đảm bảo copy đúng, không có khoảng trắng

2. **"Rate limit exceeded"**
   - Pinata free tier có giới hạn 100 requests/giờ
   - Upgrade lên paid plan nếu cần

3. **"File too large"**
   - Kiểm tra file size limit
   - Tăng max size trong API key settings

4. **"Authentication failed"**
   - Kiểm tra API key permissions
   - Đảm bảo key có quyền "Pin File to IPFS"

### Debug Commands:
```bash
# Test API key
curl -H "pinata_api_key: YOUR_KEY" https://api.pinata.cloud/data/testAuthentication

# Check rate limits
curl -H "pinata_api_key: YOUR_KEY" https://api.pinata.cloud/data/userPinnedDataTotal

# List pinned files
curl -H "pinata_api_key: YOUR_KEY" https://api.pinata.cloud/data/pinList
```

## 7. Security Best Practices

1. **Không commit API keys vào git**
   - Thêm `.env` vào `.gitignore`
   - Sử dụng environment variables

2. **Rotate API keys định kỳ**
   - Tạo key mới mỗi 3-6 tháng
   - Xóa key cũ

3. **Monitor usage**
   - Kiểm tra rate limits
   - Monitor storage usage

4. **Backup data**
   - IPFS data có thể bị mất nếu không pin
   - Backup quan trọng data 