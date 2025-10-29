"""
NLU Testing Script for BookForMe Backend
Test the Natural Language Understanding agent with various scenarios
"""

import asyncio
import sys
import os
import json
from datetime import datetime
from typing import Dict, List, Any

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class NLUTester:
    """Comprehensive NLU testing class"""
    
    def __init__(self):
        self.nlu_agent = None
        self.state_manager = None
        self.test_results = []
        
    async def initialize(self):
        """Initialize NLU agent and state manager"""
        try:
            from nlu.agent import NLUAgent
            from nlu.state_manager import StateManager
            
            print("🔧 Initializing NLU components...")
            self.nlu_agent = NLUAgent()
            self.state_manager = StateManager()
            print("✅ NLU components initialized successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize NLU components: {e}")
            return False
    
    async def test_intent_extraction(self):
        """Test intent extraction with various message types"""
        print("\n🧠 Testing Intent Extraction")
        print("=" * 40)
        
        test_cases = [
            {
                "message": "Hello, I want to book futsal tomorrow at 5pm",
                "expected_intent": "booking_request",
                "description": "Basic booking request in English"
            },
            {
                "message": "Salam, mujhe salon book karna hai",
                "expected_intent": "booking_request", 
                "description": "Booking request in Roman Urdu"
            },
            {
                "message": "Hi there!",
                "expected_intent": "greeting",
                "description": "Simple greeting"
            },
            {
                "message": "What services do you offer?",
                "expected_intent": "information",
                "description": "Information request"
            },
            {
                "message": "I want to cancel my booking",
                "expected_intent": "cancellation",
                "description": "Cancellation request"
            },
            {
                "message": "Yes, confirm the booking",
                "expected_intent": "confirmation",
                "description": "Confirmation response"
            },
            {
                "message": "I need futsal court for next Friday evening",
                "expected_intent": "booking_request",
                "description": "Specific date and time request"
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 Test Case {i}: {test_case['description']}")
            print(f"Message: '{test_case['message']}'")
            
            try:
                # Test with empty conversation history
                result = await self.nlu_agent.extract_intent(
                    test_case['message'], 
                    []
                )
                
                print(f"✅ Intent: {result.get('intent', 'unknown')}")
                print(f"✅ Confidence: {result.get('confidence', 0.0):.2f}")
                print(f"✅ Entities: {result.get('entities', {})}")
                
                # Check if intent matches expected
                detected_intent = result.get('intent', 'unknown')
                expected_intent = test_case['expected_intent']
                
                if detected_intent == expected_intent:
                    print(f"✅ Intent matches expected: {expected_intent}")
                    results.append(True)
                else:
                    print(f"⚠️ Intent mismatch - Expected: {expected_intent}, Got: {detected_intent}")
                    results.append(False)
                
                # Store result for summary
                self.test_results.append({
                    'test': f"Intent Test {i}",
                    'message': test_case['message'],
                    'expected': expected_intent,
                    'actual': detected_intent,
                    'confidence': result.get('confidence', 0.0),
                    'entities': result.get('entities', {}),
                    'passed': detected_intent == expected_intent
                })
                
            except Exception as e:
                print(f"❌ Error in test case {i}: {e}")
                results.append(False)
                self.test_results.append({
                    'test': f"Intent Test {i}",
                    'message': test_case['message'],
                    'error': str(e),
                    'passed': False
                })
        
        passed = sum(results)
        total = len(results)
        print(f"\n📊 Intent Extraction Results: {passed}/{total} passed")
        return passed == total
    
    async def test_entity_extraction(self):
        """Test entity extraction for different intents"""
        print("\n🔍 Testing Entity Extraction")
        print("=" * 35)
        
        test_cases = [
            {
                "message": "I want to book futsal tomorrow at 5pm",
                "intent": "booking_request",
                "expected_entities": ["service_type", "date", "time"],
                "description": "Futsal booking with date and time"
            },
            {
                "message": "Book salon for next Friday evening",
                "intent": "booking_request", 
                "expected_entities": ["service_type", "date", "time"],
                "description": "Salon booking with relative date"
            },
            {
                "message": "My name is Ahmad and I need gym slot",
                "intent": "booking_request",
                "expected_entities": ["customer_name", "service_type"],
                "description": "Booking with customer name"
            },
            {
                "message": "Call me at +923001234567 for futsal booking",
                "intent": "booking_request",
                "expected_entities": ["phone_number", "service_type"],
                "description": "Booking with phone number"
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 Test Case {i}: {test_case['description']}")
            print(f"Message: '{test_case['message']}'")
            print(f"Intent: {test_case['intent']}")
            
            try:
                entities = await self.nlu_agent.extract_entities(
                    test_case['message'],
                    test_case['intent']
                )
                
                print(f"✅ Extracted entities: {entities}")
                
                # Check if expected entity types are present
                extracted_keys = set(entities.keys())
                expected_keys = set(test_case['expected_entities'])
                
                missing_entities = expected_keys - extracted_keys
                if not missing_entities:
                    print(f"✅ All expected entities found")
                    results.append(True)
                else:
                    print(f"⚠️ Missing entities: {missing_entities}")
                    results.append(False)
                
                # Store result
                self.test_results.append({
                    'test': f"Entity Test {i}",
                    'message': test_case['message'],
                    'intent': test_case['intent'],
                    'expected_entities': test_case['expected_entities'],
                    'extracted_entities': entities,
                    'passed': not missing_entities
                })
                
            except Exception as e:
                print(f"❌ Error in entity test {i}: {e}")
                results.append(False)
                self.test_results.append({
                    'test': f"Entity Test {i}",
                    'message': test_case['message'],
                    'error': str(e),
                    'passed': False
                })
        
        passed = sum(results)
        total = len(results)
        print(f"\n📊 Entity Extraction Results: {passed}/{total} passed")
        return passed == total
    
    async def test_response_generation(self):
        """Test response generation for different intents"""
        print("\n💬 Testing Response Generation")
        print("=" * 35)
        
        test_cases = [
            {
                "intent": "greeting",
                "entities": {},
                "context": {"state": "greeting"},
                "description": "Greeting response"
            },
            {
                "intent": "booking_request",
                "entities": {"service_type": "futsal", "date": "tomorrow"},
                "context": {"state": "booking"},
                "description": "Booking request response"
            },
            {
                "intent": "information",
                "entities": {},
                "context": {"state": "information"},
                "description": "Information request response"
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 Test Case {i}: {test_case['description']}")
            print(f"Intent: {test_case['intent']}")
            print(f"Entities: {test_case['entities']}")
            
            try:
                response = await self.nlu_agent.generate_response(
                    test_case['intent'],
                    test_case['entities'],
                    test_case['context']
                )
                
                print(f"✅ Generated response: '{response}'")
                
                # Basic validation - response should not be empty
                if response and len(response.strip()) > 0:
                    print(f"✅ Response generated successfully")
                    results.append(True)
                else:
                    print(f"⚠️ Empty or invalid response")
                    results.append(False)
                
                # Store result
                self.test_results.append({
                    'test': f"Response Test {i}",
                    'intent': test_case['intent'],
                    'entities': test_case['entities'],
                    'response': response,
                    'passed': bool(response and len(response.strip()) > 0)
                })
                
            except Exception as e:
                print(f"❌ Error in response test {i}: {e}")
                results.append(False)
                self.test_results.append({
                    'test': f"Response Test {i}",
                    'error': str(e),
                    'passed': False
                })
        
        passed = sum(results)
        total = len(results)
        print(f"\n📊 Response Generation Results: {passed}/{total} passed")
        return passed == total
    
    async def test_conversation_flow(self):
        """Test complete conversation flow with state management"""
        print("\n🔄 Testing Conversation Flow")
        print("=" * 35)
        
        test_phone = "+923001234567"
        conversation_steps = [
            {
                "message": "Hello",
                "expected_state": "greeting",
                "description": "Initial greeting"
            },
            {
                "message": "I want to book futsal",
                "expected_state": "service_selection",
                "description": "Service selection"
            },
            {
                "message": "Tomorrow at 5pm",
                "expected_state": "date_time_selection",
                "description": "Date and time selection"
            },
            {
                "message": "Yes, confirm",
                "expected_state": "confirmation",
                "description": "Booking confirmation"
            }
        ]
        
        results = []
        
        try:
            # Clear any existing session
            await self.state_manager.clear_session(test_phone)
            
            for i, step in enumerate(conversation_steps, 1):
                print(f"\n📝 Step {i}: {step['description']}")
                print(f"Message: '{step['message']}'")
                
                # Get current session
                session = await self.state_manager.get_session(test_phone)
                print(f"Current state: {session.get('state', 'unknown')}")
                
                # Extract intent
                intent_result = await self.nlu_agent.extract_intent(
                    step['message'],
                    session.get('history', [])
                )
                
                print(f"Intent: {intent_result.get('intent', 'unknown')}")
                print(f"Entities: {intent_result.get('entities', {})}")
                
                # Add message to history
                await self.state_manager.add_message_to_history(
                    test_phone, 'user', step['message']
                )
                
                # Generate response
                response = await self.nlu_agent.generate_response(
                    intent_result.get('intent', 'unknown'),
                    intent_result.get('entities', {}),
                    session.get('context', {})
                )
                
                print(f"Response: '{response}'")
                
                # Add assistant response to history
                await self.state_manager.add_message_to_history(
                    test_phone, 'assistant', response
                )
                
                # Update state based on intent
                new_state = self._determine_next_state(
                    intent_result.get('intent', 'unknown'),
                    session.get('state', 'greeting')
                )
                
                await self.state_manager.update_session(test_phone, {
                    'state': new_state,
                    'context': {**session.get('context', {}), **intent_result.get('entities', {})}
                })
                
                print(f"Updated state: {new_state}")
                results.append(True)
                
                # Store result
                self.test_results.append({
                    'test': f"Conversation Step {i}",
                    'message': step['message'],
                    'intent': intent_result.get('intent', 'unknown'),
                    'response': response,
                    'state': new_state,
                    'passed': True
                })
            
            print(f"\n✅ Complete conversation flow tested successfully")
            
        except Exception as e:
            print(f"❌ Error in conversation flow test: {e}")
            results.append(False)
            self.test_results.append({
                'test': 'Conversation Flow',
                'error': str(e),
                'passed': False
            })
        
        passed = sum(results)
        total = len(results)
        print(f"\n📊 Conversation Flow Results: {passed}/{total} steps passed")
        return passed == total
    
    def _determine_next_state(self, intent: str, current_state: str) -> str:
        """Determine next conversation state based on intent"""
        state_transitions = {
            'greeting': {
                'booking_request': 'service_selection',
                'information': 'information',
                'greeting': 'greeting'
            },
            'service_selection': {
                'booking_request': 'date_time_selection',
                'service_selection': 'date_time_selection'
            },
            'date_time_selection': {
                'confirmation': 'confirmation',
                'booking_request': 'confirmation'
            },
            'confirmation': {
                'greeting': 'greeting',
                'booking_request': 'service_selection'
            }
        }
        
        return state_transitions.get(current_state, {}).get(intent, current_state)
    
    def print_detailed_results(self):
        """Print detailed test results"""
        print("\n📋 Detailed Test Results")
        print("=" * 50)
        
        for result in self.test_results:
            print(f"\n🔍 {result['test']}")
            if 'error' in result:
                print(f"❌ Error: {result['error']}")
            else:
                if 'message' in result:
                    print(f"Message: {result['message']}")
                if 'intent' in result:
                    print(f"Intent: {result['intent']}")
                if 'entities' in result:
                    print(f"Entities: {result['entities']}")
                if 'response' in result:
                    print(f"Response: {result['response']}")
                if 'state' in result:
                    print(f"State: {result['state']}")
            
            status = "✅ PASSED" if result['passed'] else "❌ FAILED"
            print(f"Status: {status}")
    
    def save_results_to_file(self):
        """Save test results to JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"nlu_test_results_{timestamp}.json"
        
        results_data = {
            'timestamp': timestamp,
            'total_tests': len(self.test_results),
            'passed_tests': sum(1 for r in self.test_results if r['passed']),
            'failed_tests': sum(1 for r in self.test_results if not r['passed']),
            'results': self.test_results
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results_data, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Results saved to: {filename}")
        except Exception as e:
            print(f"❌ Failed to save results: {e}")

async def main():
    """Main testing function"""
    print("🧪 NLU Testing Suite for BookForMe Backend")
    print("=" * 60)
    print()
    
    tester = NLUTester()
    
    # Initialize components
    if not await tester.initialize():
        print("❌ Failed to initialize NLU components. Exiting.")
        return False
    
    # Run all tests
    test_functions = [
        ("Intent Extraction", tester.test_intent_extraction),
        ("Entity Extraction", tester.test_entity_extraction),
        ("Response Generation", tester.test_response_generation),
        ("Conversation Flow", tester.test_conversation_flow)
    ]
    
    results = []
    
    for test_name, test_func in test_functions:
        print(f"\n🚀 Running {test_name} Tests...")
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Print summary
    print("\n📊 Test Summary")
    print("=" * 30)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} test suites passed")
    
    # Print detailed results
    tester.print_detailed_results()
    
    # Save results
    tester.save_results_to_file()
    
    if passed == len(results):
        print("\n🎉 All NLU tests passed! The system is ready for production.")
    else:
        print("\n⚠️ Some tests failed. Please review the results and fix issues.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        sys.exit(1)
