import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    print("Testing imports...")
    from database.models_social import PostCreate, MatchCreate
    from database.social_api import router
    from app.main import app
    print("Imports successful!")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

print("Social features backend setup verified.")
