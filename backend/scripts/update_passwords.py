import sys
import os
import bcrypt

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set dummy key for config validation
os.environ["GROQ_API_KEY"] = "dummy_key_for_scripts"

from app.firestore import firestore_db

db = firestore_db.db

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def main():
    print("Updating passwords for test users...")
    password_hash = hash_password("password123")
    
    # Update users created by populate_social (user_0 to user_7)
    for i in range(8):
        uid = f"user_{i}"
        doc_ref = db.collection('users').document(uid)
        doc = doc_ref.get()
        
        if doc.exists:
            doc_ref.update({
                "password_hash": password_hash,
                "role": "customer" # Ensure role is set
            })
            print(f"Updated password for {doc.get('email')} ({uid})")
        else:
            print(f"User {uid} not found.")

    print("Done! You can now login with:")
    print("Email: user0@example.com")
    print("Password: password123")

if __name__ == "__main__":
    main()
