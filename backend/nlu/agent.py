"""
NLU Agent - Natural Language Understanding using Groq (Qwen 3 32B)
Handles intent extraction and entity recognition for Roman Urdu/English mixed language
Uses Pydantic for structured LLM response parsing
"""

import logging
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from openai import OpenAI
from pydantic import ValidationError
from app.config import settings
from nlu.usage_tracker import UsageTracker
from agent.models import LLMIntentResponse, LLMEntityResponse, ExtractedEntities

logger = logging.getLogger(__name__)

usage_tracker = UsageTracker()


class NLUAgent:
    """Natural Language Understanding agent using Groq (Qwen 3 32B)"""
    
    def __init__(self):
        """Initialize NLU agent with Groq"""
        try:
            # Check if API key is set
            api_key = settings.GROQ_API_KEY
            if not api_key or api_key == "dummy_key_for_dev" or api_key == "your_groq_api_key_here":
                error_msg = (
                    "GROQ_API_KEY is not configured!\n"
                    "Please set your Groq API key in the .env file:\n"
                    "1. Get your API key from https://console.groq.com/\n"
                    "2. Add this line to backend/.env:\n"
                    "   GROQ_API_KEY=your_actual_api_key_here\n"
                    "3. Restart the application"
                )
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Configure Groq API (OpenAI-compatible)
            self.client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=api_key
            )
            logger.info(f"NLU Agent initialized with Groq model: {settings.GROQ_MODEL}")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Groq: {e}")
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
        logger.info("=" * 70)
        logger.info("🔵 [extract_intent] FUNCTION CALLED")
        logger.info(f"   Message: {message}")
        logger.info(f"   History length: {len(conversation_history)}")
        logger.info("=" * 70)
        
        try:
            # Build context from conversation history
            logger.info("📝 [extract_intent] Building context from history...")
            context = self._build_context(conversation_history)
            logger.info(f"   Context built: {len(context)} characters")
            
            # Create prompt for Groq
            logger.info("📝 [extract_intent] Creating intent classification prompt...")
            prompt = self._create_intent_prompt(message, context)
            logger.info(f"   Prompt created: {len(prompt)} characters")
            
            # Get response from Groq
            logger.info("[extract_intent] Calling Groq API...")
            response = await self._call_groq(prompt, json_format=True)
            logger.info(f"   Groq response received: {len(response)} characters")
            
            # Parse Groq response
            logger.info("🔍 [extract_intent] Parsing Groq response...")
            result = self._parse_intent_response(response)
            
            entities = result.get('entities', {})

            if entities.get('customer_name'):
                customer_name = entities['customer_name']
                message_lower = message.lower()
                name_parts = customer_name.lower().split()
                name_in_message = any(part in message_lower for part in name_parts if len(part) > 2)
                explicit_patterns = [
                    f"my name is {customer_name.lower()}",
                    f"i am {customer_name.lower()}",
                    f"i'm {customer_name.lower()}",
                    f"name is {customer_name.lower()}",
                ]
                has_explicit_pattern = any(pattern in message_lower for pattern in explicit_patterns)
                if not name_in_message and not has_explicit_pattern:
                    logger.warning(f"customer_name '{customer_name}' not found in current message, removing")
                    entities['customer_name'] = None

            if result.get('intent') == 'greeting':
                has_booking_entities = any([
                    entities.get('service_type'),
                    entities.get('date'),
                    entities.get('time'),
                    entities.get('vendor_name'),
                ])
                if has_booking_entities:
                    result['intent'] = 'booking_request'
                    logger.info("Upgraded greeting to booking_request (booking entities found in message)")

            result['entities'] = entities
            logger.info(f"[extract_intent] RESULT: intent={result.get('intent')}, entities={entities}")
            
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
            
            # Get response from Groq (no JSON format for text generation)
            response = await self._call_groq(prompt, json_format=False)
            
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
        for msg in history[-10:]:  # Last 5 messages
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            context += f"{role}: {content}\n"
        
        return context
    
    def _create_intent_prompt(self, message: str, context: str) -> str:
        """Create prompt for intent extraction - Enhanced with real conversation patterns"""
        return f"""You are a booking assistant for sports facilities (padel courts, futsal, cricket) and salons in Karachi, Pakistan.

Analyze this WhatsApp message and classify the user's intent. The user may speak in Roman Urdu mixed with English.

Message: "{message}"

Conversation History:
{context}

CRITICAL RULE - GREETING vs BOOKING:
A message that starts with a greeting BUT also contains booking details (sport, time, date, venue) is NOT a greeting.
It is a booking_request or availability_inquiry. Only classify as "greeting" when the message is PURELY a greeting with ZERO booking info.
Examples:
- "Hi" → greeting (no booking info)
- "Aoa, padel slot chahiye kal" → booking_request (has sport + date)
- "Salam, 4 pm at ace padel" → availability_inquiry (has time + venue)
- "Hello I want to book futsal tomorrow evening" → booking_request (has sport + date + time)

CRITICAL RULE - CONFIRMATION AND SELECTION:
When conversation history shows the bot listed slots or asked for confirmation:
- "2" or "3" or any single digit → confirmation (slot selection)
- "yes", "ok", "han", "ji", "haan", "done" → confirmation
- "2 yes", "yes 2", "book 3", "slot 2" → confirmation (slot selection + confirm)
- "no", "nahi", "cancel" → cancellation
- "change", "different", "actually" → modification

Possible Intents:
1. **greeting** - ONLY pure greetings with NO booking info: "Hi", "Aoa", "Salam", "Hello"
2. **booking_request** - Want to book: "book slot", "want to book", "mujhe slot chahiye", "slot karna hai", or any message with sport+time/date/venue
3. **availability_inquiry** - Check availability: "slot available?", "koi slot hei?", any query about slots
4. **service_selection** - Choose service type: "padel", "futsal", "cricket", "salon"
5. **date_selection** - Provide date: "tomorrow", "Friday", "kal", "next week"
6. **time_selection** - Provide time: "6-9", "evening", "shaam", "7pm"
7. **price_inquiry** - Ask about pricing: "how much", "charges", "price", "kitna"
8. **confirmation** - Confirm/select: "yes", "ok", "confirm", "book it", "han", "ji", "done", digit selection like "2", "3"
9. **cancellation** - Cancel: "cancel", "nahi", "don't want"
10. **modification** - Change: "actually", "change to", "instead", "different"
11. **information** - General questions: "what services", "where is the venue"
12. **payment_related** - Payment: "payment", "transfer", "account number"
13. **name_provided** - Sharing name: "My name is X"
14. **unknown** - Unclear or irrelevant message

Roman Urdu Reference:
- "mujhe" = I want, "chahiye" = need, "karna hai" = want to do
- "kal" = tomorrow, "aaj" = today, "parson" = day after tomorrow
- "subah" = morning (7:00-11:00), "dopahar" = afternoon (12:00-16:00)
- "shaam" = evening (17:00-19:00), "raat" = night (20:00-23:00)
- "bajay/baje" = o'clock, "ghanta" = hour

Extract entities (return null for any not found in the message):
- service_type: padel, futsal, cricket, salon (handle typos: "paddle"="padel", "padle"="padel")
- date: tomorrow, today, specific date, "kal", "aaj", day names
- time: specific time like "4 pm", or a RANGE like "5-9", "6 to 9", "from 5 to 9" (extract exactly as said so the system can show all slots in that range). Or bucket like "evening"/"shaam". If both bucket and clock time given (e.g. "evening 4 pm"), extract the specific clock time "16:00".
  Time buckets: morning=07:00-12:00, afternoon=12:00-17:00, evening=17:00-19:00, night=20:00-23:00
- area: DHA, Clifton, Gulshan, Gulberg, Bahria, etc.
- vendor_name: venue/facility name if mentioned. Extract the name as the user said it. Known venues in Karachi: "Ace Padel Club" (DHA), "Smash Padel" (Clifton), "Golden Court" (DHA), "Pickle Pod" (DHA), "Dink Masters" (Clifton), "Pitch Perfect" (DHA), "Rally Point" (Gulshan), "Elite Futsal" (Clifton), "Goal Zone" (Gulshan), "Urban Futsal" (Bahria), "Clifton Cricket Nets" (Clifton). Common short aliases: "ace"="Ace Padel Club", "golden"="Golden Court", "smash"="Smash Padel", "pickle"="Pickle Pod", "dink"="Dink Masters", "rally"="Rally Point", "pitch perfect"="Pitch Perfect", "elite"="Elite Futsal", "goal zone"="Goal Zone", "urban"="Urban Futsal".
- customer_name: ONLY if explicitly stated in THIS message ("My name is X", "I am X"). null otherwise.

Respond in JSON format:
{{
    "intent": "booking_request",
    "confidence": 0.95,
    "reasoning": "brief reason",
    "entities": {{
        "service_type": "padel",
        "date": "tomorrow",
        "time": "16:00",
        "area": null,
        "vendor_name": "Ace Padel Club",
        "customer_name": null
    }}
}}"""
    
    def _create_entity_prompt(self, message: str, intent: str) -> str:
        """Create prompt for entity extraction"""
        return f"""
            Extract specific entities from this message for a {intent} intent:

            Message: "{message}"

            Extract:
            - service_type: futsal, salon, gym, padel, cricket
            - date: tomorrow, today, specific date (convert to YYYY-MM-DD if possible)
            - time: 5pm, evening, morning, specific time (convert to HH:MM if possible)
            - customer_name: extract name if mentioned
            - phone_number: extract phone if mentioned
            - vendor_name: venue/facility name if mentioned (e.g. "Ace Padel Club", "Golden Court")
            DATE FORMATS TO EXTRACT:
            - If user provides YYYY-MM-DD format (e.g., "2025-12-17"), PRESERVE IT EXACTLY
            - If user says "tomorrow" or "kal", extract as: "tomorrow"
            - If user says day name (e.g., "Friday"), extract as: "Friday"
            - DO NOT convert dates to other formats
            Respond in JSON format:
            {{
                "service_type": "futsal",
                "date": "2025-01-15",
                "time": "17:00",
                "customer_name": "Ahmad",
                "phone_number": "+923001234567"
            }}
            """
    
    async def _call_groq(self, prompt: str, json_format: bool = False) -> str:
        """Call Groq API with prompt"""
        logger.info(f"[_call_groq] Calling Groq API...")
        logger.info(f"   Model: {settings.GROQ_MODEL}")
        logger.info(f"   Prompt length: {len(prompt)} characters")
        try:
            import asyncio
            # Run the synchronous Groq call in a thread pool
            logger.info(f"   Sending request to Groq...")
            
            # Build request params
            request_params = {
                "model": settings.GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3
            }
            
            # Only use json_object format if requested and prompt contains "json"
            if json_format and "json" in prompt.lower():
                request_params["response_format"] = {"type": "json_object"}
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.chat.completions.create(**request_params)
            )
            response_text = response.choices[0].message.content
            
            # Track token usage
            if hasattr(response, 'usage') and response.usage:
                prompt_tokens = response.usage.prompt_tokens or 0
                completion_tokens = response.usage.completion_tokens or 0
                total_tokens = response.usage.total_tokens or 0
                
                usage_tracker.record_call(prompt_tokens, completion_tokens, total_tokens)
                
                logger.info(f"   Groq response received: {len(response_text)} characters")
                logger.info(f"   Tokens: {total_tokens} (prompt: {prompt_tokens}, completion: {completion_tokens})")
            else:
                logger.info(f"   Groq response received: {len(response_text)} characters")
            
            return response_text
        except Exception as e:
            logger.error(f"   Groq API error: {e}")
            raise
    
    def _parse_intent_response(self, response: str) -> Dict[str, Any]:
        """Parse Groq response for intent extraction using Pydantic"""
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if not json_match:
                logger.warning("No JSON found in intent response")
                return {'intent': 'unknown', 'entities': {}, 'confidence': 0.0}
            
            json_str = json_match.group()
            raw_data = json.loads(json_str)
            
            try:
                parsed = LLMIntentResponse(**raw_data)
                logger.info(f"✅ Pydantic parsed intent: {parsed.intent} (confidence: {parsed.confidence})")
                return {
                    'intent': parsed.intent,
                    'entities': parsed.entities or {},
                    'confidence': parsed.confidence,
                    'reasoning': parsed.reasoning
                }
            except ValidationError as ve:
                logger.warning(f"Pydantic validation failed, using raw: {ve}")
                return raw_data
            
        except json.JSONDecodeError as je:
            logger.error(f"JSON decode error: {je}")
            return {'intent': 'unknown', 'entities': {}, 'confidence': 0.0}
        except Exception as e:
            logger.error(f"Error parsing intent response: {e}")
            return {'intent': 'unknown', 'entities': {}, 'confidence': 0.0}
    
    def _parse_entity_response(self, response: str) -> Dict[str, Any]:
        """Parse Groq response for entity extraction using Pydantic"""
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if not json_match:
                logger.warning("No JSON found in entity response")
                return {}
            
            json_str = json_match.group()
            raw_data = json.loads(json_str)
            
            try:
                parsed = LLMEntityResponse(**raw_data)
                result = parsed.model_dump(exclude_none=True)
                logger.info(f"✅ Pydantic parsed entities: {result}")
                return result
            except ValidationError as ve:
                logger.warning(f"Pydantic validation failed, using raw: {ve}")
                return raw_data
            
        except json.JSONDecodeError as je:
            logger.error(f"JSON decode error: {je}")
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
            logger.info("=" * 70)
            logger.info("🔵 [generate_response] FUNCTION CALLED")
            logger.info(f"   Intent: {intent}")
            logger.info(f"   Entities: {entities}")
            logger.info(f"   Context: {context}")
            logger.info("=" * 70)
            
            # Check if query_result is already available from LangGraph query_availability_node
            availability_data = None
            query_result = context.get('query_result', {})
            
            if query_result and query_result.get('success') is not None:
                logger.info("✅ [generate_response] Using query_result from LangGraph query_availability_node")
                vendors = query_result.get('vendors', [])
                total_vendors = query_result.get('total_vendors', 0)
                
                available_slots = []
                for vendor in vendors:
                    for slot in vendor.get('slots', []):
                        available_slots.append({
                            'time': slot.get('time_display', f"{slot.get('slot_time', '')} - {slot.get('end_time', '')}"),
                            'slot_time': slot.get('slot_time', ''),
                            'price': slot.get('price', 0),
                            'slot_id': slot.get('slot_id', ''),
                            'vendor_id': vendor.get('vendor_id', ''),
                            'vendor_name': vendor.get('vendor_name', '')
                        })
                
                availability_data = {
                    'success': query_result.get('success', False),
                    'date': query_result.get('date', ''),
                    'requested_date': query_result.get('requested_date', query_result.get('date', '')),
                    'next_available_date': query_result.get('next_available_date'),
                    'available_slots': available_slots,
                    'total_available': len(available_slots),
                    'vendor_id': vendors[0].get('vendor_id') if vendors else None,
                    'sport_type': query_result.get('sport_type', ''),
                    'area': query_result.get('area', '')
                }
                logger.info(f"📊 [generate_response] Converted query_result: {len(available_slots)} slots, next_available_date={availability_data.get('next_available_date')}")
            else:
                should_check = self._should_check_availability(intent, entities)
                logger.info(f"🔍 [generate_response] Checking if database lookup needed: {should_check}")
                
                if should_check:
                    logger.info("✅ [generate_response] Database check triggered - calling _check_database_availability()")
                    availability_data = await self._check_database_availability(entities)
                    logger.info(f"📊 [generate_response] Database check result: success={availability_data.get('success')}, slots_found={len(availability_data.get('available_slots', []))}")

                    # Update context with resolved vendor_id from availability check
                    if availability_data and availability_data.get('success') and availability_data.get('vendor_id'):
                        context['vendor_id'] = availability_data['vendor_id']
                        entities['vendor_id'] = availability_data['vendor_id']
                        logger.info(f"✅ [generate_response] Updated context with resolved vendor_id: {availability_data['vendor_id']}")
                else:
                    logger.info("⏭️  [generate_response] Skipping database check - not all details present")
            
            # BOOKING IS HANDLED BY LANGGRAPH (execute_booking_node in nodes.py)
            # NLU only generates responses - booking_result comes from context if LangGraph executed a booking
            booking_result = context.get('booking_result')
            if booking_result:
                logger.info(f"📋 [generate_response] Booking result from LangGraph: {booking_result}")
            
            # Create response generation prompt with availability AND booking data
            logger.info("📝 [generate_response] Creating response prompt...")
            prompt = self._create_response_prompt(intent, entities, context, availability_data)
            
            # Get response from Groq (no JSON format for text generation)
            logger.info("[generate_response] Calling Groq to generate response...")
            response = await self._call_groq(prompt, json_format=False)
            logger.info(f"✅ [generate_response] Response generated: {response[:100]}...")
            logger.info("=" * 70)
            
            response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
            return response.strip()
            
        except Exception as e:
            logger.error(f"❌ [generate_response] ERROR: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "Internet/Network Issue. Please try again."
    
    def _has_complete_booking_details(self, entities: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """
        Check if we have all required details to create a booking
        Now extracts from conversation history if not in context
        """
        phone_number = context.get('phone_number')
        if not phone_number:
            logger.info("   ❌ Missing phone_number")
            return False
        
        # Try to get date from multiple sources
        date = entities.get('date') or context.get('selected_date')
        
        # If no date in entities/context, check conversation history
        if not date:
            conversation_history = context.get('conversation_history', [])
            for msg in reversed(conversation_history[-5:]):  # Check last 5 messages
                if msg.get('role') == 'assistant':
                    content = msg.get('content', '').lower()
                    # Look for date mentions in agent responses
                    import re
                    date_pattern = r'(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})'
                    date_match = re.search(date_pattern, content, re.IGNORECASE)
                    if date_match:
                        # Convert to YYYY-MM-DD
                        from datetime import datetime
                        try:
                            parsed = datetime.strptime(date_match.group(1), '%d %B %Y')
                            date = parsed.strftime('%Y-%m-%d')
                            logger.info(f"   ℹ️  Extracted date from history: {date}")
                            break
                        except:
                            pass
        
        # Try to get time from entities or conversation history
        time = entities.get('time')
        if not time:
            # Check if selected_slot has time
            selected_slot = context.get('selected_slot')
            if selected_slot:
                time = selected_slot.get('slot_time') or selected_slot.get('time')
        
        # If still no time, extract from conversation history
        if not time:
            conversation_history = context.get('conversation_history', [])
            for msg in reversed(conversation_history[-5:]):  # Check last 5 messages
                if msg.get('role') == 'assistant':
                    content = msg.get('content', '').lower()
                    # Look for time mentions like "8:00 AM" or "8 AM"
                    import re
                    time_pattern = r'(\d{1,2}):?(\d{2})?\s*(am|pm)'
                    time_match = re.search(time_pattern, content, re.IGNORECASE)
                    if time_match:
                        hour = int(time_match.group(1))
                        minute = int(time_match.group(2)) if time_match.group(2) else 0
                        period = time_match.group(3).lower()
                        
                        if period == 'pm' and hour < 12:
                            hour += 12
                        elif period == 'am' and hour == 12:
                            hour = 0
                        
                        time = f"{hour:02d}:{minute:02d}"
                        logger.info(f"   ℹ️  Extracted time from history: {time}")
                        break
        
        # Check if we have all required fields
        if not date:
            logger.info("   ❌ Missing date")
            return False
        
        if not time:
            logger.info("   ❌ Missing time")
            return False
        
        logger.info(f"   ✅ All booking details available: date={date}, time={time}")
        return True

    async def _get_vendor_id_by_name(self, vendor_name: str) -> Optional[str]:
        """
        Map vendor name to vendor_id by querying Firestore, with fuzzy matching for typos
        
        Args:
            vendor_name: Vendor name (e.g., "Golden Court", "Ace Padel Club")
            
        Returns:
            vendor_id if found, None otherwise
        """
        if not vendor_name:
            return None
            
        try:
            from app.firestore import firestore_db
            from difflib import SequenceMatcher
            
            vendor_name_lower = vendor_name.lower().strip()
            
            # Query vendors collection by name (case-insensitive match)
            vendors_ref = firestore_db.db.collection('vendors')
            vendors = vendors_ref.stream()
            
            best_id: Optional[str] = None
            best_score: float = 0.0
            
            for vendor_doc in vendors:
                vendor_data = vendor_doc.to_dict()
                vendor_doc_name = vendor_data.get('name', '').lower().strip()
                
                # Fast path: exact/contains match
                if (
                    vendor_name_lower == vendor_doc_name
                    or vendor_name_lower in vendor_doc_name
                    or vendor_doc_name in vendor_name_lower
                ):
                    vendor_id = vendor_doc.id
                    logger.info(f"✅ Found vendor_id '{vendor_id}' for name '{vendor_name}' (direct match)")
                    return vendor_id
                
                # Fuzzy match for typos (e.g. 'smsh padel' -> 'Smash Padel')
                score = SequenceMatcher(None, vendor_name_lower, vendor_doc_name).ratio()
                if score > best_score:
                    best_score = score
                    best_id = vendor_doc.id
            
            # Accept best fuzzy match above threshold
            if best_id and best_score >= 0.7:
                logger.info(f"✅ Fuzzy matched vendor '{vendor_name}' -> id '{best_id}' (score={best_score:.2f})")
                return best_id
            
            logger.warning(f"⚠️  No vendor found for name: '{vendor_name}' (best_score={best_score:.2f})")
            return None
            
        except Exception as e:
            logger.error(f"❌ Error getting vendor by name: {e}")
            return None

    def _extract_booking_details(self, entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract all booking details from entities, context, and conversation history
        """
        logger.info("=" * 70)
        logger.info("🔍 [_extract_booking_details] EXTRACTING BOOKING DETAILS")
        logger.info(f"   Entities: {entities}")
        logger.info(f"   Context keys: {list(context.keys())}")
        logger.info("=" * 70)
        
        selected_slot = context.get('selected_slot', {})
        
        # Get slot time (try multiple formats and sources)
        slot_time = selected_slot.get('slot_time') or selected_slot.get('time') or entities.get('time')
        logger.info(f"   Initial slot_time from context/entities: {slot_time}")
        
        # If no time found, extract from conversation history
        if not slot_time:
            conversation_history = context.get('conversation_history', [])
            logger.info(f"   🔍 Searching conversation history for time (history length: {len(conversation_history)})")
            for msg in reversed(conversation_history[-5:]):
                if msg.get('role') == 'assistant':
                    content = msg.get('content', '')
                    logger.info(f"   📝 Checking message: {content[:100]}...")
                    import re
                    time_pattern = r'(\d{1,2}):(\d{2})\s*(am|pm)'
                    time_match = re.search(time_pattern, content, re.IGNORECASE)
                    if time_match:
                        hour = int(time_match.group(1))
                        minute = int(time_match.group(2))
                        period = time_match.group(3).lower()
                        
                        logger.info(f"   🕐 Matched time: {hour}:{minute:02d} {period}")
                        
                        if period == 'pm' and hour < 12:
                            hour += 12
                        elif period == 'am' and hour == 12:
                            hour = 0
                        # For AM times 1-11, keep as is
                        
                        slot_time = f"{hour:02d}:{minute:02d}"
                        logger.info(f"   ✅ Extracted time from history: {slot_time}")
                        break
                    else:
                        logger.info(f"   ❌ No time pattern matched in this message")
        
        # Normalize slot_time to HH:MM format (24-hour)
        if slot_time:
            import re
            slot_time_str = str(slot_time).strip()
            
            # Check if it's already in HH:MM format (24-hour)
            if re.match(r'^\d{2}:\d{2}$', slot_time_str):
                slot_time = slot_time_str
                logger.info(f"   ✅ Time already in HH:MM format: {slot_time}")
            else:
                # Handle "HH:MM AM/PM" format (e.g., "12:00 PM", "09:00 AM")
                am_pm_pattern_with_colon = r'(\d{1,2}):(\d{2})\s*(am|pm)'
                am_pm_match = re.search(am_pm_pattern_with_colon, slot_time_str, re.IGNORECASE)
                if am_pm_match:
                    hour = int(am_pm_match.group(1))
                    minute = int(am_pm_match.group(2))
                    period = am_pm_match.group(3).lower()
                    
                    # Convert to 24-hour format
                    if period == 'pm' and hour < 12:
                        hour += 12
                    elif period == 'am' and hour == 12:
                        hour = 0
                    
                    slot_time = f"{hour:02d}:{minute:02d}"
                    logger.info(f"   ✅ Converted '{slot_time_str}' to '{slot_time}' (24-hour format)")
                else:
                    # Handle "X am" or "X pm" format WITHOUT colon (e.g., "11 am", "12 pm", "9 pm", "3 pm")
                    am_pm_pattern_no_colon = r'(\d{1,2})\s*(am|pm)'
                    am_pm_match_no_colon = re.search(am_pm_pattern_no_colon, slot_time_str, re.IGNORECASE)
                    if am_pm_match_no_colon:
                        hour = int(am_pm_match_no_colon.group(1))
                        period = am_pm_match_no_colon.group(2).lower()
                        
                        # Convert to 24-hour format
                        if period == 'pm' and hour < 12:
                            hour += 12
                        elif period == 'am' and hour == 12:
                            hour = 0
                        
                        slot_time = f"{hour:02d}:00"
                        logger.info(f"   ✅ Converted '{slot_time_str}' to '{slot_time}' (24-hour format, no colon)")
                    else:
                        # Try to extract time from various formats using normalize_time
                        from agent.nodes import normalize_time
                        normalized = normalize_time(slot_time_str)
                        if normalized:
                            slot_time = normalized.get('start', slot_time_str)
                            logger.info(f"   ✅ Normalized '{slot_time_str}' to '{slot_time}' using normalize_time")
                        else:
                            # If normalization fails, try to extract just the time part
                            # Handle cases like "12:00 PM - 01:00 PM" -> extract start time
                            time_range_match = re.search(r'(\d{1,2}):(\d{2})', slot_time_str)
                            if time_range_match:
                                hour = int(time_range_match.group(1))
                                minute = int(time_range_match.group(2))
                                # Check if PM is mentioned anywhere in the string
                                if 'pm' in slot_time_str.lower() and hour < 12:
                                    hour += 12
                                elif 'am' in slot_time_str.lower() and hour == 12:
                                    hour = 0
                                slot_time = f"{hour:02d}:{minute:02d}"
                                logger.info(f"   ✅ Extracted time from range '{slot_time_str}' -> '{slot_time}'")
                            else:
                                logger.warning(f"   ⚠️  Could not normalize time: '{slot_time_str}', using as-is")
                                slot_time = slot_time_str
        
        # Get date - try multiple sources and normalize to YYYY-MM-DD format
        date = entities.get('date') or context.get('selected_date')
        
        # Normalize date if it's in text format (e.g., "December 15, 2025")
        if date:
            import re
            from datetime import datetime
            
            date_str = str(date).strip()
            
            # Check if already in YYYY-MM-DD format
            if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
                date = date_str
                logger.info(f"   ✅ Date already in YYYY-MM-DD format: {date}")
            else:
                # Try to parse various date formats
                date_formats = [
                    ('%B %d, %Y', r'(\w+)\s+(\d{1,2}),\s+(\d{4})'),  # "December 15, 2025"
                    ('%d %B %Y', r'(\d{1,2})\s+(\w+)\s+(\d{4})'),     # "15 December 2025"
                    ('%B %d %Y', r'(\w+)\s+(\d{1,2})\s+(\d{4})'),     # "December 15 2025"
                ]
                
                parsed_date = None
                for fmt, pattern in date_formats:
                    match = re.search(pattern, date_str, re.IGNORECASE)
                    if match:
                        try:
                            # Reconstruct date string for parsing
                            if fmt == '%B %d, %Y':
                                date_to_parse = f"{match.group(1)} {match.group(2)}, {match.group(3)}"
                            elif fmt == '%d %B %Y':
                                date_to_parse = f"{match.group(1)} {match.group(2)} {match.group(3)}"
                            else:
                                date_to_parse = f"{match.group(1)} {match.group(2)} {match.group(3)}"
                            
                            parsed = datetime.strptime(date_to_parse, fmt)
                            parsed_date = parsed.strftime('%Y-%m-%d')
                            logger.info(f"   ✅ Converted date '{date_str}' to '{parsed_date}'")
                            break
                        except Exception as e:
                            logger.debug(f"   ⚠️  Failed to parse date with format {fmt}: {e}")
                            continue
                
                if parsed_date:
                    date = parsed_date
                else:
                    logger.warning(f"   ⚠️  Could not normalize date: '{date_str}', using as-is")
        
        # If still no date, extract from conversation history
        if not date:
            conversation_history = context.get('conversation_history', [])
            for msg in reversed(conversation_history[-5:]):
                if msg.get('role') == 'assistant':
                    content = msg.get('content', '').lower()
                    import re
                    date_pattern = r'(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})'
                    date_match = re.search(date_pattern, content, re.IGNORECASE)
                    if date_match:
                        from datetime import datetime
                        try:
                            parsed = datetime.strptime(date_match.group(1), '%d %B %Y')
                            date = parsed.strftime('%Y-%m-%d')
                            logger.info(f"   📅 Extracted date from history: {date}")
                            break
                        except:
                            pass
        
        # Get vendor info - try entities first, then context
        vendor_id = entities.get('vendor_id') or context.get('vendor_id')
        
        # If vendor_id is not found, try to get from vendor_name or venue
        if not vendor_id:
            vendor_name = entities.get('vendor_name') or entities.get('vendor') or entities.get('venue')
            if vendor_name:
                # Use vendor_id from context if it was resolved earlier
                vendor_id = context.get('vendor_id')
                if not vendor_id:
                    # Store vendor_name for async resolution in generate_response
                    context['vendor_name'] = vendor_name
                    logger.info(f"   📝 Stored vendor_name '{vendor_name}' for resolution")
        
        # Fallback to default only if absolutely no vendor info
        if not vendor_id:
            vendor_id = 'ace_padel_club'
            logger.warning(f"   ⚠️  No vendor_id found, using default: {vendor_id}")
        
        # Get customer info
        phone_number = context.get('phone_number', '')
        
        # Get duration (default to 1 hour if not specified)
        duration_hours = context.get('selected_duration', 1.0)
        # TODO: Implement 120-minute consecutive slot check
        
        # Calculate end time based on duration
        if slot_time and duration_hours:
            try:
                from datetime import datetime, timedelta
                start_time = datetime.strptime(slot_time, '%H:%M')
                end_time = start_time + timedelta(hours=duration_hours)
                end_time_str = end_time.strftime('%H:%M')
            except:
                end_time_str = slot_time  # fallback
        else:
            end_time_str = slot_time
            
        booking_details = {
            'vendor_id': vendor_id,
            'date': date,  # Use the date we extracted (not from entities only)
            'time': slot_time,
            'end_time': end_time_str,
            'duration_hours': duration_hours,
            'customer_info': {
                'phone': phone_number,
                'name': context.get('customer_name', f'Customer {phone_number}'),
                'booking_source': 'whatsapp_ai'
            },
            'selected_slot': selected_slot
        }
        
        logger.info("=" * 70)
        logger.info(f"📋 [extract_booking_details] FINAL EXTRACTED DETAILS:")
        logger.info(f"   Vendor ID: {vendor_id}")
        logger.info(f"   Date: {date}")
        logger.info(f"   Time: {slot_time}")
        logger.info(f"   End Time: {end_time_str}")
        logger.info(f"   Phone: {phone_number}")
        logger.info("=" * 70)
        return booking_details

    async def _create_booking(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        DEPRECATED: Booking is now handled by LangGraph (execute_booking_node in nodes.py)
        This method is kept for reference but is no longer called.
        All bookings go through the slot locking flow in LangGraph.
        """
        try:
            logger.info("🔧 [_create_booking] Creating booking in database...")
            
            from database.availability_service import AvailabilityService
            
            availability_service = AvailabilityService()
            
            # Use the check_and_book_slot method (atomic booking with Firestore transaction)
            result = await availability_service.check_and_book_slot(
                vendor_id=booking_details['vendor_id'],
                date=booking_details['date'],
                time=booking_details['time'],
                customer_info=booking_details['customer_info']
            )
            
            logger.info(f"📊 [_create_booking] Booking result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"❌ [_create_booking] Error creating booking: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            return {
                'success': False,
                'error': f'Booking creation failed: {str(e)}'
            }
    
    def _should_check_availability(self, intent: str, entities: Dict[str, Any]) -> bool:
        """
        Check if we have all required details to check database availability
        
        Returns True if:
        - Intent is inquiry
        - Service type is provided
        - Date is provided
        - Time is provided (optional but preferred)
        """
        logger.info("🔍 [_should_check_availability] FUNCTION CALLED")
        logger.info(f"   Intent: {intent}")
        logger.info(f"   Entities: {entities}")
        
        if intent != "inquiry":
            logger.info(f"   ❌ Intent '{intent}' does not require availability check")
            return False
        logger.info(f"   ✅ Intent '{intent}' requires availability check")
        
        # Check if service type is provided
        service_type = entities.get("service_type", "").lower()
        if not service_type:
            logger.info("   ❌ Service type not provided")
            return False  # Need service type to find vendor
        logger.info(f"   ✅ Service type found: {service_type}")
        
        # Check if date is provided
        date = entities.get("date")
        if not date:
            logger.info("   ❌ Date not provided")
            return False
        logger.info(f"   ✅ Date found: {date}")
        
        # Time is optional
        time = entities.get("time") or entities.get("time_range")
        if time:
            logger.info(f"   ✅ Time found: {time}")
        else:
            logger.info("   ⚠️  Time not provided (optional)")
        
        logger.info("   ✅ All required details present - WILL check database")
        return True
    
    async def _check_database_availability(self, entities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check actual database for slot availability
        
        Args:
            entities: Extracted entities with date, time, service_type
            
        Returns:
            Availability data from database
        """
        logger.info("=" * 70)
        logger.info("🔵 [_check_database_availability] FUNCTION CALLED")
        logger.info(f"   Input entities: {entities}")
        logger.info("=" * 70)
        
        try:
            from database.availability_service import AvailabilityService
            
            # Get entities
            date = entities.get("date")
            time_range = entities.get("time") or entities.get("time_range")
            service_type = entities.get("service_type", "padel")

            # Guard: do not query without a date — avoids silent "today" fallbacks
            if not date:
                logger.warning("[_check_database_availability] No date in entities — skipping query")
                return {
                    "success": False,
                    "error": "no_date",
                    "available_slots": []
                }

            logger.info(f"📋 [_check_database_availability] Extracted:")
            logger.info(f"   Date: {date}")
            logger.info(f"   Time range: {time_range}")
            logger.info(f"   Service type: {service_type}")
            
            # Normalize date if needed (handle "tomorrow", "kal", etc.)
            original_date = date
            if isinstance(date, str) and not date.startswith("202"):
                logger.info(f"📅 [_check_database_availability] Normalizing date: '{date}'")
                # Try to normalize relative dates
                today = datetime.now()
                date_lower = date.lower()
                if date_lower in ["tomorrow", "kal"]:
                    date = (today + timedelta(days=1)).strftime("%Y-%m-%d")
                    logger.info(f"   ✅ Normalized 'tomorrow' to: {date}")
                elif date_lower in ["today", "aaj"]:
                    date = today.strftime("%Y-%m-%d")
                    logger.info(f"   ✅ Normalized 'today' to: {date}")
                else:
                    # Try to parse as date string
                    try:
                        parsed_date = datetime.strptime(date, "%Y-%m-%d")
                        date = parsed_date.strftime("%Y-%m-%d")
                        logger.info(f"   ✅ Parsed date to: {date}")
                    except:
                        # Cannot parse date — bail rather than silently defaulting to today
                        logger.warning(f"   ⚠️  Could not parse date '{date}' — skipping query")
                        return {
                            "success": False,
                            "error": "unparseable_date",
                            "available_slots": []
                        }
            else:
                logger.info(f"📅 [_check_database_availability] Date already in format: {date}")
            
            # Get vendor_id from entities or context
            # First try to get from entities, then from vendor_name, or query by service_type
            vendor_id = entities.get("vendor_id")
            logger.info(f"🏢 [_check_database_availability] Looking for vendor_id...")
            
            # If vendor_id not found, try to resolve from vendor_name
            if not vendor_id:
                vendor_name = entities.get("vendor_name") or entities.get("vendor")
                if vendor_name:
                    logger.info(f"   🔍 Resolving vendor_id from vendor_name: '{vendor_name}'")
                    vendor_id = await self._get_vendor_id_by_name(vendor_name)
                    if vendor_id:
                        logger.info(f"   ✅ Resolved vendor_id: {vendor_id}")
                    else:
                        logger.warning(f"   ⚠️  Could not resolve vendor_id from name: '{vendor_name}'")
            
            # If still no vendor_id, query by service_type
            if not vendor_id:
                logger.info(f"   ⚠️  vendor_id not found, querying Firestore by service_type: {service_type}")
                # Try to get vendor_id from service_type by querying Firestore
                try:
                    from database.firestore_v2 import FirestoreV2
                    from app.firestore import firestore_db
                    service_type = entities.get("service_type", "padel").lower()
                    
                    logger.info(f"   🔍 Querying Firestore: services collection where sport_type == '{service_type}'")
                    # Use FirestoreV2.get_vendors_by_sport() which queries services collection correctly
                    fs_v2 = FirestoreV2(firestore_db.db)
                    vendors = await fs_v2.get_vendors_by_sport(service_type)
                    
                    logger.info(f"   📊 Firestore query returned {len(vendors)} vendor(s)")
                    
                    if vendors:
                        # Use the first vendor found (or you can add logic to select specific vendor)
                        vendor_id = vendors[0].get("id")
                        logger.info(f"   ✅ Found vendor_id: {vendor_id} (using first vendor from results)")
                        logger.info(f"   📋 Vendor details: {vendors[0]}")
                    else:
                        logger.warning(f"   ❌ No vendors found for service type: {service_type}")
                        logger.info("   📤 Returning error response")
                        return {
                            "success": False,
                            "error": f"No vendors found for service type: {service_type}",
                            "available_slots": []
                        }
                except Exception as e:
                    logger.error(f"   ❌ Error getting vendor by service type: {e}")
                    import traceback
                    logger.error(f"   Traceback: {traceback.format_exc()}")
                    return {
                        "success": False,
                        "error": f"Could not determine vendor: {str(e)}",
                        "available_slots": []
                    }
            else:
                logger.info(f"   ✅ vendor_id found: {vendor_id}")
            
            if not vendor_id:
                logger.error("   ❌ vendor_id is still None after all attempts")
                return {
                    "success": False,
                    "error": "Vendor ID not found. Please specify the vendor or service type.",
                    "available_slots": []
                }
            
            # Initialize availability service
            logger.info(f"🔧 [_check_database_availability] Initializing AvailabilityService...")
            availability_service = AvailabilityService()
            
            # Check database for available slots
            logger.info(f"🗄️  [_check_database_availability] CALLING DATABASE:")
            logger.info(f"   Vendor ID: {vendor_id}")
            logger.info(f"   Date: {date}")
            logger.info(f"   Method: availability_service.get_available_slots()")
            available_slots = await availability_service.get_available_slots(vendor_id, date)
            logger.info(f"📊 [_check_database_availability] DATABASE RESPONSE:")
            logger.info(f"   Slots returned: {len(available_slots)}")
            
            # If no slots found for requested date, check next 7 days
            next_available_date = None
            if not available_slots:
                logger.info(f"   ⚠️  No slots for {date}, checking next 7 days...")
                from datetime import datetime as dt, timedelta as td
                base_date = dt.strptime(date, "%Y-%m-%d")
                
                for days_ahead in range(1, 8):
                    check_date = (base_date + td(days=days_ahead)).strftime("%Y-%m-%d")
                    logger.info(f"   🔍 Checking {check_date}...")
                    future_slots = await availability_service.get_available_slots(vendor_id, check_date)
                    if future_slots:
                        available_slots = future_slots
                        next_available_date = check_date
                        logger.info(f"   ✅ Found {len(future_slots)} slots on {check_date}")
                        break
            
            if available_slots:
                logger.info(f"   First slot example: {available_slots[0]}")
            else:
                logger.info(f"   ⚠️  No slots found in the next 7 days")
            
            # Format time range if provided
            time_filter = None
            if time_range:
                logger.info(f"⏰ [_check_database_availability] Processing time range: {time_range}")
                if isinstance(time_range, dict):
                    time_filter = time_range
                    logger.info(f"   ✅ Time range is dict: {time_filter}")
                elif isinstance(time_range, str):
                    # Try to parse time string
                    # This is a simple parser - you might want to enhance it
                    if "-" in time_range:
                        parts = time_range.split("-")
                        time_filter = {"start": parts[0].strip(), "end": parts[1].strip()}
                        logger.info(f"   ✅ Parsed time string to: {time_filter}")
                    else:
                        logger.info(f"   ⚠️  Time range string doesn't contain '-', skipping filter")
            
            # Filter slots by time range if provided
            original_slot_count = len(available_slots)
            if time_filter and available_slots:
                logger.info(f"🔍 [_check_database_availability] Filtering slots by time: {time_filter}")
                start_time = time_filter.get("start", "")
                end_time = time_filter.get("end", "")
                filtered_slots = []
                for slot in available_slots:
                    slot_time = slot.get("time", "")
                    if start_time and end_time:
                        if start_time <= slot_time < end_time:
                            filtered_slots.append(slot)
                    elif start_time:
                        if slot_time >= start_time:
                            filtered_slots.append(slot)
                    else:
                        filtered_slots.append(slot)
                available_slots = filtered_slots
                logger.info(f"   📊 Filtered from {original_slot_count} to {len(available_slots)} slots")
            elif time_filter:
                logger.info(f"   ⚠️  Time filter provided but no slots to filter")
            else:
                logger.info(f"   ℹ️  No time filter, using all {len(available_slots)} slots")
            
            # Use next available date if found, otherwise use requested date
            actual_date = next_available_date if next_available_date else date
            
            result = {
                "success": True,
                "date": actual_date,
                "requested_date": date,
                "next_available_date": next_available_date,  # Set if slots were found on different date
                "vendor_id": vendor_id,
                "available_slots": available_slots,
                "total_available": len(available_slots),
                "time_filter": time_filter
            }
            
            logger.info(f"✅ [_check_database_availability] FUNCTION COMPLETED SUCCESSFULLY")
            logger.info(f"   Result: success=True, slots={len(available_slots)}, vendor={vendor_id}, date={date}")
            logger.info("=" * 70)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ [_check_database_availability] ERROR: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.info("=" * 70)
            return {
                "success": False,
                "error": str(e),
                "available_slots": []
            }
    
    def _create_response_prompt(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any], availability_data: Optional[Dict[str, Any]] = None) -> str:
        """Create prompt for response generation"""
        
        # Build availability information string if available
        availability_info = ""
        if availability_data and availability_data.get("success"):
            slots = availability_data.get("available_slots", [])
            date = availability_data.get("date", "")
            requested_date = availability_data.get("requested_date", date)
            next_available_date = availability_data.get("next_available_date")
            
            if slots:
                # Check if we found slots on a different date than requested
                if next_available_date and next_available_date != requested_date:
                    availability_info = f"""
REAL DATABASE AVAILABILITY DATA (use this actual data):
⚠️ NOTE: No slots were available on the requested date ({requested_date}).
✅ Found slots on the NEXT AVAILABLE DATE: {next_available_date}
Available Slots: {len(slots)} slots found

Slot Details for {next_available_date}:
"""
                else:
                    availability_info = f"""
REAL DATABASE AVAILABILITY DATA (use this actual data):
Date: {date}
Available Slots: {len(slots)} slots found

Slot Details:
"""
                for i, slot in enumerate(slots[:10], 1):  # Show max 10 slots
                    slot_time = slot.get("time", "N/A")
                    price = slot.get("price", 0)
                    slot_id = slot.get("slot_id", "")
                    availability_info += f"{i}. Time: {slot_time}, Price: Rs {price}/hour, ID: {slot_id}\n"
                
                availability_info += "\nPresent this information clearly to the user. Show times and prices."
                if next_available_date:
                    availability_info += f"\nMention that these are the next available slots on {next_available_date}."
            else:
                availability_info = f"""
REAL DATABASE AVAILABILITY DATA:
Date: {date}
Available Slots: 0 slots found

The requested date/time has no available slots in the next 7 days. Apologize and suggest trying another date or time. Do NOT ask the user to call or contact the venue.
"""
        elif availability_data and not availability_data.get("success"):
            availability_info = f"""
DATABASE CHECK FAILED:
Error: {availability_data.get('error', 'Unknown error')}

Apologize that you couldn't check availability right now and ask them to try again.
"""
        
        # Add booking result information (from LangGraph execute_booking_node)
        booking_info = ""
        booking_result = context.get('booking_result')
        if booking_result and booking_result.get('success'):
            status = booking_result.get('status', 'confirmed')
            booking_id = booking_result.get('booking_id', 'N/A')
            amount = booking_result.get('amount', 0)
            
            if status == 'locked':
                slot_parts = booking_id.split('_') if '_' in booking_id else []
                if len(slot_parts) >= 3:
                    vendor_parts = slot_parts[2:5] if len(slot_parts) >= 5 else slot_parts[2:]
                    vendor_code = "".join([p[0].upper() for p in vendor_parts if p])[:3]
                    time_part = slot_parts[1] if len(slot_parts) > 1 else "00"
                    short_id = f"{vendor_code}-{time_part}"
                else:
                    short_id = booking_id[:8]
                booking_info = f"""
SLOT RESERVED:
- Amount: Rs {amount}
- Booking Ref: {short_id}
- Time limit: 10 minutes
- Action: Transfer Rs {amount} and send payment screenshot
"""
            else:
                slot_parts = booking_id.split('_') if '_' in booking_id else []
                if len(slot_parts) >= 3:
                    vendor_parts = slot_parts[2:5] if len(slot_parts) >= 5 else slot_parts[2:]
                    vendor_code = "".join([p[0].upper() for p in vendor_parts if p])[:3]
                    time_part = slot_parts[1] if len(slot_parts) > 1 else "00"
                    short_id = f"{vendor_code}-{time_part}"
                else:
                    short_id = booking_id[:8]
                booking_info = f"""
BOOKING CONFIRMED:
- Booking Ref: {short_id}
- Status: Confirmed
- Thank the customer
"""
        elif booking_result and not booking_result.get('success'):
            error = booking_result.get('error', 'Unknown error')
            booking_info = f"""
BOOKING FAILED:
- Error: {error}
- Apologize and ask customer to try again or select a different slot
"""
        
        return f"""
            You are a friendly booking assistant for futsal courts and salons in Karachi.

CRITICAL - NEVER do any of these:
- Do NOT suggest the user to call, phone, or contact any number (including +92 or any digits).
- Do NOT mention "contact directly", "call us", "phone number", or "reach out" for booking.
- All booking is done in this chat only. Tell the user to type "Confirm [Slot ID]" to book a slot, or to send a payment screenshot here after locking a slot.

Intent: {intent}
Entities: {entities}
Context: {context}
{availability_info if availability_info else ""}
{booking_info if booking_info else ""}

Generate a helpful, friendly response that:
1. Matches the user's language style (Roman Urdu if they use "Aoa", "kal", "shaam" / English otherwise)
2. Addresses the {intent} intent directly
3. Uses the extracted entities naturally: {entities}
4. {"Presents the REAL availability data from database clearly. End by asking them to type Confirm [Slot ID] to book." if availability_info else "Guides the user to provide missing information (date/time) or to type Confirm [Slot ID] to book."}
5. {"If SLOT LOCKED: Tell user the slot is held, provide payment amount, and ask them to send payment screenshot here in chat." if booking_info and "LOCKED" in booking_info else ""}
6. {"If BOOKING CONFIRMED: Confirm the booking with the booking ID and thank the customer" if booking_info and "CONFIRMED" in booking_info else ""}
7. {"If booking failed: Apologize and suggest trying again or selecting a different slot" if booking_info and "FAILED" in booking_info else ""}

Response Guidelines:
- Tone: Friendly, professional, helpful
- Length: 2-4 sentences (be concise)
- Format: NO emojis for booking confirmations. Clean, simple text like a receipt.
- Language: Match user's style exactly
- NEVER suggest calling or contacting any phone number. Booking is only in this chat.
- CRITICAL - Urdu Language Requirement: When responding in Roman Urdu, use ONLY Urdu vocabulary and grammar. Strictly avoid Hindi words. Examples:
  * Use "hai" (Urdu) NOT "hain" (Hindi)
  * Use "mujhe" (Urdu) NOT "mujhko" (Hindi) 
  * Use "aap" (Urdu) NOT "aapko" (Hindi)
  * Use "kya" (Urdu) NOT "kyaa" (Hindi)
  * Use "main" (Urdu) NOT "main" with Hindi grammar patterns
  * Use Urdu verb forms: "karna hai", "chahiye", "mil jayega" (Urdu) NOT Hindi equivalents
  * Use Urdu prepositions and conjunctions: "se", "ko", "ka", "ki" (Urdu) NOT Hindi variants
  * Maintain Urdu sentence structure and word order, not Hindi patterns
- {"If slots are available: List them clearly with times and prices" if availability_info and availability_data.get("total_available", 0) > 0 else ""}
- {"If no slots available: Apologize and suggest alternatives" if availability_info and availability_data.get("total_available", 0) == 0 else ""}

Generate the response now:
"""
