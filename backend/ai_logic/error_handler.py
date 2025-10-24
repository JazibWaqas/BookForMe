"""
AI Error Handler
Handles AI-related errors and provides fallback responses
"""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class AIErrorHandler:
    """Handles AI-related errors and provides fallback responses"""
    
    def __init__(self):
        """Initialize error handler"""
        logger.info("AI Error Handler initialized")
    
    async def handle_nlu_error(self, error: Exception, message: str) -> Dict[str, Any]:
        """
        Handle NLU processing errors
        
        Args:
            error: The error that occurred
            message: Original user message
            
        Returns:
            Fallback response
        """
        try:
            logger.error(f"NLU Error: {error}")
            
            # Determine error type
            error_type = self._classify_error(error)
            
            # Generate fallback response
            fallback_response = await self._generate_fallback_response(error_type, message)
            
            return {
                'success': False,
                'error_type': error_type,
                'fallback_response': fallback_response,
                'original_error': str(error)
            }
            
        except Exception as e:
            logger.error(f"Error handling NLU error: {e}")
            return {
                'success': False,
                'error_type': 'unknown',
                'fallback_response': 'I apologize, but I\'m having trouble understanding. Could you please try again?',
                'original_error': str(error)
            }
    
    async def handle_conversation_error(self, error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle conversation processing errors
        
        Args:
            error: The error that occurred
            context: Conversation context
            
        Returns:
            Fallback response
        """
        try:
            logger.error(f"Conversation Error: {error}")
            
            # Determine error type
            error_type = self._classify_error(error)
            
            # Generate fallback response
            fallback_response = await self._generate_conversation_fallback(error_type, context)
            
            return {
                'success': False,
                'error_type': error_type,
                'fallback_response': fallback_response,
                'original_error': str(error)
            }
            
        except Exception as e:
            logger.error(f"Error handling conversation error: {e}")
            return {
                'success': False,
                'error_type': 'unknown',
                'fallback_response': 'I apologize, but I\'m having trouble processing your request. Could you please try again?',
                'original_error': str(error)
            }
    
    def _classify_error(self, error: Exception) -> str:
        """Classify error type"""
        error_str = str(error).lower()
        
        if 'api' in error_str or 'key' in error_str:
            return 'api_error'
        elif 'timeout' in error_str or 'connection' in error_str:
            return 'connection_error'
        elif 'parse' in error_str or 'json' in error_str:
            return 'parsing_error'
        elif 'rate' in error_str or 'limit' in error_str:
            return 'rate_limit_error'
        else:
            return 'unknown_error'
    
    async def _generate_fallback_response(self, error_type: str, message: str) -> str:
        """Generate fallback response based on error type"""
        if error_type == 'api_error':
            return "I'm having trouble connecting to my AI service. Please try again in a moment."
        elif error_type == 'connection_error':
            return "I'm experiencing connection issues. Please try again."
        elif error_type == 'parsing_error':
            return "I'm having trouble understanding your message. Could you please rephrase it?"
        elif error_type == 'rate_limit_error':
            return "I'm receiving too many requests. Please wait a moment and try again."
        else:
            return "I apologize, but I'm having trouble understanding. Could you please try again?"
    
    async def _generate_conversation_fallback(self, error_type: str, context: Dict[str, Any]) -> str:
        """Generate conversation fallback response"""
        current_state = context.get('state', 'greeting')
        
        if current_state == 'greeting':
            return "Hello! I'm your BookForMe assistant. What service would you like to book?"
        elif current_state == 'select_service':
            return "What service are you interested in? I can help you book futsal, salon, or gym services."
        elif current_state == 'select_date':
            return "What date would you like to book for? I can check availability for any date."
        elif current_state == 'select_time':
            return "What time would you prefer? I can show you available time slots."
        elif current_state == 'confirm_booking':
            return "Please confirm your booking details. Type 'yes' to confirm or 'no' to cancel."
        else:
            return "I'm here to help you with your booking. What would you like to do?"
    
    async def get_error_suggestions(self, error_type: str) -> List[str]:
        """
        Get suggestions for handling specific error types
        
        Args:
            error_type: Type of error
            
        Returns:
            List of suggestions
        """
        suggestions = {
            'api_error': [
                "Check API key configuration",
                "Verify API service status",
                "Try again in a few minutes"
            ],
            'connection_error': [
                "Check internet connection",
                "Verify service availability",
                "Try again later"
            ],
            'parsing_error': [
                "Simplify the message",
                "Use clearer language",
                "Try rephrasing the request"
            ],
            'rate_limit_error': [
                "Wait before trying again",
                "Reduce request frequency",
                "Contact support if persistent"
            ],
            'unknown_error': [
                "Try again with a different message",
                "Contact support if issue persists",
                "Check system logs for details"
            ]
        }
        
        return suggestions.get(error_type, ["Try again", "Contact support"])
    
    async def log_error(self, error: Exception, context: Dict[str, Any]) -> None:
        """
        Log error for debugging and monitoring
        
        Args:
            error: The error that occurred
            context: Conversation context
        """
        try:
            error_data = {
                'error_type': type(error).__name__,
                'error_message': str(error),
                'context': context,
                'timestamp': self._get_timestamp()
            }
            
            logger.error(f"AI Error logged: {error_data}")
            
            # TODO: Send to monitoring service
            # await self._send_to_monitoring(error_data)
            
        except Exception as e:
            logger.error(f"Error logging error: {e}")
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
