"""Quick database status check"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from google.cloud import firestore
import json
import tempfile


def get_firestore_client():
    from app.config import settings
    
    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        creds_data = json.loads(settings.GOOGLE_APPLICATION_CREDENTIALS)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(creds_data, f)
            temp_file = f.name
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file
    else:
        creds_file = settings.FIRESTORE_CREDENTIALS_FILE
        if not os.path.isabs(creds_file):
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            creds_file = os.path.join(backend_dir, 'credentials', 'firestore-service-account.json')
        
        if os.path.exists(creds_file):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_file
    
    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)


def main():
    db = get_firestore_client()
    
    collections = [
        'users', 'vendors', 'resources', 'services', 'slots', 
        'payments', 'vendor_payment_accounts', 'conversation_states',
        'posts', 'post_comments', 'post_likes', 'matches', 
        'match_participants', 'conversations', 'messages', 
        'notifications', 'reviews', 'chatbot_sessions'
    ]
    
    print("DATABASE STATUS CHECK")
    print("=" * 50)
    print()
    print("CORE BOOKING COLLECTIONS:")
    
    core = ['users', 'vendors', 'resources', 'services', 'slots', 'payments', 'vendor_payment_accounts']
    for col in core:
        docs = list(db.collection(col).stream())
        print(f"  {col}: {len(docs)} documents")
    
    print()
    print("SOCIAL COLLECTIONS:")
    social = ['posts', 'post_comments', 'post_likes', 'matches', 'match_participants', 
              'conversations', 'messages', 'notifications', 'reviews', 'chatbot_sessions']
    for col in social:
        docs = list(db.collection(col).stream())
        print(f"  {col}: {len(docs)} documents")
    
    print()
    print("SLOT STATUS BREAKDOWN:")
    slots = db.collection('slots').stream()
    status_counts = {}
    for s in slots:
        data = s.to_dict()
        st = data.get('status', 'unknown')
        status_counts[st] = status_counts.get(st, 0) + 1
    for st, cnt in sorted(status_counts.items()):
        print(f"  {st}: {cnt}")
    
    print()
    print("USER DATA INTEGRITY CHECK (user_ahmad):")
    user = db.collection('users').document('user_ahmad').get()
    if user.exists:
        data = user.to_dict()
        print(f"  name: {data.get('name')}")
        print(f"  phone: {data.get('phone')}")
        print(f"  role: {data.get('role')}")
        print(f"  points: {data.get('points', 'NOT SET')}")
        print(f"  rank: {data.get('rank', 'NOT SET')}")
        print(f"  matches_played: {data.get('matches_played', 'NOT SET')}")
    
    print()
    print("VENDOR DATA INTEGRITY CHECK (ace_padel_dha):")
    vendor = db.collection('vendors').document('ace_padel_dha').get()
    if vendor.exists:
        data = vendor.to_dict()
        print(f"  name: {data.get('name')}")
        print(f"  location: {data.get('location')}")
        print(f"  has operating_hours: {'operating_hours' in data}")


if __name__ == "__main__":
    main()
