# LearnTwinChain Backend

## Mô tả
Backend cho hệ thống Digital Twin ứng dụng trong giáo dục, sử dụng FastAPI, lưu trạng thái học viên theo schema chuẩn, hỗ trợ phân tích và đề xuất cá nhân hóa.

---

## 1. Cài đặt môi trường ảo (venv)
```bash
cd learn-twin-chain/backend
python -m venv venv
# Kích hoạt venv:
venv\Scripts\activate  # Windows
# hoặc
source venv/bin/activate  # Linux/Mac
```

---

## 2. Cài đặt package
```bash
pip install -r requirements.txt
```

---

## 3. Chạy backend FastAPI
```bash
uvicorn digital_twin.main:app --reload
```
- API docs: http://127.0.0.1:8000/docs

---

## 4. Test API bằng Postman
- Tạo request POST tới: `http://127.0.0.1:8000/api/v1/update-twin`
- Header: `Content-Type: application/json`
- Body (raw, JSON):
```json
{
  "twin_id": "did:learntwin:student001",
  "owner_did": "did:learner:0xAbC123",
  "profile": {
    "full_name": "Nguyen Van A",
    "birth_year": 2002,
    "institution": "HUST",
    "program": "Computer Science",
    "enrollment_date": "2021-09-01"
  },
  "learning_state": {
    "progress": {"Python cơ bản": 0.95},
    "checkpoint_history": [
      {"module": "Python cơ bản", "completed_at": "2025-06-08", "tokenized": true, "nft_cid": "QmXYZabc..."}
    ],
    "current_modules": ["Python cơ bản"]
  },
  "skill_profile": {
    "programming_languages": {"Python": 0.8},
    "soft_skills": {"teamwork": 0.7}
  },
  "interaction_logs": {
    "last_llm_session": "2025-06-08T14:15:00Z",
    "most_asked_topics": ["đệ quy", "for loop"],
    "preferred_learning_style": "code-first"
  }
}
```
- Nếu schema thay đổi, hãy cập nhật file `learner_digital_twin.schema.json` trong `digital_twin/`.

---

## 5. Lưu ý khi chạy trên Windows
- Không dùng ký tự `:` trong tên file (đã tự động thay thế khi lưu twin_id).
- Nếu gặp lỗi ghi log, hãy tạo thư mục `logs/` trong `backend/`.

---

## 6. Kiểm tra file lưu trạng thái
- File sẽ được lưu tại: `learn-twin-chain/backend/data/digital_twins/dt_{twin_id}.json` (twin_id đã được chuyển thành tên file an toàn).

---

## 7. Các lệnh thường dùng
```bash
# Tạo venv
python -m venv venv
# Kích hoạt venv
venv\Scripts\activate  # Windows
# Cài package
pip install -r requirements.txt
# Chạy server
uvicorn digital_twin.main:app --reload
```

---

## 8. Liên hệ & hỗ trợ
- Nếu gặp lỗi, kiểm tra log, kiểm tra schema, kiểm tra các trường required.
- Nếu cần hỗ trợ thêm, liên hệ nhóm phát triển hoặc gửi log lỗi chi tiết. 

## 9. Test CID voi Pinata Cloud
- Tao tai khoan tren Pinata Cloud
- Create new API Key
- Tao file .env trong folder backend
- Dan thong tin sau vao
```
PINATA_API_KEY="YOUR_PINATA_API_KEY"
PINATA_SECRET_API_KEY="YOUR_PINATA_SECRET_API_KEY"
```
