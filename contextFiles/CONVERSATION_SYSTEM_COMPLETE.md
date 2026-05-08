# 🤖 JHAT Conversation System - Complete Reference

**Version**: 2.0 (February 2026)  
**Purpose**: Complete AI conversation system documentation  
**Scope**: All prompts, patterns, flows, and implementation details

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Intent Classification](#2-intent-classification)
3. [Entity Extraction](#3-entity-extraction)
4. [Complete Booking Flow](#4-complete-booking-flow)
5. [Language Patterns](#5-language-patterns)
6. [Response Generation](#6-response-generation)
7. [Error Handling](#7-error-handling)
8. [Implementation Guide](#8-implementation-guide)

---

## 1. SYSTEM OVERVIEW

### 1.1 Architecture
```
WhatsApp Message → NLU (Intent + Entities) → LangGraph Agent → Database Query → Response Generation → WhatsApp Reply
```

### 1.2 Core Components
- **NLU Engine**: Groq (Qwen 3 32B) for intent/entity extraction
- **Agent Workflow**: LangGraph StateGraph for conversation management
- **Database Integration**: Firestore for booking operations
- **Response System**: Template-based with dynamic content

### 1.3 Design Principles
1. **Bilingual Support**: Roman Urdu + English code-switching
2. **Context Awareness**: Maintain conversation state across turns
3. **Proactive Collection**: Ask for missing info before user asks
4. **Graceful Degradation**: Handle AI failures with human handoff
5. **Natural Language**: Match user's language style

---

## 2. INTENT CLASSIFICATION

### 2.1 5-Core Intent Model
Based on real conversation analysis, we use 5 core intents:

| Intent | Description | Triggers |
|---------|-------------|-----------|
| **GREETING** | Simple greetings | "Hi", "Aoa", "Salam" |
| **INQUIRY** | Any booking-related question | "slot available", "want to book", "price" |
| **INFO_REQUEST** | Static information requests | "how much", "charges", "account details" |
| **TRANSACTION** | Yes/No/Change responses | "confirm", "cancel", "actually" |
| **UNKNOWN** | Unclear or irrelevant | Unclear messages, off-topic |

### 2.2 Intent Classification Prompt
```python
INTENT_CLASSIFICATION_PROMPT = """
You are a booking assistant for sports facilities in Karachi, Pakistan.

Analyze this WhatsApp message and classify user's intent. The user may speak in Roman Urdu mixed with English.

Message: "{message}"
Conversation History: {history}
Current Context: {context}

Possible Intents:
1. **GREETING** - Simple greeting: "Hi", "Aoa", "Salam", "Hello"
2. **INQUIRY** - Any booking-related question: availability, booking, pricing
3. **INFO_REQUEST** - Static information: prices, rules, account info
4. **TRANSACTION** - Yes/No/Change responses to proposals
5. **UNKNOWN** - Unclear or irrelevant message

Roman Urdu Patterns:
- "Aoa" / "AoA" = greeting
- "mujhe" = "I want"
- "chahiye" = "need"
- "kal" = "tomorrow"
- "aaj" = "today"

Priority Rules:
- If message contains booking info → INQUIRY (highest priority)
- If responding to proposal → TRANSACTION
- Simple greetings → GREETING
- Price/account questions → INFO_REQUEST
- Everything else → UNKNOWN

Respond in JSON format:
{
    "intent": "INQUIRY",
    "confidence": 0.95,
    "reasoning": "User wants to book with date/time info",
    "entities": {...}
}
"""
```

### 2.3 Intent Examples from Real Conversations

#### GREETING Examples
- "Hi" → GREETING
- "Aoa" → GREETING  
- "Salam" → GREETING

#### INQUIRY Examples
- "Hi is there a slot available tomorrow Wednesday between 6-9" → INQUIRY
- "Aoa want to book a slot from 8-9 today" → INQUIRY
- "padel court available?" → INQUIRY

#### INFO_REQUEST Examples
- "Ok and how much are the charges and is there any discounts on cards etc?" → INFO_REQUEST
- "Aaj Kal shayad discount bhi hei, price batadei pls" → INFO_REQUEST

#### TRANSACTION Examples
- "Yes" → TRANSACTION (confirming)
- "Ok I'd like to book it" → TRANSACTION
- "Actually just want 6-7 so transferring 3k" → TRANSACTION (modify)

---

## 3. ENTITY EXTRACTION

### 3.1 Entity Types
1. **Date**: When they want to book
2. **Time**: What time slot
3. **Service**: Which sport/service
4. **Price**: Pricing information
5. **Customer Name**: For booking records

### 3.2 Date Extraction
```python
DATE_EXTRACTION_PROMPT = """
Extract date information from WhatsApp booking messages.

Message: "{message}"
Current Date: {current_date}
Conversation Context: {context}

Date Extraction Rules:
1. "tomorrow" = current_date + 1 day
2. "today" = current_date
3. "kal" (Roman Urdu) = current_date + 1 day
4. "aaj" (Roman Urdu) = current_date
5. Day names = next occurrence of that day
6. "next [day]" = next week's occurrence
7. "this [day]" = this week's occurrence

Output Format:
{
    "date": "2025-01-15",  // YYYY-MM-DD format
    "date_text": "tomorrow Wednesday",  // Original text
    "date_type": "relative",  // "relative", "absolute", "day_name"
    "confidence": 0.95
}

Examples:
1. "tomorrow Wednesday" → tomorrow if it's Wednesday, else next Wednesday
2. "kal" → tomorrow
3. "next Friday" → next Friday
4. "today" → current date
"""
```

### 3.3 Time Extraction
```python
TIME_EXTRACTION_PROMPT = """
Extract time information from booking messages.

Message: "{message}"
Conversation Context: {context}

Time Extraction Rules:
1. Time ranges: "6-9", "7-9", "between 6-9", "from 8-9:30"
2. Relative times: "after 6", "evening", "morning"
3. Roman Urdu: "shaam" (evening 6-9 PM), "raat" (night)
4. Specific times: "5pm", "7:30", "12am"

Default Rules:
- Default to PM for evening times (after 12 PM context)
- "evening" / "shaam" = 6:00 PM - 9:00 PM
- "morning" / "subah" = 9:00 AM - 12:00 PM
- "after X" = X:00 onwards (no end time)
- Time ranges like "6-9" = assume PM if evening context

Output Format:
{
    "start_time": "18:00",  // HH:MM format (24-hour)
    "end_time": "21:00",  // HH:MM format (null if open-ended)
    "duration_minutes": 180,  // Calculated duration
    "time_text": "between 6-9",  // Original text
    "time_type": "range",  // "range", "after", "before", "specific"
    "confidence": 0.95
}

Examples:
1. "between 6-9" → start: 18:00, end: 21:00
2. "from 8-9:30" → start: 20:00, end: 21:30
3. "after 6" → start: 18:00, end: null
4. "evening" → start: 18:00, end: 21:00
"""
```

### 3.4 Service Type Extraction
```python
SERVICE_EXTRACTION_PROMPT = """
Extract service type from booking messages.

Message: "{message}"
Available Services: {available_services}  // ["padel", "futsal", "cricket", "salon"]

Common Service Types:
- "padel" / "paddle" → padel
- "futsal" → futsal
- "cricket" → cricket
- "salon" → salon

Extraction Rules:
1. Look for exact service name mentions
2. Handle typos: "paddle" = "padel"
3. If no service mentioned, return null (will use vendor default)
4. Check context: "court" hints at sports, "appointment" hints at salon

Output Format:
{
    "service_type": "padel",  // Service ID
    "service_text": "paddle",  // Original text
    "confidence": 0.90
}

Examples:
1. "Padel" → service_type: "padel"
2. "paddle" → service_type: "padel" (typo handling)
3. "futsal court" → service_type: "futsal"
4. No mention → service_type: null
"""
```

---

## 4. COMPLETE BOOKING FLOW

### 4.1 State Machine Flow
```
greeting
  ↓
inquiry → select_service → select_date → select_time → price_inquiry
  ↓
confirm_booking → collect_name → share_payment → wait_for_payment
  ↓
confirm_payment → booking_complete
```

### 4.2 Detailed Flow with Real Examples

#### Phase 1: Initial Contact
**Customer**: "Aoa want to book a slot from 8-9 today"

**Agent Processing**:
1. Extract entities: date="today", time="8-9", intent="inquiry"
2. Check availability
3. Respond quickly

**Agent**: "AoA! Available. Plz share full name for booking"

**State**: `select_service` or `select_date`

#### Phase 2: Service Selection (if needed)
**Scenario A: Service not mentioned**
```
Customer: "Hi is there a slot available tomorrow Wednesday between 6-9"
Agent: "Yes, available! Which service:
• Padel
• Futsal  
• Cricket
Which one would you like?"
```

#### Phase 3: Date/Time Selection
**Scenario A: Time range provided**
```
Customer: "between 6-9"
Agent: "Available slots:
• 6:00 PM - 7:00 PM
• 7:00 PM - 8:00 PM
• 8:00 PM - 9:00 PM
Which one would you like?"
```

#### Phase 4: Price Inquiry
**Customer**: "Ok and how much are the charges and is there any discounts on cards etc?"

**Agent**:
```
"Pricing:
• Rs 7500 per hour
• 20% discount available
• After discount: Rs 6000 per hour
• Card discount: Not available

Total for your slot: Rs 6000

Would you like to confirm?"
```

#### Phase 5: Booking Confirmation
**Customer**: "Yes" / "Ok I'd like to book it"

**Agent**: "Perfect! Plz share full name for booking"

#### Phase 6: Name Collection
**Agent**: "Plz share full name for booking"
**Customer**: "Jazib Waqas"

**Agent**: "Thank you, Jazib! Booking details:
• Service: Padel
• Date: Today
• Time: 8:00 PM - 9:00 PM
• Price: Rs 6000

Payment details below..."

#### Phase 7: Payment Details Sharing
**Agent sends structured payment info**:
```
Payment Details:

Account Title: Capital Padel
Account Number: 00150900000721
IBAN: PK38ASCM0000150900000721
Bank Name: Askari Bank

Please transfer Rs 6000 and share payment proof.
```

#### Phase 8: Payment Confirmation
**Customer**: [Sends payment screenshot image]
**Agent**: [Processes image with OCR]
**Agent**: "Payment received! Booking confirmed. Thank you!"

### 4.3 Alternative Flows

#### Slot Unavailable Flow
**Customer**: "Hi is there a slot available tomorrow Friday between 7-9"
**Agent**: "No I'm sorry we're completely booked but we do have a slot open from 8 to 9:30"

#### Complex Pricing Flow
**Customer**: "Ok I'd like to book it. Aaj Kal shayad discount bhi hei, price batadei pls for this 1.5 hr session"

**Agent**:
```
"Yes, discounts available!

Pricing (time-based):
• 03 AM - 11 AM: Rs 2000/hour
• 11 AM - 07 PM: Rs 2500/hour
• 07 PM - 03 AM: Rs 3500/hour

Your slot (8:00 PM - 9:30 PM = 1.5 hours):
Rs 3500 × 1.5 = Rs 5250

Would you like to confirm?"
```

---

## 5. LANGUAGE PATTERNS

### 5.1 Roman Urdu Phrase Dictionary
```python
ROMAN_URDU_PHRASES = {
    # Greetings
    "Aoa": "greeting",
    "AoA": "greeting", 
    "Salam": "greeting",
    
    # Want/Need
    "mujhe": "i_want",
    "chahiye": "need",
    "karna hai": "want_to_do",
    "mil jayega": "will_be_available",
    
    # Time
    "kal": "tomorrow",
    "aaj": "today",
    "parson": "day_after_tomorrow",
    "shaam": "evening",
    "raat": "night",
    "subah": "morning",
    
    # Actions
    "batadei": "tell_me",
    "batado": "tell_me",
    "lagwa da": "make_do",
    "Karwa data hn": "I_will_do",
    
    # Responses
    "Han g": "yes",
    "Haan g": "yes",
    "ji": "yes_polite",
    
    # Common
    "scene": "situation/vibe",
    "on hai": "is happening/available"
}
```

### 5.2 Code-Switching Examples
- "Aoa want to book a slot from 8-9 today" (Aoa + English)
- "Ok I'd like to book it" (English)
- "Aaj Kal shayad discount bhi hei, price batadei pls" (Mixed)

### 5.3 Language Matching Rules
1. **Match Greeting Style**: If user says "Aoa", respond "AoA"
2. **Match Language Mix**: If user code-switches, code-switch naturally
3. **Use Roman Urdu**: When user primarily uses Roman Urdu
4. **Stay Professional**: Avoid overly casual language in business context

---

## 6. RESPONSE GENERATION

### 6.1 Response Templates

#### Availability Confirmed
```
"Yes, available! Slots available:
• 6:00 PM - 7:00 PM
• 7:00 PM - 8:00 PM

Which one would you like?"
```

#### Slot Unavailable
```
"No I'm sorry we're completely booked but we do have a slot open from 8 to 9:30. Would that work?"
```

#### Price Information
```
"Pricing:
• Rs 7500 per hour
• 20% discount available
• After discount: Rs 6000 per hour

Total for your slot: Rs 6000"
```

#### Payment Details
```
"Payment Details:

Account Title: Capital Padel
Account Number: 00150900000721
IBAN: PK38ASCM0000150900000721
Bank Name: Askari Bank

Please transfer Rs 6000 and share payment proof."
```

#### Booking Confirmation
```
"🎉 Booking Confirmed!

Booking ID: BK-12345
Service: Padel
Date: Today (2025-01-15)
Time: 8:00 PM - 9:00 PM
Customer: Jazib Waqas
Amount: Rs 6000

Thank you for using BookForMe!"
```

### 6.2 Dynamic Response Generation
```python
def generate_response(intent, entities, context):
    if intent == "GREETING":
        return generate_greeting_response()
    elif intent == "INQUIRY":
        return handle_inquiry(entities, context)
    elif intent == "INFO_REQUEST":
        return handle_info_request(entities, context)
    elif intent == "TRANSACTION":
        return handle_transaction(entities, context)
    else:
        return generate_help_response()
```

---

## 7. ERROR HANDLING

### 7.1 Error Categories
1. **Unclear Message**: Cannot understand intent
2. **Missing Information**: Incomplete booking details
3. **Slot Unavailable**: Requested time not available
4. **System Errors**: Database/API failures
5. **Payment Issues**: OCR verification failures

### 7.2 Error Response Strategies

#### Unclear Message
```
"I'm sorry, I didn't understand that. Could you please tell me:
• What date you want to book?
• What time you prefer?
• Which service you need?"
```

#### Missing Information
```
"I can help with that! Could you please share:
• Your full name
• Preferred date and time
• Which service you'd like"
```

#### System Errors
```
"I'm having technical difficulties right now. Please try again in a few minutes, or call us directly at +92-XXX-XXXXXXX"
```

### 7.3 Fallback Strategies
1. **Human Handoff**: Offer to connect with human agent
2. **Alternative Suggestions**: Suggest different times/dates
3. **Simplified Questions**: Break down complex requests
4. **Retry Mechanism**: Allow users to rephrase requests

---

## 8. IMPLEMENTATION GUIDE

### 8.1 File Locations
- **Main Agent**: `backend/agent/graph.py`
- **Agent Nodes**: `backend/agent/nodes.py`
- **Agent State**: `backend/agent/state.py`
- **NLU System**: `backend/nlu/agent.py`
- **WhatsApp Handler**: `backend/whatsapp/agent.py`

### 8.2 Key Functions

#### Intent Classification
```python
# backend/nlu/agent.py
class NLUAgent:
    def extract_intent(self, message: str, history: list, context: dict) -> dict:
        # Uses Groq API with intent classification prompt
        # Returns: {intent, confidence, reasoning, entities}
```

#### Entity Extraction
```python
# backend/nlu/agent.py
def extract_entities(self, message: str, intent: str, context: dict) -> dict:
    # Extract date, time, service, price, name
        # Returns structured entities dictionary
```

#### Response Generation
```python
# backend/agent/nodes.py
def generate_response_node(state: AgentState) -> AgentState:
        # Generate appropriate response based on intent and entities
        # Handle language matching and template selection
```

### 8.3 Testing the System

#### Local Testing
```bash
# Test conversation flow
python backend/scripts/chat_terminal.py

# Test NLU only
python backend/scripts/test_nlu.py

# Test complete workflow
python backend/scripts/test_workflow.py
```

#### Test Cases
```python
TEST_CASES = [
    {
        "message": "Aoa want to book a slot from 8-9 today",
        "expected_intent": "INQUIRY",
        "expected_entities": {"date": "today", "time": {"start": "20:00", "end": "21:00"}}
    },
    {
        "message": "kal paddle chahiye",
        "expected_intent": "INQUIRY", 
        "expected_entities": {"date": "tomorrow", "service": "padel"}
    }
]
```

### 8.4 Performance Optimization

#### Response Time Targets
- **Intent Classification**: <500ms
- **Entity Extraction**: <300ms
- **Response Generation**: <200ms
- **Total Response Time**: <2 seconds

#### Caching Strategy
- **Intent Patterns**: Cache common intent classifications
- **Entity Templates**: Pre-compile regex patterns
- **Response Templates**: Pre-generate common responses

---

## 🔑 CRITICAL SUCCESS METRICS

### Accuracy Targets
- **Intent Classification**: >90% accuracy
- **Entity Extraction**: >85% accuracy
- **Language Detection**: >95% accuracy
- **Response Appropriateness**: >90% user satisfaction

### Business Metrics
- **Booking Completion Rate**: >80% from initial inquiry
- **Conversation Efficiency**: <5 messages per booking
- **User Satisfaction**: >4.5/5 rating
- **Error Recovery**: <5% require human intervention

---

**This document consolidates all conversation system knowledge from previously scattered files into a single comprehensive reference.**

*Last Updated: February 20, 2026*  
*Next Review: March 20, 2026*
# Historical Archive Notice

This document is historical prompt/conversation planning. The current runtime
agent is in `backend/agent/` and `backend/nlu/`. The active scope is sports
court booking only: padel, futsal, cricket, pickleball.

---
