"""
NLU Agent - Natural Language Understanding using Gemini API
Handles intent extraction and entity recognition for Roman Urdu/English mixed language
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
        """Create prompt for intent extraction - Enhanced with real conversation patterns"""
        return f"""
You are a booking assistant for sports facilities (padel courts, futsal, cricket) and salons in Karachi, Pakistan.

Analyze this WhatsApp message and classify the user's intent. The user may speak in Roman Urdu mixed with English.

Message: "{message}"

Conversation History:
{context}

Possible Intents:
1. **greeting** - Simple greeting: "Hi", "Aoa", "Salam", "Hello" (NO booking info)
2. **booking_request** - Want to book a slot: "book slot", "want to book", "mujhe slot chahiye", "slot karna hai"
3. **availability_inquiry** - Check availability (often INCOMPLETE): 
   - Complete: "slot available tomorrow 6-9"
   - Incomplete: "koi slot hei?", "slot hai?", "any slot?" (MISSING date/time/service)
   - Partial: "kal slot" (has date, missing time/service), "evening slot" (has time, missing date/service)
4. **service_selection** - Choose service type: "padel", "futsal", "cricket", "salon"
5. **date_selection** - Provide/ask about date: "tomorrow", "Friday", "kal", "next week"
6. **time_selection** - Provide/ask about time: "6-9", "evening", "shaam", "7pm"
7. **price_inquiry** - Ask about pricing: "how much", "charges", "price", "discount", "kitna"
8. **confirmation** - Confirm booking: "yes", "ok", "confirm", "book it", "Han g"
9. **cancellation** - Cancel booking: "cancel", "nahi", "don't want"
10. **modification** - Change booking: "actually", "change to", "instead"
11. **information** - General questions: "what services", "what are prices"
12. **payment_related** - Payment questions: "payment", "transfer", "account number"
13. **name_provided** - Sharing name: "Jazib Waqas", "My name is..."
14. **unknown** - Unclear or irrelevant message

IMPORTANT: Most customers send INCOMPLETE messages:
- "Salam" / "Hi" / "Aoa" → greeting only, ask what they want
- "koi slot hei?" → availability_inquiry (MISSING: date, time, service)
- "kal slot" → availability_inquiry (HAS: date, MISSING: time, service)
- "evening slot" → availability_inquiry (HAS: time, MISSING: date, service)

Roman Urdu Patterns (Common Incomplete Queries):
- "Aoa" / "AoA" / "Salam" / "Hi" = greeting only (NO booking info yet)
- "koi slot hei?" / "slot hai?" = incomplete availability query (MISSING: date, time, service)
- "kal slot" / "kal ka slot" = has date (tomorrow), MISSING: time, service
- "evening slot" / "shaam ka slot" = has time, MISSING: date, service
- "padel slot" / "futsal available?" = has service, MISSING: date, time
- "mujhe" = "I want"
- "chahiye" = "need"
- "karna hai" = "want to do"
- "mil jayega" = "will be available"
- "kal" = "tomorrow"
- "aaj" = "today"
- "shaam" = "evening" (6-9 PM)

Common Incomplete Patterns:
1. Just greeting: "Salam", "Hi", "Aoa" → greeting intent, no entities
2. Vague availability: "koi slot hei?" → availability_inquiry, missing ALL entities
3. Date only: "kal slot", "tomorrow slot" → availability_inquiry, has date, missing time/service
4. Time only: "evening slot", "shaam ka time" → availability_inquiry, has time, missing date/service
5. Service only: "padel slot hai?" → availability_inquiry, has service, missing date/time

Context Clues:
- If previous message was about availability, "yes" likely means confirmation
- If asking about time slot, likely availability_inquiry or booking_request
- If customer provided date/time, likely confirming or asking for price
- INCOMPLETE queries are VERY COMMON (80% of initial messages) - handle gracefully by asking for missing info

Extract entities:
- service_type: padel, futsal, cricket, salon (handle typos: "paddle" = "padel")
- date: tomorrow, today, specific date, "kal", "aaj"
- time: 6-9, evening, morning, "shaam", "raat", specific time
- customer_name: Full name or first name if mentioned

Respond in JSON format:
{{
    "intent": "booking_request",
    "confidence": 0.95,
    "reasoning": "User wants to book a slot (Roman Urdu: 'mujhe slot chahiye')",
    "entities": {{
        "service_type": "padel",
        "date": "tomorrow",
        "time": "18:00-21:00",
        "customer_name": null
    }}
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
    "customer_name": "Ahmad",
    "phone_number": "+923001234567"
}}
"""
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API with prompt"""
        try:
            import asyncio
            # Run the synchronous Gemini call in a thread pool
            response = await asyncio.get_event_loop().run_in_executor(
                None, self.model.generate_content, prompt
            )
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
