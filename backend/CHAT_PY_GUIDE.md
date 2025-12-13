# Chat.py Component Guide - AI-Powered Responses

## 🎯 What `chat.py` Uses

`chat.py` is **simpler** than `chat_terminal.py` - it only uses the NLU Agent with **AI-generated responses**:

```
chat.py
  └─> NLUAgent (nlu/agent.py)
      ├─> extract_intent() → Uses Gemini AI for intent classification
      └─> generate_response() → Uses Gemini AI for response generation
```

**Key Difference**: 
- `chat_terminal.py` → Uses **hardcoded responses** in `agent/nodes.py`
- `chat.py` → Uses **AI-generated responses** via Gemini in `nlu/agent.py`

## 📍 Components to Edit

### 1. **Intent Classification Prompt** (Understanding)
**File**: `backend/nlu/agent.py`  
**Method**: `_create_intent_prompt()` (lines 109-191)

**What it does**: Tells Gemini how to understand user messages  
**When to adjust**: 
- User messages are misunderstood
- Wrong intent classification
- Missing entity extraction

### 2. **Response Generation Prompt** (What Agent Says) ⭐
**File**: `backend/nlu/agent.py`  
**Method**: `_create_response_prompt()` (lines 304-323)

**What it does**: Tells Gemini how to generate responses  
**When to adjust**: 
- Want different response style/tone
- Want different response format
- Want to add/remove information

## 🚀 Quick Iteration Workflow

### Step 1: Test Current Behavior
```bash
cd backend
python scripts/chat.py
```

### Step 2: Adjust Response Generation (Most Common)

**Edit**: `backend/nlu/agent.py` → `_create_response_prompt()` (line 304)

**Current Prompt** (lines 306-323):
```python
def _create_response_prompt(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> str:
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
```

### Step 3: Test Changes
```bash
# Restart chat.py
python scripts/chat.py
```

## 🎨 Response Prompt Customization Examples

### Example 1: More Detailed Response Prompt
```python
def _create_response_prompt(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> str:
    return f"""
You are a friendly booking assistant for Ace Padel Club in Karachi, Pakistan.

Intent: {intent}
Entities: {entities}
Context: {context}

Generate a helpful, friendly response that:
1. Matches the user's language style (Roman Urdu or English)
2. Addresses the specific intent
3. Uses the extracted entities naturally
4. Guides the user through the booking process

Language Guidelines:
- If user uses "Aoa" or "Salam", respond with "AoA" or "Salam"
- If user uses Roman Urdu words like "kal", "shaam", "kitna", match that style
- If user uses English, respond in English
- You can code-switch naturally (mix Roman Urdu and English)

Response Style:
- Be concise but helpful
- Ask one question at a time
- Use emojis sparingly (✅, 📅, ⏰, 💰)
- Be professional but warm

For greeting: Welcome them and ask what they need.
For availability: Show available slots clearly with times and prices.
For pricing: Explain pricing structure clearly.
For booking: Confirm details and ask for confirmation.

Generate the response now:
"""
```

### Example 2: Add Specific Instructions for Each Intent
```python
def _create_response_prompt(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> str:
    # Intent-specific instructions
    intent_instructions = {
        "greeting": "Welcome the user warmly. Introduce Ace Padel Club. Ask what service they need.",
        "availability_inquiry": "Check if date/time are provided. If missing, ask for them. If provided, show available slots with times and prices.",
        "price_inquiry": "Explain pricing: base price, discount, final price. Ask about duration.",
        "booking_request": "Acknowledge the request. Confirm date, time, and duration. Show total price.",
        "confirmation": "Thank them. Summarize booking details. Ask for name and payment.",
    }
    
    instruction = intent_instructions.get(intent, "Respond helpfully based on the intent.")
    
    return f"""
You are a booking assistant for Ace Padel Club in Karachi.

Intent: {intent}
Entities: {entities}
Context: {context}

{instruction}

Match the user's language style (Roman Urdu or English).
Be friendly, concise, and helpful.

Response:
"""
```

### Example 3: Add Structured Response Format
```python
def _create_response_prompt(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> str:
    return f"""
You are a booking assistant for Ace Padel Club.

Intent: {intent}
Entities: {entities}
Context: {context}

Generate a response following this format:

1. **Greeting** (if first message): "AoA! Welcome to Ace Padel Club."
2. **Main Message**: Address the intent clearly
3. **Details**: Include relevant information from entities
4. **Next Step**: Guide user on what to do next

Language: Match user's style (Roman Urdu/English)
Tone: Friendly, professional, helpful
Length: Keep it concise (2-4 sentences)

Generate response:
"""
```

