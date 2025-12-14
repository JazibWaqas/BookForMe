"""
Quick script to check if booking was written to database
Checks for Ace Padel Club, Dec 17, 2025, 7 AM slot
"""
import asyncio
import sys
import os

# Add backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.firestore import firestore_db
from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime

async def check_specific_booking():
    """Check if the specific slot was booked"""
    try:
        print("\n" + "=" * 70)
        print("CHECKING SLOT STATUS IN DATABASE")
        print("=" * 70)
        print(f"\nLooking for:")
        print(f"  Vendor: ace_padel_dha")
        print(f"  Date: 2025-12-17")
        print(f"  Time: 07:00 (7 AM)")
        print(f"\n" + "-" * 70)
        
        # Query slots collection for this specific slot
        query = firestore_db.db.collection('slots')\
            .where(filter=FieldFilter('vendor_id', '==', 'ace_padel_dha'))\
            .where(filter=FieldFilter('date', '==', '2025-12-17'))\
            .limit(20)
        
        docs = list(query.stream())
        print(f"\nFound {len(docs)} slots for ace_padel_dha on 2025-12-17\n")
        
        found_target = False
        confirmed_count = 0
        
        for doc in docs:
            data = doc.to_dict()
            start_time = data.get('start_time')
            
            # Extract time from timestamp
            if start_time:
                if hasattr(start_time, 'strftime'):
                    time_str = start_time.strftime('%H:%M')
                else:
                    time_str = str(start_time)
            else:
                time_str = 'N/A'
            
            status = data.get('status', 'unknown')
            
            # Check if this is the 7 AM slot
            if time_str == '07:00' or '07:00' in str(start_time):
                found_target = True
                print(f">>> TARGET SLOT FOUND (7 AM):")
                print(f"   Slot ID: {doc.id}")
                print(f"   Status: {status}")
                print(f"   Time: {time_str}")
                
                if status == 'confirmed':
                    print(f"   [SUCCESS] STATUS: CONFIRMED")
                    print(f"   Customer Name: {data.get('customer_name', 'N/A')}")
                    print(f"   Customer Phone: {data.get('customer_phone', 'N/A')}")
                    print(f"   Booking Source: {data.get('booking_source', 'N/A')}")
                    print(f"   Updated At: {data.get('updated_at', 'N/A')}")
                else:
                    print(f"   [FAILED] STATUS: {status.upper()} (Expected: confirmed)")
                
                print()
            
            if status == 'confirmed':
                confirmed_count += 1
        
        if not found_target:
            print("[X] 7 AM slot NOT FOUND in database!")
            print("   The slot might not exist or has a different time format.")
        
        print("-" * 70)
        print(f"\nSummary:")
        print(f"  Total slots on 2025-12-17: {len(docs)}")
        print(f"  Confirmed bookings: {confirmed_count}")
        print(f"  Target slot (7 AM) found: {'[YES]' if found_target else '[NO]'}")
        print("\n" + "=" * 70)
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_specific_booking())

