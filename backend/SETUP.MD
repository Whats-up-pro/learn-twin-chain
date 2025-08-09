# 🚀 Hướng dẫn cài đặt và thiết lập Backend LearnTwinChain

Hệ thống Digital Twin cho giáo dục, tích hợp blockchain, AI và zero-knowledge proofs để theo dõi và quản lý quá trình học tập.

## 📋 Yêu cầu hệ thống

### Phần mềm cần thiết:
- **Python 3.9+** (khuyến nghị 3.11)
- **Node.js 18+** và npm
- **Docker & Docker Compose** (cho các dịch vụ cơ sở dữ liệu)
- **Git**

### Tài khoản bên ngoài cần thiết:
- **MongoDB Atlas** (hoặc MongoDB local)
- **Google Gemini API** (cho AI Tutor)
- **Zilliz Cloud/Milvus** (cho RAG system)
- **Pinata/Web3.Storage** (cho IPFS)
- **Alchemy/Infura** (cho blockchain RPC)
- **Gmail/SMTP** (cho email service)

## 🛠️ Cài đặt từng bước

### Cách 1: Quick Setup (Khuyến nghị)
```bash
git clone <repository-url>
cd learn-twin-chain/backend
python quick_setup.py
```

### Cách 2: Manual Setup

### 1. Clone repository và chuẩn bị
```bash
git clone <repository-url>
cd learn-twin-chain/backend
```

### 2. Cài đặt Python dependencies

#### Tạo môi trường ảo (khuyến nghị):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### Cài đặt packages:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Cài đặt Node.js dependencies (cho blockchain/circuits)
```bash
npm install
```

### 4. Cài đặt Hardhat dependencies (cho smart contracts)
```bash
npx hardhat compile
```

### 5. Thiết lập cơ sở dữ liệu

#### Cách 1: Sử dụng Docker (Khuyến nghị cho development)
```bash
# Khởi động MongoDB và Redis
docker-compose up -d mongodb redis

# Kiểm tra services đang chạy
docker ps
```

#### Cách 2: Cài đặt thủ công
- **MongoDB**: Tải từ https://www.mongodb.com/try/download/community
- **Redis**: Tải từ https://redis.io/downloads

### 6. Thiết lập các dịch vụ IPFS (tùy chọn)
```bash
# Khởi động IPFS node local (tùy chọn)
docker-compose up -d ipfs
```

## ⚙️ Cấu hình Environment Variables

### 1. Tạo file .env từ template:
```bash
cp env.example .env
# Hoặc từ config folder
cp config/env.example .env
```

### 2. Điền thông tin vào .env:

#### **Database Configuration**
```env
MONGODB_URI=mongodb://localhost:27017/learntwinchain
REDIS_URL=redis://localhost:6379/0
```

#### **JWT & Security**
```env
JWT_SECRET_KEY=your_jwt_secret_key_here
SESSION_SECRET_KEY=your_session_secret_key_here
```

#### **Email Service** (Gmail example)
```env
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com
```

#### **AI Services**
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Milvus/Zilliz Cloud (cho RAG)
MILVUS_URI=your_milvus_uri
MILVUS_USER=your_username
MILVUS_PASSWORD=your_password
```

#### **Blockchain Configuration**
```env
BLOCKCHAIN_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your_key
BLOCKCHAIN_PRIVATE_KEY=your_private_key_without_0x
```

#### **IPFS Configuration**
```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
```


## 🔧 Thiết lập các dịch vụ

### 1. Thiết lập MongoDB
- Tạo database `learntwinchain`
- Collections sẽ được tạo tự động khi chạy application

### 2. Thiết lập Redis
- Cấu hình cho session management và nonce storage
- Port mặc định: 6379

### 3. Thiết lập Gemini AI
1. Truy cập [Google AI Studio](https://aistudio.google.com/)
2. Tạo API key
3. Thêm vào .env file

### 4. Thiết lập Milvus/Zilliz (cho RAG system)
1. Tạo tài khoản tại [Zilliz Cloud](https://cloud.zilliz.com/)
2. Tạo cluster
3. Lấy URI, username, password

### 5. Thiết lập Pinata (IPFS)
1. Tạo tài khoản tại [Pinata](https://pinata.cloud/)
2. Tạo API keys
3. Thêm vào .env file

### 6. Thiết lập Blockchain
1. Tạo tài khoản Alchemy/Infura
2. Tạo app cho Polygon Amoy testnet
3. Tạo wallet và lấy private key
4. Lấy testnet tokens từ faucet

## 🏗️ Deploy Smart Contracts

### 1. Compile contracts:
```bash
npx hardhat compile
```

### 2. Deploy to testnet:
```bash
python scripts/deploy_contracts.py
```

### 3. Copy contract addresses:
```bash
python scripts/copy_abi.py
```

## 📝 Upload Documents cho RAG (tùy chọn)

### 1. Tạo sample documents:
```bash
python rag/create_sample_docs.py
```

### 2. Upload documents:
```bash
python rag/upload_docs.py
```

## 🚀 Chạy ứng dụng

### 1. Kiểm tra môi trường:
```bash
python check_env.py
```

### 2. Khởi động backend:
```bash
python start_backend.py
```

Hoặc chạy trực tiếp:
```bash
cd digital_twin
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Kiểm tra services:
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

