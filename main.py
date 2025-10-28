#!/usr/bin/env python3
"""
Railway deployment entry point
"""
import os
import subprocess
import sys

# Change to backend directory
os.chdir('backend')

# Get port from environment
port = os.environ.get('PORT', '8000')

# Start the FastAPI server
print(f"Starting server on port {port}")
subprocess.run([
    sys.executable, '-m', 'uvicorn', 
    'app.main:app', 
    '--host', '0.0.0.0', 
    '--port', port
])
