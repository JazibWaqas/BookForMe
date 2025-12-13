# test_gemini_quick.py
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlu.agent import NLUAgent

async def test():
    agent = NLUAgent()
    result = await agent.extract_intent("Hi", [])
    print(f"Intent: {result.get('intent')}")
    print(f"Full result: {result}")

asyncio.run(test())