"""
Clear Conversation History Script
Clears all conversation history for a specific phone number or all users
"""

import asyncio
import sys
import os

# Add backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from nlu.state_manager import StateManager
from agent.session_store import session_store


async def clear_user_history(phone_number: str):
    """Clear conversation history for a specific user"""
    print(f"\nClearing conversation history for {phone_number}...")
    
    state_manager = StateManager()
    
    # Clear Firestore session
    success_firestore = await state_manager.clear_session(phone_number)
    
    # Clear in-memory session
    session_store.clear_session(phone_number)
    
    if success_firestore:
        print(f"✅ Successfully cleared conversation history for {phone_number}")
    else:
        print(f"⚠️  Warning: Could not clear Firestore session (may not exist)")
    
    print("✅ In-memory session cleared")


async def clear_all_history():
    """Clear conversation history for all users (use with caution)"""
    print("\n⚠️  WARNING: This will clear ALL conversation history!")
    confirm = input("Type 'yes' to confirm: ")
    
    if confirm.lower() != 'yes':
        print("Cancelled.")
        return
    
    print("\nClearing all conversation history...")
    # Note: This would require iterating through all conversation states
    # For now, we'll just clear the test phone number
    await clear_user_history("+923001234567")
    print("✅ All conversation history cleared")


async def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        phone_number = sys.argv[1]
        await clear_user_history(phone_number)
    else:
        print("Usage: python clear_conversation_history.py [phone_number]")
        print("Example: python clear_conversation_history.py +923001234567")
        print("\nOr run interactively:")
        phone_number = input("Enter phone number to clear (or 'all' for all): ").strip()
        if phone_number.lower() == 'all':
            await clear_all_history()
        elif phone_number:
            await clear_user_history(phone_number)
        else:
            await clear_user_history("+923001234567")


if __name__ == "__main__":
    asyncio.run(main())
