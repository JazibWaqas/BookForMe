#!/usr/bin/env python3
"""
Railway deployment entry point - imports from backend structure
"""
import os
import sys

# Add backend to Python path
sys.path.insert(0, 'backend')

# Fix Firestore credentials path for Railway deployment
os.environ['FIRESTORE_CREDENTIALS_FILE'] = './backend/credentials/firestore-service-account.json'

# Import the main FastAPI app from backend
from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    print("=== BookForMe Backend Starting ===")
    print(f"Python version: {sys.version}")
    print(f"Working directory: {os.getcwd()}")
    print(f"Environment PORT: {os.environ.get('PORT', 'NOT SET')}")
    
    try:
        port = int(os.environ.get("PORT", 8000))
    except (ValueError, TypeError):
        port = 8000
        print(f"PORT conversion failed, using default: {port}")
    
    print(f"Starting server on port {port}")
    print("=== Server should be running now ===")
    uvicorn.run(app, host="0.0.0.0", port=port)