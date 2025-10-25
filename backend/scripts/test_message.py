"""
One-liner NLU Test
Test single messages from command line
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlu.agent import NLUAgent


async def test_message(message: str):
    """Test a single message and show results"""
    agent = NLUAgent()
    
    print(f"Testing: '{message}'")
    print("-" * 50)
    
    try:
        # Extract intent and entities
        result = await agent.extract_intent(message, [])
        intent = result.get('intent', 'unknown')
        entities = result.get('entities', {})
        confidence = result.get('confidence', 0.0)
        
        print(f"Intent: {intent}")
        print(f"Confidence: {confidence:.2f}")
        print(f"Entities: {entities}")
        
        # Generate response
        response = await agent.generate_response(intent, entities, {})
        print(f"Response: {response}")
        
    except Exception as e:
        print(f"Error: {e}")


async def main():
    """Test with command line message"""
    if len(sys.argv) > 1:
        message = ' '.join(sys.argv[1:])
        await test_message(message)
    else:
        print("Usage: python test_message.py 'your message here'")
        print("\nExamples:")
        print("python test_message.py 'Hello, I want to book futsal'")
        print("python test_message.py 'Salam, salon ka appointment lena hai'")
        print("python test_message.py 'Tomorrow 5pm slot chahiye'")


if __name__ == "__main__":
    asyncio.run(main())
