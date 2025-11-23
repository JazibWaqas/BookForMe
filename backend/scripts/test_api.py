"""
Test API endpoints to verify Firestore data retrieval
"""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore import firestore_db


async def test_firestore_connection():
    """Test if we can query Firestore"""
    print("Testing Firestore connection...")
    
    try:
        if not firestore_db.db:
            print("ERROR: Firestore not initialized")
            return False
        
        # Test querying vendors
        vendors = firestore_db.db.collection('vendors').limit(5).stream()
        vendor_list = list(vendors)
        
        print(f"SUCCESS: Found {len(vendor_list)} vendors in database")
        
        if vendor_list:
            print("\nSample vendors:")
            for vendor in vendor_list[:5]:
                data = vendor.to_dict()
                print(f"  - {data.get('name', 'Unknown')} - {data.get('category', 'Unknown')} - {data.get('service_type', 'Unknown')}")
        
        # Test sport courts filter
        print("\nTesting sport courts filter...")
        sport_types = ['padel', 'tennis', 'pickleball', 'table_tennis', 'futsal']
        sport_courts = []
        
        for sport_type in sport_types:
            docs = firestore_db.db.collection('vendors').where('service_type', '==', sport_type).limit(3).stream()
            count = len(list(docs))
            if count > 0:
                sport_courts.append(f"{sport_type}: {count}")
        
        if sport_courts:
            print("SUCCESS: Sport courts found:")
            for item in sport_courts:
                print(f"  - {item}")
        else:
            print("WARNING: No sport courts found")
        
        # Test availability slots
        print("\nTesting availability slots...")
        slots = firestore_db.db.collection('availability_slots').limit(5).stream()
        slot_list = list(slots)
        print(f"SUCCESS: Found {len(slot_list)} availability slots")
        
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    asyncio.run(test_firestore_connection())

