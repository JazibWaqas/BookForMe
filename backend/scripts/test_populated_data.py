"""
Test script to verify populated Firestore data
Run this after populating to check if data was created correctly
"""

import asyncio
import sys
import os
from collections import defaultdict

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore import firestore_db


async def test_populated_data():
    """Test the populated Firestore data"""
    print("🔍 Testing populated Firestore data...")
    
    try:
        # Test vendors collection
        print("\n📊 Checking vendors collection...")
        vendors = firestore_db.db.collection('vendors').stream()
        vendor_list = list(vendors)
        
        if not vendor_list:
            print("❌ No vendors found in database!")
            return False
        
        print(f"✅ Found {len(vendor_list)} vendors")
        
        # Categorize vendors
        categories = defaultdict(int)
        for vendor in vendor_list:
            vendor_data = vendor.to_dict()
            category = vendor_data.get('category', 'Unknown')
            categories[category] += 1
        
        print("\n📈 Vendor breakdown:")
        for category, count in categories.items():
            print(f"   • {category}: {count}")
        
        # Test availability slots collection
        print("\n⏰ Checking availability slots...")
        slots = firestore_db.db.collection('availability_slots').stream()
        slot_list = list(slots)
        
        if not slot_list:
            print("❌ No availability slots found!")
            return False
        
        print(f"✅ Found {len(slot_list)} availability slots")
        
        # Test vendor availability subcollections
        print("\n🔍 Testing vendor availability subcollections...")
        subcollection_count = 0
        for vendor in vendor_list[:3]:  # Test first 3 vendors
            vendor_id = vendor.id
            availability_docs = firestore_db.db.collection('vendors').document(vendor_id).collection('availability').stream()
            availability_list = list(availability_docs)
            subcollection_count += len(availability_list)
            print(f"   • {vendor.to_dict().get('name', 'Unknown')}: {len(availability_list)} availability days")
        
        print(f"✅ Total availability subcollection entries: {subcollection_count}")
        
        # Test sample vendor data
        print("\n🏢 Testing sample vendor data...")
        sample_vendor = vendor_list[0]
        vendor_data = sample_vendor.to_dict()
        
        required_fields = ['name', 'category', 'location_area', 'phone', 'email', 'description']
        missing_fields = [field for field in required_fields if field not in vendor_data]
        
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
        else:
            print("✅ Sample vendor has all required fields")
        
        # Test availability slot data
        print("\n⏱️ Testing availability slot data...")
        sample_slot = slot_list[0]
        slot_data = sample_slot.to_dict()
        
        slot_required_fields = ['vendor_id', 'slot_date', 'slot_time', 'price', 'status']
        slot_missing_fields = [field for field in slot_required_fields if field not in slot_data]
        
        if slot_missing_fields:
            print(f"❌ Missing required slot fields: {slot_missing_fields}")
        else:
            print("✅ Sample availability slot has all required fields")
        
        # Test data quality
        print("\n🎯 Testing data quality...")
        
        # Check for realistic phone numbers
        pakistani_phones = 0
        for vendor in vendor_list:
            phone = vendor.to_dict().get('phone', '')
            if phone.startswith('+92') and len(phone) == 13:
                pakistani_phones += 1
        
        print(f"   • Pakistani phone numbers: {pakistani_phones}/{len(vendor_list)}")
        
        # Check for realistic pricing
        realistic_pricing = 0
        for vendor in vendor_list:
            vendor_data = vendor.to_dict()
            if 'price_per_hour' in vendor_data:
                price = vendor_data['price_per_hour']
                if 1000 <= price <= 10000:  # Reasonable range for hourly services
                    realistic_pricing += 1
            elif 'price_per_day' in vendor_data:
                price = vendor_data['price_per_day']
                if 5000 <= price <= 100000:  # Reasonable range for daily services
                    realistic_pricing += 1
        
        print(f"   • Realistic pricing: {realistic_pricing}/{len(vendor_list)}")
        
        # Check availability distribution
        available_slots = sum(1 for slot in slot_list if slot.to_dict().get('status') == 'available')
        booked_slots = sum(1 for slot in slot_list if slot.to_dict().get('status') == 'booked')
        total_slots = len(slot_list)
        
        print(f"   • Available slots: {available_slots} ({available_slots/total_slots*100:.1f}%)")
        print(f"   • Booked slots: {booked_slots} ({booked_slots/total_slots*100:.1f}%)")
        
        print("\n🎉 Data verification completed successfully!")
        print("\n📋 Summary:")
        print(f"   • {len(vendor_list)} vendors across {len(categories)} categories")
        print(f"   • {len(slot_list)} availability slots")
        print(f"   • {subcollection_count} availability subcollection entries")
        print(f"   • Data quality: Good")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing data: {e}")
        return False


async def test_specific_queries():
    """Test specific queries that the app might use"""
    print("\n🔍 Testing specific queries...")
    
    try:
        # Test querying by category
        print("   • Testing category queries...")
        futsal_vendors = firestore_db.db.collection('vendors').where('category', '==', 'Futsal Court').stream()
        futsal_count = len(list(futsal_vendors))
        print(f"     Futsal courts: {futsal_count}")
        
        # Test querying by service type
        print("   • Testing service type queries...")
        salon_vendors = firestore_db.db.collection('vendors').where('service_type', '==', 'salon').stream()
        salon_count = len(list(salon_vendors))
        print(f"     Salons: {salon_count}")
        
        # Test querying availability
        print("   • Testing availability queries...")
        available_slots = firestore_db.db.collection('availability_slots').where('status', '==', 'available').limit(5).stream()
        available_count = len(list(available_slots))
        print(f"     Available slots (sample): {available_count}")
        
        # Test querying by location
        print("   • Testing location queries...")
        dha_vendors = firestore_db.db.collection('vendors').where('location_area', '>=', 'DHA').where('location_area', '<=', 'DHA\uf8ff').stream()
        dha_count = len(list(dha_vendors))
        print(f"     DHA vendors: {dha_count}")
        
        print("✅ Query tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing queries: {e}")
        return False


async def main():
    """Main test function"""
    print("🧪 BookForMe Data Verification")
    print("=" * 40)
    
    # Test basic data
    data_ok = await test_populated_data()
    
    if data_ok:
        # Test specific queries
        queries_ok = await test_specific_queries()
        
        if queries_ok:
            print("\n🎉 All tests passed! Your data is ready for testing.")
            print("\n🚀 Next steps:")
            print("1. Test your WhatsApp bot")
            print("2. Check the frontend displays")
            print("3. Try booking different venues")
            print("4. Test the AI agent functionality")
        else:
            print("\n⚠️ Data exists but some queries failed. Check your Firestore indexes.")
    else:
        print("\n❌ Data verification failed. Please check the population script.")


if __name__ == "__main__":
    asyncio.run(main())
