"""
Clean up partner's non-sports additions from Firestore
Removes beach huts, farmhouses, salons, gaming zones while keeping sports courts
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


def clean_non_sports_vendors(db):
    """Delete vendors that are not sports courts"""
    print("🧹 Cleaning non-sports vendors...")

    # Categories to keep (sports only)
    sports_categories = ['Futsal Court', 'Padel Court']

    # Also keep vendors that don't have category field (original seed data)
    # These have 'area' field instead of 'category'

    deleted_count = 0
    kept_count = 0

    vendors = db.collection('vendors').stream()

    for vendor_doc in vendors:
        vendor_data = vendor_doc.to_dict()
        vendor_id = vendor_doc.id
        category = vendor_data.get('category')
        name = vendor_data.get('name', 'Unknown')

        # Keep if it's sports or if it doesn't have category field (original data)
        if category in sports_categories or not category:
            print(f"  ✅ Keeping: {name} ({category or 'original'})")
            kept_count += 1

            # Clean up availability subcollection for kept vendors
            availability_docs = db.collection('vendors').document(vendor_id).collection('availability').stream()
            for avail_doc in availability_docs:
                avail_doc.reference.delete()

        else:
            print(f"  🗑️  Deleting: {name} ({category})")

            # Delete availability subcollection first
            availability_docs = db.collection('vendors').document(vendor_id).collection('availability').stream()
            for avail_doc in availability_docs:
                avail_doc.reference.delete()

            # Delete vendor document
            vendor_doc.reference.delete()
            deleted_count += 1

    print(f"  📊 Deleted {deleted_count} non-sports vendors")
    print(f"  📊 Kept {kept_count} sports vendors")
    return deleted_count, kept_count


def clean_availability_slots_collection(db):
    """Delete the entire availability_slots collection created by partner"""
    print("🧹 Cleaning availability_slots collection...")

    deleted_count = 0
    batch_size = 500

    while True:
        docs = list(db.collection('availability_slots').limit(batch_size).stream())
        if not docs:
            break

        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
            deleted_count += 1

        batch.commit()
        print(f"  🗑️  Deleted batch of {len(docs)} slots")

    print(f"  📊 Total deleted from availability_slots: {deleted_count}")
    return deleted_count


def check_remaining_vendors(db):
    """Check what vendors remain after cleanup"""
    print("🔍 Checking remaining vendors...")

    vendors = db.collection('vendors').stream()
    categories = {}
    total = 0

    for vendor_doc in vendors:
        vendor_data = vendor_doc.to_dict()
        category = vendor_data.get('category', 'original')
        name = vendor_data.get('name', 'Unknown')

        if category not in categories:
            categories[category] = []
        categories[category].append(name)
        total += 1

    print(f"  📊 Total vendors remaining: {total}")
    for category, names in categories.items():
        print(f"  📋 {category}: {len(names)} vendors")
        if len(names) <= 3:  # Show sample if small
            for name in names:
                print(f"     - {name}")

    return categories


def main():
    """Main cleanup function"""
    print("🧹 BookForMe Partner Data Cleanup")
    print("=" * 50)

    try:
        print("🔌 Connecting to Firestore...")
        db = get_firestore_client()
        print("✅ Connected successfully")

        # Clean non-sports vendors
        deleted_vendors, kept_vendors = clean_non_sports_vendors(db)

        # Clean availability_slots collection
        deleted_slots = clean_availability_slots_collection(db)

        # Check what remains
        remaining_categories = check_remaining_vendors(db)

        print("\n🎉 Cleanup complete!")
        print("=" * 50)
        print("📊 Summary:")
        print(f"  • Non-sports vendors deleted: {deleted_vendors}")
        print(f"  • Sports vendors kept: {kept_vendors}")
        print(f"  • Availability slots deleted: {deleted_slots}")

        # Check if we have sports vendors
        sports_vendors = sum(len(names) for cat, names in remaining_categories.items()
                           if cat in ['Futsal Court', 'Padel Court', 'original'])

        if sports_vendors == 0:
            print("\n⚠️  WARNING: No sports vendors remaining!")
            print("   You may need to run: python backend/database/seed/seed_all.py --clear")
        elif sports_vendors > 0:
            print(f"\n✅ Found {sports_vendors} sports vendors remaining")
            print("   Your booking system should work with these vendors")

        print("\n🔄 Next steps:")
        print("1. Test your mobile app - it should show only sports courts")
        print("2. Test booking flow - should work with remaining vendors")
        print("3. If you want to reset completely, run: python backend/database/seed/seed_all.py --clear")

    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()