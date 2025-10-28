#!/usr/bin/env python3
"""
Minimal test version for Railway - just health check
"""
import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "BookForMe backend is running"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "BookForMe Backend API"}

if __name__ == "__main__":
    import uvicorn
    # Get port from environment, default to 8000
    port = os.environ.get("PORT", "8000")
    # Convert to int and handle any issues
    try:
        port = int(port)
    except (ValueError, TypeError):
        port = 8000
    
    print(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)