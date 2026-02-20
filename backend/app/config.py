"""
Configuration and settings management
Simplified for WhatsApp + Firestore workflow
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
import os
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # FastAPI
    APP_NAME: str = "BookForMe Backend"
    DEBUG: bool = True
    PORT: int = 8000
    
    # AI/NLU (Groq - Qwen 3 32B for bilingual capabilities)
    GROQ_API_KEY: str = "dummy_key_for_dev"
    GROQ_MODEL: str = "qwen/qwen3-32b"
    
    # Legacy Gemini support (optional, deprecated)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # WhatsApp (Meta Business API)
    WHATSAPP_ACCESS_TOKEN: str = "dummy_token"
    WHATSAPP_PHONE_NUMBER_ID: str = "dummy_phone_id"
    WHATSAPP_VERIFY_TOKEN: str = "dummy_verify_token"
    
    # Firestore (instead of PostgreSQL)
    FIRESTORE_PROJECT_ID: str = "bookforme-dev"
    FIRESTORE_CREDENTIALS_FILE: str = "./backend/credentials/firestore-service-account.json"
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    # Authentication
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @field_validator('DEBUG', mode='before')
    @classmethod
    def validate_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ('true', '1', 'yes', 'on')
        return bool(v)
    
    # PATHS
    @property
    def BASE_DIR(self) -> str:
        # This is backend/
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    @property
    def PROJECT_ROOT(self) -> str:
        # This is JHAT/
        return os.path.dirname(self.BASE_DIR)
    
    @property
    def UPLOADS_DIR(self) -> str:
        # This is JHAT/uploads/
        path = os.path.join(self.PROJECT_ROOT, "uploads")
        os.makedirs(path, exist_ok=True)
        return path

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


# Global settings instance
settings = Settings()