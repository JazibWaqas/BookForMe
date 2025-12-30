"""
Debug script to understand why slots aren't matching
"""
import asyncio
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.firestore import firestore_db
from google.cloud.firestore_v1.base_query import FieldFilter

async def debug_slot_matching():
    print("\n" + "=" * 70)
    print("DEBUG: Slot Time Matching Issue")
    print("=" * 70)
    
    # Check what slots exist for golden_court_dha on Dec 14
    vendor_id = 'golden_court_dha'
    date = '2025-12-14'
    requested_time = '09:00'
    
    print(f"\nQuerying database:")
    print(f"  Vendor: {vendor_id}")
    print(f"  Date: {date}")
    print(f"  Requested time: {requested_time}")
    print("\n" + "-" * 70)
    
    query = firestore_db.db.collection('slots')\
        .where(filter=FieldFilter('vendor_id', '==', vendor_id))\
        .where(filter=FieldFilter('date', '==', date))\
        .where(filter=FieldFilter('status', '==', 'available'))
    
    docs = list(query.stream())
    print(f"\nFound {len(docs)} available slots\n")
    
    if not docs:
        print("[X] No slots found! The date might not have slots generated.")
        return
    
    # Show all slots and their time formats
    print("Slot details:")
    for i, doc in enumerate(docs[:10], 1):
        data = doc.to_dict()
        start_time = data.get('start_time')
        
        print(f"\n{i}. Slot ID: {doc.id}")
        print(f"   start_time (raw): {start_time}")
        print(f"   start_time type: {type(start_time)}")
        
        # Try to extract time
        if start_time:
            if hasattr(start_time, 'strftime'):
                time_str = start_time.strftime('%H:%M')
                print(f"   start_time (formatted): {time_str}")
                print(f"   Match with {requested_time}? {time_str == requested_time}")
            else:
                print(f"   start_time is not a timestamp object")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    asyncio.run(debug_slot_matching())



