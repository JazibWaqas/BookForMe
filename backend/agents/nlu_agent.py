"""
NLU Agent - Natural Language Understanding using Gemini API
Member 2: NLU & Conversation Logic Lead

This agent handles:
1. Intent extraction (greeting, booking, confirmation, etc.)
2. Entity extraction (date, time, service, customer name)
3. Roman Urdu/English mixed language support
4. Conversation context understanding
"""

import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)


class NLUAgent:
    """Natural Language Understanding agent using Gemini API"""
    
    def __init__(self):
        """Initialize NLU agent with Gemini"""
        try:
            # Configure Gemini API
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            logger.info("NLU Agent initialized with Gemini")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            raise
    
    async def extract_intent(self, message: str, conversation_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract intent and entities from user message
        
        Args:
            message: User's message
            conversation_history: Previous conversation context
            
        Returns:
            Dict with intent, entities, and confidence
        """
        try:
            logger.info(f"Extracting intent from: {message}")
            
            # Build context from conversation history
            context = self._build_context(conversation_history)
            
            # Create prompt for Gemini
            prompt = self._create_intent_prompt(message, context)
            
            # Get response from Gemini
            response = await self._call_gemini(prompt)
            
            # Parse Gemini response
            result = self._parse_intent_response(response)
            
            logger.info(f"Intent extracted: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error extracting intent: {e}")
            return {
                'intent': 'unknown',
                'entities': {},
                'confidence': 0.0,
                'error': str(e)
            }
    
    async def extract_entities(self, message: str, intent: str) -> Dict[str, Any]:
        """
        Extract specific entities from message based on intent
        
        Args:
            message: User's message
            intent: Detected intent
            
        Returns:
            Dict with extracted entities
        """
        try:
            logger.info(f"Extracting entities for intent '{intent}': {message}")
            
            # Create entity extraction prompt
            prompt = self._create_entity_prompt(message, intent)
            
            # Get response from Gemini
            response = await self._call_gemini(prompt)
            
            # Parse entities
            entities = self._parse_entity_response(response)
            
            logger.info(f"Entities extracted: {entities}")
            return entities
            
        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
            return {}
    
    def _build_context(self, history: List[Dict[str, Any]]) -> str:
        """Build conversation context from history"""
        if not history:
            return "No previous conversation."
        
        context = "Previous conversation:\n"
        for msg in history[-5:]:  # Last 5 messages
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            context += f"{role}: {content}\n"
        
        return context
    
    def _create_intent_prompt(self, message: str, context: str) -> str:
        """Create prompt for intent extraction"""
        return f"""
You are a booking assistant for futsal courts and salons in Karachi, Pakistan.

Analyze this message and extract the intent and entities. The user may speak in Roman Urdu mixed with English.

Message: "{message}"

Context: {context}

Possible intents:
- greeting: Hello, hi, salam, assalam
- booking_request: Want to book, need slot, book futsal, book salon
- service_selection: Choose futsal, choose salon, select service
- date_selection: Tomorrow, next Friday, 15th January, specific date
- time_selection: 5pm, evening, morning, specific time
- confirmation: Yes, confirm, book it, done
- cancellation: Cancel, no, don't want
- information: What services, prices, availability

Extract entities:
- service_type: futsal, salon, gym
- date: tomorrow, today, specific date
- time: 5pm, evening, morning, specific time
- customer_name: My name is Ahmed, I am Ali
- phone_number: 03001234567, +923001234567

Respond in JSON format:
{{
    "intent": "intent_name",
    "entities": {{
        "service_type": "futsal",
        "date": "tomorrow",
        "time": "5pm",
        "customer_name": "Ahmed"
    }},
    "confidence": 0.95
}}
"""
    
    def _create_entity_prompt(self, message: str, intent: str) -> str:
        """Create prompt for entity extraction"""
        return f"""
Extract specific entities from this message for a {intent} intent:

Message: "{message}"

Extract:
- service_type: futsal, salon, gym
- date: tomorrow, today, specific date (convert to YYYY-MM-DD if possible)
- time: 5pm, evening, morning, specific time (convert to HH:MM if possible)
- customer_name: extract name if mentioned
- phone_number: extract phone if mentioned

Respond in JSON format:
{{
    "service_type": "futsal",
    "date": "2025-01-15",
    "time": "17:00",
    "customer_name": "Ahmed",
    "phone_number": "+923001234567"
}}
"""
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API with prompt"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise
    
    def _parse_intent_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini response for intent extraction"""
        try:
            # Try to extract JSON from response
            import json
            import re
            
            # Find JSON in response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                result = json.loads(json_str)
                return result
            
            # Fallback parsing
            return {
                'intent': 'unknown',
                'entities': {},
                'confidence': 0.0
            }
            
        except Exception as e:
            logger.error(f"Error parsing intent response: {e}")
            return {
                'intent': 'unknown',
                'entities': {},
                'confidence': 0.0
            }
    
    def _parse_entity_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini response for entity extraction"""
        try:
            import json
            import re
            
            # Find JSON in response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            
            return {}
            
        except Exception as e:
            logger.error(f"Error parsing entity response: {e}")
            return {}
    
    async def generate_response(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> str:
        """
        Generate appropriate response based on intent and entities
        
        Args:
            intent: Detected intent
            entities: Extracted entities
            context: Conversation context
            
        Returns:
            Generated response message
        """
        try:
            logger.info(f"Generating response for intent: {intent}")
            
            # Create response generation prompt
            prompt = self._create_response_prompt(intent, entities, context)
            
            # Get response from Gemini
            response = await self._call_gemini(prompt)
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I understand. How can I help you with your booking?"
    
    def _create_response_prompt(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Create prompt for response generation"""
        return f"""
You are a friendly booking assistant for futsal courts and salons in Karachi.

Intent: {intent}
Entities: {entities}
Context: {context}

Generate a helpful, friendly response in Roman Urdu mixed with English.
Keep it conversational and guide the user through the booking process.

Examples:
- For greeting: "Hello! Welcome to BookForMe. What service would you like to book?"
- For booking request: "Great! I can help you book. What service are you interested in?"
- For service selection: "Perfect! What date would you like to book for?"
- For confirmation: "Excellent! Your booking is confirmed. Thank you!"

Respond naturally and helpfully.
"""