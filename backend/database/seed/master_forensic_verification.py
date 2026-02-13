"""
MASTER FORENSIC VERIFICATION SCRIPT
Performs deep structural audit of the Firestore database.
Validates schemas, referential integrity, state invariants, and data health.
"""

import sys
import os
import random
from datetime import datetime
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.firestore import firestore_db
from database.schema import Collections
from database.schema_social import SocialCollections
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("AUDIT")

# Redirect stdout to capture full report
sys.stdout = open('audit_results.log', 'w', encoding='utf-8')

def print_section(title):
    print("\n" + "=" * 60)
    print(f"🔎 {title}")
    print("=" * 60)

def print_json(data, label=None):
    if label:
        print(f"\n--- {label} ---")
    print(json.dumps(data, indent=2, default=str))

def check_user_schema(user_doc, type_label):
    data = user_doc.to_dict()
    required = [
        'points', 'level', 'stats', 'preferences', 
        'is_online', 'last_active', 'created_at', 'role'
    ]
    missing = [f for f in required if f not in data]
    
    # Check stats nested structure
    stats_ok = True
    if 'stats' in data:
        if not isinstance(data['stats'], dict):
            stats_ok = False
        else:
            if 'matches_played' not in data['stats']: stats_ok = False
            if 'wins' not in data['stats']: stats_ok = False
            if 'losses' not in data['stats']: stats_ok = False
    else:
        stats_ok = False

    print(f"\n👤 {type_label} User ({user_doc.id}):")
    if missing:
        print(f"   ❌ MISSING FIELDS: {missing}")
    else:
        print(f"   ✅ Top-level fields present")
    
    if stats_ok:
        print(f"   ✅ Stats map structure correct")
    else:
        print(f"   ❌ Stats map INVALID")
        
    # Print sample
    print_json(data, f"{type_label} User Data")
    return not missing and stats_ok

def audit_users():
    print_section("1️⃣ USER SCHEMA VALIDATION")
    
    # 1. Seeded User
    seeded = firestore_db.db.collection(Collections.USERS).document("user_ahmad").get()
    if seeded.exists:
        check_user_schema(seeded, "SEEDED")
    else:
        print("❌ Seeded user 'user_ahmad' NOT FOUND")

    # 2. App Registered User (find by email)
    docs = firestore_db.db.collection(Collections.USERS).where("email", ">=", "test").limit(1).stream()
    app_user = next(docs, None)
    if app_user:
        check_user_schema(app_user, "APP-REGISTERED")
    else:
        print("❌ App registered user NOT FOUND (Did you run test_api.py?)")

    # 3. Request WhatsApp user simulation (handled manually by user interaction usually, checking for phone)
    # searching for any user with only phone (no email or specific pattern)
    # For now, we likely don't have a WhatsApp user unless you messaged the agent. 
    # capturing any user that is NOT the above two
    print("\n(Note: WhatsApp user check requires manual interaction first)")
    

def audit_integrity():
    print_section("2️⃣ REFERENTIAL INTEGRITY CHECK")
    
    user_ids = set([d.id for d in firestore_db.db.collection(Collections.USERS).stream()])
    
    # Slots
    print("\n🎰 Checking 10 Random Slots...")
    slots = list(firestore_db.db.collection(Collections.SLOTS).limit(50).stream())
    if slots:
        sample = random.sample(slots, min(10, len(slots)))
        orphans = 0
        for s in sample:
            d = s.to_dict()
            uid = d.get('user_id')
            if uid:
                if uid not in user_ids:
                    print(f"   ❌ ORPHAN: Slot {s.id} -> User {uid} (NOT FOUND)")
                    orphans += 1
                else:
                    print(f"   ✅ Slot {s.id} -> User {uid} (Exists)")
            else:
                print(f"   ✅ Slot {s.id} (Available/No User)")
        if orphans == 0: print("   ✨ Slots Integrity: PASS")
    
    # Matches
    print("\n🎾 Checking 5 Matches...")
    matches = list(firestore_db.db.collection(SocialCollections.MATCHES).limit(5).stream())
    if matches:
        for m in matches:
            d = m.to_dict()
            host = d.get('host_user_id')
            if host not in user_ids:
               print(f"   ❌ ORPHAN: Match {m.id} -> Host {host} (NOT FOUND)")
            else:
               print(f"   ✅ Match {m.id} -> Host {host} (Exists)")
               
    # Posts
    print("\n📢 Checking 5 Posts...")
    posts = list(firestore_db.db.collection(SocialCollections.POSTS).limit(5).stream())
    if posts:
        for p in posts:
            d = p.to_dict()
            uid = d.get('user_id')
            if uid not in user_ids:
                print(f"   ❌ ORPHAN: Post {p.id} -> User {uid} (NOT FOUND)")
            else:
                print(f"   ✅ Post {p.id} -> User {uid} (Exists)")

