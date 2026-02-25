import os
import sys
import logging
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.auth_service import AuthService
from app.firestore import firestore_db

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def fix_passwords():
    # Make sure firestore is initialized
    auth_service = AuthService(firestore_db.db)
    
    password = "vendor123"
    hashed = auth_service.hash_password(password)
    
    # Get all users with role vendor
    users_ref = firestore_db.db.collection('users').where('role', '==', 'vendor').stream()
    
    count = 0
    for doc in users_ref:
        doc.reference.update({'password_hash': hashed})
        logger.info(f"Updated password_hash for vendor user: {doc.id}")
        count += 1
        
    logger.info(f"Fixed passwords for {count} vendor users")

if __name__ == '__main__':
    asyncio.run(fix_passwords())
