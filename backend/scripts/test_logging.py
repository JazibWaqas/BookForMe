"""
Test script to verify logging configuration
"""

import asyncio
import sys
import os
import logging

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from nlu.agent import NLUAgent

# Configure logging to show in terminal (same as chat.py)
logging.basicConfig(
    level=logging.INFO,  # Shows INFO, WARNING, ERROR
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)

async def test_logging():
    """Test that logging is working"""
    logger.info("🔵 [test_logging] TEST SCRIPT STARTED")
    logger.info("   Testing NLU Agent initialization...")

    try:
        # Initialize NLU Agent (this should show logging)
        agent = NLUAgent()
        logger.info("✅ [test_logging] NLU Agent initialized successfully")
        logger.info("   Model: " + settings.GEMINI_MODEL)

        # Test a simple intent extraction
        logger.info("   Testing intent extraction...")
        result = await agent.extract_intent("Hello", [])
        logger.info(f"   Intent result: {result.get('intent')}")

        logger.info("✅ [test_logging] All tests passed!")
        return True

    except Exception as e:
        logger.error(f"❌ [test_logging] Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_logging())
    if success:
        print("\n🎉 Logging test successful! Logs should be visible above.")
    else:
        print("\n❌ Logging test failed.")
        sys.exit(1)
