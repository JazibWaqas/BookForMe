import requests
import json

try:
    response = requests.get("http://localhost:8000/openapi.json")
    if response.status_code == 200:
        data = response.json()
        paths = data.get('paths', {}).keys()
        print("Available paths:")
        for p in paths:
            if "ai-search" in p:
                print(f"FOUND: {p}")
            else:
                pass # print(p) # checking only relevant ones
        
        if "/api/ai-search" not in paths:
            print("ERROR: /api/ai-search NOT FOUND in paths!")
            # print all paths to debug
            print(list(paths))
    else:
        print(f"Failed to get openapi.json: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
