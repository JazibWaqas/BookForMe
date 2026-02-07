import requests
import json
from datetime import datetime

url = "http://localhost:8000/api/ai-search"
headers = {"Content-Type": "application/json"}
data = {
    "message": "padel tonight DHA",
    "model": "llama-3.3-70b-versatile"
}

try:
    print(f"Sending request to {url}...")
    start = datetime.now()
    response = requests.post(url, headers=headers, json=data)
    duration = (datetime.now() - start).total_seconds()
    
    print(f"Status Code: {response.status_code}")
    print(f"Duration: {duration}s")
    
    if response.status_code == 200:
        json_response = response.json()
        print("Response JSON keys:", json_response.keys())
        if 'results' in json_response and len(json_response['results']) > 0:
            first_result = json_response['results'][0]
            print("First Result keys:", first_result.keys())
            if 'available_slots' in first_result and len(first_result['available_slots']) > 0:
                first_slot = first_result['available_slots'][0]
                print("First Slot keys:", first_slot.keys())
                print("First Slot content:", json.dumps(first_slot, indent=2))
        else:
            print("No results found.")
    else:
        print("Error Response:", response.text)

except Exception as e:
    print(f"Request failed: {e}")
