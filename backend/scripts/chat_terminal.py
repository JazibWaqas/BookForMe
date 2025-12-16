"""
Interactive Terminal Chat for Testing LangGraph Agent
Mimics WhatsApp workflow exactly - uses the same WhatsAppAgent
"""

import asyncio
import sys
import os
import logging
from datetime import datetime

# Configure complete logging to show all logs in terminal
logging.basicConfig(
    level=logging.DEBUG,  # Show ALL logs (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Add backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from whatsapp.agent import WhatsAppAgent


class TerminalChat:
    """Interactive terminal chat interface - same workflow as WhatsApp"""
    
    def __init__(self):
        """Initialize chat with WhatsApp agent"""
        print("\n" + "=" * 70)
        print("  TERMINAL CHAT - LangGraph Agent Testing (WhatsApp Workflow)")
        print("=" * 70)
        print("\n⏳ Initializing LangGraph Agent...")
        try:
            self.agent = WhatsAppAgent()
            self.phone_number = "+923001234567"  # Test phone number
            print("✅ Agent ready!\n")
        except Exception as e:
            print(f"❌ Error initializing agent: {e}")
            print("\nMake sure:")
            print("  - Firestore credentials are configured")
            print("  - Gemini API key is set")
            print("  - All dependencies are installed")
            raise
    
    async def start_chat(self):
        """Start interactive chat session"""
        print("-" * 70)
        print("💬 Type messages to chat (exact same as WhatsApp webhook)")
        print("\nCommands:")
        print("  • 'exit' or 'quit' - End chat")
        print("  • 'clear' - Clear conversation history")
        print("  • '/help' - Show help and examples")
        print("-" * 70)
        print()
        
        while True:
            try:
                # Get user input
                user_message = input("You: ").strip()
                
                if not user_message:
                    continue
                
                # Handle commands
                if user_message.lower() in ['exit', 'quit', 'q']:
                    print("\n👋 Chat ended. Goodbye!\n")
                    break
                
                if user_message.lower() == 'clear':
                    print("\n🔄 Clearing conversation history...")
                    # Reinitialize agent to clear state
                    self.agent = WhatsAppAgent()
                    print("✅ Conversation cleared!\n")
                    continue
                
                if user_message.lower() == '/help':
                    self.show_help()
                    continue
                
                # Process message through agent (EXACT same as WhatsApp webhook)
                print("Agent: ", end="", flush=True)
                
                response = await self.agent.process_message(
                    phone_number=self.phone_number,
                    message=user_message
                )
                
                print(response)
                print()
                
            except KeyboardInterrupt:
                print("\n\n👋 Chat interrupted. Goodbye!\n")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")
                import traceback
                print("\nFull error:")
                traceback.print_exc()
                print("\nContinue chatting or type 'exit' to quit.\n")
    
    def show_help(self):
        """Show help and example messages"""
        print("\n" + "=" * 70)
        print("  HELP & EXAMPLE MESSAGES")
        print("=" * 70)
        print("\n📝 Available Commands:")
        print("  exit/quit/q  - Exit chat")
        print("  clear        - Clear conversation history")
        print("  /help        - Show this help")
        
        print("\n💬 Example Messages to Try:")
        print("\n  Greetings:")
        print("    • Hi")
        print("    • Aoa")
        print("    • Salam")
        
        print("\n  Availability Queries:")
        print("    • koi slot hei?")
        print("    • kal slot hai?")
        print("    • evening ka slot hai?")
        print("    • kal evening ka slot hai?")
        print("    • padel slot available?")
        
        print("\n  Pricing:")
        print("    • kitna hai price?")
        print("    • kitna charge hai?")
        print("    • what are the rates?")
        
        print("\n  Booking:")
        print("    • book slot tomorrow 6pm")
        print("    • mujhe slot chahiye kal evening")
        print("    • I want to book for Friday")
        
        print("\n" + "-" * 70)
        print("💡 Tip: Try incomplete queries like 'koi slot hei?' to see how")
        print("   the agent asks for missing information!\n")


async def main():
    """Main entry point"""
    try:
        chat = TerminalChat()
        await chat.start_chat()
    except Exception as e:
        print(f"\n❌ Failed to start chat: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!\n")

