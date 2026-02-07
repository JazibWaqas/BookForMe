import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_specific_time():
    print("\nTEST: Specific Time Filtering (7 PM)")
    print("=" * 60)
    
    query = "padel at 7pm today"
    print(f"Query: '{query}'")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai-search",
            json={"message": query},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            filters = result.get('filters', {})
            print(f"Parsed Time: {filters.get('time_range')}")
            
            results = result.get('results', [])
            print(f"Vendors found: {len(results)}")
            
            for r in results:
                vendor_name = r['vendor']['name']
                slots = [s['time'] for s in r['available_slots']]
                print(f"  - {vendor_name}: {slots}")
                
                # Verify all slots are in the 7 PM hour (19:00)
                for slot_time in slots:
                    hour = int(slot_time.split(':')[0])
                    if hour != 19:
                        print(f"  ❌ FAIL: Found slot at {slot_time} when 19:00 was expected")
                    else:
                        print(f"  ✅ PASS: Slot at {slot_time} is correct")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_specific_time()
