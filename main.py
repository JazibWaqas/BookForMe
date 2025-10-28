#!/usr/bin/env python3
"""
Railway deployment entry point
"""
import os
import subprocess

# Change to backend directory
os.chdir('backend')

# Start the FastAPI server
subprocess.run([
    'python', '-m', 'uvicorn', 
    'app.main:app', 
    '--host', '0.0.0.0', 
    '--port', os.environ.get('PORT', '8000')
])
