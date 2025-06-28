import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from digital_twin.api.twin_api import router as twin_router
from digital_twin.api.learning_api import router as learning_router
from digital_twin.api.analytics_api import router as analytics_router
from .config.config import config
from .utils import Logger
from pydantic import BaseModel
import json
from datetime import datetime

# Khởi tạo logger
logger = Logger("main")

USERS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'users', 'users.json')
DIGITAL_TWINS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'digital_twins')

class UserRegister(BaseModel):
    did: str
    name: str
    password: str
    avatarUrl: str = ""

class UserLogin(BaseModel):
    did: str
    password: str

def read_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except Exception:
            return []

def write_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def create_digital_twin_file(did: str, name: str):
    """Tạo file Digital Twin mới cho user đăng ký"""
    try:
        # Đảm bảo thư mục tồn tại
        os.makedirs(DIGITAL_TWINS_DIR, exist_ok=True)
        
        # Xử lý did để lấy phần identifier
        if did.startswith('did:learntwin:'):
            identifier = did.replace('did:learntwin:', '')
        else:
            identifier = did
        
        # Tạo twin_id từ did
        twin_id = f"did:learntwin:{identifier}"
        
        # Tạo file path
        filename = f"dt_did_learntwin_{identifier}.json"
        filepath = os.path.join(DIGITAL_TWINS_DIR, filename)
        
        # Tạo dữ liệu Digital Twin mẫu
        digital_twin_data = {
            "twin_id": twin_id,
            "owner_did": f"did:learner:{identifier}",
            "latest_cid": None,
            "profile": {
                "full_name": name,
                "birth_year": None,
                "institution": "BKU",
                "program": "Computer Science",
                "enrollment_date": datetime.now().strftime("%Y-%m-%d")
            },
            "learning_state": {
                "progress": {},
                "checkpoint_history": [],
                "current_modules": []
            },
            "skill_profile": {
                "programming_languages": {},
                "soft_skills": {}
            },
            "interaction_logs": {
                "last_llm_session": None,
                "most_asked_topics": [],
                "preferred_learning_style": "code-first"
            }
        }
        
        # Ghi file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(digital_twin_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Created Digital Twin file for {identifier}: {filepath}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating Digital Twin file for {did}: {str(e)}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Digital Twin...")
    yield
    # Shutdown
    logger.info("Shutting down Digital Twin...")

# Khởi tạo FastAPI app
app = FastAPI(
    title="LearnTwinChain",
    description="API for Digital Twin in Education",
    version="1.0.0",
    openapi_url=f"{config.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả origins trong development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các router
app.include_router(twin_router, prefix="/api/v1")
app.include_router(learning_router, prefix="/api/v1/learning")
app.include_router(analytics_router, prefix="/api/v1/analytics")

@app.get("/")
async def root():
    return {"message": "Welcome to LearnTwinChain API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/register")
async def register(user: UserRegister):
    users = read_users()
    if any(u['did'] == user.did for u in users):
        raise HTTPException(status_code=409, detail="User already exists")
    
    # Thêm user vào danh sách
    users.append(user.dict())
    write_users(users)
    
    # Tạo file Digital Twin
    if create_digital_twin_file(user.did, user.name):
        return {"message": "Registered successfully and Digital Twin created"}
    else:
        return {"message": "Registered successfully but failed to create Digital Twin"}

@app.post("/login")
async def login(user: UserLogin):
    users = read_users()
    found = next((u for u in users if u['did'] == user.did and u['password'] == user.password), None)
    if not found:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "did": found['did'],
        "name": found['name'],
        "avatarUrl": found.get('avatarUrl', ''),
        "role": found.get('role', 'learner')
    }

@app.get("/api/v1/learning/students")
async def get_all_students():
    """Lấy danh sách tất cả students với thông tin từ cả users và digital twins"""
    try:
        users = read_users()
        students_data = []
        
        for user in users:
            # Xử lý did để lấy identifier
            if user['did'].startswith('did:learntwin:'):
                identifier = user['did'].replace('did:learntwin:', '')
            else:
                identifier = user['did']
            
            # Tìm file digital twin tương ứng
            twin_filename = f"dt_did_learntwin_{identifier}.json"
            twin_filepath = os.path.join(DIGITAL_TWINS_DIR, twin_filename)
            
            twin_data = None
            if os.path.exists(twin_filepath):
                try:
                    with open(twin_filepath, 'r', encoding='utf-8') as f:
                        twin_data = json.load(f)
                except Exception as e:
                    logger.error(f"Error reading twin file {twin_filename}: {str(e)}")
            
            # Nếu không có digital twin, tạo dữ liệu mặc định từ user info
            if not twin_data:
                twin_data = {
                    "twin_id": user['did'],
                    "owner_did": f"did:learner:{identifier}",
                    "latest_cid": None,
                    "profile": {
                        "full_name": user['name'],
                        "birth_year": None,
                        "institution": "BKU",
                        "program": "Computer Science",
                        "enrollment_date": datetime.now().strftime("%Y-%m-%d")
                    },
                    "learning_state": {
                        "progress": {},
                        "checkpoint_history": [],
                        "current_modules": []
                    },
                    "skill_profile": {
                        "programming_languages": {},
                        "soft_skills": {}
                    },
                    "interaction_logs": {
                        "last_llm_session": None,
                        "most_asked_topics": [],
                        "preferred_learning_style": "code-first"
                    }
                }
            
            students_data.append(twin_data)
        
        return {
            "total": len(students_data),
            "students": students_data
        }
        
    except Exception as e:
        logger.error(f"Error getting students: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/v1/sync-users-twins")
async def sync_users_and_twins():
    """Đồng bộ dữ liệu giữa users và digital twins"""
    try:
        users = read_users()
        synced_count = 0
        created_count = 0
        
        for user in users:
            # Xử lý did để lấy identifier
            if user['did'].startswith('did:learntwin:'):
                identifier = user['did'].replace('did:learntwin:', '')
            else:
                identifier = user['did']
            
            # Kiểm tra xem digital twin đã tồn tại chưa
            twin_filename = f"dt_did_learntwin_{identifier}.json"
            twin_filepath = os.path.join(DIGITAL_TWINS_DIR, twin_filename)
            
            if not os.path.exists(twin_filepath):
                # Tạo digital twin nếu chưa có
                if create_digital_twin_file(user['did'], user['name']):
                    created_count += 1
                    logger.info(f"Created missing Digital Twin for {identifier}")
            else:
                synced_count += 1
        
        return {
            "message": "Sync completed",
            "synced_existing": synced_count,
            "created_new": created_count,
            "total_users": len(users)
        }
        
    except Exception as e:
        logger.error(f"Error syncing users and twins: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def main():
    try:
        logger.info("Running Digital Twin...")
        uvicorn.run(
            "digital_twin.main:app",
            host=config.HOST,
            port=config.PORT,
            reload=config.DEBUG
        )
    except Exception as e:
        logger.error(f"Error running Digital Twin: {str(e)}")
        raise

if __name__ == "__main__":
    main() 