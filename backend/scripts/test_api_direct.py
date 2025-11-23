"""
Direct test of API functions without starting server
"""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.rest_api import get_vendors, get_sport_courts


async def test_api_functions():
    """Test API functions directly"""
    print("Testing API functions...")
    print("=" * 50)
    
    try:
        # Test get_vendors
        print("\n1. Testing get_vendors()...")
        result = await get_vendors()
        print(f"   Status: {result.get('success', False)}")
        print(f"   Count: {result.get('count', 0)} vendors")
        
        if result.get('vendors'):
            print("\n   Sample vendors:")
            for vendor in result['vendors'][:5]:
                print(f"     - {vendor.get('name', 'Unknown')} ({vendor.get('category', 'Unknown')})")
        
        # Test get_sport_courts
        print("\n2. Testing get_sport_courts()...")
        sport_result = await get_sport_courts()
        print(f"   Status: {sport_result.get('success', False)}")
        print(f"   Count: {sport_result.get('count', 0)} sport courts")
        
        if sport_result.get('sport_courts'):
            print("\n   Sport courts found:")
            for court in sport_result['sport_courts'][:5]:
                print(f"     - {court.get('name', 'Unknown')} ({court.get('service_type', 'Unknown')})")
        
        # Test filtering
        print("\n3. Testing filter by service_type=padel...")
        padel_result = await get_vendors(service_type='padel')
        print(f"   Count: {padel_result.get('count', 0)} padel courts")
        
        print("\n" + "=" * 50)
        print("SUCCESS: API functions are working!")
        return True
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    asyncio.run(test_api_functions())

