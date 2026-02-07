import requests
import time
import json

try:
    start_time = time.time()
    print("Starting search...")
    # Use 'message' as per API contract
    response = requests.post("http://localhost:8000/api/ai-search", json={"message": "padel in DHA tonight"})
    duration = time.time() - start_time

    print(f"Search took {duration:.2f} seconds")
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data.get('results', []))} results")
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Failed: {e}")
