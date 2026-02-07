import requests
import json
from datetime import datetime, timedelta
import pytz

KARACHI_TZ = pytz.timezone('Asia/Karachi')

BASE_URL = "http://localhost:8000"

def get_karachi_date(offset=0):
    return (datetime.now(KARACHI_TZ) + timedelta(days=offset)).strftime('%Y-%m-%d')

def run_test(test_id, query, expected_desc):
    print(f"\n{'='*80}")
    print(f"TEST {test_id}: {query}")
    print(f"{'='*80}")
    print(f"Expected: {expected_desc}")
    print("-" * 40)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai-search",
            json={"message": query},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            filters = result.get('filters', {})
            results = result.get('results', [])
            
            print(f"Parsed Filters:")
            print(f"  - Sport: {filters.get('sport_type', 'N/A')}")
            print(f"  - Area: {filters.get('area', 'N/A')}")
            print(f"  - Date: {filters.get('date', 'N/A')}")
            print(f"  - Time Range: {filters.get('time_range', 'N/A')}")
            print(f"  - Max Price: {filters.get('max_price', 'N/A')}")
            print(f"  - Reasoning: {filters.get('reasoning', 'N/A')}")
            
            print(f"\nActual Response:")
            print(f"  - Vendors Found: {len(results)}")
            if results:
                for r in results[:2]:
                    vendor = r['vendor']['name']
                    slots = [s['time'] for s in r['available_slots']]
                    print(f"    - {vendor}: {slots}")
            else:
                print(f"    - No availability found")
            
            # Validation Logic
            passed = True
            
            # Test 1: Explicit Today + 5pm
            if test_id == 1:
                if filters.get('date') != get_karachi_date(0) or filters.get('time_range', {}).get('start') != '17:00':
                    passed = False
            
            # Test 2: Kal Raat (Tomorrow Night)
            elif test_id == 2:
                if filters.get('date') != get_karachi_date(1) or filters.get('time_range', {}).get('start') != '18:00':
                    passed = False
            
            # Test 4: Tomorrow + 7pm
            elif test_id == 4:
                if filters.get('date') != get_karachi_date(1) or filters.get('time_range', {}).get('start') != '19:00':
                    passed = False

            # Test 8: Price Constraint
            elif test_id == 8:
                if filters.get('max_price') != 2500:
                    passed = False

            if passed:
                print(f"\n✅ RESULT: PASS")
            else:
                print(f"\n❌ RESULT: FAIL")
                
        else:
            print(f"❌ ERROR: HTTP {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")

if __name__ == "__main__":
    print("AI SEARCH VALIDATION TEST RUNNER")
    print(f"Current Date (Karachi): {get_karachi_date(0)}")
    
    tests = [
        (1, "is there any padel slot available at 5pm today?", f"Padel, {get_karachi_date(0)}, 17:00-17:59"),
        (2, "kal raat koi cricket net available hai?", f"Cricket, {get_karachi_date(1)}, 18:00-23:59"),
        (3, "padel at 7pm", f"Padel, {get_karachi_date(0)} (Default), 19:00-19:59"),
        (4, "padel at 7pm tomorrow", f"Padel, {get_karachi_date(1)}, 19:00-19:59"),
        (5, "kal 8 baje padel ka scene hai?", f"Padel, {get_karachi_date(1)}, 20:00-20:59"),
        (6, "is anything free right now?", f"Any Sport, {get_karachi_date(0)}, Current Hour"),
        (7, "padel at 3am today", "No availability found"),
        (8, "any futsal under 2500 tomorrow evening?", f"Futsal, {get_karachi_date(1)}, 18:00-23:59, Max Price 2500"),
        (9, "padel tonight tomorrow", f"Prefer tomorrow ({get_karachi_date(1)})"),
        (10, "hi how are you?", "Redirect to search prompt")
    ]
    
    for tid, query, desc in tests:
        run_test(tid, query, desc)
