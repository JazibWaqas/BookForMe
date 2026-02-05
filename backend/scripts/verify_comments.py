import requests
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Setup Firestore (Direct DB check) - SKIPPED (Using API only)
# if not firebase_admin._apps:
#     cred = credentials.Certificate(r"c:\Users\tahah\OneDrive\Desktop\JHAT\backend\serviceAccountKey.json")
#     firebase_admin.initialize_app(cred)
# db = firestore.client()

API_URL = "http://127.0.0.1:8000"

def verify_comments():
    print("--- Verifying Comments System ---")
    
    # 1. Create a User (if not exists, or just use a known one)
    # For simplicity, we'll just simulate a user_id since our backend dev mode might rely on it
    # But wait, our API requires auth token usually. 
    # Let's bypass auth if we are running locally or use a test token if the backend requires it.
    # Looking at social_api.py: user_id: str = Depends(get_current_user_id)
    # We might need to mock this or generate a token. 
    # Alternatively, we can inspect `get_current_user_id` to see if it accepts a debug header.
    # Let's assume we can pass Authorization header if we login.
    
    # Prerequisite: Login
    print("Logging in...")
    login_payload = {"email": "test@example.com", "password": "password123"} 
    # Try to login, if fails, create user.
    try:
        resp = requests.post(f"{API_URL}/api/auth/login", json=login_payload)
        if resp.status_code != 200:
            # Register
            print("Registering test user...")
            reg_payload = {"email": "test@example.com", "password": "password123", "name": "Test User", "phone": "1234567890"}
            requests.post(f"{API_URL}/api/auth/register", json=reg_payload)
            resp = requests.post(f"{API_URL}/api/auth/login", json=login_payload)
            if resp.status_code != 200:
                print("Failed to login.")
                return
        
        token = resp.json().get("token")
        if not token:
             print("Error: No token received in login response")
             return
        headers = {"Authorization": f"Bearer {token}"}
        print("Logged in.")
        
        # 2. Create a Post
        print("Creating Post...")
        post_payload = {"content": "Test Post for Comments", "type": "general"}
        post_resp = requests.post(f"{API_URL}/api/social/posts/create", json=post_payload, headers=headers)
        if post_resp.status_code != 200:
             print(f"Failed to create post: {post_resp.text}")
             return
        post_id = post_resp.json()['id']
        print(f"Post created: {post_id}")
        
        # 3. Add a Comment
        print("Adding Comment...")
        comment_payload = {"content": "This is a test comment!"}
        comment_resp = requests.post(f"{API_URL}/api/social/posts/{post_id}/comments", json=comment_payload, headers=headers)
        
        if comment_resp.status_code == 200:
            print("Comment added successfully.")
            print(f"Response: {comment_resp.json()}")
        else:
            print(f"Failed to add comment: {comment_resp.status_code} - {comment_resp.text}")
            return

        # 4. Get Comments
        print("Fetching Comments...")
        get_resp = requests.get(f"{API_URL}/api/social/posts/{post_id}/comments", headers=headers)
        comments = get_resp.json()
        
        if len(comments) > 0 and comments[0]['content'] == "This is a test comment!":
            print("Verified: Comment retrieved successfully.")
        else:
            print(f"Verification Failed: Comments mismatch. {comments}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_comments()
