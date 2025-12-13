"""
Comprehensive Agent Test Script
Tests the fixed LangGraph agent with various scenarios
"""

import asyncio
import sys
import os
from datetime import datetime
from typing import Dict, List, Any

# Add backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from agent.graph import BookingAgent


class AgentTester:
    """Comprehensive agent testing class"""
    
    def __init__(self):
        self.agent = None
        self.results = []
        self.conversation_history = []
        
    async def initialize(self):
        """Initialize the agent"""
        print("=" * 70)
        print("  AGENT TEST SUITE - Testing Fixed LangGraph Agent")
        print("=" * 70)
        print("\n⏳ Initializing LangGraph agent...")
        try:
            self.agent = BookingAgent()
            print("✅ Agent initialized successfully!\n")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize agent: {e}")
            import traceback
            print(traceback.format_exc())
            return False
    
    async def test_case(self, name: str, message: str, expected_intent: str = None, 
                       should_contain: List[str] = None, should_not_contain: List[str] = None) -> Dict[str, Any]:
        """
        Test a single case
        
        Args:
            name: Test case name
            message: User message to test
            expected_intent: Expected intent (optional)
            should_contain: List of strings that should be in response
            should_not_contain: List of strings that should NOT be in response
        """
        print(f"\n{'='*70}")
        print(f"Test: {name}")
        print(f"{'='*70}")
        print(f"User: {message}")
        
        try:
            # Process message
            response = await self.agent.process(
                user_phone="+923001234567",
                message=message,
                conversation_history=self.conversation_history
            )
            
            print(f"Agent: {response[:200]}..." if len(response) > 200 else f"Agent: {response}")
            
            # Validate response
            is_valid = True
            issues = []
            
            # Check for error messages
            error_phrases = ["didn't understand", "samajh nahi aaya", "error", "sorry, i encountered"]
            if any(phrase in response.lower() for phrase in error_phrases):
                is_valid = False
                issues.append("Response contains error message")
            
            # Check should_contain
            if should_contain:
                for phrase in should_contain:
                    if phrase.lower() not in response.lower():
                        is_valid = False
                        issues.append(f"Missing expected phrase: '{phrase}'")
            
            # Check should_not_contain
            if should_not_contain:
                for phrase in should_not_contain:
                    if phrase.lower() in response.lower():
                        is_valid = False
                        issues.append(f"Contains unwanted phrase: '{phrase}'")
            
            # Check response length
            if len(response.strip()) < 10:
                is_valid = False
                issues.append("Response too short")
            
            # Update conversation history
            self.conversation_history.append({"role": "user", "content": message})
            self.conversation_history.append({"role": "assistant", "content": response})
            
            result = {
                "name": name,
                "message": message,
                "response": response,
                "success": is_valid,
                "issues": issues,
                "expected_intent": expected_intent
            }
            
            status = "✅ PASS" if is_valid else "❌ FAIL"
            print(f"\n{status}")
            if issues:
                for issue in issues:
                    print(f"   ⚠️  {issue}")
            
            return result
            
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            import traceback
            print(traceback.format_exc())
            return {
                "name": name,
                "message": message,
                "response": f"Error: {e}",
                "success": False,
                "issues": [f"Exception: {str(e)}"],
                "error": str(e)
            }
    
    async def run_all_tests(self):
        """Run all test cases"""
        
        test_cases = [
            # Greeting Tests (Critical - these were failing)
            {
                "name": "Simple English Greeting",
                "message": "Hi",
                "expected_intent": "greeting",
                "should_contain": ["Hello", "Welcome", "Ace Padel"],
                "should_not_contain": ["didn't understand", "rephrase"]
            },
            {
                "name": "Roman Urdu Greeting - Aoa",
                "message": "Aoa",
                "expected_intent": "greeting",
                "should_contain": ["AoA", "Welcome", "Ace Padel"],
                "should_not_contain": ["samajh nahi aaya", "rephrase"]
            },
            {
                "name": "Roman Urdu Greeting - Salam",
                "message": "Salam",
                "expected_intent": "greeting",
                "should_contain": ["AoA", "Welcome"],
                "should_not_contain": ["samajh nahi aaya"]
            },
            {
                "name": "Hello Greeting",
                "message": "Hello",
                "expected_intent": "greeting",
                "should_contain": ["Hello", "Welcome"],
                "should_not_contain": ["didn't understand"]
            },
            
            # Availability Tests
            {
                "name": "Incomplete Availability Query",
                "message": "koi slot hei?",
                "expected_intent": "availability_inquiry",
                "should_contain": ["slot", "available"],
                "should_not_contain": ["didn't understand"]
            },
            {
                "name": "Availability with Date - Kal",
                "message": "kal slot hai?",
                "expected_intent": "availability_inquiry",
                "should_contain": ["slot", "available"],
                "should_not_contain": ["didn't understand"]
            },
            {
                "name": "Availability with Time - Evening",
                "message": "evening ka slot hai?",
                "expected_intent": "availability_inquiry",
                "should_contain": ["slot", "evening"],
                "should_not_contain": ["didn't understand"]
            },
            {
                "name": "Complete Availability Query",
                "message": "kal evening ka slot hai?",
                "expected_intent": "availability_inquiry",
                "should_contain": ["slot", "available"],
                "should_not_contain": ["didn't understand"]
            },
            {
                "name": "English Availability Query",
                "message": "Do you have slots tomorrow evening?",
                "expected_intent": "availability_inquiry",
                "should_contain": ["slot", "available"],
                "should_not_contain": ["didn't understand"]
            },
            
            # Price Inquiry Tests
            {
                "name": "Price Inquiry - Roman Urdu",
                "message": "kitna hai price?",
                "expected_intent": "price_inquiry",
                "should_contain": ["price", "Rs"],
                "should_not_contain": ["didn't understand"]
            },
            {
                "name": "Price Inquiry - English",
                "message": "What are the rates?",
                "expected_intent": "price_inquiry",
                "should_contain": ["price", "Rs"],
                "should_not_contain": ["didn't understand"]
            },
            {
                "name": "Price Inquiry - Kitna Charge",
                "message": "kitna charge hai?",
                "expected_intent": "price_inquiry",
                "should_contain": ["price", "Rs"],
                "should_not_contain": ["didn't understand"]
            },
            
            # Booking Request Tests
            {
                "name": "Booking Request - English",
                "message": "I want to book a slot",
                "expected_intent": "booking_request",
                "should_contain": ["slot", "book"],
                "should_not_contain": ["didn't understand"]
            },
            {
                "name": "Booking Request - Roman Urdu",
                "message": "mujhe slot chahiye",
                "expected_intent": "booking_request",
                "should_contain": ["slot"],
                "should_not_contain": ["didn't understand"]
            },
            
            # Information Tests
            {
                "name": "Information Request",
                "message": "What services do you offer?",
                "expected_intent": "information",
                "should_contain": ["service", "available"],
                "should_not_contain": ["didn't understand"]
            },
        ]
        
        print(f"\n🚀 Running {len(test_cases)} test cases...\n")
        
        for i, test in enumerate(test_cases, 1):
            print(f"\n[{i}/{len(test_cases)}] ", end="")
            result = await self.test_case(**test)
            self.results.append(result)
            
            # Small delay to avoid rate limiting
            await asyncio.sleep(0.5)
        
        return self.results
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("  TEST SUMMARY")
        print("=" * 70)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r['success'])
        failed = total - passed
        
        print(f"\n📊 Results: {passed}/{total} passed ({passed*100//total}%)")
        print(f"   ✅ Passed: {passed}")
        print(f"   ❌ Failed: {failed}")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.results:
                if not result['success']:
                    print(f"\n   • {result['name']}")
                    print(f"     Message: '{result['message']}'")
                    if result.get('issues'):
                        for issue in result['issues']:
                            print(f"     ⚠️  {issue}")
                    if result.get('error'):
                        print(f"     Error: {result['error']}")
        
        print("\n✅ Passed Tests:")
        for result in self.results:
            if result['success']:
                print(f"   ✓ {result['name']}")
        
        # Critical tests check
        greeting_tests = [r for r in self.results if 'greeting' in r['name'].lower()]
        greeting_passed = sum(1 for r in greeting_tests if r['success'])
        
        print(f"\n🎯 Critical Tests (Greetings): {greeting_passed}/{len(greeting_tests)} passed")
        if greeting_passed < len(greeting_tests):
            print("   ⚠️  WARNING: Greeting detection is still failing!")
        else:
            print("   ✅ Greeting detection is working correctly!")
        
        print("\n" + "=" * 70)
    
    def save_results(self):
        """Save test results to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"agent_test_results_{timestamp}.txt"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write("Agent Test Results\n")
                f.write("=" * 70 + "\n")
                f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                
                for result in self.results:
                    f.write(f"\nTest: {result['name']}\n")
                    f.write(f"Message: {result['message']}\n")
                    f.write(f"Status: {'PASS' if result['success'] else 'FAIL'}\n")
                    f.write(f"Response: {result['response']}\n")
                    if result.get('issues'):
                        f.write(f"Issues: {', '.join(result['issues'])}\n")
                    f.write("-" * 70 + "\n")
            
            print(f"\n💾 Results saved to: {filename}")
        except Exception as e:
            print(f"\n⚠️  Failed to save results: {e}")


async def main():
    """Main test function"""
    tester = AgentTester()
    
    # Initialize
    if not await tester.initialize():
        print("\n❌ Failed to initialize agent. Exiting.")
        sys.exit(1)
    
    # Run tests
    try:
        await tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        print(traceback.format_exc())
        sys.exit(1)
    
    # Print summary
    tester.print_summary()
    
    # Save results
    tester.save_results()
    
    # Exit code
    passed = sum(1 for r in tester.results if r['success'])
    total = len(tester.results)
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Tests cancelled by user\n")
        sys.exit(1)