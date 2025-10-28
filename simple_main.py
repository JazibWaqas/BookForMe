#!/usr/bin/env python3
"""
Minimal Railway deployment - just health check
"""
import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check():
    """Simple health check"""
    return {
        "status": "healthy",
        "message": "BookForMe backend is running"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "BookForMe Backend API"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
