"""
Master seed script for populating all Firestore collections
Run this script to populate the database with test data
"""

import os
import sys
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from google.cloud import firestore

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_firestore_client():
    from app.config import settings
    import json
    import tempfile
    
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
        else:
            raise FileNotFoundError(f"Firestore credentials not found at: {creds_file}")
    
    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)


def seed_users(db):
    from database.seed.users_data import USERS_DATA
    from database.schema import Collections
    
    logger.info("Seeding users collection...")
    
    for user in USERS_DATA:
        user_doc = {
            "phone": user["phone"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "vendor_id": user["vendor_id"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(Collections.USERS).document(user["id"]).set(user_doc)
        logger.info(f"  Created user: {user['name']}")
    
    logger.info(f"Seeded {len(USERS_DATA)} users")


def seed_vendors(db):
    from database.seed.vendors_data import VENDORS_DATA, get_vendor_default_payment
    from database.schema import Collections
    
    logger.info("Seeding vendors collection...")
    
    for vendor in VENDORS_DATA:
        vendor_doc = {
            "name": vendor["name"],
            "area": vendor["area"],
            "address": vendor["address"],
            "phone": vendor["phone"],
            "whatsapp_number": vendor["whatsapp_number"],
            "operating_hours": vendor["operating_hours"],
            "description": vendor.get("description", ""),
            "default_payment_id": get_vendor_default_payment(vendor["id"]),
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(Collections.VENDORS).document(vendor["id"]).set(vendor_doc)
        logger.info(f"  Created vendor: {vendor['name']}")
    
    logger.info(f"Seeded {len(VENDORS_DATA)} vendors")


def seed_resources(db):
    from database.seed.vendors_data import RESOURCES_DATA
    from database.schema import Collections
    
    logger.info("Seeding resources collection...")
    
    for resource in RESOURCES_DATA:
        resource_doc = {
            "vendor_id": resource["vendor_id"],
            "name": resource["name"],
            "capacity": resource["capacity"],
            "active": resource["active"]
        }
        db.collection(Collections.RESOURCES).document(resource["id"]).set(resource_doc)
        logger.info(f"  Created resource: {resource['name']} for {resource['vendor_id']}")
    
    logger.info(f"Seeded {len(RESOURCES_DATA)} resources")


def seed_services(db):
    from database.seed.vendors_data import SERVICES_DATA
    from database.schema import Collections
    
    logger.info("Seeding services collection...")
    
    for service in SERVICES_DATA:
        service_doc = {
            "vendor_id": service["vendor_id"],
            "sport_type": service["sport_type"],
            "name": service["name"],
            "duration_min": service["duration_min"],
            "pricing": service["pricing"],
            "active": service["active"]
        }
        db.collection(Collections.SERVICES).document(service["id"]).set(service_doc)
        logger.info(f"  Created service: {service['name']} ({service['sport_type']})")
    
    logger.info(f"Seeded {len(SERVICES_DATA)} services")


def seed_payment_accounts(db):
    from database.seed.vendors_data import PAYMENT_ACCOUNTS_DATA
    from database.schema import Collections
    
    logger.info("Seeding vendor_payment_accounts collection...")
    
    for account in PAYMENT_ACCOUNTS_DATA:
        account_doc = {
            "vendor_id": account["vendor_id"],
            "type": account["type"],
            "account_number": account["account_number"],
            "account_title": account["account_title"],
            "bank_name": account["bank_name"],
            "is_default": account["is_default"]
        }
        db.collection(Collections.VENDOR_PAYMENT_ACCOUNTS).document(account["id"]).set(account_doc)
        logger.info(f"  Created payment account: {account['type']} for {account['vendor_id']}")
    
    logger.info(f"Seeded {len(PAYMENT_ACCOUNTS_DATA)} payment accounts")


def seed_slots(db, days=14):
    from database.seed.slot_generator import generate_all_slots, apply_test_states, get_slot_statistics
    from database.seed.users_data import USERS_DATA
    from database.schema import Collections
    
    logger.info(f"Generating slots for {days} days...")
    
    start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    slots = generate_all_slots(start_date=start_date, days=days)
    
    logger.info(f"Generated {len(slots)} slots, applying test states...")
    slots = apply_test_states(slots, USERS_DATA)
    
    stats = get_slot_statistics(slots)
    logger.info(f"Slot statistics: {stats['by_status']}")
    
    logger.info("Seeding slots collection (this may take a while)...")
    
    batch_size = 500
    batch = db.batch()
    count = 0
    
    for i, slot in enumerate(slots):
        slot_doc = {
            "vendor_id": slot["vendor_id"],
            "service_id": slot["service_id"],
            "resource_id": slot["resource_id"],
            "date": slot["date"],
            "start_time": slot["start_time"],
            "end_time": slot["end_time"],
            "price": slot["price"],
            "status": slot["status"],
            "user_id": slot["user_id"],
            "payment_id": slot["payment_id"],
            "hold_expires_at": slot["hold_expires_at"],
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = db.collection(Collections.SLOTS).document(slot["id"])
        batch.set(doc_ref, slot_doc)
        count += 1
        
        if count >= batch_size:
            batch.commit()
            logger.info(f"  Committed batch of {count} slots ({i + 1}/{len(slots)})")
            batch = db.batch()
            count = 0
    
    if count > 0:
        batch.commit()
        logger.info(f"  Committed final batch of {count} slots")
    
    logger.info(f"Seeded {len(slots)} slots total")


def seed_payments(db):
    from database.seed.users_data import TEST_PAYMENTS_DATA
    from database.schema import Collections
    
    logger.info("Seeding payments collection...")
    
    for payment in TEST_PAYMENTS_DATA:
        payment_doc = {
            "slot_id": payment["slot_id"],
            "user_id": payment["user_id"],
            "vendor_id": payment["vendor_id"],
            "screenshot_url": payment["screenshot_url"],
            "amount_claimed": payment["amount_claimed"],
            "ocr_verified_amount": payment["ocr_verified_amount"],
            "status": payment["status"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(Collections.PAYMENTS).document(payment["id"]).set(payment_doc)
        logger.info(f"  Created payment: {payment['id']}")
    
    logger.info(f"Seeded {len(TEST_PAYMENTS_DATA)} payments")


def seed_all(days=14):
    logger.info("=" * 60)
    logger.info("Starting Firestore seed process")
    logger.info("=" * 60)
    
    try:
        db = get_firestore_client()
        logger.info("Firestore client initialized")
        
        seed_users(db)
        seed_vendors(db)
        seed_resources(db)
        seed_services(db)
        seed_payment_accounts(db)
        seed_slots(db, days=days)
        seed_payments(db)
        
        logger.info("=" * 60)
        logger.info("Seed process completed successfully")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"Seed process failed: {e}")
        raise


def clear_collections(db, collections_to_clear=None):
    from database.schema import Collections
    
    if collections_to_clear is None:
        collections_to_clear = [
            Collections.USERS,
            Collections.VENDORS,
            Collections.RESOURCES,
            Collections.SERVICES,
            Collections.SLOTS,
            Collections.PAYMENTS,
            Collections.VENDOR_PAYMENT_ACCOUNTS
        ]
    
    logger.warning("Clearing collections (this is destructive)...")
    
    for collection_name in collections_to_clear:
        docs = db.collection(collection_name).limit(500).stream()
        deleted = 0
        
        for doc in docs:
            doc.reference.delete()
            deleted += 1
        
        if deleted > 0:
            logger.info(f"  Deleted {deleted} documents from {collection_name}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed Firestore database")
    parser.add_argument("--days", type=int, default=14, help="Number of days to generate slots for")
    parser.add_argument("--clear", action="store_true", help="Clear existing data before seeding")
    
    args = parser.parse_args()
    
    if args.clear:
        db = get_firestore_client()
        clear_collections(db)
    
    seed_all(days=args.days)
