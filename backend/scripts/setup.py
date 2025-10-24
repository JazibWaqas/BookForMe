"""
Setup script for BookForMe backend
Run this to initialize your development environment
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    """Main setup function"""
    print("🚀 BookForMe Backend Setup")
    print("=" * 50)
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or python_version.minor < 11:
        print("❌ Python 3.11+ required. Current version:", sys.version)
        return False
    
    print(f"✅ Python {python_version.major}.{python_version.minor} detected")
    
    # Create virtual environment
    if not os.path.exists("venv"):
        if not run_command("python -m venv venv", "Creating virtual environment"):
            return False
    else:
        print("✅ Virtual environment already exists")
    
    # Activate virtual environment and install requirements
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/Mac
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    # Install requirements
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing Python packages"):
        return False
    
    # Create .env file if it doesn't exist
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            run_command("copy .env.example .env" if os.name == 'nt' else "cp .env.example .env", "Creating .env file")
            print("📝 Please update .env file with your API keys")
        else:
            print("⚠️ .env.example not found")
    else:
        print("✅ .env file already exists")
    
    # Create credentials directory
    credentials_dir = Path("credentials")
    credentials_dir.mkdir(exist_ok=True)
    print("✅ Created credentials directory")
    
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    print("✅ Created logs directory")
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Update .env file with your API keys:")
    print("   - GEMINI_API_KEY (from Google AI Studio)")
    print("   - TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN (from Twilio)")
    print("   - FIRESTORE_PROJECT_ID (from Google Cloud)")
    print("2. Download Firestore service account JSON to ./credentials/")
    print("3. Run: python scripts/init_firestore.py")
    print("4. Run: uvicorn app.main:app --reload")
    print("5. Test WhatsApp webhook with ngrok")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
