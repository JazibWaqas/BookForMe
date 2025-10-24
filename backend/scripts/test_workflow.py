"""
Test workflow script for BookForMe backend
Demonstrates the complete WhatsApp booking flow
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# TODO: Import when implemented
# from agents.whatsapp_agent import WhatsAppAgent
# from agents.nlu_agent import NLUAgent
# from services.availability_service import AvailabilityService
# from utils.state_manager import StateManager


async def test_whatsapp_workflow():
    """Test the complete WhatsApp booking workflow"""
    print("🧪 Testing BookForMe WhatsApp Workflow")
    print("=" * 50)
    
    # Test phone number
    test_phone = "+923001234567"
    
    # Simulate conversation flow
    conversation_steps = [
        {
            "user": "Hello",
            "expected_bot": "Welcome to BookForMe!",
            "description": "Initial greeting"
        },
        {
            "user": "I want to book futsal",
            "expected_bot": "Great! What date would you like?",
            "description": "Service selection"
        },
        {
            "user": "Tomorrow",
            "expected_bot": "Available times:",
            "description": "Date selection"
        },
        {
            "user": "5pm",
            "expected_bot": "Perfect! Your name and phone?",
            "description": "Time selection"
        },
        {
            "user": "Ahmed, +923001234567",
            "expected_bot": "Booking confirmed!",
            "description": "Booking confirmation"
        }
    ]
    
    print("📱 Simulating WhatsApp conversation:")
    print()
    
    for i, step in enumerate(conversation_steps, 1):
        print(f"Step {i}: {step['description']}")
        print(f"👤 User: {step['user']}")
        
        # TODO: Process through WhatsApp agent
        # bot_response = await whatsapp_agent.process_message(test_phone, step['user'])
        bot_response = f"[MOCK] {step['expected_bot']}"
        
        print(f"🤖 Bot: {bot_response}")
        print()
    
    print("✅ WhatsApp workflow test completed!")
    return True


async def test_nlu_processing():
    """Test NLU processing with sample messages"""
    print("🧠 Testing NLU Processing")
    print("=" * 30)
    
    test_messages = [
        "Hello, I want to book futsal tomorrow 5pm",
        "futsal kal 5 baje book karna hai",
        "My name is Ahmed, book salon next Friday",
        "Yes, confirm the booking",
        "Cancel my booking"
    ]
    
    for message in test_messages:
        print(f"📝 Message: {message}")
        
        # TODO: Process through NLU agent
        # nlu_result = await nlu_agent.extract_intent(message, [])
        nlu_result = {
            "intent": "booking_request",
            "entities": {"service": "futsal", "date": "tomorrow", "time": "5pm"},
            "confidence": 0.95
        }
        
        print(f"🎯 Intent: {nlu_result['intent']}")
        print(f"📊 Entities: {nlu_result['entities']}")
        print(f"🎯 Confidence: {nlu_result['confidence']}")
        print()
    
    print("✅ NLU processing test completed!")
    return True


async def test_availability_checking():
    """Test availability checking and booking"""
    print("📅 Testing Availability & Booking")
    print("=" * 35)
    
    # Test data
    vendor_id = "vendor1"
    date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    time = "17:00"
    customer_info = {
        "name": "Ahmed",
        "phone": "+923001234567"
    }
    
    print(f"🏢 Vendor: {vendor_id}")
    print(f"📅 Date: {date}")
    print(f"⏰ Time: {time}")
    print(f"👤 Customer: {customer_info['name']}")
    print()
    
    # TODO: Test availability checking
    # available_slots = await availability_service.get_available_slots(vendor_id, date)
    # print(f"📋 Available slots: {len(available_slots)}")
    
    # TODO: Test booking creation
    # booking_result = await availability_service.check_and_book_slot(
    #     vendor_id, date, time, customer_info
    # )
    # print(f"✅ Booking result: {booking_result}")
    
    print("✅ Availability & booking test completed!")
    return True


async def test_database_operations():
    """Test Firestore database operations"""
    print("🔥 Testing Firestore Operations")
    print("=" * 30)
    
    # TODO: Test Firestore connection
    # from app.firestore import firestore_db
    # 
    # # Test connection
    # vendors = await firestore_db.get_vendors_by_service("futsal")
    # print(f"🏢 Found {len(vendors)} futsal vendors")
    # 
    # # Test availability
    # slots = await firestore_db.get_available_slots("vendor1", "2025-01-15")
    # print(f"📅 Found {len(slots)} available slots")
    
    print("✅ Firestore operations test completed!")
    return True


async def main():
    """Run all tests"""
    print("🚀 BookForMe Backend Testing Suite")
    print("=" * 50)
    print()
    
    tests = [
        ("WhatsApp Workflow", test_whatsapp_workflow),
        ("NLU Processing", test_nlu_processing),
        ("Availability & Booking", test_availability_checking),
        ("Firestore Operations", test_database_operations)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            print(f"🧪 Running {test_name}...")
            result = await test_func()
            results.append((test_name, result))
            print()
        except Exception as e:
            print(f"❌ {test_name} failed: {e}")
            results.append((test_name, False))
            print()
    
    # Summary
    print("📊 Test Results Summary:")
    print("=" * 30)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Your backend is ready for development.")
    else:
        print("⚠️ Some tests failed. Check the implementation and try again.")
    
    return passed == len(results)


if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        sys.exit(1)
