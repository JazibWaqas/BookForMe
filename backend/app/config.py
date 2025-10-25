"""
Configuration and settings management
Simplified for WhatsApp + Firestore workflow
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # FastAPI
    APP_NAME: str = "BookForMe Backend"
    DEBUG: bool = True
    PORT: int = 8000
    
    # AI/NLU (Gemini)
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-pro-latest"
    
    # WhatsApp (Twilio) - Optional for now
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Firestore (instead of PostgreSQL)
    FIRESTORE_PROJECT_ID: str
    FIRESTORE_CREDENTIALS_FILE: str = "./credentials/firestore-service-account.json"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @field_validator('DEBUG', mode='before')
    @classmethod
    def validate_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ('true', '1', 'yes', 'on')
        return bool(v)
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()