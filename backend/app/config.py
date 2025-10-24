"""
Configuration and settings management
Simplified for WhatsApp + Firestore workflow
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # FastAPI
    APP_NAME: str = "BookForMe Backend"
    DEBUG: bool = True
    PORT: int = 8000
    
    # AI/NLU (Gemini)
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-1.5-pro-latest"
    
    # WhatsApp (Twilio)
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str
    
    # Firestore (instead of PostgreSQL)
    FIRESTORE_PROJECT_ID: str
    FIRESTORE_CREDENTIALS_FILE: str = "./credentials/firestore-service-account.json"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()