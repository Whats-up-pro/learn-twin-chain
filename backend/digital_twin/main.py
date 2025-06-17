import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from digital_twin.api.twin_api import router as twin_router
from digital_twin.api.learning_api import router as learning_router
from digital_twin.api.analytics_api import router as analytics_router
from .config.config import config
from .utils import Logger

# Khởi tạo logger
logger = Logger("main")

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