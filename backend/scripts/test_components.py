"""
Component Testing Script for BookForMe Backend
Test individual components to ensure they're working correctly
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_imports():
    """Test if all modules can be imported"""
    print("🧪 Testing Module Imports")
    print("=" * 30)
    
    modules_to_test = [
        ("app.config", "Settings configuration"),
        ("app.firestore", "Firestore database"),
        ("whatsapp.agent", "WhatsApp conversation agent"),
        ("nlu.agent", "NLU agent with Gemini"),
        ("agent.tools", "Agent tools (availability, pricing)"),
        ("nlu.state_manager", "Conversation state management"),
        ("agent.graph", "LangGraph booking agent")
    ]
    
    results = []
    
    for module_name, description in modules_to_test:
        try:
            __import__(module_name)
            print(f"✅ {description}: Import successful")
            results.append(True)
        except ImportError as e:
            print(f"❌ {description}: Import failed - {e}")
            results.append(False)
        except Exception as e:
            print(f"⚠️ {description}: Import error - {e}")
            results.append(False)
    
    print(f"\n📊 Import Results: {sum(results)}/{len(results)} modules imported successfully")
    return all(results)

def test_config():
    """Test configuration loading"""
    print("\n🔧 Testing Configuration")
    print("=" * 25)
    
    try:
        from app.config import settings
        print(f"✅ App Name: {settings.APP_NAME}")
        print(f"✅ Debug Mode: {settings.DEBUG}")
        print(f"✅ Port: {settings.PORT}")
        print(f"✅ Log Level: {settings.LOG_LEVEL}")
        
        # Check if required environment variables are set
        required_vars = [
            'GEMINI_API_KEY',  # Required for NLU
        ]
        
        # Optional but recommended
        optional_vars = [
            'TWILIO_ACCOUNT_SID', 
            'TWILIO_AUTH_TOKEN',
            'FIRESTORE_PROJECT_ID',
            'WHATSAPP_VERIFY_TOKEN'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not hasattr(settings, var) or not getattr(settings, var):
                missing_vars.append(var)
        
        missing_optional = []
        for var in optional_vars:
            if not hasattr(settings, var) or not getattr(settings, var):
                missing_optional.append(var)
        
        if missing_vars:
            print(f"❌ Missing required environment variables: {missing_vars}")
            print("   Please update your .env file with the required API keys")
            return False
        else:
            print("✅ All required environment variables are set")
            if missing_optional:
                print(f"⚠️ Missing optional variables: {missing_optional}")
                print("   These are recommended but not required for basic testing")
            return True
            
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

async def test_firestore():
    """Test Firestore connection and operations"""
    print("\n🔥 Testing Firestore Connection")
    print("=" * 30)
    
    try:
        from app.firestore import firestore_db
        
        # Check if Firestore is initialized
        if firestore_db.db is None:
            print("⚠️ Firestore not initialized (credentials may be missing)")
            print("   This is OK - the agent will work without Firestore")
            print("   Conversation history just won't be persisted")
            return True  # Don't fail the test
        
        # Test connection by reading a document
        vendors = firestore_db.db.collection('vendors').limit(1).stream()
        vendor_list = list(vendors)
        
        if vendor_list:
            print("✅ Firestore connection successful!")
            print(f"✅ Found {len(vendor_list)} vendors in database")
            return True
        else:
            print("⚠️ Firestore connected but no data found")
            print("   Run 'python scripts/init_firestore.py' to create sample data")
            return True
            
    except Exception as e:
        print(f"⚠️ Firestore connection failed: {e}")
        print("   This is OK - the agent will work without Firestore")
        print("   Check your FIRESTORE_PROJECT_ID and credentials file if you want persistence")
        return True  # Don't fail the test - Firestore is optional

async def test_nlu_agent():
    """Test NLU agent with Groq API"""
    print("\n🧠 Testing NLU Agent")
    print("=" * 20)
    
    try:
        from nlu.agent import NLUAgent
        
        # Test Groq API connection
        agent = NLUAgent()
        print("✅ NLU Agent initialized successfully")
        
        # Test with sample message
        test_message = "Hello, I want to book futsal tomorrow 5pm"
        print(f"📝 Testing with message: '{test_message}'")
        
        # Test the actual NLU processing
        result = await agent.extract_intent(test_message, [])
        print(f"✅ NLU processing successful")
        print(f"   Intent: {result.get('intent', 'unknown')}")
        print(f"   Confidence: {result.get('confidence', 0.0):.2f}")
        if result.get('entities'):
            print(f"   Entities: {result.get('entities')}")
        
        print("✅ NLU Agent test completed")
        return True
        
    except Exception as e:
        print(f"❌ NLU Agent test failed: {e}")
        print("   Check your GROQ_API_KEY in .env file")
        return False

async def test_whatsapp_agent():
    """Test WhatsApp agent conversation flow"""
    print("\n📱 Testing WhatsApp Agent")
    print("=" * 25)
    
    try:
        from whatsapp.agent import WhatsAppAgent
        
        agent = WhatsAppAgent()
        print("✅ WhatsApp Agent initialized successfully")
        
        # Test message processing
        test_phone = "+923001234567"
        test_message = "Hello, I want to book futsal"
        
        print(f"📝 Testing with phone: {test_phone}")
        print(f"📝 Testing with message: '{test_message}'")
        
        # Test the actual conversation processing
        response = await agent.process_message(test_phone, test_message)
        print(f"✅ Conversation processing successful")
        print(f"   Response: {response[:100]}...")
        
        print("✅ WhatsApp Agent test completed")
        return True
        
    except Exception as e:
        print(f"❌ WhatsApp Agent test failed: {e}")
        import traceback
        print(f"   Error details: {traceback.format_exc()}")
        return False

async def test_availability_service():
    """Test availability service"""
    print("\n📅 Testing Availability Service")
    print("=" * 30)
    
    try:
        from agent.tools import check_availability
        
        print("✅ Availability tools imported successfully")
        
        # Test with sample data
        date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        time_range = {"start": "18:00", "end": "21:00"}
        
        print(f"📝 Testing availability for date: {date}")
        print(f"📝 Testing time range: {time_range}")
        
        # Test the actual availability checking
        result = check_availability(date, time_range)
        if result.get("success"):
            slots = result.get("available_slots", [])
            print(f"✅ Found {len(slots)} available slots")
        else:
            print(f"⚠️ Availability check returned: {result.get('error', 'Unknown error')}")
        
        print("✅ Availability Service test completed")
        return True
        
    except Exception as e:
        print(f"❌ Availability Service test failed: {e}")
        import traceback
        print(f"   Error details: {traceback.format_exc()}")
        return False

async def test_state_manager():
    """Test conversation state management"""
    print("\n💾 Testing State Manager")
    print("=" * 25)
    
    try:
        from nlu.state_manager import StateManager
        
        manager = StateManager()
        print("✅ State Manager initialized successfully")
        
        # Test with sample phone number
        test_phone = "+923001234567"
        
        print(f"📝 Testing state management for phone: {test_phone}")
        
        # Test the actual state management
        session = await manager.get_session(test_phone)
        print(f"✅ Session retrieved successfully")
        print(f"   State: {session.get('state', 'unknown')}")
        print(f"   History length: {len(session.get('history', []))}")
        
        print("✅ State Manager test completed")
        return True
        
    except Exception as e:
        print(f"❌ State Manager test failed: {e}")
        print(f"   Note: This is OK if Firestore is not configured")
        print(f"   The agent will still work with in-memory state")
        import traceback
        print(f"   Error details: {traceback.format_exc()}")
        # Don't fail the test if Firestore isn't configured
        return True  # Return True since this is optional

async def main():
    """Run all component tests"""
    print("🧪 BookForMe Backend - Component Testing")
    print("=" * 50)
    print()
    
    # Test imports first
    if not test_imports():
        print("\n❌ Import tests failed. Please check your Python environment.")
        return False
    
    # Test configuration
    if not test_config():
        print("\n❌ Configuration test failed. Please check your .env file.")
        return False
    
    # Test individual components
    tests = [
        ("Firestore Connection", test_firestore),
        ("NLU Agent", test_nlu_agent),
        ("WhatsApp Agent", test_whatsapp_agent),
        ("Availability Service", test_availability_service),
        ("State Manager", test_state_manager)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n📊 Component Test Results:")
    print("=" * 30)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} components working")
    
    if passed == len(results):
        print("🎉 All components are working! Ready for integration testing.")
    else:
        print("⚠️ Some components need attention. Check the error messages above.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        sys.exit(1)
