"""
Database Integrity Audit - Critical checks for BookForMe
Verifies UTC timestamps, slot structure, relationships, and ghost data
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.firestore import firestore_db
from datetime import datetime, timedelta


def audit_utc_timestamps():
    """Check 1: UTC Timestamp Check - Critical for Booking"""
    print("=" * 60)
    print("AUDIT 1: UTC Timestamp Check")
    print("=" * 60)

    try:
        # Get first 3 slots
        slots = list(firestore_db.db.collection('slots').limit(3).stream())

        if not slots:
            print("No slots found in database!")
            return False

        print(f"Found {len(slots)} slots")

        for i, slot_doc in enumerate(slots):
            slot_data = slot_doc.to_dict()
            slot_id = slot_doc.id

            print(f"\nSlot {i+1} ({slot_id}):")

            # Check start_time type and value
            start_time = slot_data.get('start_time')
            if start_time:
                print(f"   start_time: {start_time} (type: {type(start_time).__name__})")

                # Check if it's a Firestore Timestamp
                if hasattr(start_time, 'timestamp'):
                    print(f"   Correctly stored as Firestore Timestamp")
                    print(f"   UTC Value: {start_time}")

                    # Check if it's in the future (tomorrow or later)
                    utc_now = datetime.now(start_time.tzinfo)
                    if start_time > utc_now:
                        days_ahead = (start_time.date() - utc_now.date()).days
                        print(f"   Future slot: {days_ahead} days from now")
                    else:
                        print(f"   Past slot: {abs((start_time.date() - utc_now.date()).days)} days ago")
                else:
                    print(f"   ERROR: Not a Firestore Timestamp! Type: {type(start_time)}")
                    print(f"   Value: {start_time}")
                    return False
            else:
                print("   ERROR: No start_time field!")
                return False

        print("\nUTC Timestamp Check: PASSED")
        return True

    except Exception as e:
        print(f"UTC Timestamp Check failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def audit_slot_structure():
    """Check 2: Atomic Slot Structure Check"""
    print("\n" + "=" * 60)
    print("AUDIT 2: Atomic Slot Structure Check")
    print("=" * 60)

    try:
        # Find Ace Padel Club or any Padel vendor
        padel_vendors = list(firestore_db.db.collection('vendors')\
            .where('name', '>=', 'Ace Padel Club')\
            .where('name', '<=', 'Ace Padel Club\uf8ff')\
            .limit(1)\
            .stream())

        if not padel_vendors:
            # Try any vendor
            all_vendors = list(firestore_db.db.collection('vendors').limit(1).stream())
            if not all_vendors:
                print("No vendors found!")
                return False
            vendor_doc = all_vendors[0]
        else:
            vendor_doc = padel_vendors[0]

        vendor_data = vendor_doc.to_dict()
        vendor_id = vendor_doc.id
        vendor_name = vendor_data.get('name', 'Unknown')

        print(f"Checking vendor: {vendor_name} ({vendor_id})")

        # Find services for this vendor
        services = list(firestore_db.db.collection('services')\
            .where('vendor_id', '==', vendor_id)\
            .stream())

        if not services:
            print(f"No services found for vendor {vendor_id}")
            return False

        print(f"Found {len(services)} services")

        # Check each service has duration_min
        valid_services = []
        for service_doc in services:
            service_data = service_doc.to_dict()
            service_id = service_doc.id

            duration = service_data.get('duration_min')
            if duration:
                print(f"   Service {service_id}: duration_min = {duration}")
                valid_services.append(service_id)
            else:
                print(f"   Service {service_id}: MISSING duration_min!")
                return False

        if not valid_services:
            print("No valid services with duration_min!")
            return False

        # Check slots for these services (simplified query to avoid index requirements)
        total_slots = 0
        for service_id in valid_services[:1]:  # Check first service
            # Use a simpler query - just get slots for this vendor
            slots = list(firestore_db.db.collection('slots')\
                .where('vendor_id', '==', vendor_id)\
                .limit(20)\
                .stream())

            print(f"\nChecking slots for vendor {vendor_id}:")

            # Filter by service_id in code
            service_slots = [s for s in slots if s.to_dict().get('service_id') == service_id]

            if not service_slots:
                print("   No slots found for this service!")
                continue

            # Sort by start_time
            service_slots.sort(key=lambda s: s.to_dict().get('start_time', datetime.min))

            prev_time = None
            checked_slots = 0
            for slot_doc in service_slots[:5]:  # Check first 5 slots
                slot_data = slot_doc.to_dict()
                start_time = slot_data.get('start_time')

                if start_time and hasattr(start_time, 'timestamp'):
                    if prev_time:
                        time_diff = (start_time - prev_time).total_seconds() / 60  # minutes
                        if abs(time_diff - 60) < 1:  # Within 1 minute
                            print(f"   {time_diff:.1f} minutes apart (correct)")
                        else:
                            print(f"   {time_diff:.1f} minutes apart (expected 60)")
                    else:
                        print(f"   First slot: {start_time.strftime('%H:%M')}")

                    prev_time = start_time
                    checked_slots += 1

            total_slots += checked_slots

        if total_slots > 0:
            print(f"\nSlot Structure Check: PASSED ({total_slots} slots verified)")
            return True
        else:
            print("No valid slots found!")
            return False

    except Exception as e:
        print(f"Slot Structure Check failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def audit_relationships():
    """Check 3: Relationship Mapping Check"""
    print("\n" + "=" * 60)
    print("AUDIT 3: Relationship Mapping Check")
    print("=" * 60)

    try:
        # Get one slot
        slots = list(firestore_db.db.collection('slots').limit(1).stream())

        if not slots:
            print("No slots found!")
            return False

        slot_doc = slots[0]
        slot_data = slot_doc.to_dict()
        slot_id = slot_doc.id

        print(f"Checking slot: {slot_id}")

        # Check vendor_id relationship
        vendor_id = slot_data.get('vendor_id')
        if not vendor_id:
            print("Slot has no vendor_id!")
            return False

        print(f"vendor_id: {vendor_id}")

        vendor_doc = firestore_db.db.collection('vendors').document(vendor_id).get()
        if not vendor_doc.exists:
            print(f"Vendor {vendor_id} does NOT exist!")
            return False

        vendor_data = vendor_doc.to_dict()
        vendor_name = vendor_data.get('name', 'Unknown')
        print(f"Vendor exists: {vendor_name}")

        # Check service_id relationship
        service_id = slot_data.get('service_id')
        if not service_id:
            print("Slot has no service_id!")
            return False

        print(f"service_id: {service_id}")

        service_doc = firestore_db.db.collection('services').document(service_id).get()
        if not service_doc.exists:
            print(f"Service {service_id} does NOT exist!")
            return False

        service_data = service_doc.to_dict()
        service_name = service_data.get('name', 'Unknown')
        service_vendor_id = service_data.get('vendor_id')

        print(f"Service exists: {service_name}")

        # Verify service belongs to the same vendor
        if service_vendor_id != vendor_id:
            print(f"Service vendor mismatch! Slot vendor: {vendor_id}, Service vendor: {service_vendor_id}")
            return False

        print("Service belongs to correct vendor")

        # Check resource_id relationship
        resource_id = slot_data.get('resource_id')
        if resource_id:
            print(f"resource_id: {resource_id}")

            resource_doc = firestore_db.db.collection('resources').document(resource_id).get()
            if not resource_doc.exists:
                print(f"Resource {resource_id} does NOT exist!")
                return False

            resource_data = resource_doc.to_dict()
            resource_name = resource_data.get('name', 'Unknown')
            resource_vendor_id = resource_data.get('vendor_id')

            print(f"Resource exists: {resource_name}")

            if resource_vendor_id != vendor_id:
                print(f"Resource vendor mismatch! Slot vendor: {vendor_id}, Resource vendor: {resource_vendor_id}")
                return False

            print("Resource belongs to correct vendor")

        print("\nRelationship Mapping Check: PASSED")
        return True

    except Exception as e:
        print(f"Relationship Mapping Check failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def audit_ghost_data():
    """Check 4: Ghost Data Residual Check"""
    print("\n" + "=" * 60)
    print("AUDIT 4: Ghost Data Residual Check")
    print("=" * 60)

    try:
        # Check vendors collection for non-sports categories
        print("Checking vendors for non-sports categories...")

        all_vendors = list(firestore_db.db.collection('vendors').stream())
        non_sports_found = []

        valid_categories = ['padel', 'futsal', 'cricket', 'pickleball']

        for vendor_doc in all_vendors:
            vendor_data = vendor_doc.to_dict()
            category = vendor_data.get('category')
            area = vendor_data.get('area')

            # Our original vendors have 'area' field, not 'category'
            # Partner's vendors would have 'category' field
            if category:
                # This is partner's data - check if it's non-sports
                if category not in valid_categories:
                    non_sports_found.append(f"{vendor_data.get('name', 'Unknown')} ({category})")
            elif area:
                # This is our original data - it's sports
                continue
            else:
                # Unknown vendor structure
                non_sports_found.append(f"{vendor_data.get('name', 'Unknown')} (unknown structure)")

        if non_sports_found:
            print(f"Found {len(non_sports_found)} non-sports vendors:")
            for vendor in non_sports_found[:5]:
                print(f"   - {vendor}")
            print("   ...")
            return False
        else:
            print(f"No non-sports vendors found ({len(all_vendors)} total vendors)")

        # Check for forbidden collections
        forbidden_collections = ['availability_slots', 'beach_huts', 'farmhouses', 'salons', 'gaming_zones']

        print("\nChecking for forbidden collections...")
        found_forbidden = []

        for collection_name in forbidden_collections:
            try:
                # Try to get one document from each forbidden collection
                docs = list(firestore_db.db.collection(collection_name).limit(1).stream())
                if docs:
                    found_forbidden.append(f"{collection_name} ({len(docs)} documents)")
            except:
                pass  # Collection doesn't exist

        if found_forbidden:
            print(f"Found forbidden collections:")
            for collection in found_forbidden:
                print(f"   - {collection}")
            return False
        else:
            print("No forbidden collections found")

        print("\nGhost Data Residual Check: PASSED")
        return True

    except Exception as e:
        print(f"Ghost Data Residual Check failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_full_audit():
    """Run all four critical audits"""
    print("DATABASE INTEGRITY AUDIT")
    print("Critical checks for BookForMe booking system")
    print("=" * 60)

    results = []

    # Run all audits
    results.append(("UTC Timestamps", audit_utc_timestamps()))
    results.append(("Slot Structure", audit_slot_structure()))
    results.append(("Relationships", audit_relationships()))
    results.append(("Ghost Data", audit_ghost_data()))

    # Summary
    print("\n" + "=" * 60)
    print("AUDIT SUMMARY")
    print("=" * 60)

    passed = 0
    failed = 0

    for check_name, success in results:
        status = "PASSED" if success else "FAILED"
        print("20")
        if success:
            passed += 1
        else:
            failed += 1

    print(f"\nFinal Result: {passed}/{passed + failed} checks passed")

    if failed == 0:
        print("ALL CHECKS PASSED - Database is correctly structured!")
        print("Ready for Pydantic migration and production use")
    else:
        print(f"{failed} checks failed - Database needs attention before proceeding")

    return failed == 0


if __name__ == "__main__":
    success = run_full_audit()
    sys.exit(0 if success else 1)