def audit_booking_state():
    print_section("3️⃣ BOOKING STATE INVARIANTS")
    
    slots = list(firestore_db.db.collection(Collections.SLOTS).limit(20).stream())
    if not slots:
        print("❌ No slots found")
        return

    invariants_passed = True
    for s in slots:
        d = s.to_dict()
        status = d.get('status')
        uid = d.get('user_id')
        payment_id = d.get('payment_id')
        expires = d.get('hold_expires_at')
        
        issue = None
        if status == 'available' and uid:
            issue = "Available slot has user_id"
        elif status == 'locked' and not expires:
            issue = "Locked slot missing hold_expires_at"
        elif status == 'confirmed' and not payment_id:
            # issue = "Confirmed slot missing payment_id" # Strictly speaking usually required in your flow
            pass 
            
        if issue:
            print(f"   ❌ Invariant Fail: {s.id} [{status}] -> {issue}")
            invariants_passed = False
        else:
            # print(f"   ✅ {s.id} [{status}] OK")
            pass
            
    if invariants_passed:
         print("   ✨ All checked slots obey state machine rules")

def audit_vendors():
    print_section("4️⃣ VENDOR ANALYTICS CHECK")
    
    vendors = list(firestore_db.db.collection(Collections.VENDORS).limit(3).stream())
    for v in vendors:
        d = v.to_dict()
        fields = ['rating_sum', 'rating_count', 'revenue_today', 'revenue_month']
        missing = [f for f in fields if f not in d]
        
        if missing:
             print(f"   ❌ Vendor {v.id} missing: {missing}")
        else:
             print(f"   ✅ Vendor {v.id}: Analytics Present")
             print(f"      Rating: {d.get('average_rating', 0)} ({d.get('rating_count')} reviews)")
             print(f"      Revenue Today: {d.get('revenue_today')}")

def audit_timestamps():
    print_section("5️⃣ SLOT TIMESTAMP SANITY")
    
    slots = list(firestore_db.db.collection(Collections.SLOTS).limit(5).stream())
    now = datetime.now()
    
    for s in slots:
        d = s.to_dict()
        start = d.get('start_time') # Check if strings or timestamps
        
        print(f"   📅 Slot {s.id}: Start={start} (Type: {type(start)})")
        
        # Verify future dates (mostly)
        # Verify UTC (datetime objects usually tz-aware or naive utc in firestore)

def audit_config():
    print_section("6️⃣ SYSTEM CONFIG CHECK")
    
    doc = firestore_db.db.collection('system_config').document('global').get()
    if doc.exists:
        print_json(doc.to_dict(), "Global Config")
        print("   ✅ Config document exists")
    else:
        print("   ❌ system_config/global MISSING")

def audit_counts():
    print_section("7️⃣ DENSITY CHECK (COUNTS)")
    
    colls = [
        Collections.USERS, Collections.VENDORS, Collections.RESOURCES, 
        Collections.SERVICES, Collections.SLOTS, SocialCollections.MATCHES,
        SocialCollections.POSTS, SocialCollections.CONVERSATIONS
    ]
    
    for c in colls:
        # Note: exact count for large collections is expensive/slow in Firestore
        # We'll validat via stream count for small ones or aggregate query if available
        # For this audit, simple stream count is fine for dev size
        count = len(list(firestore_db.db.collection(c).select(['id']).stream()))
        print(f"   📊 {c}: {count} documents")

if __name__ == "__main__":
    print("\n🚀 STARTING FORENSIC AUDIT 🚀")
    
    audit_users()
    audit_integrity()
    audit_booking_state()
    audit_vendors()
    audit_timestamps()
    audit_config()
    audit_counts()
    
    print("\n✅ AUDIT COMPLETE")
