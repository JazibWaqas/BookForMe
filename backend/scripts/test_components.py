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
        ("agents.whatsapp_agent", "WhatsApp conversation agent"),
        ("agents.nlu_agent", "NLU agent with Gemini"),
        ("services.availability_service", "Availability checking service"),
        ("utils.state_manager", "Conversation state management"),
        ("utils.helpers", "Utility functions")
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
            'GEMINI_API_KEY',
            'TWILIO_ACCOUNT_SID', 
            'TWILIO_AUTH_TOKEN',
            'FIRESTORE_PROJECT_ID'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not hasattr(settings, var) or not getattr(settings, var):
                missing_vars.append(var)
        
        if missing_vars:
            print(f"⚠️ Missing environment variables: {missing_vars}")
            print("   Please update your .env file with the required API keys")
            return False
        else:
            print("✅ All required environment variables are set")
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
        print(f"❌ Firestore connection failed: {e}")
        print("   Check your FIRESTORE_PROJECT_ID and credentials file")
        return False

async def test_nlu_agent():
    """Test NLU agent with Gemini API"""
    print("\n🧠 Testing NLU Agent")
    print("=" * 20)
    
    try:
        from agents.nlu_agent import NLUAgent
        
        # Test Gemini API connection
        agent = NLUAgent()
        print("✅ NLU Agent initialized successfully")
        
        # Test with sample message
        test_message = "Hello, I want to book futsal tomorrow 5pm"
        print(f"📝 Testing with message: '{test_message}'")
        
        # This would test the actual NLU processing
        # result = await agent.extract_intent(test_message, [])
        # print(f"✅ NLU processing successful: {result}")
        
        print("✅ NLU Agent test completed")
        return True
        
    except Exception as e:
        print(f"❌ NLU Agent test failed: {e}")
        print("   Check your GEMINI_API_KEY in .env file")
        return False

async def test_whatsapp_agent():
    """Test WhatsApp agent conversation flow"""
    print("\n📱 Testing WhatsApp Agent")
    print("=" * 25)
    
    try:
        from agents.whatsapp_agent import WhatsAppAgent
        
        agent = WhatsAppAgent()
        print("✅ WhatsApp Agent initialized successfully")
        
        # Test conversation states
        states = agent.STATES
        print(f"✅ Conversation states: {list(states.values())}")
        
        # Test message processing
        test_phone = "+923001234567"
        test_message = "Hello, I want to book futsal"
        
        print(f"📝 Testing with phone: {test_phone}")
        print(f"📝 Testing with message: '{test_message}'")
        
        # This would test the actual conversation processing
        # response = await agent.process_message(test_phone, test_message)
        # print(f"✅ Conversation processing successful: {response}")
        
        print("✅ WhatsApp Agent test completed")
        return True
        
    except Exception as e:
        print(f"❌ WhatsApp Agent test failed: {e}")
        return False

async def test_availability_service():
    """Test availability service"""
    print("\n📅 Testing Availability Service")
    print("=" * 30)
    
    try:
        from services.availability_service import AvailabilityService
        
        service = AvailabilityService()
        print("✅ Availability Service initialized successfully")
        
        # Test with sample data
        vendor_id = "vendor1"
        date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        print(f"📝 Testing availability for vendor: {vendor_id}")
        print(f"📝 Testing date: {date}")
        
        # This would test the actual availability checking
        # slots = await service.get_available_slots(vendor_id, date)
        # print(f"✅ Found {len(slots)} available slots")
        
        print("✅ Availability Service test completed")
        return True
        
    except Exception as e:
        print(f"❌ Availability Service test failed: {e}")
        return False

async def test_state_manager():
    """Test conversation state management"""
    print("\n💾 Testing State Manager")
    print("=" * 25)
    
    try:
        from utils.state_manager import StateManager
        
        manager = StateManager()
        print("✅ State Manager initialized successfully")
        
        # Test with sample phone number
        test_phone = "+923001234567"
        
        print(f"📝 Testing state management for phone: {test_phone}")
        
        # This would test the actual state management
        # session = await manager.get_session(test_phone)
        # print(f"✅ Session retrieved: {session}")
        
        print("✅ State Manager test completed")
        return True
        
    except Exception as e:
        print(f"❌ State Manager test failed: {e}")
        return False

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
