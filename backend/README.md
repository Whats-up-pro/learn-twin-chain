# 🧠 LearnTwinChain Backend

Hệ thống Digital Twin cho giáo dục với tích hợp blockchain, AI, và zero-knowledge proofs.

## 🚀 Quick Start

```bash
# Clone và setup
git clone <repository-url>
cd learn-twin-chain/backend

# Quick setup (khuyến nghị)
python quick_setup.py

# Cấu hình environment
cp env.example .env
# Chỉnh sửa .env với credentials thật

# Khởi động backend
python start_backend.py
```

## 📋 Yêu cầu hệ thống

- **Python 3.9+** (khuyến nghị 3.11)
- **Node.js 18+** và npm
- **Docker & Docker Compose**
- **Git**

## 🏗️ Architecture

```
Backend Architecture
├── 🌐 FastAPI Application (Port 8000)
├── 📊 MongoDB (Database)  
├── 💾 Redis (Session & Cache)
├── 🧠 Milvus (Vector Database cho RAG)
├── 🤖 Gemini AI (Conversational AI)
├── 🔗 Blockchain (Smart Contracts)
├── 📁 IPFS (Decentralized Storage)
└── 🔐 ZK Circuits (Privacy-Preserving Proofs)
```

## 🎯 Tính năng chính

- ✅ **Digital Twin Management**: Theo dõi học tập cá nhân hóa
- ✅ **Blockchain Integration**: NFT cho thành tích và tiến độ  
- ✅ **AI Tutor**: Hỗ trợ học tập thông minh
- ✅ **RAG System**: Tìm kiếm và trả lời từ tài liệu
- ✅ **Zero-Knowledge Proofs**: Bảo mật thông tin học tập
- ✅ **IPFS Storage**: Lưu trữ phi tập trung
- ✅ **Email Integration**: Thông báo và xác thực
- ✅ **Session Management**: Đăng nhập an toàn

## 📁 Cấu trúc thư mục

```
backend/
├── 📄 SETUP.MD              # Hướng dẫn chi tiết
├── 🚀 quick_setup.py        # Script setup tự động
├── 📝 env.example           # Template environment variables
├── 🐳 docker-compose.yml    # Docker services
├── 📦 requirements.txt      # Python dependencies
├── 📦 package.json          # Node.js dependencies
├── 🎛️ start_backend.py      # Script khởi động
├── digital_twin/            # Core application
│   ├── api/                 # REST API endpoints
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── config/              # Configuration
│   └── utils/               # Utilities
├── contracts/               # Smart contracts
├── circuits/                # ZK circuits
├── rag/                     # RAG system
├── scripts/                 # Deployment scripts
├── test/                    # Test files
└── data/                    # Sample data
```

## ⚙️ Services cần thiết

### Database
- **MongoDB**: Primary database
- **Redis**: Session management và caching

### AI Services  
- **Google Gemini**: Conversational AI
- **Milvus/Zilliz**: Vector database cho RAG

### Blockchain
- **Polygon Amoy**: Testnet cho development
- **Alchemy/Infura**: RPC provider

### Storage
- **Pinata/Web3.Storage**: IPFS pinning service

### Communication
- **Gmail/SMTP**: Email service

## 🔧 Environment Variables

Các biến môi trường quan trọng:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/learntwinchain
REDIS_URL=redis://localhost:6379/0

# AI Services
GEMINI_API_KEY=your_gemini_api_key
MILVUS_URI=your_milvus_uri
MILVUS_USER=your_milvus_user
MILVUS_PASSWORD=your_milvus_password

# Blockchain
BLOCKCHAIN_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your_key
BLOCKCHAIN_PRIVATE_KEY=your_private_key

# IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Email
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Security
JWT_SECRET_KEY=your_jwt_secret
SESSION_SECRET_KEY=your_session_secret
```

## 🚀 Deployment

### Development
```bash
# Khởi động services
docker-compose up -d

# Chạy backend
python start_backend.py
```

### Production
```bash
# Build và deploy contracts
python scripts/deploy_contracts.py

# Upload documents cho RAG
python rag/upload_docs.py

# Khởi động với production settings
ENVIRONMENT=production python start_backend.py
```

## 🧪 Testing

```bash
# Test cơ bản
python test_redis.py
python check_env.py

# Test blockchain
python test/test_blockchain.py

# Test digital twin
python test/test_digital_twin.py

# Test ZK proofs
python test/test_zkp.py
```

## 📊 API Endpoints

Sau khi khởi động, truy cập:

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health
- **Authentication**: http://localhost:8000/api/v1/auth
- **Digital Twins**: http://localhost:8000/api/v1/twins
- **Learning**: http://localhost:8000/api/v1/learning
- **Blockchain**: http://localhost:8000/api/v1/blockchain

## 🔍 Troubleshooting

### Lỗi thường gặp:

1. **Port đã được sử dụng**: Thay đổi PORT trong .env
2. **MongoDB connection failed**: Kiểm tra Docker containers
3. **Gemini API errors**: Kiểm tra API key và quota
4. **Blockchain errors**: Kiểm tra RPC URL và private key
5. **Import errors**: Reinstall dependencies

### Debug commands:
```bash
# Kiểm tra services
docker-compose ps
docker-compose logs

# Kiểm tra Python environment  
pip list
python check_env.py

# Test connections
python test_redis.py
```

## 📚 Documentation

- 📄 **SETUP.MD**: Hướng dẫn cài đặt chi tiết
- 📁 **env.example**: Template biến môi trường  
- 🌐 **/docs**: API documentation (khi server chạy)
- 📝 **rag/README.md**: Hướng dẫn RAG system

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📞 Hỗ trợ

- 📧 **Email**: support@learntwinchain.com
- 📖 **Documentation**: Xem SETUP.MD
- 🐛 **Issues**: Tạo issue trên GitHub
- 💬 **Community**: Discord/Telegram

---

🔗 **Links**:
- [Frontend](../frontend-dashboard/)
- [Smart Contracts](./contracts/)
- [RAG System](./rag/)
- [Documentation](./docs/)

💡 **Tip**: Sử dụng `python quick_setup.py` để setup nhanh chóng!