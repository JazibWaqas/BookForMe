import requests
import json

BASE_URL = "http://localhost:8000"

# Quick focused tests
tests = [
    ("English Query", "padel tonight DHA"),
    ("Roman Urdu", "kal sham padel khali hai?"),
    ("Messy Query", "aaj raat scene on hai kya"),
]

print("AI SEARCH QUICK TEST")
print("=" * 60)

for name, query in tests:
    print(f"\n{name}: '{query}'")
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai-search",
            json={"message": query},
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            filters = result.get('filters', {})
            
            print(f"  ✅ Sport: {filters.get('sport_type', 'N/A')}")
            print(f"  ✅ Date: {filters.get('date', 'N/A')}")
            print(f"  ✅ Time: {filters.get('time_range', 'N/A')}")
            print(f"  ✅ Area: {filters.get('area', 'N/A')}")
            print(f"  📝 Reasoning: {filters.get('reasoning', 'N/A')[:80]}...")
            print(f"  📊 Results: {len(result.get('results', []))} vendors")
        else:
            print(f"  ❌ Failed: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")

print("\n" + "=" * 60)
