#!/usr/bin/env python3
"""
Railway entry point - alternative to main.py
"""
import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "BookForMe backend is running"}

@app.get("/healthz")
async def health_check_alt():
    """Alternative health check endpoint"""
    return {"status": "ok"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "BookForMe Backend API"}

if __name__ == "__main__":
    import uvicorn
    print("=== BookForMe Backend Starting ===")
    print(f"Python version: {os.sys.version}")
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