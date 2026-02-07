import requests
import json

# Test AI Search API
BASE_URL = "http://localhost:8000"

test_queries = [
    # Test 1: Simple English query
    {
        "name": "Simple English - Tonight DHA",
        "query": "padel tonight DHA",
        "expected": "Should find padel courts in DHA for today evening"
    },
    # Test 2: Roman Urdu query
    {
        "name": "Roman Urdu - Kal sham",
        "query": "kal sham padel khali hai?",
        "expected": "Should find padel slots for tomorrow evening"
    },
    # Test 3: Messy mixed query
    {
        "name": "Messy Mixed - Scene check",
        "query": "aaj raat ka scene on hai kya DHA mein",
        "expected": "Should check tonight availability in DHA"
    },
    # Test 4: Specific time query
    {
        "name": "Specific Time",
        "query": "padel at 7pm tomorrow",
        "expected": "Should find 7pm slots for tomorrow"
    },
    # Test 5: Price filter
    {
        "name": "Price Filter",
        "query": "cheap padel courts under 3000",
        "expected": "Should filter by max price 3000"
    },
    # Test 6: Area only
    {
        "name": "Area Only",
        "query": "futsal in Gulberg",
        "expected": "Should find futsal in Gulberg area"
    },
    # Test 7: Vague query (hallucination test)
    {
        "name": "Vague Query",
        "query": "koi slot hai?",
        "expected": "Should handle missing info gracefully"
    },
    # Test 8: Day after tomorrow
    {
        "name": "Day After Tomorrow",
        "query": "parson cricket available?",
        "expected": "Should parse 'parson' as day after tomorrow"
    }
]

print("=" * 80)
print("AI SEARCH API COMPREHENSIVE TEST")
print("=" * 80)

for i, test in enumerate(test_queries, 1):
    print(f"\n{'='*80}")
    print(f"TEST {i}: {test['name']}")
    print(f"{'='*80}")
    print(f"Query: '{test['query']}'")
    print(f"Expected: {test['expected']}")
    print("-" * 80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai-search",
            json={"message": test['query']},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"✅ Status: SUCCESS")
            print(f"\nParsed Filters:")
            filters = result.get('filters', {})
            print(f"  - Sport: {filters.get('sport_type', 'N/A')}")
            print(f"  - Area: {filters.get('area', 'N/A')}")
            print(f"  - Date: {filters.get('date', 'N/A')}")
            print(f"  - Time Range: {filters.get('time_range', 'N/A')}")
            print(f"  - Max Price: {filters.get('max_price', 'N/A')}")
            print(f"  - Reasoning: {filters.get('reasoning', 'N/A')}")
            
            print(f"\nResults:")
            results = result.get('results', [])
            print(f"  - Vendors Found: {len(results)}")
            
            if results:
                for idx, vendor_result in enumerate(results[:3], 1):
                    vendor = vendor_result.get('vendor', {})
                    slots = vendor_result.get('available_slots', [])
                    print(f"\n  Vendor {idx}: {vendor.get('name', 'Unknown')}")
                    print(f"    - Area: {vendor.get('area', 'N/A')}")
                    print(f"    - Available Slots: {len(slots)}")
                    if slots:
                        print(f"    - First Slot: {slots[0].get('time', 'N/A')} @ Rs {slots[0].get('price', 'N/A')}")
            
            # Hallucination check
            if filters.get('sport_type') and filters['sport_type'] not in ['padel', 'futsal', 'cricket', 'tennis', 'pickleball', '']:
                print(f"\n⚠️  HALLUCINATION WARNING: Invalid sport type '{filters['sport_type']}'")
            
        else:
            print(f"❌ Status: FAILED (HTTP {response.status_code})")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
print("TEST COMPLETE")
print("=" * 80)
