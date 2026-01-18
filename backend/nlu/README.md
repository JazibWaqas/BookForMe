# NLU Module - Natural Language Understanding

**Last Updated**: January 18, 2025  
**Status**: Functional with Groq (Qwen 3 32B) - Optimized for Bilingual Support  
**Purpose**: Intent classification and entity extraction using Groq Cloud API (Qwen 3 32B)

---

## 🎯 Core Vision

The NLU module understands user messages in **Roman Urdu and English** (mixed language). It extracts:
- **Intent**: What does the user want? (greeting, booking, pricing inquiry)
- **Entities**: What details did they provide? (date, time, service type)

**Key Challenge**: Users code-switch naturally ("Kal slot hai?" vs "I want to book tomorrow"). The NLU must handle both.

---

## 🏗️ Architecture

### NLUAgent Class (`agent.py`)

**Main Methods**:
- `extract_intent(message, conversation_history)` - Classifies intent and extracts entities
- `generate_response(intent, entities, context)` - Generates AI response (not used by LangGraph)

**Flow**:
```
User Message → Groq API (Qwen 3 32B) → Intent + Entities → Return to Agent
```

**Migration Note**: Migrated from Google Gemini to Groq (Qwen 3 32B) on January 18, 2025 for enhanced bilingual capabilities and lower latency.

### Prompt Engineering

**Intent Classification Prompt** (`_create_intent_prompt()` - lines 148-233):
- Defines possible intents (greeting, booking_request, availability_inquiry, etc.)
- Provides examples in Roman Urdu and English
- Instructs Groq (Qwen 3 32B) to return JSON with intent and entities

**Entity Extraction** (same prompt):
- Extracts: `date`, `time`, `service_type`, `duration`, `area`
- Handles relative dates ("tomorrow", "kal", "Friday")
- Normalizes time formats

---

## 📁 Key Files

### `agent.py` - NLU Agent Implementation ⭐
**Class**: `NLUAgent`

**Key Methods**:
- `extract_intent()` - Main method called by LangGraph agent
- `_call_groq()` - Calls Groq API with JSON response format support
- `_create_intent_prompt()` - Builds Groq prompt for intent classification
- `_create_entity_prompt()` - Builds prompt for entity extraction (not currently used)
- `_normalize_date()` - Converts "tomorrow", "kal" to "YYYY-MM-DD"
- `_build_context()` - Builds conversation context from history

**Groq Integration** (OpenAI-compatible API):
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.GROQ_API_KEY
)

