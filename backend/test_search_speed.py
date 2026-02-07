import requests
import time
import json

start_time = time.time()
print("Starting search...")
response = requests.post("http://localhost:8000/api/ai-search", json={"message": "padel courts in DHA tonight"})
duration = time.time() - start_time

print(f"Search took {duration:.2f} seconds")
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"Results: {len(data.get('results', []))}")
    if data.get('results'):
        print("First result vendor:", data['results'][0]['vendor'].get('name'))
else:
    print(response.text)
