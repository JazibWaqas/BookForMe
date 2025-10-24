"""
Configuration and settings management
Loads environment variables and provides app-wide configuration
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # FastAPI
    APP_NAME: str = "BookForMe Backend"
    DEBUG: bool = True
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str
    
    # AI/NLU (Gemini)
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-1.5-pro-latest"
    
    # WhatsApp (Twilio)
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str
    
    # Google Sheets
    GOOGLE_SHEETS_CREDENTIALS_FILE: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Google Sheets Sync
    SHEET_SYNC_INTERVAL_MINUTES: int = 2
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

