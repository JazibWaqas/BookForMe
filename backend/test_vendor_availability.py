import requests
import json
import sys

# Use localhost since we are running on same machine
url = "http://localhost:8000/api/vendors/ace_padel_dha/availability?date=2026-02-07"

try:
    print(f"Requesting: {url}")
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data.get('success')}")
        slots = data.get('available_slots', [])
        print(f"Slots found: {len(slots)}")
        
        if slots:
            print("First slot structure:")
            print(json.dumps(slots[0], indent=2))
            
            # Check for start_time
            if 'start_time' not in slots[0]:
                print("ERROR: start_time missing in slot!")
            else:
                print(f"start_time present: {slots[0]['start_time']}")
        else:
            print("No slots found.")
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Failed: {e}")
