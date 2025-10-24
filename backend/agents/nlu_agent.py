"""
NLU Agent - Natural Language Understanding with Gemini API
Member 2: NLU & Conversation Logic Lead

This agent handles intent extraction and entity recognition for Roman Urdu/English
messages using Google's Gemini API. It provides the interface for other agents
to understand user intent and extract relevant information.

Reference: google-gemini-fastapi Gemini integration (lines 104-116)
"""

import json
import re
import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)


class NLUAgent:
    """Natural Language Understanding agent using Gemini API"""
    
    def __init__(self):
        """Initialize NLU agent with Gemini API"""
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            logger.info("NLU Agent initialized with Gemini API")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini API: {e}")
            raise
    
    async def extract_intent(self, message: str, conversation_history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Extract intent and entities from user message
        
        Args:
            message: Current user message
            conversation_history: Previous conversation context
            
        Returns:
            Dict with 'intent' and 'entities' keys
        """
        try:
            logger.info(f"Extracting intent from: {message}")
            
            # Build context from conversation history
            context = self._build_context(conversation_history)
            
            # Create prompt for Gemini
            prompt = self._create_intent_prompt(message, context)
            
            # Get response from Gemini
            response = self.model.generate_content(prompt)
            
            # Parse response
            result = self._parse_gemini_response(response.text)
            
            logger.info(f"Intent extracted: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Intent extraction failed: {e}")
            return {
                'intent': 'other',
                'entities': {}
            }
    
    def _build_context(self, conversation_history: List[Dict[str, str]]) -> str:
        """Build context string from conversation history"""
        if not conversation_history:
            return "No previous context"
        
        context_parts = []
        for turn in conversation_history[-3:]:  # Last 3 turns
            role = turn.get('role', 'user')
            content = turn.get('content', '')
            context_parts.append(f"{role}: {content}")
        
        return "\n".join(context_parts)
    
    def _create_intent_prompt(self, message: str, context: str) -> str:
        """Create prompt for Gemini to extract intent and entities"""
        return f"""
You are a booking assistant for futsal courts and salons in Karachi. 
Analyze this message and extract intent and entities.

CONVERSATION CONTEXT:
{context}

CURRENT MESSAGE: {message}

EXTRACT:
1. Intent (choose one):
   - greeting: Hello, hi, hey, start, etc.
   - check_availability: Check slots, available times, etc.
   - make_booking: Book, reserve, schedule, etc.
   - confirm_booking: Yes, confirm, okay, etc.
   - cancel_booking: Cancel, cancel booking, etc.
   - other: Everything else

2. Entities (if mentioned):
   - service_type: futsal, salon, court, appointment
   - date: tomorrow, next Friday, 15th January, etc. (convert to YYYY-MM-DD)
   - time: 5pm, 2:30pm, evening, morning, etc. (convert to HH:MM)
   - customer_name: Any name mentioned

IMPORTANT:
- Handle Roman Urdu mixed with English (common in Pakistan)
- Be flexible with date/time expressions
- Return ONLY valid JSON, no other text

RESPONSE FORMAT:
{{
    "intent": "intent_name",
    "entities": {{
        "service_type": "futsal|salon|null",
        "date": "YYYY-MM-DD|null", 
        "time": "HH:MM|null",
        "customer_name": "name|null"
    }}
}}
"""
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response and extract JSON"""
        try:
            # Clean response text
            cleaned = response_text.strip()
            
            # Try to find JSON in response
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
                
                # Validate and clean result
                return self._validate_intent_result(result)
            else:
                logger.warning(f"No JSON found in Gemini response: {response_text}")
                return self._fallback_intent_extraction(response_text)
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Gemini: {e}")
            return self._fallback_intent_extraction(response_text)
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return {'intent': 'other', 'entities': {}}
    
    def _validate_intent_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean intent extraction result"""
        # Ensure required keys exist
        if 'intent' not in result:
            result['intent'] = 'other'
        
        if 'entities' not in result:
            result['entities'] = {}
        
        # Validate intent values
        valid_intents = ['greeting', 'check_availability', 'make_booking', 'confirm_booking', 'cancel_booking', 'other']
        if result['intent'] not in valid_intents:
            result['intent'] = 'other'
        
        # Clean entities
        entities = result['entities']
        for key in ['service_type', 'date', 'time', 'customer_name']:
            if key not in entities:
                entities[key] = None
            elif entities[key] == 'null' or entities[key] == '':
                entities[key] = None
        
        return result
    
    def _fallback_intent_extraction(self, message: str) -> Dict[str, Any]:
        """Fallback intent extraction using simple keyword matching"""
        message_lower = message.lower()
        
        # Intent detection
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'start']):
            intent = 'greeting'
        elif any(word in message_lower for word in ['book', 'reserve', 'schedule']):
            intent = 'make_booking'
        elif any(word in message_lower for word in ['check', 'available', 'time']):
            intent = 'check_availability'
        elif any(word in message_lower for word in ['yes', 'confirm', 'okay']):
            intent = 'confirm_booking'
        elif any(word in message_lower for word in ['cancel', 'cancel booking']):
            intent = 'cancel_booking'
        else:
            intent = 'other'
        
        # Simple entity extraction
        entities = {}
        
        # Service type
        if 'futsal' in message_lower or 'court' in message_lower:
            entities['service_type'] = 'futsal'
        elif 'salon' in message_lower or 'appointment' in message_lower:
            entities['service_type'] = 'salon'
        else:
            entities['service_type'] = None
        
        # Date (simple patterns)
        if 'tomorrow' in message_lower:
            from datetime import datetime, timedelta
            tomorrow = datetime.now() + timedelta(days=1)
            entities['date'] = tomorrow.strftime('%Y-%m-%d')
        else:
            entities['date'] = None
        
        # Time (simple patterns)
        time_patterns = {
            'morning': '09:00',
            'afternoon': '14:00', 
            'evening': '18:00',
            'night': '20:00'
        }
        
        for pattern, time in time_patterns.items():
            if pattern in message_lower:
                entities['time'] = time
                break
        else:
            entities['time'] = None
        
        entities['customer_name'] = None
        
        return {
            'intent': intent,
            'entities': entities
        }
