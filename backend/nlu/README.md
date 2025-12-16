# NLU Module - Natural Language Understanding

**Last Updated**: January 15, 2025  
**Status**: Functional, Needs Bilingual Enhancement  
**Purpose**: Intent classification and entity extraction using Gemini API

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
User Message → Gemini API → Intent + Entities → Return to Agent
```

### Prompt Engineering

**Intent Classification Prompt** (`_create_intent_prompt()` - lines 109-191):
- Defines possible intents (greeting, booking_request, availability_inquiry, etc.)
- Provides examples in Roman Urdu and English
- Instructs Gemini to return JSON with intent and entities

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
- `_create_intent_prompt()` - Builds Gemini prompt for intent classification
- `_create_entity_prompt()` - Builds prompt for entity extraction (not currently used)
- `_normalize_date()` - Converts "tomorrow", "kal" to "YYYY-MM-DD"
- `_build_context()` - Builds conversation context from history

**Gemini Integration**:
```python
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel(settings.GEMINI_MODEL)
response = await model.generate_content_async(prompt)
```

### `state_manager.py` - Conversation State
**Purpose**: Manages conversation state in Firestore (optional)

**Note**: Currently not heavily used - LangGraph manages state in memory.

---

## ✅ Current Implementation Status

### Working ✅
- Gemini API integration functional
- Intent classification working
- Entity extraction working
- Date normalization ("tomorrow" → "2025-01-16")
- Conversation history context building

### Needs Improvement ⚠️
1. **Bilingual Support**: Roman Urdu handling could be better
2. **Code-Switching**: Mixed language messages sometimes misunderstood
3. **Entity Extraction**: Date/time extraction from Roman Urdu needs refinement

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
# Test intent extraction
python backend/scripts/test_nlu.py

# Test single message
python backend/scripts/test_nlu_single.py

# Test with real conversations
python backend/scripts/chat.py
```

### Test Bilingual Support
```bash
# Try Roman Urdu messages
python backend/scripts/test_nlu.py
# Input: "Kal slot hai?"
# Expected: intent=availability_inquiry, entities={date: "tomorrow"}
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

**Last Updated**: January 15, 2025  
**Maintained By**: NLU Team  
**Key Files**: `agent.py` (main implementation)

