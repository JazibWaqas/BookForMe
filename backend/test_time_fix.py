import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_specific_time():
    print("\nTEST: Specific Time Filtering (7 PM)")
    print("=" * 60)
    
    queries = [
        {"q": "padel at 7pm today", "expected_date": datetime.now().strftime('%Y-%m-%d')},
        {"q": "padel at 7pm tomorrow", "expected_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')},
        {"q": "kal 7pm padel", "expected_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')}
    ]
    
    for item in queries:
        query = item["q"]
        expected_date = item["expected_date"]
        print(f"\nQuery: '{query}'")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/ai-search",
                json={"message": query},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                filters = result.get('filters', {})
                parsed_date = filters.get('date')
                print(f"Parsed Date: {parsed_date} (Expected: {expected_date})")
                print(f"Parsed Time: {filters.get('time_range')}")
                
                if parsed_date == expected_date:
                    print(f"  ✅ DATE PASS")
                else:
                    print(f"  ❌ DATE FAIL")

                results = result.get('results', [])
                print(f"Vendors found: {len(results)}")
                
                for r in results:
                    vendor_name = r['vendor']['name']
                    slots = [s['time'] for s in r['available_slots']]
                    print(f"  - {vendor_name}: {slots}")
            else:
                print(f"Error: {response.status_code}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    test_specific_time()
