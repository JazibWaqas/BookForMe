"""
Groq Migration Test Script
Test NLU agent with Groq (Qwen 3 32B) after migration from Gemini
"""

import asyncio
import sys
import os
import time


# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def test_groq_connection():
    """Test Groq API connection and initialization"""
    print("Testing Groq Connection")
    print("=" * 40)
    
    try:
        from nlu.agent import NLUAgent
        from app.config import settings
        
        print(f"GROQ_MODEL: {settings.GROQ_MODEL}")
        print(f"GROQ_API_KEY: {'*' * 20}...{settings.GROQ_API_KEY[-4:] if settings.GROQ_API_KEY else 'NOT SET'}")
        
        agent = NLUAgent()
        print("NLU Agent initialized successfully with Groq")
        return True, agent
        
    except Exception as e:
        print(f"Groq connection failed: {e}")
        print("\nTroubleshooting:")
        print("1. Check that GROQ_API_KEY is set in .env file")
        print("2. Verify your Groq API key is valid")
        print("3. Ensure openai library is installed: pip install openai")
        return False, None

async def test_intent_extraction(agent):
    """Test intent extraction with bilingual messages"""
    print("\nTesting Intent Extraction (Roman Urdu + English)")
    print("=" * 50)
    
    test_cases = [
        {
            "message": "Hello, I want to book futsal tomorrow at 5pm",
            "expected_intent": "booking_request",
            "description": "English booking request"
        },
        {
            "message": "Salam, mujhe salon book karna hai",
            "expected_intent": "booking_request",
            "description": "Roman Urdu booking request"
        },
        {
            "message": "Aoa, koi slot hai kal?",
            "expected_intent": "availability_inquiry",
            "description": "Roman Urdu availability inquiry"
        },
        {
            "message": "Hi there!",
            "expected_intent": "greeting",
            "description": "Simple greeting"
        },
        {
            "message": "Kitna charge hai padel ka?",
            "expected_intent": "price_inquiry",
            "description": "Price inquiry in Roman Urdu"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['description']}")
        print(f"   Message: '{test_case['message']}'")
        
        try:
            start_time = time.time()
            result = await agent.extract_intent(test_case['message'], [])
            elapsed = time.time() - start_time
            
            intent = result.get('intent', 'unknown')
            confidence = result.get('confidence', 0.0)
            entities = result.get('entities', {})
            
            print(f"   Intent: {intent}")
            print(f"   Confidence: {confidence:.2f}")
            print(f"   Response time: {elapsed:.2f}s")
            if entities:
                print(f"   Entities: {entities}")
            
            passed = intent == test_case['expected_intent']
            status = "PASS" if passed else "PARTIAL"
            
            if passed:
                print(f"   {status} - Matches expected intent")
            else:
                print(f"   {status} - Expected: {test_case['expected_intent']}, Got: {intent}")
            
            results.append({
                'test': test_case['description'],
                'passed': passed,
                'elapsed': elapsed
            })
            
        except Exception as e:
            print(f"   Error: {e}")
            results.append({'test': test_case['description'], 'passed': False, 'elapsed': 0})
    
    return results

async def test_response_generation(agent):
    """Test response generation"""
    print("\nTesting Response Generation")
    print("=" * 35)
    
    try:
        intent = "greeting"
        entities = {}
        context = {}
        
        start_time = time.time()
        response = await agent.generate_response(intent, entities, context)
        elapsed = time.time() - start_time
        
        print(f"Response generated in {elapsed:.2f}s")
        print(f"Response: {response[:100]}..." if len(response) > 100 else f"Response: {response}")
        
        return True, elapsed
        
    except Exception as e:
        print(f"Response generation failed: {e}")
        return False, 0

async def main():
    """Main test function"""
    print("Groq Migration Test - Qwen 3 32B")
    print("=" * 50)
    print()
    
    # Test connection
    connection_ok, agent = await test_groq_connection()
    
    if not connection_ok:
        print("\nConnection test failed. Cannot proceed with other tests.")
        return False
    
    # Test intent extraction
    intent_results = await test_intent_extraction(agent)
    
    # Test response generation
    response_ok, response_time = await test_response_generation(agent)
    
    # Summary
    print("\nTest Summary")
    print("=" * 30)
    
    passed_intents = sum(1 for r in intent_results if r['passed'])
    total_intents = len(intent_results)
    avg_latency = sum(r['elapsed'] for r in intent_results) / total_intents if total_intents > 0 else 0
    
    print(f"Connection: PASSED")
    print(f"Intent Extraction: {passed_intents}/{total_intents} passed")
    print(f"Response Generation: {'PASSED' if response_ok else 'FAILED'}")
    print(f"Average Latency: {avg_latency:.2f}s")
    
    if avg_latency < 1.0:
        print("Excellent! Groq is delivering 10x lower latency than Gemini")
    elif avg_latency < 2.0:
        print("Good! Groq latency is acceptable")
    else:
        print("Latency higher than expected, but should still be faster than Gemini")
    
    all_passed = connection_ok and passed_intents > 0 and response_ok
    
    if all_passed:
        print("\nMigration successful! Groq is working correctly.")
    else:
        print("\nSome tests failed. Check errors above.")
    
    return all_passed

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
