"""
Quick verification script to check if slots have UTC datetime objects
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database.seed.seed_all import get_firestore_client
from database.schema import Collections

db = get_firestore_client()
slot_docs = list(db.collection(Collections.SLOTS).limit(3).stream())

if not slot_docs:
    print("ERROR: No slots found")
else:
    print(f"SUCCESS: Found {len(slot_docs)} slots")
    print("\nVerifying first 3 slots:")
    
    for i, doc in enumerate(slot_docs, 1):
        slot = doc.to_dict()
        start_time = slot.get('start_time')
        
        print(f"\nSlot {i} (ID: {doc.id}):")
        print(f"  start_time type: {type(start_time).__name__}")
        
        if hasattr(start_time, 'tzinfo'):
            print(f"  start_time value: {start_time}")
            print(f"  timezone: {start_time.tzinfo}")
            print(f"  is UTC: {str(start_time.tzinfo) == 'UTC'}")
            
            import pytz
            PKT = pytz.timezone('Asia/Karachi')
            pkt_time = start_time.astimezone(PKT)
            print(f"  PKT equivalent: {pkt_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        else:
            print(f"  start_time value: {start_time}")
            print(f"  WARNING: Not a datetime object!")
