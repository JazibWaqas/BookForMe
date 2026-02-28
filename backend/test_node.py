import sys
import os
import asyncio
sys.path.append(os.path.abspath('.'))
from agent.nodes import query_availability_node
import json

async def test():
    state = {
        "current_intent": "transaction",
        "entities": {
            "sport_type": "padel",
            "date": "2026-03-01",
            "time": "20:00",
            "area": None,
            "vendor_name": None
        },
        "messages": [],
        "user_phone": "1234567890",
        "selected_date": "2026-03-01",
        "vendor_id": None
    }
    
    print("Testing query_availability_node...")
    res = await query_availability_node(state)
    print("Query Result:")
    print(json.dumps(res.get("query_result", {}), indent=2))
    print("Response Generated:")
    print(res.get("response", ""))

if __name__ == '__main__':
    asyncio.run(test())
