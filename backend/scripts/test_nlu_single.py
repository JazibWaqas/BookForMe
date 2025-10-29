"""
Single NLU Test - Respects API rate limits
Test one message at a time with delays
"""

import asyncio
import sys
import os
import time

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def test_single_message(message: str):
    """Test a single message with NLU"""
    print(f"🧪 Testing NLU with message: '{message}'")
    print("=" * 60)
    
    try:
        from nlu.agent import NLUAgent
        
        # Initialize agent
        agent = NLUAgent()
        print("✅ NLU Agent initialized")
        
        # Extract intent
        print("🔍 Extracting intent...")
        intent_result = await agent.extract_intent(message, [])
        
        print(f"✅ Intent: {intent_result.get('intent', 'unknown')}")
        print(f"✅ Confidence: {intent_result.get('confidence', 0.0):.2f}")
        print(f"✅ Entities: {intent_result.get('entities', {})}")
        
        # Wait a bit to respect rate limits
        print("⏳ Waiting 30 seconds to respect API rate limits...")
        await asyncio.sleep(30)
        
        # Generate response
        print("💬 Generating response...")
        response = await agent.generate_response(
            intent_result.get('intent', 'unknown'),
            intent_result.get('entities', {}),
            {}
        )
        
        print(f"✅ Response: '{response}'")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python test_nlu_single.py 'your message here'")
        print("Example: python test_nlu_single.py 'Hello, I want to book futsal tomorrow'")
        return
    
    message = sys.argv[1]
    success = await test_single_message(message)
    
    if success:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n❌ Test failed!")

if __name__ == "__main__":
    asyncio.run(main())
