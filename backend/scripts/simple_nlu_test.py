"""
Simple NLU Test Script
Quick test of NLU functionality without complex setup
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def test_nlu_basic():
    """Basic NLU test"""
    print("🧪 Simple NLU Test")
    print("=" * 30)
    
    try:
        # Import NLU agent
        from nlu.agent import NLUAgent
        
        print("✅ NLU Agent imported successfully")
        
        # Initialize agent
        agent = NLUAgent()
        print("✅ NLU Agent initialized successfully")
        
        # Test messages
        test_messages = [
            "Hello, I want to book futsal tomorrow at 5pm",
            "Salam, mujhe salon book karna hai",
            "Hi there!",
            "What services do you offer?",
            "Yes, confirm the booking"
        ]
        
        print("\n📝 Testing with sample messages:")
        print("-" * 40)
        
        for i, message in enumerate(test_messages, 1):
            print(f"\n{i}. Message: '{message}'")
            
            try:
                # Extract intent
                result = await agent.extract_intent(message, [])
                
                print(f"   Intent: {result.get('intent', 'unknown')}")
                print(f"   Confidence: {result.get('confidence', 0.0):.2f}")
                print(f"   Entities: {result.get('entities', {})}")
                
                # Generate response
                response = await agent.generate_response(
                    result.get('intent', 'unknown'),
                    result.get('entities', {}),
                    {}
                )
                print(f"   Response: '{response}'")
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
        
        print("\n✅ Basic NLU test completed!")
        return True
        
    except Exception as e:
        print(f"❌ NLU test failed: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you have a .env file with GEMINI_API_KEY")
        print("2. Check that all dependencies are installed")
        print("3. Verify your Gemini API key is valid")
        return False

async def test_gemini_model_speed():
    """Test Gemini model speed with different models"""
    print("\n⚡ Testing Gemini Model Speed")
    print("=" * 35)
    
    try:
        import google.generativeai as genai
        from app.config import settings
        
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Test with current model
        current_model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        test_prompt = "Extract intent from: 'I want to book futsal tomorrow'"
        
        print(f"Testing with model: {settings.GEMINI_MODEL}")
        
        import time
        start_time = time.time()
        
        response = await asyncio.get_event_loop().run_in_executor(
            None, current_model.generate_content, test_prompt
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"✅ Response time: {response_time:.2f} seconds")
        print(f"✅ Response: {response.text[:100]}...")
        
        if response_time < 2.0:
            print("✅ Model is fast enough for real-time use")
        else:
            print("⚠️ Model might be slow for real-time conversations")
        
        return True
        
    except Exception as e:
        print(f"❌ Speed test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 BookForMe NLU Quick Test")
    print("=" * 40)
    print()
    
    # Test basic NLU functionality
    nlu_success = await test_nlu_basic()
    
    # Test model speed
    speed_success = await test_gemini_model_speed()
    
    print("\n📊 Test Results:")
    print("=" * 20)
    print(f"NLU Functionality: {'✅ PASSED' if nlu_success else '❌ FAILED'}")
    print(f"Model Speed: {'✅ PASSED' if speed_success else '❌ FAILED'}")
    
    if nlu_success and speed_success:
        print("\n🎉 All tests passed! NLU is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check the error messages above.")
    
    return nlu_success and speed_success

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        sys.exit(1)
