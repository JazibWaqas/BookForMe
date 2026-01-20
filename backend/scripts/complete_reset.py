"""
Complete database reset - clears all collections thoroughly
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google.cloud import firestore
from app.config import settings
import json
import tempfile


def get_firestore_client():
    """Get Firestore client"""
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

    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)


def clear_collection_completely(db, collection_name):
    """Clear a collection completely by batching"""
    print(f"Clearing {collection_name}...")

    total_deleted = 0
    batch_size = 500

    while True:
        # Get batch of documents
        docs = list(db.collection(collection_name).limit(batch_size).stream())

        if not docs:
            break  # No more documents

        # Delete this batch
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
            total_deleted += 1

        # Commit batch
        batch.commit()
        print(f"  Deleted batch of {len(docs)} ({total_deleted} total)")

        # Safety check - don't loop forever
        if total_deleted > 10000:  # Emergency break
            print(f"  EMERGENCY BREAK: Deleted {total_deleted} documents, stopping to prevent infinite loop")
            break

    print(f"  Total deleted from {collection_name}: {total_deleted}")
    return total_deleted


def clear_all_collections(db):
    """Clear all collections that might contain data"""
    collections_to_clear = [
        'users',
        'vendors',
        'resources',
        'services',
        'slots',
        'payments',
        'vendor_payment_accounts',
        'availability_slots',  # Partner's collection
        # Social collections (leave these for now)
        # 'posts', 'post_comments', 'post_likes', 'matches',
        # 'match_participants', 'conversations', 'messages',
        # 'notifications', 'reviews', 'chatbot_sessions'
    ]

    print("Starting complete database reset...")
    print("This will clear ALL booking-related data")
    print("=" * 50)

    total_deleted = 0
    for collection in collections_to_clear:
        deleted = clear_collection_completely(db, collection)
        total_deleted += deleted

    print("=" * 50)
    print(f"Total documents deleted: {total_deleted}")

    return total_deleted


def verify_reset(db):
    """Verify all collections are empty"""
    print("Verifying reset...")

    collections_to_check = [
        'users', 'vendors', 'resources', 'services', 'slots',
        'payments', 'vendor_payment_accounts', 'availability_slots'
    ]

    all_empty = True
    for collection in collections_to_check:
        count = len(list(db.collection(collection).limit(1).stream()))
        if count > 0:
            print(f"  WARNING: {collection} still has {count} documents")
            all_empty = False
        else:
            print(f"  OK: {collection} is empty")

    return all_empty


def main():
    """Complete reset"""
    try:
        print("Factory Reset: BookForMe Database")
        print("=" * 50)

        print("Connecting to Firestore...")
        db = get_firestore_client()
        print("Connected successfully")

        # Clear all collections
        clear_all_collections(db)

        # Verify
        all_empty = verify_reset(db)

        if all_empty:
            print("\nSUCCESS: Complete database reset finished!")
            print("You can now run: python database/seed/seed_all.py --days 14")
        else:
            print("\nWARNING: Some collections may still have data")
            print("You may need to run this script again")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()