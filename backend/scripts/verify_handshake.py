import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set dummy key for config validation
os.environ["GROQ_API_KEY"] = "dummy_key_for_scripts"

from app.firestore import firestore_db

def verify_handshake():
    db = firestore_db.db
    print("--- Verifying Match-to-Slot Handshake ---")
    
    # 1. Create a Dummy User (Host)
    user_ref = db.collection('users').document()
    user_id = user_ref.id
    user_ref.set({
        'name': 'Handshake Tester',
        'email': 'tester@example.com',
        'role': 'customer'
    })
    print(f"Created Host User: {user_id}")
    
    # 2. Create a Dummy Vendor and Slot
    vendor_ref = db.collection('vendors').document()
    vendor_id = vendor_ref.id
    vendor_ref.set({
        'business_name': 'Test Padel Court',
        'location': {'lat': 0, 'lng': 0}
    })
    
    slot_ref = db.collection('slots').document()
    slot_id = slot_ref.id
    slot_ref.set({
        'vendor_id': vendor_id,
        'user_id': user_id,
        'date': '2025-12-25',
        'start_time': '10:00', # Simple string for test
        'status': 'confirmed'
    })
    print(f"Created Slot: {slot_id} at Vendor: {vendor_ref.get().get('business_name')}")
    
    # 3. Simulate "Create Match from Booking" (Logic inside create_match API)
    # Since we can't easily call the FastAPI endpoint directly without running the server,
    # we will simulate the logic or we can use `requests` if the server was running.
    # But since the server might not be running in this environment, I will verify the LOGIC by 
    # instantiating the logic block? No, better to verify by reading the code or assuming success?
    # NO, I should verify the logic works.
    
    # I will replicate the logic snippet here to ensure it works against Firestore structure.
    print("Test A: Verify 'Create Match from Booking' Logic...")
    
    # Logic from social_api.py:
    match_data = {}
    _slot_doc = db.collection('slots').document(slot_id).get()
    if _slot_doc.exists:
        _slot_data = _slot_doc.to_dict()
        if _slot_data.get('user_id') == user_id:
            match_data['venue_id'] = _slot_data.get('vendor_id')
            match_data['date'] = _slot_data.get('date')
            match_data['time'] = _slot_data.get('start_time')
            
            _vendor = db.collection('vendors').document(match_data['venue_id']).get()
            if _vendor.exists:
                match_data['location'] = _vendor.get('business_name')
    
    if match_data.get('location') == 'Test Padel Court' and match_data.get('date') == '2025-12-25':
        print("SUCCESS: Slot data correctly fetched and mapped.")
    else:
        print(f"FAILURE: Data mismatch. Got: {match_data}")
        
    # 4. Simulate "Link Match to Slot" API
    print("Test B: Verify 'Link Match to Slot' Logic...")
    
    # Create a match first
    match_ref = db.collection('matches').document()
    match_id = match_ref.id
    match_ref.set({
        'host_user_id': user_id,
        'status': 'open',
        'sport_type': 'padel'
    })
    
    # Logic from social_api.py link_match_slot:
    # Verify ownership
    _slot_doc = db.collection('slots').document(slot_id).get()
    _slot_data = _slot_doc.to_dict()
    
    if _slot_data.get('user_id') == user_id:
        update_data = {
            "slot_id": slot_id,
            "venue_id": _slot_data.get('vendor_id'),
            "date": _slot_data.get('date'),
            "time": _slot_data.get('start_time')
        }
        _vendor = db.collection('vendors').document(update_data['venue_id']).get()
        if _vendor.exists:
             update_data['location'] = _vendor.get('business_name')
             
        match_ref.update(update_data)
        
    # Verify result
    updated_match = match_ref.get().to_dict()
    if updated_match.get('slot_id') == slot_id and updated_match.get('location') == 'Test Padel Court':
        print("SUCCESS: Match successfully linked to slot.")
    else:
        print(f"FAILURE: Match update failed. Got: {updated_match}")

    # Cleanup
    print("Cleaning up...")
    user_ref.delete()
    vendor_ref.delete()
    slot_ref.delete()
    match_ref.delete()
    print("Done.")

if __name__ == "__main__":
    verify_handshake()
