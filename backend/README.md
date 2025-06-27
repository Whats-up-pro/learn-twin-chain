# Digital Twin System - LearnTwinChain

## Tổng quan

Hệ thống Digital Twin cho giáo dục, tích hợp blockchain và AI để theo dõi và quản lý quá trình học tập của sinh viên.

**Tech Stack:**
- **Backend**: FastAPI + Uvicorn
- **Frontend**: React + TypeScript + Vite
- **Database**: JSON files (có thể mở rộng sang SQLite/PostgreSQL)
- **Blockchain**: Web3 + Solidity (cho tương lai)
- **IPFS**: Pinata Cloud (cho tương lai)

## Cấu trúc hệ thống

### Backend (FastAPI)
- **Port**: 8000
- **API Base URL**: `http://localhost:8000`
- **Digital Twin Files**: `backend/data/digital_twins/`
- **User Data**: `backend/data/users/users.json`

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

## Quy trình hoạt động

### 1. Đăng ký tài khoản mới
Khi sinh viên đăng ký tài khoản mới:
1. Tạo user record trong `users.json`
2. **Tự động tạo file Digital Twin** với format: `dt_did_learntwin_{did}.json`
3. File Digital Twin chứa thông tin cơ bản và cấu trúc chuẩn

### 2. Cập nhật Digital Twin
- Khi sinh viên hoàn thành module → cập nhật `checkpoint_history`
- Khi có tương tác với AI → cập nhật `interaction_logs`
- Khi có skill mới → cập nhật `skill_profile`

### 3. School Dashboard
- Hiển thị danh sách tất cả Digital Twin
- Xem chi tiết từng sinh viên
- Theo dõi tiến độ học tập

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
        "nft_cid": "QmXyZa12bCdEf345GhIjKL678MnopQr9StUvWxYzA1BcDe"
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

### 3. Chạy hệ thống

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

### 🔄 Đang phát triển
- [ ] AI Tutor integration
- [ ] Blockchain integration cho credentials
- [ ] Real-time updates
- [ ] Advanced analytics

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

## Troubleshooting

### Lỗi thường gặp
1. **File không được tạo**: Kiểm tra quyền ghi thư mục `data/digital_twins/`
2. **API không trả về dữ liệu**: Kiểm tra LearningService có reload dữ liệu không
3. **Frontend không hiển thị**: Kiểm tra CORS và API endpoint
4. **Port conflicts**: Đảm bảo port 5173, 5180, 8000 không bị sử dụng
5. **Dependencies issues**: Đảm bảo đã cài đúng requirements.txt (không còn Flask)

### Debug
- Kiểm tra logs trong console
- Sử dụng script test để verify functionality
- Kiểm tra file JSON có đúng format không
- Verify API endpoints tại http://localhost:8000/docs
- Kiểm tra virtual environment đã activate chưa 