"""
Simple NLU Chat Interface
Chat with your NLU system through the terminal
"""

import asyncio
import sys
import os
import logging

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from nlu.agent import NLUAgent

# Configure logging to show in terminal
logging.basicConfig(
    level=logging.INFO,  # Shows INFO, WARNING, ERROR (use DEBUG for more detail)
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)


class SimpleChat:
    def __init__(self):
        self.agent = NLUAgent()
        self.conversation_history = []
        print("BookForMe NLU Chat")
        print("Type your messages to chat with the AI")
        print("Type 'quit' to exit, 'clear' to clear history")
        print("-" * 50)
    
    async def process_message(self, message: str):
        """Process a single message"""
        if message.lower() == 'quit':
            return False
        elif message.lower() == 'clear':
            self.conversation_history = []
            print("Conversation cleared!")
            return True
        elif message.strip() == '':
            return True
        
        try:
            print(f"\nYou: {message}")
            
            # Extract intent and entities
            result = await self.agent.extract_intent(message, self.conversation_history)
            intent = result.get('intent', 'unknown')
            entities = result.get('entities', {})
            confidence = result.get('confidence', 0.0)
            
            print(f"[Intent: {intent} (confidence: {confidence:.2f})]")
            if entities:
                print(f"[Entities: {entities}]")
            
            # Generate response
            response = await self.agent.generate_response(intent, entities, {'chat': True})
            print(f"AI: {response}")
            
            # Add to conversation
            self.conversation_history.extend([
                {'role': 'user', 'content': message},
                {'role': 'assistant', 'content': response}
            ])
            
            # Keep only last 10 messages
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            
            print("-" * 30)
            return True
            
        except Exception as e:
            print(f"Error: {e}")
            return True
    
    async def chat(self):
        """Main chat loop"""
        while True:
            try:
                message = input("You: ").strip()
                if not await self.process_message(message):
                    break
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except EOFError:
                print("\nGoodbye!")
                break


async def main():
    """Start the chat"""
    chat = SimpleChat()
    await chat.chat()


if __name__ == "__main__":
    asyncio.run(main())
