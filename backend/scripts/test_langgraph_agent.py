"""
Test LangGraph Agent
Test the LangGraph agent with various queries about Ace Padel Club
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from agent.graph import BookingAgent


async def test_agent():
    """Test the LangGraph agent with various queries"""
    
    print("=" * 60)
    print("LangGraph Agent Test Suite")
    print("=" * 60)
    print()
    
    # Initialize agent
    print("Initializing LangGraph agent...")
    agent = BookingAgent()
    print("[OK] Agent initialized\n")
    
    # Test cases
    test_cases = [
        {
            "name": "Simple Greeting",
            "message": "Hi",
            "expected": "greeting response"
        },
        {
            "name": "Roman Urdu Greeting",
            "message": "Aoa",
            "expected": "AoA greeting in Roman Urdu"
        },
        {
            "name": "Incomplete Availability Query",
            "message": "koi slot hei?",
            "expected": "Ask for date/time"
        },
        {
            "name": "Availability with Date",
            "message": "kal slot hai?",
            "expected": "Show available slots for tomorrow"
        },
        {
            "name": "Availability with Time",
            "message": "evening ka slot hai?",
            "expected": "Show evening slots"
        },
        {
            "name": "Complete Availability Query",
            "message": "kal evening ka slot hai?",
            "expected": "Show tomorrow evening slots"
        },
        {
            "name": "Price Inquiry",
            "message": "kitna hai price?",
            "expected": "Show pricing information"
        },
        {
            "name": "Price Inquiry Roman Urdu",
            "message": "kitna charge hai?",
            "expected": "Show pricing in Roman Urdu style"
        }
    ]
    
    results = []
    conversation_history = []
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}: {test['name']}")
        print(f"{'='*60}")
        print(f"User: {test['message']}")
        
        try:
            # Process message
            response = await agent.process(
                user_phone="+923001234567",
                message=test['message'],
                conversation_history=conversation_history
            )
            
            print(f"Agent: {response}")
            print()
            
            # Update conversation history
            conversation_history.append({"role": "user", "content": test['message']})
            conversation_history.append({"role": "assistant", "content": response})
            
            # Check if response is meaningful
            is_meaningful = len(response.strip()) > 10 and "error" not in response.lower()
            
            results.append({
                "test": test['name'],
                "message": test['message'],
                "response": response,
                "success": is_meaningful,
                "expected": test['expected']
            })
            
            # Small delay between tests
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"[ERROR] Error: {e}")
            import traceback
            print(traceback.format_exc())
            results.append({
                "test": test['name'],
                "message": test['message'],
                "response": f"Error: {e}",
                "success": False,
                "error": str(e)
            })
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    successful = sum(1 for r in results if r['success'])
    total = len(results)
    
    print(f"\nSuccessful: {successful}/{total}")
    print()
    
    for result in results:
        status = "[OK]" if result['success'] else "[FAIL]"
        print(f"{status} {result['test']}")
        if not result['success']:
            print(f"   Error: {result.get('error', 'Unknown error')}")
    
    print("\n" + "=" * 60)
    print("Reference Data Check")
    print("=" * 60)
    print("\nTo verify responses, check: backend/data/ace_padel_club.txt")
    print("This file contains all hardcoded vendor data for comparison.")
    
    return successful == total


if __name__ == "__main__":
    success = asyncio.run(test_agent())
    sys.exit(0 if success else 1)