## 📝 Intent Classification Prompt (If Needed)

**File**: `backend/nlu/agent.py` → `_create_intent_prompt()` (line 109)

**When to edit**: If messages are misunderstood

**Example Addition**:
```python
# Add new intent type (line 138)
14. **your_new_intent** - Description of when this intent occurs

# Add new entity (line 177)
- your_new_entity: Description of what to extract
```

## 🔄 Complete Workflow

```
User Message
    ↓
[Intent Classification] ← nlu/agent.py → _create_intent_prompt() (Gemini)
    ↓
Intent + Entities
    ↓
[Response Generation] ← nlu/agent.py → _create_response_prompt() (Gemini) ⭐
    ↓
AI-Generated Response
```

## ⚡ Quick Reference

| What to Change | File | Method | Line |
|---------------|------|--------|------|
| **Response style/tone** | `nlu/agent.py` | `_create_response_prompt()` | 304 |
| **Response examples** | `nlu/agent.py` | `_create_response_prompt()` | 316-320 |
| **Intent understanding** | `nlu/agent.py` | `_create_intent_prompt()` | 109 |
| **Entity extraction** | `nlu/agent.py` | `_create_intent_prompt()` | 173-177 |

## 🎯 Key Differences: chat.py vs chat_terminal.py

| Feature | chat.py | chat_terminal.py |
|---------|---------|------------------|
| **Response Generation** | AI (Gemini) | Hardcoded templates |
| **Files to Edit** | `nlu/agent.py` | `agent/nodes.py` |
| **Response Control** | Prompt-based | Direct string editing |
| **Flexibility** | High (AI adapts) | Low (fixed templates) |
| **Consistency** | Variable (AI) | Fixed (templates) |
| **Full Workflow** | No (NLU only) | Yes (full LangGraph) |

## 🚨 Important Notes

1. **AI-Generated Responses**: `chat.py` uses Gemini to generate responses
   - You control responses via **prompts**, not direct text
   - Responses may vary slightly each time
   - More flexible but less predictable

2. **Prompt Engineering**: Adjust the prompt to get desired responses
   - Be specific about format, tone, style
   - Provide examples in the prompt
   - Test and iterate

3. **No Hardcoded Responses**: Unlike `chat_terminal.py`, everything is AI-generated
   - Easier to change overall style
   - Harder to control exact wording

4. **Intent Classification**: Also uses Gemini
   - Adjust `_create_intent_prompt()` if understanding is wrong

## 💡 Pro Tips

1. **Test with Examples**: Add specific examples in the prompt
2. **Be Explicit**: Tell Gemini exactly what format you want
3. **Iterate Quickly**: Change prompt → test → adjust
4. **Use Context**: The prompt receives intent, entities, and context - use them!
5. **Language Matching**: Emphasize matching user's language style

## 🎨 Example: Complete Custom Response Prompt

```python
def _create_response_prompt(self, intent: str, entities: Dict[str, Any], context: Dict[str, Any]) -> str:
    return f"""
You are a professional booking assistant for Ace Padel Club in Karachi, Pakistan.

CURRENT SITUATION:
- User Intent: {intent}
- Extracted Info: {entities}
- Conversation Context: {context}

YOUR TASK:
Generate a helpful response that:
1. Matches the user's language (Roman Urdu if they use "Aoa", "kal", "shaam" / English otherwise)
2. Addresses the {intent} intent directly
3. Uses the extracted entities naturally: {entities}
4. Guides the user to the next step in booking

RESPONSE GUIDELINES:
- Tone: Friendly, professional, helpful
- Length: 2-4 sentences (be concise)
- Format: Use emojis sparingly (✅ 📅 ⏰ 💰)
- Language: Match user's style exactly

SPECIFIC INSTRUCTIONS:
{self._get_intent_specific_instructions(intent)}

Generate the response now:
"""

def _get_intent_specific_instructions(self, intent: str) -> str:
    instructions = {
        "greeting": "Welcome warmly. Introduce Ace Padel Club. Ask what they need.",
        "availability_inquiry": "If date/time missing, ask for them. If provided, show available slots with times.",
        "price_inquiry": "Explain: base price, 20% discount, final price per hour. Ask about duration.",
        "booking_request": "Acknowledge. Confirm date, time, duration. Show total price. Ask for confirmation.",
    }
    return instructions.get(intent, "Respond helpfully based on the intent.")
```

Happy prompt engineering! 🎉

