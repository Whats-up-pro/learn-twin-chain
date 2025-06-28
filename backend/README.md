# Digital Twin System - LearnTwinChain

## Tổng quan

Hệ thống Digital Twin cho giáo dục, tích hợp blockchain và AI để theo dõi và quản lý quá trình học tập của sinh viên với **NFT ERC-1155 cho module completion** và **ERC-721 cho learning achievements**.

**Tech Stack:**
- **Backend**: FastAPI + Uvicorn
- **Frontend**: React + TypeScript + Vite
- **Database**: JSON files (có thể mở rộng sang SQLite/PostgreSQL)
- **Blockchain**: Web3 + Solidity (ERC-1155 + ERC-721)
- **IPFS**: Pinata Cloud (cho metadata storage)

## 🚀 Tính năng Blockchain mới

### **ERC-1155 Module Progress NFTs**
- **Mục đích**: Theo dõi tiến độ hoàn thành module của người học
- **Tính năng**:
  - Mint NFT khi hoàn thành module
  - Tracking số lượng module đã hoàn thành
  - Hệ thống level up tự động (Novice → Master)
  - Metadata lưu trữ trên IPFS

### **ERC-721 Achievement NFTs**
- **Mục đích**: Chứng chỉ và thành tựu học tập
- **Loại chứng chỉ**:
  - `COURSE_COMPLETION`: Chứng chỉ hoàn thành khóa học
  - `SKILL_MASTERY`: Chứng chỉ thành thạo kỹ năng
  - `MILESTONE_REACHED`: Thành tựu đạt mốc quan trọng
  - `CERTIFICATION`: Chứng chỉ chuyên môn
  - `LEADERSHIP`: Thành tựu lãnh đạo
  - `INNOVATION`: Thành tựu đổi mới sáng tạo

### **ZKP Certificate Generation**
- **Mục đích**: Tạo chứng chỉ Zero-Knowledge Proof cho employer verification
- **Tính năng**:
  - Tổng hợp dữ liệu học tập từ blockchain
  - Tạo hash verification cho employer
  - Lưu trữ metadata trên IPFS
  - Hỗ trợ privacy-preserving verification

## Cấu trúc hệ thống

### Backend (FastAPI)
- **Port**: 8000
- **API Base URL**: `http://localhost:8000`
- **Digital Twin Files**: `backend/data/digital_twins/`
- **User Data**: `backend/data/users/users.json`
- **Smart Contracts**: `backend/contracts/`

### Frontend
- **Student Frontend**: `learn-twin-chain/` (React + TypeScript + Vite) - Port 5173
- **School Dashboard**: `frontend-dgt/` (React + Material-UI + Vite) - Port 5180

## API Endpoints

### Authentication
- `POST /register` - Đăng ký tài khoản mới
- `POST /login` - Đăng nhập

### Digital Twin Management
- `GET /api/v1/learning/students` - Lấy danh sách tất cả Digital Twin
- `GET /api/v1/learning/students/{twin_id}` - Lấy chi tiết Digital Twin
- `POST /api/v1/sync-users-twins` - Đồng bộ users và digital twins

### 🆕 Blockchain Integration
- `GET /api/v1/blockchain/status` - Kiểm tra trạng thái blockchain service
- `POST /api/v1/blockchain/mint/module-completion` - Mint ERC-1155 NFT cho module completion
- `POST /api/v1/blockchain/mint/achievement` - Mint ERC-721 NFT cho achievement
- `POST /api/v1/blockchain/mint/course-completion` - Mint course completion certificate
- `POST /api/v1/blockchain/mint/skill-mastery` - Mint skill mastery certificate
- `GET /api/v1/blockchain/student/{address}/data` - Lấy dữ liệu blockchain của student
- `POST /api/v1/blockchain/checkpoint/register` - Đăng ký learning checkpoint
- `POST /api/v1/blockchain/achievement/check-eligibility` - Kiểm tra eligibility cho achievement
- `POST /api/v1/blockchain/verification/employer` - Tạo verification data cho employer
- `POST /api/v1/blockchain/certificate/zkp` - Tạo ZKP certificate
- `GET /api/v1/blockchain/achievement/{token_id}/verify` - Verify achievement validity
- `GET /api/v1/blockchain/achievements/types` - Lấy danh sách achievement types

## Smart Contracts

### **ModuleProgressNFT.sol** (ERC-1155)
```solidity
// Tính năng chính:
- mintModuleCompletion(): Mint NFT cho module completion
- getStudentProgress(): Lấy tiến độ học tập của student
- _checkAndUpdateLevel(): Tự động level up
- _calculateLevel(): Tính toán level dựa trên số module hoàn thành
```

