"""
Test Script to Verify Gemini Booking Database Writes
Checks if bookings are actually being created and slot status changes
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database.availability_service import AvailabilityService
from database.firestore_v2 import FirestoreV2
from app.firestore import firestore_db
from database.schema import Collections, SlotStatus
from google.cloud import firestore


async def check_slot_status(vendor_id: str, date: str, time: str):
    """Check the status of a specific slot"""
    try:
        # Try checking in availability_slots collection (used by book_slot)
        try:
            slot_query = firestore_db.db.collection('availability_slots')\
                .where('vendor_id', '==', vendor_id)\
                .where('slot_date', '==', date)\
                .where('slot_time', '==', time)\
                .limit(1)
            
            slots = list(slot_query.stream())
            if slots:
                slot_doc = slots[0]
                slot_data = slot_doc.to_dict()
                return {
                    'found': True,
                    'status': slot_data.get('status', 'unknown'),
                    'slot_id': slot_doc.id,
                    'slot_data': slot_data
                }
        except Exception as e:
            print(f"   ⚠️  Could not check availability_slots: {e}")
        
        # Fallback: Check via FirestoreV2
        fs_client = FirestoreV2(firestore_db.db)
        slots = await fs_client.get_available_slots(vendor_id, date)
        
        # Find the specific slot by time
        target_slot = None
        for slot in slots:
            slot_time = slot.get('slot_time', '')
            if isinstance(slot_time, datetime):
                slot_time = slot_time.strftime('%H:%M')
            else:
                slot_time = str(slot_time)[:5]  # Take HH:MM part
            
            if slot_time == time:
                target_slot = slot
                break
        
        if target_slot:
            status = target_slot.get('status', 'unknown')
            slot_id = target_slot.get('id', 'N/A')
            return {
                'found': True,
                'status': status,
                'slot_id': slot_id,
                'slot_data': target_slot
            }
        else:
            return {
                'found': False,
                'status': None,
                'slot_id': None
            }
    except Exception as e:
        print(f"❌ Error checking slot status: {e}")
        return None


async def check_bookings_collection(phone_number: str = None):
    """Check bookings collection for recent bookings"""
    try:
        fs_client = FirestoreV2(firestore_db.db)
        
        # Get recent bookings (collection name is 'bookings')
        bookings_ref = firestore_db.db.collection('bookings')
        
        if phone_number:
            # Filter by phone number
            query = bookings_ref.where('customer_phone', '==', phone_number).limit(5)
        else:
            # Get last 5 bookings
            query = bookings_ref.order_by('created_at', direction='DESCENDING').limit(5)
        
        bookings = []
        for doc in query.stream():
            booking_data = doc.to_dict()
            booking_data['id'] = doc.id
            bookings.append(booking_data)
        
        return bookings
    except Exception as e:
        print(f"❌ Error checking bookings: {e}")
        return []


async def test_booking_verification():
    """Comprehensive test to verify booking database writes"""
    
    print("=" * 70)
    print("  GEMINI BOOKING DATABASE VERIFICATION TEST")
    print("=" * 70)
    print()
    
    # Test parameters
    vendor_id = "ace_padel_dha"
    test_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")  # Tomorrow
    test_time = "10:00"  # 10 AM
    test_phone = "+923001234567"
    
    print(f"📋 Test Parameters:")
    print(f"   Vendor ID: {vendor_id}")
    print(f"   Date: {test_date}")
    print(f"   Time: {test_time}")
    print(f"   Phone: {test_phone}")
    print()
    
    # Step 1: Check slot status BEFORE booking
    print("=" * 70)
    print("STEP 1: Checking slot status BEFORE booking")
    print("=" * 70)
    
    slot_before = await check_slot_status(vendor_id, test_date, test_time)
    
    if slot_before and slot_before['found']:
        print(f"✅ Slot found!")
        print(f"   Slot ID: {slot_before['slot_id']}")
        print(f"   Status: {slot_before['status']}")
        print(f"   Expected: Should be 'available' or 'locked'")
        
        if slot_before['status'] == SlotStatus.AVAILABLE.value:
            print("   ✅ Slot is available - ready for booking")
        elif slot_before['status'] == SlotStatus.LOCKED.value:
            print("   ⚠️  Slot is locked (might be held by another user)")
        else:
            print(f"   ⚠️  Slot status is '{slot_before['status']}' - might already be booked")
    else:
        print(f"❌ Slot not found for {test_time} on {test_date}")
        print("   Trying to find any available slot...")
        
        # Try to find any available slot
        service = AvailabilityService()
        slots = await service.get_available_slots(vendor_id, test_date)
        
        if slots:
            first_slot = slots[0]
            test_time = first_slot.get('time', '10:00')
            if isinstance(test_time, datetime):
                test_time = test_time.strftime('%H:%M')
            else:
                test_time = str(test_time)[:5]
            
            print(f"   Found slot at {test_time}, using that instead")
            slot_before = await check_slot_status(vendor_id, test_date, test_time)
        else:
            print("   ❌ No available slots found for this date")
            return
    
    print()
    
    # Step 2: Check existing bookings
    print("=" * 70)
    print("STEP 2: Checking existing bookings")
    print("=" * 70)
    
    bookings_before = await check_bookings_collection(test_phone)
    print(f"   Found {len(bookings_before)} existing bookings for this phone")
    
    if bookings_before:
        print("   Recent bookings:")
        for booking in bookings_before[:3]:
            print(f"      - ID: {booking.get('id', 'N/A')}, Status: {booking.get('status', 'N/A')}")
    
    print()
    
    # Step 3: Create a test booking
    print("=" * 70)
    print("STEP 3: Creating test booking through AvailabilityService")
    print("=" * 70)
    
    service = AvailabilityService()
    
    print(f"   Attempting to book: {test_time} on {test_date}")
    
    booking_result = await service.check_and_book_slot(
        vendor_id=vendor_id,
        date=test_date,
        time=test_time,
        customer_info={
            'phone': test_phone,
            'name': 'Test User - DB Verification',
            'booking_source': 'test_script'
        }
    )
    
    print(f"   Booking result: {booking_result}")
    
    if booking_result.get('success'):
        booking_id = booking_result.get('booking_id', 'N/A')
        print(f"   ✅ Booking created successfully!")
        print(f"   Booking ID: {booking_id}")
    else:
        error = booking_result.get('error', 'Unknown error')
        print(f"   ❌ Booking failed: {error}")
        print()
        print("   This might mean:")
        print("   - Slot is already booked")
        print("   - Slot is locked by another user")
        print("   - Database connection issue")
        return
    
    print()
    
    # Step 4: Check slot status AFTER booking
    print("=" * 70)
    print("STEP 4: Checking slot status AFTER booking")
    print("=" * 70)
    
    await asyncio.sleep(1)  # Small delay to ensure DB write completes
    
    slot_after = await check_slot_status(vendor_id, test_date, test_time)
    
    if slot_after and slot_after['found']:
        print(f"✅ Slot found!")
        print(f"   Slot ID: {slot_after['slot_id']}")
        print(f"   Status BEFORE: {slot_before['status'] if slot_before else 'N/A'}")
        print(f"   Status AFTER: {slot_after['status']}")
        
        # Verify status change
        if slot_before and slot_before['status'] == SlotStatus.AVAILABLE.value:
            # Check for any booked status (booked, locked, pending, confirmed)
            booked_statuses = [SlotStatus.LOCKED.value, SlotStatus.PENDING.value, SlotStatus.CONFIRMED.value, 'booked']
            if slot_after['status'] in booked_statuses:
                print("   ✅ SUCCESS: Slot status changed from 'available' to booked state!")
                print(f"   ✅ Database write confirmed - slot is now '{slot_after['status']}'")
            elif slot_after['status'] == SlotStatus.AVAILABLE.value:
                print("   ⚠️  WARNING: Slot status is still 'available' - booking may not have worked")
            else:
                print(f"   ⚠️  Status changed but unexpected: {slot_after['status']}")
        else:
            print(f"   ℹ️  Status: {slot_after['status']}")
    else:
        print("   ⚠️  Could not find slot after booking")
    
    print()
    
    # Step 5: Verify booking in bookings collection
    print("=" * 70)
    print("STEP 5: Verifying booking in bookings collection")
    print("=" * 70)
    
    bookings_after = await check_bookings_collection(test_phone)
    print(f"   Found {len(bookings_after)} bookings for this phone")
    
    if len(bookings_after) > len(bookings_before):
        print("   ✅ SUCCESS: New booking found in database!")
        
        # Find the new booking
        new_booking = None
        for booking in bookings_after:
            if booking.get('id') == booking_result.get('booking_id'):
                new_booking = booking
                break
        
        if new_booking:
            print(f"   Booking ID: {new_booking.get('id')}")
            print(f"   Status: {new_booking.get('status', 'N/A')}")
            print(f"   Customer Phone: {new_booking.get('customer_phone', 'N/A')}")
            print(f"   Slot ID: {new_booking.get('slot_id', 'N/A')}")
            print("   ✅ Booking document verified in database!")
        else:
            print("   ⚠️  Booking ID not found in collection (might be using different ID format)")
    else:
        print("   ⚠️  No new booking found in collection")
    
    print()
    print("=" * 70)
    print("  TEST SUMMARY")
    print("=" * 70)
    
    if booking_result.get('success'):
        print("✅ Booking creation: SUCCESS")
        if slot_after and slot_after['status'] != SlotStatus.AVAILABLE.value:
            print("✅ Slot status change: SUCCESS")
        else:
            print("⚠️  Slot status change: NEEDS VERIFICATION")
        if len(bookings_after) > len(bookings_before):
            print("✅ Booking document creation: SUCCESS")
        else:
            print("⚠️  Booking document creation: NEEDS VERIFICATION")
    else:
        print("❌ Booking creation: FAILED")
        print(f"   Error: {booking_result.get('error', 'Unknown')}")
    
    print()
    print("💡 To test Gemini booking:")
    print("   1. Run: python scripts/chat_terminal.py")
    print("   2. Ask: 'koi slot hai'")
    print("   3. Select a slot: 'book 10-11'")
    print("   4. Confirm: 'yes'")
    print("   5. Check logs for: '✅ Booking created: BK-xxx'")
    print("   6. Run this script again to verify slot status changed")


if __name__ == "__main__":
    try:
        asyncio.run(test_booking_verification())
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted. Goodbye!\n")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

