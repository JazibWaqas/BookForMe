import os
import sys
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import firebase_admin
from firebase_admin import auth, credentials
from google.cloud import firestore
from app.config import settings
import json
import tempfile

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_firestore_client():
    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        creds_data = json.loads(settings.GOOGLE_APPLICATION_CREDENTIALS)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(creds_data, f)
            temp_file = f.name
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file
    else:
        creds_file = settings.FIRESTORE_CREDENTIALS_FILE
        if not os.path.isabs(creds_file):
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            creds_file = os.path.join(backend_dir, 'credentials', 'firestore-service-account.json')
        
        if os.path.exists(creds_file):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_file
        else:
            raise FileNotFoundError(f"Firestore credentials not found at: {creds_file}")
            
    # Initialize Firebase Admin if not already initialized
    try:
        firebase_admin.get_app()
    except ValueError:
        # Use application default credentials (which uses GOOGLE_APPLICATION_CREDENTIALS)
        try:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': settings.FIRESTORE_PROJECT_ID,
            })
        except Exception as e:
            logger.warning(f"Using alternate initialization for Firebase Admin: {e}")
            cred = credentials.Certificate(os.environ['GOOGLE_APPLICATION_CREDENTIALS'])
            firebase_admin.initialize_app(cred)
        
    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)

def create_vendor_logins():
    try:
        db = get_firestore_client()
        
        # 1. Fetch all vendors
        vendors_ref = db.collection('vendors').stream()
        vendors = []
        for doc in vendors_ref:
            data = doc.to_dict()
            data['id'] = doc.id
            vendors.append(data)
            
        logger.info(f"Found {len(vendors)} vendors in Firestore")
        
        for vendor in vendors:
            vendor_id = vendor['id']
            # Remove any unusual characters from email
            clean_vendor_id = "".join([c if c.isalnum() else "_" for c in vendor_id])
            email = f"{clean_vendor_id}@email.com"
            password = "vendor123"
            
            logger.info(f"Processing vendor: {vendor_id} | Proposed Email: {email}")
            
            # 2. Check if Firebase Auth user exists, if not create
            auth_uid = None
            try:
                user = auth.get_user_by_email(email)
                auth_uid = user.uid
                logger.info(f"Auth user already exists for {email} with UID {auth_uid}")
            except Exception as e:
                # User doesn't exist, create them
                try:
                    user = auth.create_user(
                        email=email,
                        password=password,
                        display_name=vendor.get('name', vendor_id)
                    )
                    auth_uid = user.uid
                    logger.info(f"Created Auth user for {email} with UID {auth_uid}")
                except Exception as e2:
                    logger.error(f"Failed to create Auth user for {email}: {e2}")
                    continue
                    
            if auth_uid:
                # 3. Create/Update Firestore users document
                user_ref = db.collection('users').document(auth_uid)
                user_doc = user_ref.get()
                
                if user_doc.exists:
                    # Update existing
                    user_ref.update({
                        'role': 'vendor',
                        'vendor_id': vendor_id,
                        'email': email
                    })
                    logger.info(f"Updated Firestore user doc for {auth_uid} to role='vendor'")
                else:
                    # Create new
                    user_data = {
                        "phone": vendor.get('phone', ''),
                        "name": vendor.get('name', vendor_id),
                        "email": email,
                        "role": "vendor",
                        "vendor_id": vendor_id,
                        "created_at": firestore.SERVER_TIMESTAMP,
                        "last_active": firestore.SERVER_TIMESTAMP,
                        "is_online": False,
                        "points": 0,
                        "level": 1,
                        "skill_rating": 1000.0,
                        "avatar_url": "default_avatar.png",
                        "bio": "",
                        "stats": {
                            "matches_played": 0,
                            "wins": 0,
                            "losses": 0
                        },
                        "preferences": {
                            "notifications": True
                        },
                        "badges": []
                    }
                    user_ref.set(user_data)
                    logger.info(f"Created new Firestore user doc for {auth_uid}")
    except Exception as e:
        logger.error(f"Script failed: {e}")

if __name__ == '__main__':
    create_vendor_logins()
    logger.info("Done!")