### **LearningAchievementNFT.sol** (ERC-721)
```solidity
// Tính năng chính:
- mintAchievement(): Mint achievement NFT
- mintCourseCompletion(): Mint course completion certificate
- mintSkillMastery(): Mint skill mastery certificate
- checkAchievementValidity(): Kiểm tra tính hợp lệ
- revokeAchievement(): Thu hồi achievement
```

### **DigitalTwinRegistry.sol**
```solidity
// Tính năng chính:
- logTwinUpdate(): Log cập nhật digital twin
- getLatestTwinDataLog(): Lấy log mới nhất
- getAllTwinDataLogs(): Lấy tất cả logs
```

## Quy trình hoạt động

### 1. Đăng ký tài khoản mới
Khi sinh viên đăng ký tài khoản mới:
1. Tạo user record trong `users.json`
2. **Tự động tạo file Digital Twin** với format: `dt_did_learntwin_{did}.json`
3. File Digital Twin chứa thông tin cơ bản và cấu trúc chuẩn

### 2. Cập nhật Digital Twin
- Khi sinh viên hoàn thành module → cập nhật `checkpoint_history` + **Mint ERC-1155 NFT**
- Khi có tương tác với AI → cập nhật `interaction_logs`
- Khi có skill mới → cập nhật `skill_profile`
- Khi đạt thành tựu → **Mint ERC-721 NFT**

### 3. 🆕 Blockchain Integration
- **Module Completion**: Tự động mint ERC-1155 NFT khi hoàn thành module
- **Achievement System**: Mint ERC-721 NFT cho các thành tựu học tập
- **Level System**: Tự động level up dựa trên số module hoàn thành
- **Employer Verification**: Tạo ZKP certificate cho verification

### 4. School Dashboard
- Hiển thị danh sách tất cả Digital Twin
- Xem chi tiết từng sinh viên
- Theo dõi tiến độ học tập
- **🆕 Xem blockchain data và NFTs**

## Format Digital Twin File

```json
{
  "twin_id": "did:learntwin:student001",
  "owner_did": "did:learner:0xAbC123",
  "latest_cid": "QmPC3VFtrfBRYueiukA9ySpg5JGDmpiAkCwUTyqESUepDt",
  "profile": {
    "full_name": "Đoàn Minh Trung",
    "birth_year": 2002,
    "institution": "BKU",
    "program": "Computer Science",
    "enrollment_date": "2021-09-01"
  },
  "learning_state": {
    "progress": {
      "Python cơ bản": 0.95,
      "Data Structures": 1.0
    },
    "checkpoint_history": [
      {
        "module": "Python cơ bản",
        "completed_at": "2025-06-08",
        "tokenized": true,
        "nft_cid": "QmXyZa12bCdEf345GhIjKL678MnopQr9StUvWxYzA1BcDe",
        "blockchain_tx": "0x1234567890abcdef..."
      }
    ],
    "current_modules": ["Python cơ bản"]
  },
  "skill_profile": {
    "programming_languages": {"Python": 0.8},
    "soft_skills": {"teamwork": 0.7}
  },
  "interaction_logs": {
    "last_llm_session": "2025-06-08T21:15:00+07:00",
    "most_asked_topics": ["đệ quy", "for loop"],
    "preferred_learning_style": "code-first"
  },
  "blockchain_data": {
    "student_address": "0x1234567890123456789012345678901234567890",
    "module_progress_nfts": [
      {
        "token_id": 1,
        "module_id": "python_basics_001",
        "amount": 1,
        "metadata_uri": "ipfs://Qm..."
      }
    ],
    "achievement_nfts": [
      {
        "token_id": 1,
        "achievement_type": "COURSE_COMPLETION",
        "title": "Python Fundamentals",
        "metadata_uri": "ipfs://Qm..."
      }
    ]
  }
}
```

## Cài đặt và chạy hệ thống

### 1. Cài đặt dependencies
```bash
# Backend
cd learn-twin-chain/backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Student Frontend
cd learn-twin-chain
npm install

# School Dashboard
cd frontend-dgt
npm install
```

### 2. Cấu hình environment
```bash
# Copy file env.example và cấu hình
cd learn-twin-chain/backend
cp env.example .env
# Chỉnh sửa .env với thông tin thực tế
```

### 3. 🆕 Deploy Smart Contracts
```bash
# Deploy contracts lên testnet
cd learn-twin-chain/backend
python deploy_contracts.py

# Cập nhật .env với contract addresses
# Copy từ deployment.env vào .env
```

### 4. Chạy hệ thống

#### Cách 1: Khởi động toàn bộ hệ thống
```bash
cd learn-twin-chain
python start_system.py
```

#### Cách 2: Khởi động từng phần riêng biệt
```bash
# Backend
cd learn-twin-chain/backend
uvicorn digital_twin.main:app --host 0.0.0.0 --port 8000 --reload

# Student Frontend  
cd learn-twin-chain
npm run dev

# School Dashboard
cd frontend-dgt
npm run dev
```

