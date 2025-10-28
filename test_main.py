#!/usr/bin/env python3
"""
Minimal test version for Railway
"""
import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Test app is running"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "BookForMe Test API"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting test server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
