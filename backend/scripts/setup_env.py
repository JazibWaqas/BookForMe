"""
Environment Setup Script
Helps set up the environment for testing
"""

import os
import sys

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    
    if os.path.exists(env_path):
        print(f"✅ .env file already exists at: {env_path}")
        return True
    
    env_content = """# BookForMe Backend Environment Configuration
# Fill in your actual values

# FastAPI Configuration
APP_NAME=BookForMe Backend
DEBUG=True
PORT=8000

# AI/NLU (Gemini API) - Using faster Flash model for better performance
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# WhatsApp (Meta Business API)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here

# Firestore (Google Cloud)
FIRESTORE_PROJECT_ID=your-firestore-project-id
FIRESTORE_CREDENTIALS_FILE=./backend/credentials/firestore-service-account.json
GOOGLE_APPLICATION_CREDENTIALS=./backend/credentials/firestore-service-account.json

# Logging
LOG_LEVEL=INFO
"""
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        print(f"✅ Created .env file at: {env_path}")
        print("📝 Please edit the .env file and add your actual API keys")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    print("\n🔍 Checking Dependencies")
    print("=" * 30)
    
    required_packages = [
        'google-generativeai',
        'pydantic',
        'pydantic-settings',
        'python-dotenv',
        'fastapi',
        'uvicorn'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - Not installed")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️ Missing packages: {missing_packages}")
        print("Install them with: pip install " + " ".join(missing_packages))
        return False
    else:
        print("\n✅ All required packages are installed")
        return True

def main():
    """Main setup function"""
    print("🔧 BookForMe Backend Environment Setup")
    print("=" * 50)
    
    # Create .env file
    env_created = create_env_file()
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    print("\n📋 Next Steps:")
    print("=" * 20)
    
    if not env_created:
        print("1. Create a .env file manually")
    
    print("2. Edit .env file and add your GEMINI_API_KEY")
    print("3. Run: python scripts/simple_nlu_test.py")
    print("4. Or run: python scripts/test_nlu.py for comprehensive testing")
    
    if not deps_ok:
        print("5. Install missing dependencies first")
    
    print("\n🎯 You're ready to test the NLU system!")

if __name__ == "__main__":
    main()
