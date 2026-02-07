
import os
import sys
from datetime import datetime
import json

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.firestore import firestore_db

def get_schema(collection_name, limit=1):
    print(f"\n--- Collection: {collection_name} ---")
    docs = list(firestore_db.db.collection(collection_name).limit(limit).stream())
    if not docs:
        print(f"No documents found in {collection_name}")
        return
    
    for doc in docs:
        data = doc.to_dict()
        print(f"Example ID: {doc.id}")
        for key, value in data.items():
            print(f"  {key}: {value} (type: {type(value).__name__})")

def enumerate_collections():
    print("Enumerating top-level collections...")
    collections = firestore_db.db.collections()
    for col in collections:
        print(f" - {col.id}")

if __name__ == "__main__":
    print("FIRESTORE SCHEMA AUDIT")
    print("="*40)
    enumerate_collections()
    
    target_collections = ['vendors', 'slots', 'payments', 'services', 'resources', 'users']
    for col in target_collections:
        get_schema(col)
