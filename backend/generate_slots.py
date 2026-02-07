"""
Generate fresh availability slots for current dates
"""
import asyncio
from app.firestore import firestore_db
from datetime import datetime, timedelta

async def generate_fresh_slots():
    db = firestore_db.db
    
    print("=" * 80)
    print("GENERATING FRESH SLOTS")
    print("=" * 80)
    
    # Get all vendors
    vendors = list(db.collection('vendors').stream())
    
    # Generate slots for next 7 days
    start_date = datetime.now()
    
    for i in range(7):
        date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        print(f"\n📅 Generating slots for {date}...")
        
        for vendor_doc in vendors:
            vendor_id = vendor_doc.id
            vendor = vendor_doc.to_dict()
            
            # Get vendor's services
            services = list(db.collection('services').where('vendor_id', '==', vendor_id).stream())
            if not services:
                continue
            
            service = services[0].to_dict()
            service_id = services[0].id
            price = service.get('pricing', {}).get('base', 2000)
            
            # Get vendor's resources
            resources = list(db.collection('resources').where('vendor_id', '==', vendor_id).stream())
            if not resources:
                continue
            
            # Generate slots for each hour from 6 AM to 11 PM
            for hour in range(6, 23):
                time_str = f"{hour:02d}:00"
                
                for resource_doc in resources:
                    resource_id = resource_doc.id
                    
                    # Create slot ID
                    slot_id = f"{date.replace('-', '')}_{time_str.replace(':', '')}_{resource_id}"
                    
                    # Create slot document
                    slot_data = {
                        'vendor_id': vendor_id,
                        'service_id': service_id,
                        'resource_id': resource_id,
                        'date': date,
                        'time': time_str,
                        'slot_time': time_str,  # Add both fields
                        'price': price,
                        'status': 'available',
                        'created_at': datetime.now(),
                        'updated_at': datetime.now()
                    }
                    
                    # Upsert slot
                    db.collection('slots').document(slot_id).set(slot_data)
            
            print(f"   ✅ {vendor.get('name')}: {len(resources) * 17} slots")
    
    print(f"\n{'='*80}")
    print("✅ SLOTS GENERATED SUCCESSFULLY")
    print("=" * 80)
    
    # Count new slots
    total_slots = list(db.collection('slots').where('status', '==', 'available').limit(5000).stream())
    print(f"\nTotal available slots in database: {len(total_slots)}")

if __name__ == "__main__":
    asyncio.run(generate_fresh_slots())
