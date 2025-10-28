#!/usr/bin/env python3
"""
Railway deployment entry point
"""
import os
import subprocess
import sys
import time

def main():
    """Main entry point with error handling"""
    try:
        # Change to backend directory
        os.chdir('backend')
        print("Changed to backend directory")
        
        # Get port from environment
        port = os.environ.get('PORT', '8000')
        print(f"Starting server on port {port}")
        
        # Check if required files exist
        if not os.path.exists('app/main.py'):
            print("ERROR: app/main.py not found!")
            sys.exit(1)
        
        # Start the FastAPI server
        subprocess.run([
            sys.executable, '-m', 'uvicorn', 
            'app.main:app', 
            '--host', '0.0.0.0', 
            '--port', port
        ])
        
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
