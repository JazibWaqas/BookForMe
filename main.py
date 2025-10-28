#!/usr/bin/env python3
"""
Railway deployment entry point
This file helps Railway detect this as a Python project
"""
import os
import sys
import subprocess

def main():
    """Entry point for Railway deployment"""
    # Change to backend directory
    os.chdir('backend')
    
    # Start the FastAPI server
    cmd = [
        sys.executable, '-m', 'uvicorn', 
        'app.main:app', 
        '--host', '0.0.0.0', 
        '--port', os.environ.get('PORT', '8000')
    ]
    
    subprocess.run(cmd)

if __name__ == '__main__':
    main()