### 5. 🆕 Test Blockchain Integration
```bash
# Test blockchain features
cd learn-twin-chain/backend
python test_blockchain_integration.py
```

## Truy cập hệ thống

- **Student Frontend**: http://localhost:5173
- **School Dashboard**: http://localhost:5180  
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Tính năng chính

### ✅ Đã hoàn thành
- [x] Đăng ký/đăng nhập với tạo Digital Twin tự động
- [x] API trả về danh sách Digital Twin
- [x] School Dashboard hiển thị danh sách sinh viên
- [x] Cập nhật Digital Twin khi hoàn thành module
- [x] Đồng bộ dữ liệu với file JSON
- [x] **Dọn dẹp hoàn toàn Flask, chỉ sử dụng FastAPI**
- [x] **Loại bỏ các thư viện không sử dụng (ipfshttpclient, etc.)**
- [x] **🆕 ERC-1155 Module Progress NFTs**
- [x] **🆕 ERC-721 Achievement NFTs**
- [x] **🆕 Smart Contract Deployment Script**
- [x] **🆕 Blockchain Service Integration**
- [x] **🆕 ZKP Certificate Generation**
- [x] **🆕 Employer Verification System**

### 🔄 Đang phát triển
- [ ] AI Tutor integration
- [ ] Real-time updates
- [ ] Advanced analytics
- [ ] Frontend blockchain integration
- [ ] Mobile app

## 🆕 Blockchain Configuration

### Environment Variables
```bash
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here

# Smart Contract Addresses
MODULE_PROGRESS_CONTRACT_ADDRESS=0x...
ACHIEVEMENT_CONTRACT_ADDRESS=0x...
REGISTRY_CONTRACT_ADDRESS=0x...

# IPFS Configuration (Pinata)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### Achievement Types
1. **COURSE_COMPLETION** (ERC-721): Chứng chỉ hoàn thành khóa học
2. **SKILL_MASTERY** (ERC-721): Chứng chỉ thành thạo kỹ năng (có expiration)
3. **MILESTONE_REACHED** (ERC-721): Thành tựu đạt mốc quan trọng
4. **CERTIFICATION** (ERC-721): Chứng chỉ chuyên môn (có expiration)
5. **LEADERSHIP** (ERC-721): Thành tựu lãnh đạo
6. **INNOVATION** (ERC-721): Thành tựu đổi mới sáng tạo

### Learning Levels (ERC-1155)
- **Level 1**: Novice (0-4 modules)
- **Level 2**: Beginner (5-9 modules)
- **Level 3**: Intermediate (10-14 modules)
- **Level 4**: Advanced (15-19 modules)
- **Level 5**: Master (20+ modules)

## Lưu ý quan trọng

1. **File naming**: Digital Twin files phải có format `dt_did_learntwin_{did}.json`
2. **Data consistency**: Mọi cập nhật phải được lưu vào file JSON
3. **API synchronization**: LearningService tự động reload dữ liệu khi có file mới
4. **Error handling**: Hệ thống có logging và error handling đầy đủ
5. **Port configuration**: 
   - Student Frontend: 5173 (Vite dev server)
   - School Dashboard: 5180 (Vite dev server)
   - Backend API: 8000 (FastAPI + Uvicorn)
6. **Tech Stack**: **Đã dọn dẹp hoàn toàn Flask, chỉ sử dụng FastAPI + Vite**
7. **🆕 Blockchain**: **Hỗ trợ đầy đủ ERC-1155 và ERC-721 với IPFS storage**

## Troubleshooting

### Lỗi thường gặp
1. **File không được tạo**: Kiểm tra quyền ghi thư mục `data/digital_twins/`
2. **API không trả về dữ liệu**: Kiểm tra LearningService có reload dữ liệu không
3. **Frontend không hiển thị**: Kiểm tra CORS và API endpoint
4. **Port conflicts**: Đảm bảo port 5173, 5180, 8000 không bị sử dụng
5. **Dependencies issues**: Đảm bảo đã cài đúng requirements.txt (không còn Flask)
6. **🆕 Blockchain errors**: Kiểm tra environment variables và contract addresses
7. **🆕 IPFS errors**: Kiểm tra Pinata API keys và network connection

### Debug
- Kiểm tra logs trong console
- Sử dụng script test để verify functionality
- Kiểm tra file JSON có đúng format không
- Verify API endpoints tại http://localhost:8000/docs
- Kiểm tra virtual environment đã activate chưa
- **🆕 Test blockchain integration**: `python test_blockchain_integration.py`
- **🆕 Check contract deployment**: `python deploy_contracts.py`