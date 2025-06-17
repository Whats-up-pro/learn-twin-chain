import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "LearnTwinChain Digital Twin"
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = True
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./digital_twin.db")
    
    # Blockchain settings
    BLOCKCHAIN_NETWORK: str = os.getenv("BLOCKCHAIN_NETWORK", "localhost")
    BLOCKCHAIN_PORT: int = int(os.getenv("BLOCKCHAIN_PORT", "8545"))
    
    # Digital Twin settings
    TWIN_UPDATE_INTERVAL: int = int(os.getenv("TWIN_UPDATE_INTERVAL", "60"))  # seconds
    MAX_HISTORY_LENGTH: int = int(os.getenv("MAX_HISTORY_LENGTH", "1000"))
    
    class Config:
        case_sensitive = True

config = Settings() 