"""
Verify if Smash Padel Clifton booking was written to database
Date: Dec 17, 2025
Time: 8 AM
"""
import asyncio
import sys
import os

# Add backend to path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.firestore import firestore_db
from google.cloud.firestore_v1.base_query import FieldFilter

async def check():
    print("\n" + "=" * 70)
    print("CHECKING SMASH PADEL CLIFTON BOOKING")
    print("=" * 70)
    print("\nLooking for:")
    print("  Vendor: Smash Padel Clifton (smash_padel_clifton)")
    print("  Date: 2025-12-14 (December 14, 2025)")
    print("  Time: 09:00 (9 AM)")
    print("  Expected Price: Rs 1500/hour")
    print("\n" + "-" * 70)
    
    # First, check all slots for smash_padel_clifton on Dec 14
    query_all = firestore_db.db.collection('slots')\
        .where(filter=FieldFilter('vendor_id', '==', 'smash_padel_clifton'))\
        .where(filter=FieldFilter('date', '==', '2025-12-14'))
    
    all_docs = list(query_all.stream())
    print(f"\nTotal slots found for Smash Padel on Dec 14: {len(all_docs)}")
    
    if not all_docs:
        print("\n[X] No slots found at all!")
        print("    The vendor might not have slots generated for this date.")
        return
    
    # Check for the specific 8 AM slot
    target_found = False
    confirmed_found = False
    
    for doc in all_docs:
        data = doc.to_dict()
        start_time = data.get('start_time')
        
        # Extract time
        if start_time:
            if hasattr(start_time, 'strftime'):
                time_str = start_time.strftime('%H:%M')
            else:
                time_str = str(start_time)[:5] if len(str(start_time)) >= 5 else str(start_time)
        else:
            time_str = 'N/A'
        
        # Check if this is the 9 AM slot
        if time_str == '09:00' or '09:00' in str(start_time):
            target_found = True
            status = data.get('status', 'unknown')
            
            print(f"\n>>> 9 AM SLOT FOUND:")
            print(f"    Slot ID: {doc.id}")
            print(f"    Time: {time_str}")
            print(f"    Status: {status.upper()}")
            print(f"    Price: Rs {data.get('price', 'N/A')}")
            
            if status == 'confirmed':
                confirmed_found = True
                print(f"    [SUCCESS] BOOKING CONFIRMED!")
                print(f"    Customer Name: {data.get('customer_name', 'N/A')}")
                print(f"    Customer Phone: {data.get('customer_phone', 'N/A')}")
                print(f"    Booking Source: {data.get('booking_source', 'N/A')}")
                print(f"    Updated At: {data.get('updated_at', 'N/A')}")
            else:
                print(f"    [FAILED] Status is '{status}' (Expected: confirmed)")
                print(f"    This means the booking was NOT written to database!")
    
    if not target_found:
        print("\n[X] 9 AM slot NOT FOUND in database")
        print("    Showing all available slots:")
        for doc in all_docs[:5]:  # Show first 5
            data = doc.to_dict()
            start_time = data.get('start_time')
            if hasattr(start_time, 'strftime'):
                time_str = start_time.strftime('%H:%M')
            else:
                time_str = str(start_time)
            print(f"    - {time_str}: {data.get('status')}")
    
    print("\n" + "-" * 70)
    print("\nRESULT:")
    if confirmed_found:
        print("  [SUCCESS] Booking WAS written to database!")
    else:
        print("  [FAILED] Booking was NOT written to database!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    asyncio.run(check())
