"""
Seed system configuration
Creates the global system config document
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.firestore import firestore_db
from google.cloud import firestore
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_system_config():
    """Create system_config/global document"""
    try:
        config_data = {
            'schema_version': '1.0',
            'payment_verification_mode': 'test',  # 'test' or 'strict'
            'booking_lock_minutes': 10,
            'maintenance_mode': False,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        firestore_db.db.collection('system_config').document('global').set(config_data)
        logger.info("✅ System config created successfully")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creating system config: {e}")
        return False


if __name__ == "__main__":
    logger.info("🌱 Seeding system configuration...")
    success = seed_system_config()
    
    if success:
        logger.info("✅ System config seeding complete")
    else:
        logger.error("❌ System config seeding failed")
        sys.exit(1)
