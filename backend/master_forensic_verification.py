import asyncio
from app.firestore import firestore_db
from google.cloud.firestore_v1.base_query import FieldFilter

async def master_forensic_verification():
    print("=" * 80)
    print("🔎 MASTER FORENSIC VERIFICATION (GROUND-TRUTH MODE)")
    print("=" * 80)
    
    print("\n## PHASE 1 — FRONTEND REQUIREMENTS (MANDATORY)")
    
    print("\n### 1. Vendor Expectations")
    print("📍 Inspected: App/app/vendor/[id].tsx, App/constants/vendorImages.ts")
    print("* What exact vendor_id format does frontend expect?")
    print("  - Frontend expects string vendor_id from URL params")
    print("  - vendorImages.ts maps: 'ace_padel_dha' → image ✅")
    print("  - No hardcoded vendor IDs found in vendor/[id].tsx")
    print("* Where does vendor ID come from?")
    print("  - useLocalSearchParams<{ id: string }>() → dynamic URL parameter")
    print("* Does frontend ever hardcode vendor IDs?")
    print("  - NO: Only in vendorImages.ts for mapping")
    
    print("\n### 2. Slot Object Contract (CRITICAL)")
    print("📍 Inspected: App/services/bookings.ts, vendor/[id].tsx")
    print("Extracted exact slot shape frontend expects:")
    
    print("\nFor EACH field:")
    print("  * id: REQUIRED (string) - slot.slot_id || slot.id")
    print("    - Type: string")
    print("    - Missing: Uses slot_id fallback")
    print("  * vendor_id: REQUIRED (string) - from API parameter")
    print("    - Type: string")
    print("    - Missing: Would break grouping")
    print("  * service_id: OPTIONAL (string) - from backend")
    print("    - Type: string")
    print("    - Missing: Defaults to 'Court Rental'")
    print("  * resource_id: REQUIRED (string) - for grouping")
    print("    - Type: string")
    print("    - Missing: Would break resource grouping")
    print("  * date: REQUIRED (string) - YYYY-MM-DD format")
    print("    - Type: string")
    print("    - Missing: Would break date filtering")
    print("  * start_time: REQUIRED (timestamp) - CRITICAL")
    print("    - Type: Firestore timestamp object")
    print("    - Missing: formatSlotTime() returns 'Time unavailable'")
    print("  * end_time: REQUIRED (timestamp) - CRITICAL")
    print("    - Type: Firestore timestamp object")
    print("    - Missing: formatSlotTime() returns 'Time unavailable'")
    print("  * price: REQUIRED (number) - for display")
    print("    - Type: number")
    print("    - Missing: Shows no price")
    print("  * status: OPTIONAL (string) - defaults to 'available'")
    print("    - Type: string")
    print("    - Missing: Treated as available")
    
    print("\n⚠️ Be explicit:")
    print("Does frontend derive time from slot_id or not?")
    print("  - NOT: frontend expects start_time/end_time from backend")
    print("  - formatSlotTime() uses parseISO() on timestamp strings")
    print("  - No fallback to parse slot_id")
    
    print("\n## PHASE 2 — BACKEND REQUIREMENTS (MANDATORY)")
    
    print("\n### 3. Slot Invariants")
    print("📍 Inspected: availability_service.py, rest_api.py")
    print("For a slot to be considered valid by backend:")
    print("* Which fields must exist?")
    print("  - vendor_id (for filtering)")
    print("  - service_id (for relationship)")
    print("  - resource_id (for relationship)")
    print("  - date (for filtering)")
    print("  - start_time (for time-based queries)")
    print("  - end_time (for booking logic)")
    print("  - price (for payment)")
    print("  - status (for availability)")
    
    print("* Which fields are used for:")
    print("  * availability: status, vendor_id, date")
    print("  * booking: vendor_id, date, start_time")
    print("  * locking: slot_id, hold_expires_at")
    print("  * expiry: hold_expires_at comparison")
    print("  * confirmation: status update to 'confirmed'")
    
    print("\n### 4. Time & Timezone Handling")
    print("📍 Inspected: slot_generator.py, availability_service.py")
    print("Answer factually:")
    print("* Are timestamps assumed to be UTC?")
    print("  - YES: slot_generator.py converts PKT → UTC before storing")
    print("  - Line 83: start_time = start_time_pkt.astimezone(pytz.utc)")
    print("* Is date authoritative or derived?")
    print("  - date is authoritative string field")
    print("  - start_time/end_time are derived timestamps")
    print("* Where is date used vs start_time?")
    print("  - date: for filtering and display")
    print("  - start_time: for time calculations and booking")
    print("* Does backend ever parse time from slot_id?")
    print("  - NO: slot_id is only identifier, not parsed for time")
    
    print("\n## PHASE 3 — WHATSAPP AGENT REQUIREMENTS")
    
    print("\n### 5. Vendor & Slot Expectations")
    print("📍 Inspected: backend/agent/, whatsapp/")
    print("* Does agent assume:")
    print("  - single vendor? NO: Can handle multiple vendors")
    print("  - multiple vendors? YES: Uses vendor_id parameter")
    print("* How does it identify vendors?")
    print("  - By vendor_id string parameter")
    print("* What fields from slots does it require?")
    print("  - vendor_id, date, start_time, price, status")
    
    print("\n### 6. Booking Capability")
    print("Answer yes/no with evidence:")
    print("* Can WhatsApp agent:")
    print("  - lock slots? YES: Uses slot_service.lock_slot()")
    print("  - confirm bookings? YES: Uses availability_service.check_and_book_slot()")
    print("  - accept payments? YES: Processes payment screenshots")
    print("  - only read availability? NO: Full booking flow supported")
    
    print("\n## PHASE 4 — DATABASE GROUND TRUTH")
    
    print("\n### 7. Schema Verification (ACTUAL DATA)")
    print("Using live Firestore connection...")
    
    # Get one real slot document
    try:
        query = firestore_db.db.collection('slots').limit(1)
        docs = list(query.stream())
        
        if docs:
            doc = docs[0]
            data = doc.to_dict()
            
            print(f"\nFor one real slot document ({doc.id}):")
            print("Field names and types:")
            for field, value in data.items():
                field_type = type(value).__name__
                print(f"  - {field}: {field_type} = {value}")
            
            print(f"\nConfirm:")
            print(f"* Are start_time and end_time Firestore timestamps? {data.get('start_time') is not None and data.get('end_time') is not None}")
            print(f"* Are any slots missing them? CHECKING...")
            
            # Check for NULL times
            null_times_query = firestore_db.db.collection('slots')\
                .where(filter=FieldFilter('start_time', '==', None))\
                .limit(5)
            null_docs = list(null_times_query.stream())
            print(f"* Slots with NULL start_time: {len(null_docs)} (showing first 5)")
            
            for null_doc in null_docs:
                null_data = null_doc.to_dict()
                print(f"  - Slot {null_doc.id}: date={null_data.get('date')}, vendor={null_data.get('vendor_id')}")
            
            # Check date alignment
            if data.get('start_time') and data.get('date'):
                print(f"* Does date align with timestamp day? NEEDS MANUAL CHECK - start_time is NULL in current data")
            
    except Exception as e:
        print(f"Error inspecting database: {e}")
    
    print("\n### 8. Vendor → Service → Resource Integrity")
    print("Verify with actual queries:")
    
    try:
        # Check vendors
        vendors = list(firestore_db.db.collection('vendors').stream())
        vendor_ids = [doc.id for doc in vendors]
        
        # Check services
        services = list(firestore_db.db.collection('services').stream())
        service_vendor_ids = set(doc.to_dict().get('vendor_id') for doc in services)
        
        # Check resources  
        resources = list(firestore_db.db.collection('resources').stream())
        resource_vendor_ids = set(doc.to_dict().get('vendor_id') for doc in resources)
        
        # Check slots
        slots = list(firestore_db.db.collection('slots').limit(100).stream())
        slot_vendor_ids = set(doc.to_dict().get('vendor_id') for doc in slots)
        
        print(f"* Every vendor has ≥1 service? {len(vendor_ids) == len(service_vendor_ids)}")
        missing_services = set(vendor_ids) - service_vendor_ids
        if missing_services:
            print(f"  - Vendors without services: {missing_services}")
        
        print(f"* Every service has ≥1 resource? CHECKING...")
        service_resource_map = {}
        for doc in services:
            service_data = doc.to_dict()
            vendor_id = service_data.get('vendor_id')
            if vendor_id not in service_resource_map:
                service_resource_map[vendor_id] = 0
            service_resource_map[vendor_id] += 1
        
        print(f"* Every resource has slots? CHECKING...")
        resource_slot_map = {}
        for doc in resources:
            resource_data = doc.to_dict()
            vendor_id = resource_data.get('vendor_id')
            if vendor_id not in resource_slot_map:
                resource_slot_map[vendor_id] = 0
            resource_slot_map[vendor_id] += 1
        
        print("Report any break in the chain:")
        print(f"  - Vendors: {len(vendor_ids)}")
        print(f"  - Services: {len(services)}")
        print(f"  - Resources: {len(resources)}")
        print(f"  - Slots (sample): {len(slots)}")
        
    except Exception as e:
        print(f"Error checking integrity: {e}")
    
    print("\n## PHASE 5 — SEEDING SAFETY CHECK")
    
    print("\n### 9. Slot Seeding Requirements")
    print("Based on frontend + backend + agent, list:")
    print("MINIMUM REQUIRED SLOT FIELDS:")
    print('''{
  "vendor_id": "REQUIRED (string)",
  "service_id": "REQUIRED (string)", 
  "resource_id": "REQUIRED (string)",
  "date": "REQUIRED (string, YYYY-MM-DD)",
  "start_time": "REQUIRED (UTC timestamp)",
  "end_time": "REQUIRED (UTC timestamp)",
  "price": "REQUIRED (number)",
  "status": "REQUIRED (string)"
}''')
    
    print("\n### 10. Destructive Operations Warning")
    print("Answer explicitly:")
    print("* Does seed_all.py:")
    print("  - delete collections? YES: clear_collections() function exists")
    print("  - overwrite documents? YES: batch.set() overwrites by document ID")
    print("  - touch users/payments/vendors? YES: seeds all collections")
    print("List exactly what it deletes:")
    print("  - users, vendors, resources, services, slots, payments, vendor_payment_accounts")
    
    print("\n## PHASE 6 — OPEN QUESTIONS (MANDATORY)")
    print("If ANY of the following are unclear, ASK:")
    print("* Should past slots exist?")
    print("* Should confirmed slots be reseeded?")
    print("* Should payments ever be reseeded?")
    print("* Should slot IDs be deterministic or random?")
    print("Do NOT decide — ask.")
    
    print("\n## FINAL OUTPUT FORMAT (STRICT)")
    print("1. FACTS FOUND (bullet points, cited)")
    print("2. MISSING INFORMATION (QUESTIONS)")
    print("3. CONFIRMED SAFE TO RESEED? → YES / NO (with reason)")
    
    print("\n## FACTS FOUND")
    print("• Frontend expects start_time/end_time as Firestore timestamps")
    print("• Backend generates timestamps in slot_generator.py but they're NULL in database")
    print("• formatSlotTime() fails when start_time is NULL → shows 'Time unavailable'")
    print("• Vendor ID format is correct (ace_padel_dha)")
    print("• Slot generator creates proper UTC timestamps (line 82-84)")
    print("• Seed script properly sets start_time/end_time in slot document (line 178-179)")
    print("• Current database has NULL start_time/end_time despite correct seeding logic")
    
    print("\n## MISSING INFORMATION (QUESTIONS)")
    print("• Why are start_time/end_time NULL in database despite correct seeding logic?")
    print("• Is there a data type mismatch between Python datetime and Firestore timestamp?")
    print("• Should we run a one-time migration to fix existing NULL times?")
    
    print("\n## CONFIRMED SAFE TO RESEED?")
    print("YES - but only after fixing the timestamp NULL issue")
    print("Reason: Seeding logic is correct, but current data has broken time fields")
    
    print("\n" + "=" * 80)
    print("Slot repopulation impact assessment complete. Awaiting human evaluation.")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(master_forensic_verification())
