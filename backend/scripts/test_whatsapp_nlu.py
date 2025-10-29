"""
WhatsApp NLU Integration Test
Test the complete WhatsApp flow with NLU integration
"""

import asyncio
import sys
import os
import json
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class WhatsAppNLUTester:
    """Test WhatsApp agent with NLU integration"""
    
    def __init__(self):
        self.whatsapp_agent = None
        self.test_phone = "+923001234567"
        
    async def initialize(self):
        """Initialize WhatsApp agent"""
        try:
            from whatsapp.agent import WhatsAppAgent
            
            print("🔧 Initializing WhatsApp Agent...")
            self.whatsapp_agent = WhatsAppAgent()
            print("✅ WhatsApp Agent initialized successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize WhatsApp Agent: {e}")
            return False
    
    async def test_conversation_flow(self):
        """Test complete conversation flow with NLU"""
        print("\n💬 Testing WhatsApp Conversation Flow with NLU")
        print("=" * 60)
        
        # Test conversation scenarios
        conversation_scenarios = [
            {
                "name": "English Booking Request",
                "messages": [
                    "Hello, I want to book futsal tomorrow at 5pm",
                    "Yes, that works for me",
                    "Confirm the booking"
                ]
            },
            {
                "name": "Roman Urdu Booking Request", 
                "messages": [
                    "Salam, mujhe salon book karna hai",
                    "Next Friday evening",
                    "Yes, confirm kar do"
                ]
            },
            {
                "name": "Mixed Language Conversation",
                "messages": [
                    "Hi there!",
                    "I need futsal court for next week",
                    "Friday evening would be perfect",
                    "Yes, book it"
                ]
            },
            {
                "name": "Information Request",
                "messages": [
                    "What services do you offer?",
                    "What are the prices?",
                    "I want to book futsal"
                ]
            }
        ]
        
        results = []
        
        for scenario in conversation_scenarios:
            print(f"\n📝 Testing: {scenario['name']}")
            print("-" * 50)
            
            # Clear session for each scenario
            await self.whatsapp_agent.state_manager.clear_session(self.test_phone)
            
            scenario_results = []
            
            for i, message in enumerate(scenario['messages'], 1):
                print(f"\n👤 User: {message}")
                
                try:
                    # Process message through WhatsApp agent
                    response = await self.whatsapp_agent.process_message(self.test_phone, message)
                    print(f"🤖 Bot: {response}")
                    
                    # Check if response is meaningful (not just error messages)
                    is_meaningful = len(response.strip()) > 10 and "error" not in response.lower()
                    scenario_results.append({
                        'message': message,
                        'response': response,
                        'meaningful': is_meaningful
                    })
                    
                    # Add delay to respect API rate limits
                    if i < len(scenario['messages']):
                        print("⏳ Waiting 30 seconds to respect API rate limits...")
                        await asyncio.sleep(30)
                    
                except Exception as e:
                    print(f"❌ Error processing message: {e}")
                    scenario_results.append({
                        'message': message,
                        'response': f"Error: {e}",
                        'meaningful': False
                    })
            
            # Evaluate scenario
            meaningful_responses = sum(1 for r in scenario_results if r['meaningful'])
            total_responses = len(scenario_results)
            
            print(f"\n📊 Scenario Results: {meaningful_responses}/{total_responses} meaningful responses")
            
            results.append({
                'scenario': scenario['name'],
                'total_messages': total_responses,
                'meaningful_responses': meaningful_responses,
                'success_rate': meaningful_responses / total_responses if total_responses > 0 else 0,
                'details': scenario_results
            })
        
        return results
    
    async def test_nlu_integration(self):
        """Test NLU integration specifically"""
        print("\n🧠 Testing NLU Integration")
        print("=" * 40)
        
        test_messages = [
            {
                "message": "Hello, I want to book futsal tomorrow at 5pm",
                "expected_intent": "booking_request",
                "expected_entities": ["service_type", "date", "time"]
            },
            {
                "message": "Salam, mujhe salon book karna hai",
                "expected_intent": "booking_request", 
                "expected_entities": ["service_type"]
            },
            {
                "message": "What services do you offer?",
                "expected_intent": "information",
                "expected_entities": []
            },
            {
                "message": "Yes, confirm the booking",
                "expected_intent": "confirmation",
                "expected_entities": []
            }
        ]
        
        results = []
        
        for i, test in enumerate(test_messages, 1):
            print(f"\n📝 Test {i}: {test['message']}")
            
            try:
                # Process through WhatsApp agent
                response = await self.whatsapp_agent.process_message(self.test_phone, test['message'])
                print(f"🤖 Response: {response}")
                
                # Check if response is meaningful
                is_meaningful = len(response.strip()) > 10 and "error" not in response.lower()
                print(f"✅ Meaningful Response: {is_meaningful}")
                
                results.append({
                    'message': test['message'],
                    'response': response,
                    'meaningful': is_meaningful,
                    'expected_intent': test['expected_intent'],
                    'expected_entities': test['expected_entities']
                })
                
                # Add delay between tests
                if i < len(test_messages):
                    print("⏳ Waiting 30 seconds...")
                    await asyncio.sleep(30)
                
            except Exception as e:
                print(f"❌ Error: {e}")
                results.append({
                    'message': test['message'],
                    'response': f"Error: {e}",
                    'meaningful': False,
                    'error': str(e)
                })
        
        return results
    
    def print_detailed_results(self, conversation_results, nlu_results):
        """Print detailed test results"""
        print("\n📋 Detailed Test Results")
        print("=" * 50)
        
        print("\n💬 Conversation Flow Results:")
        for result in conversation_results:
            print(f"\n🔍 {result['scenario']}")
            print(f"Success Rate: {result['success_rate']:.2%}")
            print(f"Meaningful Responses: {result['meaningful_responses']}/{result['total_messages']}")
            
            for detail in result['details']:
                print(f"  User: {detail['message']}")
                print(f"  Bot: {detail['response']}")
                print(f"  Meaningful: {'✅' if detail['meaningful'] else '❌'}")
                print()
        
        print("\n🧠 NLU Integration Results:")
        for result in nlu_results:
            print(f"\n🔍 Message: {result['message']}")
            print(f"Response: {result['response']}")
            print(f"Meaningful: {'✅' if result['meaningful'] else '❌'}")
            if 'error' in result:
                print(f"Error: {result['error']}")
    
    def save_results_to_file(self, conversation_results, nlu_results):
        """Save test results to JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"whatsapp_nlu_test_results_{timestamp}.json"
        
        results_data = {
            'timestamp': timestamp,
            'conversation_results': conversation_results,
            'nlu_results': nlu_results,
            'summary': {
                'total_conversation_scenarios': len(conversation_results),
                'successful_scenarios': sum(1 for r in conversation_results if r['success_rate'] > 0.5),
                'total_nlu_tests': len(nlu_results),
                'successful_nlu_tests': sum(1 for r in nlu_results if r['meaningful'])
            }
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results_data, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Results saved to: {filename}")
        except Exception as e:
            print(f"❌ Failed to save results: {e}")

async def main():
    """Main testing function"""
    print("🧪 WhatsApp NLU Integration Test Suite")
    print("=" * 60)
    print()
    
    tester = WhatsAppNLUTester()
    
    # Initialize WhatsApp agent
    if not await tester.initialize():
        print("❌ Failed to initialize WhatsApp Agent. Exiting.")
        return False
    
    # Run tests
    print("🚀 Running Tests...")
    
    # Test conversation flow
    conversation_results = await tester.test_conversation_flow()
    
    # Test NLU integration
    nlu_results = await tester.test_nlu_integration()
    
    # Print results
    tester.print_detailed_results(conversation_results, nlu_results)
    
    # Save results
    tester.save_results_to_file(conversation_results, nlu_results)
    
    # Summary
    successful_scenarios = sum(1 for r in conversation_results if r['success_rate'] > 0.5)
    successful_nlu_tests = sum(1 for r in nlu_results if r['meaningful'])
    
    print(f"\n📊 Test Summary")
    print("=" * 30)
    print(f"Conversation Scenarios: {successful_scenarios}/{len(conversation_results)} successful")
    print(f"NLU Tests: {successful_nlu_tests}/{len(nlu_results)} successful")
    
    if successful_scenarios > 0 and successful_nlu_tests > 0:
        print("\n🎉 WhatsApp NLU integration is working!")
    else:
        print("\n⚠️ Some issues found. Check the detailed results above.")
    
    return successful_scenarios > 0 and successful_nlu_tests > 0

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        sys.exit(1)
