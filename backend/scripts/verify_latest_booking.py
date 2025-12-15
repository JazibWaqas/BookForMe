"""
Verify latest booking: Golden Court DHA, Dec 15, 2025, 11:00 AM
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

async def verify():
    print("\n" + "=" * 70)
    print("VERIFYING SLOT STATUS IN DATABASE")
    print("=" * 70)
    print("\nLooking for:")
    print("  Vendor: golden_court_dha")
    print("  Date: 2025-12-15")
    print("  Time: 11:00 (11 AM)")
    print("\n" + "-" * 70)
    
    query = firestore_db.db.collection('slots')\
        .where(filter=FieldFilter('vendor_id', '==', 'golden_court_dha'))\
        .where(filter=FieldFilter('date', '==', '2025-12-15'))\
        .limit(50)
    
    docs = list(query.stream())
    print(f"\nFound {len(docs)} slots for golden_court_dha on 2025-12-15\n")
    
    found = False
    for doc in docs:
        data = doc.to_dict()
        start_time = data.get('start_time')
        
        if start_time:
            if hasattr(start_time, 'strftime'):
                time_str = start_time.strftime('%H:%M')
            else:
                time_str = str(start_time)[:5] if len(str(start_time)) >= 5 else str(start_time)
        else:
            time_str = 'N/A'
        
        status = data.get('status', 'unknown')
        
        if time_str == '11:00':
            found = True
            print(f">>> TARGET SLOT FOUND (11:00 AM):")
            print(f"    Slot ID: {doc.id}")
            print(f"    Status: {status.upper()}")
            print(f"    Time: {time_str}")
            print(f"    Price: Rs {data.get('price', 'N/A')}")
            
            if status == 'confirmed':
                print(f"\n    ✅ SUCCESS! STATUS IS 'CONFIRMED'")
                print(f"    Customer Name: {data.get('customer_name', 'N/A')}")
                print(f"    Customer Phone: {data.get('customer_phone', 'N/A')}")
                print(f"    Booking Source: {data.get('booking_source', 'N/A')}")
                print(f"    Updated At: {data.get('updated_at', 'N/A')}")
            else:
                print(f"\n    ❌ Status is '{status}' (Expected: confirmed)")
            print()
            break
    
    if not found:
        print("[!] 11:00 AM slot NOT FOUND. Showing all slots:")
        for doc in docs[:10]:
            data = doc.to_dict()
            start_time = data.get('start_time')
            if start_time and hasattr(start_time, 'strftime'):
                time_str = start_time.strftime('%H:%M')
            else:
                time_str = str(start_time)[:5] if start_time else 'N/A'
            status = data.get('status', 'unknown')
            print(f"   - {time_str}: {status}")
    
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(verify())
