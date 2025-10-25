"""
Initialize Firestore database with sample data
Run this script to set up your Firestore database with test vendors and slots
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore import firestore_db
from app.config import settings


async def init_firestore():
    """Initialize Firestore with sample data"""
    print("Initializing Firestore database...")
    
    try:
        # Create sample vendors
        vendors = [
            {
                'name': 'Karachi Futsal Arena',
                'phone': '+923001234567',
                'service_type': 'futsal',
                'whatsapp_connected': True,
                'description': 'Premium futsal court in DHA',
                'address': 'DHA Phase 5, Karachi',
                'created_at': datetime.now()
            },
            {
                'name': 'Elite Salon & Spa',
                'phone': '+923001234568',
                'service_type': 'salon',
                'whatsapp_connected': True,
                'description': 'Luxury salon services',
                'address': 'Clifton, Karachi',
                'created_at': datetime.now()
            }
        ]
        
        print("Creating sample vendors...")
        for vendor_data in vendors:
            # Add vendor to Firestore
            doc_ref = firestore_db.db.collection('vendors').document()
            doc_ref.set(vendor_data)
            vendor_id = doc_ref.id
            print(f"Created vendor: {vendor_data['name']} (ID: {vendor_id})")
            
            # Create availability slots for the next 7 days
            await create_sample_slots(vendor_id, vendor_data['service_type'])
        
        print("Firestore initialization completed successfully!")
        print("\nSample data created:")
        print("- 2 vendors (1 futsal, 1 salon)")
        print("- 7 days of availability slots")
        print("- Ready for WhatsApp testing!")
        
    except Exception as e:
        print(f"Error initializing Firestore: {e}")
        raise


async def create_sample_slots(vendor_id: str, service_type: str):
    """Create sample availability slots for a vendor"""
    
    # Define time slots based on service type
    if service_type == 'futsal':
        time_slots = [
            {'time': '09:00', 'price': 2000.0},
            {'time': '10:00', 'price': 2000.0},
            {'time': '11:00', 'price': 2000.0},
            {'time': '14:00', 'price': 2500.0},
            {'time': '15:00', 'price': 2500.0},
            {'time': '16:00', 'price': 2500.0},
            {'time': '17:00', 'price': 3000.0},
            {'time': '18:00', 'price': 3000.0},
            {'time': '19:00', 'price': 3000.0},
            {'time': '20:00', 'price': 2500.0},
        ]
    else:  # salon
        time_slots = [
            {'time': '10:00', 'price': 1500.0},
            {'time': '11:00', 'price': 1500.0},
            {'time': '12:00', 'price': 1500.0},
            {'time': '14:00', 'price': 1500.0},
            {'time': '15:00', 'price': 1500.0},
            {'time': '16:00', 'price': 1500.0},
            {'time': '17:00', 'price': 1500.0},
            {'time': '18:00', 'price': 1500.0},
        ]
    
    # Create slots for the next 7 days
    for day_offset in range(7):
        date = (datetime.now() + timedelta(days=day_offset)).strftime('%Y-%m-%d')
        
        for slot_data in time_slots:
            slot_doc = {
                'vendor_id': vendor_id,
                'slot_date': date,
                'slot_time': slot_data['time'],
                'price': slot_data['price'],
                'status': 'available',
                'created_at': datetime.now()
            }
            
            firestore_db.db.collection('availability_slots').add(slot_doc)
    
    print(f"Created {len(time_slots)} slots for 7 days for vendor {vendor_id}")


async def test_connection():
    """Test Firestore connection"""
    try:
        # Test connection by reading a document
        vendors = firestore_db.db.collection('vendors').limit(1).stream()
        vendor_list = list(vendors)
        
        if vendor_list:
            print("Firestore connection successful!")
            print(f"Found {len(vendor_list)} vendors in database")
        else:
            print("Firestore connected but no data found")
        
        return True
        
    except Exception as e:
        print(f"Firestore connection failed: {e}")
        return False


if __name__ == "__main__":
    print("BookForMe Firestore Initialization")
    print("=" * 50)
    
    # Test connection first
    if asyncio.run(test_connection()):
        # Initialize database
        asyncio.run(init_firestore())
    else:
        print("Cannot proceed without Firestore connection")
        print("\nSetup instructions:")
        print("1. Create a Google Cloud project")
        print("2. Enable Firestore API")
        print("3. Create a service account")
        print("4. Download credentials JSON")
        print("5. Update FIRESTORE_PROJECT_ID in .env")
        print("6. Place credentials file in ./credentials/")
        sys.exit(1)