## 🧪 Testing

### 1. Test Redis connection:
```bash
python test/test_redis.py
```

### 2. Test blockchain:
```bash
python test/test_blockchain.py
```

### 3. Test digital twin:
```bash
python test/test_digital_twin.py
```

### 4. Test ZKP circuits:
```bash
python test/test_zkp.py
```

## 🔍 Troubleshooting

### Lỗi thường gặp:

#### 1. MongoDB connection failed
```bash
# Kiểm tra MongoDB đang chạy
docker ps | grep mongo
# Hoặc
systemctl status mongod
```

#### 2. Redis connection failed
```bash
# Kiểm tra Redis đang chạy
docker ps | grep redis
redis-cli ping
```

#### 3. Gemini API không hoạt động
- Kiểm tra API key đúng format
- Kiểm tra quota và billing

#### 4. Milvus connection failed
- Kiểm tra URI, username, password
- Kiểm tra network connection

#### 5. Blockchain connection failed
- Kiểm tra RPC URL
- Kiểm tra private key format (không có 0x prefix)
- Kiểm tra balance wallet

#### 6. Import errors
```bash
# Cài đặt lại dependencies
pip install -r requirements.txt --force-reinstall
```

## 📊 Monitoring & Logs

### 1. View logs:
```bash
# Backend logs
tail -f logs/digital_twin.log

# Docker logs
docker-compose logs -f
```

### 2. Monitor services:
```bash
# Check all containers
docker ps -a

# Check specific service
docker logs learntwinchain_mongo
```

## 🔄 Development Commands

### Useful commands trong quá trình phát triển:

```bash
# Restart all services
docker-compose restart

# Rebuild containers
docker-compose up --build

# View database
mongo mongodb://localhost:27017/learntwinchain

# Connect to Redis
redis-cli

# Check Python dependencies
pip list

# Update requirements
pip freeze > requirements.txt

# Run specific tests
python -m pytest test/test_specific.py -v

# Generate circuits
python scripts/generate_circuits.py

# Migrate data
python scripts/migrate_courses_to_ipfs.py
```

## 📚 Architecture Overview

```
LearnTwinChain Backend
├── 🌐 FastAPI Application (Port 8000)
├── 📊 MongoDB (Database)
├── 💾 Redis (Session & Cache)
├── 🧠 Milvus (Vector Database for RAG)
├── 🤖 Gemini AI (Conversational AI)
├── 🔗 Blockchain (Smart Contracts)
├── 📁 IPFS (Decentralized Storage)
└── 🔐 ZK Circuits (Privacy-Preserving Proofs)
```

## 🎯 Các tính năng chính

- ✅ **Digital Twin Management**: Theo dõi học tập cá nhân hóa
- ✅ **Blockchain Integration**: NFT cho thành tích và tiến độ
- ✅ **AI Tutor**: Hỗ trợ học tập thông minh
- ✅ **RAG System**: Tìm kiếm và trả lời câu hỏi từ tài liệu
- ✅ **Zero-Knowledge Proofs**: Bảo mật thông tin học tập
- ✅ **IPFS Storage**: Lưu trữ phi tập trung
- ✅ **Email Integration**: Thông báo và xác thực
- ✅ **Session Management**: Đăng nhập an toàn