response = client.chat.completions.create(
    model=settings.GROQ_MODEL,  # "qwen/qwen3-32b"
    messages=[{"role": "user", "content": prompt}],
    response_format={"type": "json_object"},  # For intent extraction
    temperature=0.3
)
```

**Token Usage Tracking**:
- Automatic tracking via `nlu/usage_tracker.py`
- Records all API calls with token consumption
- Daily usage statistics available via `scripts/check_groq_usage.py`

### `state_manager.py` - Conversation State
**Purpose**: Manages conversation state in Firestore (optional)

**Note**: Currently not heavily used - LangGraph manages state in memory.

---

## ✅ Current Implementation Status

### Working ✅
- Groq API integration functional (Qwen 3 32B)
- Intent classification working (bilingual: Roman Urdu + English)
- Entity extraction working
- Date normalization ("tomorrow" → "2025-01-16")
- Conversation history context building
- Token usage tracking and monitoring
- JSON response format for structured intent extraction

### Optimizations ✅
1. **Bilingual Support**: Qwen 3 32B provides superior Roman Urdu/English handling
2. **Lower Latency**: Average response time 1-2 seconds (vs 3-5s with Gemini)
3. **Cost Efficiency**: Optimized token usage with JSON response format
4. **Usage Monitoring**: Built-in tracking for API calls and token consumption

### Needs Improvement ⚠️
1. **Response Format**: Currently uses regex parsing; Pydantic validation planned
2. **Slot Validation**: 120-minute consecutive slot check TODO

---

## 🔑 Key Implementation Details

### Intent Classification

**Possible Intents** (defined in prompt):
- `greeting` - "Aoa", "Hello", "Hi"
- `availability_inquiry` - "Kal slot hai?", "Available tomorrow?"
- `booking_request` - "Book karna hai", "I want to book"
- `price_inquiry` - "Kitna hai?", "What's the price?"
- `confirmation` - "Han", "Yes", "Confirm"
- `cancellation` - "Cancel", "Cancel karna hai"

**Prompt Structure**:
```python
prompt = f"""
You are a booking assistant for sports facilities in Karachi.

Classify the intent and extract entities from this message: "{message}"

Possible Intents:
1. greeting - ...
2. availability_inquiry - ...
...

Extract entities:
- date: tomorrow, kal, Friday, 2025-01-15
- time: 6 PM, shaam, evening
- service_type: padel, futsal, cricket

Return JSON: {{"intent": "...", "entities": {{...}}}}
"""
```

### Entity Extraction

**Supported Entities**:
- `date`: "tomorrow", "kal", "Friday", "2025-01-15"
- `time`: "6 PM", "evening", "shaam", "18:00"
- `service_type`: "padel", "futsal", "cricket", "pickleball"
- `duration`: "1 hour", "2 hours"
- `area`: "DHA", "Clifton"

**Date Normalization**:
```python
# Handles:
"tomorrow" → "2025-01-16"
"kal" → "2025-01-16" (Roman Urdu)
"Friday" → Next Friday's date
"2025-01-15" → "2025-01-15" (already formatted)
```

### Conversation Context

**Context Building** (`_build_context()`):
- Takes last 5 messages from history
- Formats as: "User: ...\nAgent: ..."
- Includes in prompt for better understanding

**Why**: Multi-turn conversations need context:
- User: "Kal slot hai?"
- Agent: "Han g! Available: 6 PM, 7 PM..."
- User: "7 baje ka" ← Needs context to know this refers to previous message

---

## 🚧 What Needs to Be Done

### High Priority
1. **Improve Roman Urdu Prompts** (Target: January 20, 2025)
   - Add more Roman Urdu examples to prompt
   - Test with real conversations
   - Refine entity extraction for Urdu dates/times

2. **Code-Switching Enhancement** (Target: January 22, 2025)
   - Better handling of mixed language
   - Examples: "Kal evening slot chahiye" (Urdu + English)

### Medium Priority
1. **Entity Validation**: Verify extracted entities make sense
2. **Error Handling**: Better handling of unclear messages
3. **Confidence Scores**: Return confidence for intent/entities

---

## 🐛 Common Issues

### Intent Misclassification
**Symptom**: "Kal slot hai?" classified as greeting instead of availability_inquiry
**Cause**: Prompt needs more examples
**Fix**: Add more Roman Urdu examples to intent prompt

### Entity Extraction Missing
**Symptom**: Date not extracted from "Kal shaam ka slot"
**Cause**: Prompt doesn't recognize "shaam" as time indicator
**Fix**: Add time patterns to entity extraction prompt

### Date Normalization Fails
**Symptom**: "Friday" not converted to actual date
**Cause**: `_normalize_date()` doesn't handle day names
**Fix**: Add day name handling to normalization function

---

## 📚 Related Documentation

- **Prompt Templates**: `backend/conversations/prompts/` - Prompt examples
- **Conversation Analysis**: `backend/conversations/analysis/` - Pattern guides
- **Agent Integration**: `backend/agent/README.md` - How NLU is used

---

## 🧪 Testing

### Test NLU Locally
```bash
# Test Groq migration and intent extraction
python backend/scripts/test_groq_migration.py

# Test intent extraction
python backend/scripts/test_nlu.py

# Test single message
python backend/scripts/test_nlu_single.py

# Interactive terminal chat (simulates WhatsApp)
python backend/scripts/chat_terminal.py
```

### Test Bilingual Support
```bash
# Try Roman Urdu messages via migration test
python backend/scripts/test_groq_migration.py
# Tests: "Kal slot hai?", "Salam, mujhe salon book karna hai", etc.
# Expected: Correct intent classification for mixed language
```

### Check Token Usage
```bash
# View daily usage statistics
python backend/scripts/check_groq_usage.py

# Get optimization suggestions
python backend/scripts/optimize_groq_usage.py
```

---

## 💡 Prompt Engineering Tips

### Adding New Intent
1. Add intent definition to `_create_intent_prompt()` (line 121)
2. Add examples in both English and Roman Urdu
3. Test with real messages
4. Update `backend/agent/nodes.py` to handle new intent

### Improving Entity Extraction
1. Add entity patterns to prompt (line 173)
2. Include examples: "kal" = date, "shaam" = time
3. Test extraction accuracy
4. Update normalization functions if needed

### Better Bilingual Support
1. Add more Roman Urdu examples to prompts
2. Include code-switching examples
3. Test with real WhatsApp conversations
4. Iterate based on results

---

## 🔄 Migration History

**January 18, 2025 - Migrated to Groq (Qwen 3 32B)**
- Replaced Google Gemini API with Groq Cloud API
- Reason: Enhanced bilingual capabilities (Roman Urdu/English) and lower latency
- Model: `qwen/qwen3-32b`
- Library: `openai` (OpenAI-compatible client)
- Configuration: `GROQ_API_KEY` and `GROQ_MODEL` in `.env`
- Token tracking: Automatic usage monitoring via `usage_tracker.py`

**Changes Made**:
- Updated `agent.py`: Replaced `google.generativeai` with `openai` client
- Added `_call_groq()` method with JSON response format support
- Created `usage_tracker.py` for API call and token consumption tracking
- Updated `config.py`: Added `GROQ_API_KEY` and `GROQ_MODEL` settings
- Legacy Gemini support maintained (optional, deprecated)

---

**Last Updated**: January 18, 2025  
**Maintained By**: NLU Team  
**Key Files**: `agent.py` (main implementation), `usage_tracker.py` (monitoring)

