
import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from google.cloud import firestore
from app.firestore import firestore_db

def forensic_audit():
    print("=" * 60)
    print("FINAL FORENSIC DB AUDIT - FIELD VERIFICATION")
    print("=" * 60)
    
    # List of collections we expect
    collections = [
        'users', 'vendors', 'slots', 'services', 'resources', 
        'payments', 'posts', 'comments', 'matches', 'relationships', 
        'conversations', 'conversation_states', 'notifications', 
        'vendor_payment_accounts', 'system_config', 'reviews'
    ]
    
    audit_report = {}

    for coll_name in collections:
        try:
            docs = list(firestore_db.db.collection(coll_name).limit(5).stream())
            if not docs:
                audit_report[coll_name] = "EMPTY OR MISSING"
                continue
            
            all_keys = set()
            for doc in docs:
                all_keys.update(doc.to_dict().keys())
            
            audit_report[coll_name] = sorted(list(all_keys))
        except Exception as e:
            audit_report[coll_name] = f"ERROR: {str(e)}"

    print(json.dumps(audit_report, indent=2))

if __name__ == "__main__":
    if firestore_db.db:
        forensic_audit()
    else:
        print("Firestore client not initialized.")
