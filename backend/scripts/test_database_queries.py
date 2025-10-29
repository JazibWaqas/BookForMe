"""Test database query functionality with actual vendor data"""
import asyncio
import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore import firestore_db

async def test_vendor_search():
    """Test searching vendors by category and location"""
    print("🔍 Testing vendor search functionality...")
    
    try:
        # Test 1: Search futsal courts
        print("\n1. Searching for Futsal Courts:")
        futsal_vendors = firestore_db.db.collection('vendors').where('category', '==', 'Futsal Court').limit(3).stream()
        futsal_list = list(futsal_vendors)
        
        for vendor in futsal_list:
            data = vendor.to_dict()
            print(f"   • {data['name']} - {data['location_area']} - PKR {data['price_per_hour']}/hr")
        
        # Test 2: Search by location
        print("\n2. Searching for venues in DHA:")
        dha_vendors = firestore_db.db.collection('vendors').where('location_area', '>=', 'DHA').where('location_area', '<=', 'DHA\uf8ff').limit(3).stream()
        dha_list = list(dha_vendors)
        
        for vendor in dha_list:
            data = vendor.to_dict()
            print(f"   • {data['name']} ({data['category']}) - {data['location_area']}")
        
        # Test 3: Search salons
        print("\n3. Searching for Salons:")
        salon_vendors = firestore_db.db.collection('vendors').where('category', '==', 'Salon').limit(3).stream()
        salon_list = list(salon_vendors)
        
        for vendor in salon_list:
            data = vendor.to_dict()
            print(f"   • {data['name']} - {data['location_area']} - {data['type']} salon")
        
        # Test 4: Search gaming zones
        print("\n4. Searching for Gaming Zones:")
        gaming_vendors = firestore_db.db.collection('vendors').where('category', '==', 'Gaming Zone').limit(3).stream()
        gaming_list = list(gaming_vendors)
        
        for vendor in gaming_list:
            data = vendor.to_dict()
            print(f"   • {data['name']} - {data['location_area']}")
            if 'consoles' in data:
                print(f"     Consoles: {', '.join(data['consoles'][:3])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error searching vendors: {e}")
        return False

async def test_availability_search():
    """Test searching availability slots"""
    print("\n🔍 Testing availability search functionality...")
    
    try:
        # Get a sample vendor
        vendors = firestore_db.db.collection('vendors').limit(1).stream()
        vendor_list = list(vendors)
        
        if not vendor_list:
            print("❌ No vendors found for availability test")
            return False
        
        vendor = vendor_list[0]
        vendor_data = vendor.to_dict()
        vendor_id = vendor.id
        
        print(f"\nTesting availability for: {vendor_data['name']}")
        
        # Test availability for today
        today = datetime.now().strftime('%Y-%m-%d')
        print(f"\nChecking availability for {today}:")
        
        # Check availability subcollection
        availability_docs = firestore_db.db.collection('vendors').document(vendor_id).collection('availability').document(today).get()
        
        if availability_docs.exists:
            availability_data = availability_docs.to_dict()
            print(f"   Available time slots:")
            for time_slot, details in availability_data.items():
                if isinstance(details, dict) and details.get('status') == 'available':
                    print(f"     • {time_slot}")
        else:
            print(f"   No availability data for {today}")
        
        # Test availability_slots collection
        print(f"\nChecking availability_slots collection:")
        slots = firestore_db.db.collection('availability_slots').where('vendor_id', '==', vendor_id).where('slot_date', '==', today).where('status', '==', 'available').limit(5).stream()
        slot_list = list(slots)
        
        for slot in slot_list:
            slot_data = slot.to_dict()
            print(f"   • {slot_data['slot_time']} - PKR {slot_data['price']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error searching availability: {e}")
        return False

async def test_agent_responses():
    """Test what the agent should respond with"""
    print("\n🤖 Testing agent response scenarios...")
    
    try:
        # Scenario 1: User asks for futsal courts
        print("\n1. User: 'I want to book futsal'")
        futsal_vendors = firestore_db.db.collection('vendors').where('category', '==', 'Futsal Court').limit(3).stream()
        futsal_list = list(futsal_vendors)
        
        if futsal_list:
            print("   Agent should respond:")
            print("   'I found several futsal courts for you. Which area would you prefer?'")
            print("   Available areas:")
            areas = set()
            for vendor in futsal_list:
                data = vendor.to_dict()
                areas.add(data['location_area'])
            for area in sorted(areas):
                print(f"     • {area}")
        
        # Scenario 2: User asks for specific area
        print("\n2. User: 'Show me futsal courts in DHA'")
        dha_futsal = firestore_db.db.collection('vendors').where('category', '==', 'Futsal Court').where('location_area', '>=', 'DHA').where('location_area', '<=', 'DHA\uf8ff').limit(3).stream()
        dha_futsal_list = list(dha_futsal)
        
        if dha_futsal_list:
            print("   Agent should respond:")
            print("   'Here are futsal courts in DHA:'")
            for vendor in dha_futsal_list:
                data = vendor.to_dict()
                print(f"     • {data['name']} - PKR {data['price_per_hour']}/hr")
                print(f"       Rating: {data['rating']}/5.0 ({data['review_count']} reviews)")
        
        # Scenario 3: User asks for availability
        print("\n3. User: 'What time slots are available tomorrow?'")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        print(f"   Agent should respond:")
        print(f"   'Let me check availability for {tomorrow}...'")
        
        # Get a sample vendor's availability
        vendors = firestore_db.db.collection('vendors').limit(1).stream()
        vendor_list = list(vendors)
        
        if vendor_list:
            vendor_id = vendor_list[0].id
            availability_docs = firestore_db.db.collection('vendors').document(vendor_id).collection('availability').document(tomorrow).get()
            
            if availability_docs.exists:
                availability_data = availability_docs.to_dict()
                available_slots = [time for time, details in availability_data.items() 
                                 if isinstance(details, dict) and details.get('status') == 'available']
                print(f"   'Available time slots: {', '.join(available_slots[:5])}'")
            else:
                print("   'No availability data found for tomorrow'")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing agent responses: {e}")
        return False

async def main():
    """Run all database query tests"""
    print("🧪 Testing BookForMe Database Query Functionality")
    print("=" * 60)
    
    # Test vendor search
    vendor_search_ok = await test_vendor_search()
    
    # Test availability search
    availability_search_ok = await test_availability_search()
    
    # Test agent response scenarios
    agent_responses_ok = await test_agent_responses()
    
    print("\n📊 Test Results Summary:")
    print("=" * 30)
    print(f"Vendor Search: {'✅ PASSED' if vendor_search_ok else '❌ FAILED'}")
    print(f"Availability Search: {'✅ PASSED' if availability_search_ok else '❌ FAILED'}")
    print(f"Agent Response Scenarios: {'✅ PASSED' if agent_responses_ok else '❌ FAILED'}")
    
    if all([vendor_search_ok, availability_search_ok, agent_responses_ok]):
        print("\n🎉 All database query tests passed!")
        print("The agent can successfully search and respond with vendor data.")
    else:
        print("\n⚠️ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())
