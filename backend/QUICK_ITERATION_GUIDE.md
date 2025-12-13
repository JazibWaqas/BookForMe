# Quick Iteration Guide - Adjusting AI Agent Responses

## 🎯 Components Used by `chat_terminal.py`

The `chat_terminal.py` script uses the **exact same components** as production:

```
chat_terminal.py
  └─> WhatsAppAgent (whatsapp/agent.py)
      └─> BookingAgent (agent/graph.py)
          └─> LangGraph Workflow:
              1. classify_intent_node (agent/nodes.py)
                 └─> NLUAgent (nlu/agent.py) ← Uses Gemini AI
              2. query_node (agent/nodes.py)
                 └─> Tools (agent/tools.py)
              3. generate_response_node (agent/nodes.py) ← HARDCODED responses
      └─> StateManager (nlu/state_manager.py) ← Optional (Firestore)
```

## 📍 Where to Adjust Model Responses

### 1. **Intent Classification (Understanding)** - Uses Gemini AI
**File**: `backend/nlu/agent.py`  
**Method**: `_create_intent_prompt()` (lines 109-191)

**What it does**: Tells Gemini how to understand user messages  
**When to adjust**: 
- User messages are misunderstood
- Intent classification is wrong
- Entity extraction is missing information

**Quick Edit**:
```python
# backend/nlu/agent.py, line 109
def _create_intent_prompt(self, message: str, context: str) -> str:
    return f"""
You are a booking assistant for sports facilities...
# ← Edit the prompt here to change how Gemini understands messages
```

### 2. **Response Generation (What Agent Says)** - HARDCODED
**File**: `backend/agent/nodes.py`  
**Method**: `generate_response_node()` (lines 272-480)

**What it does**: Generates the actual text responses users see  
**When to adjust**: 
- Want to change response wording
- Want different response format
- Want to add/remove information in responses

**Quick Edit**:
```python
# backend/agent/nodes.py, line 272
async def generate_response_node(state: AgentState) -> AgentState:
    # ← Edit response strings here to change what the agent says
    if intent == "greeting":
        if is_roman_urdu:
            response = """AoA! Welcome to Ace Padel Club..."""  # ← Edit this
```

## 🚀 Quick Iteration Workflow

### Step 1: Test Current Behavior
```bash
cd backend
python scripts/chat_terminal.py
```

Try messages like:
- `Hi`
- `koi slot hei?`
- `kal slot hai?`
- `kitna hai price?`

### Step 2: Adjust Responses (Most Common)

**Edit**: `backend/agent/nodes.py`

**Common Changes**:

1. **Change greeting message** (line 292-310):
```python
if intent == "greeting":
    if is_roman_urdu:
        response = """Your new greeting message here"""
```

2. **Change availability response** (line 382-435):
```python
elif intent == "availability_inquiry":
    if is_roman_urdu:
        response = "Your new availability message here"
```

3. **Change pricing response** (line 437-463):
```python
elif intent == "price_inquiry":
    if is_roman_urdu:
        response = f"""Your new pricing format here"""
```

4. **Change error/unknown response** (line 465-469):
```python
else:
    if is_roman_urdu:
        response = "Your new error message here"
```

### Step 3: Test Changes
```bash
# Restart chat_terminal.py (no need to restart server)
python scripts/chat_terminal.py
```

### Step 4: Adjust Intent Understanding (If Needed)

**Edit**: `backend/nlu/agent.py`

**Common Changes**:

1. **Add new intent types** (line 121-138):
```python
Possible Intents:
1. **greeting** - ...
2. **booking_request** - ...
3. **your_new_intent** - Add here
```

2. **Improve entity extraction** (line 173-177):
```python
Extract entities:
- service_type: padel, futsal, cricket, salon
- date: tomorrow, today, specific date, "kal", "aaj"
- your_new_entity: Add here
```

3. **Add Roman Urdu patterns** (line 146-158):
```python
Roman Urdu Patterns:
- "your_pattern" = "meaning"
```

## 📝 Component Dependencies

### Required Components (Must Work)
1. ✅ **Gemini API Key** - For intent classification
   - Set in `.env`: `GEMINI_API_KEY=your_key`
   - Used by: `nlu/agent.py`

2. ✅ **Python Dependencies** - LangGraph, Gemini, etc.
   - Install: `pip install -r requirements.txt`

### Optional Components (Nice to Have)
1. ⚠️ **Firestore** - For conversation history persistence
   - If not configured: Agent works but history isn't saved
   - Used by: `nlu/state_manager.py`

2. ⚠️ **WhatsApp Service** - Not needed for terminal testing
   - Only needed for actual WhatsApp webhook

## 🎨 Response Customization Examples

### Example 1: Change Greeting Tone
```python
# backend/agent/nodes.py, line 294
if is_roman_urdu:
    response = """AoA! Ace Padel Club mein aapka swagat hai! 🎾

Main aapki madad kar sakta hoon:
• Slot availability check karne mein
• Pricing ki jaankari dene mein  
• Booking karne mein

Kaunsa service chahiye aapko?"""
```

### Example 2: Add More Details to Availability Response
```python
# backend/agent/nodes.py, line 400
if is_roman_urdu:
    response = "Han g! Aapke liye slots available hain:\n\n"
    response += f"📅 Date: {date}\n"  # Add date info
    response += f"⏰ Time Range: {time_range}\n\n"  # Add time range
    # ... rest of response
```

### Example 3: Improve Error Handling
```python
# backend/agent/nodes.py, line 465
else:
    if is_roman_urdu:
        response = """Mujhe maaf karein, main samajh nahi paya. 

Kya aap yeh puch sakte hain:
• Slot availability check karna hai?
• Pricing jaanna hai?
• Booking karni hai?

Ya phir aap apna sawaal dobara se likh sakte hain?"""
```

## 🔄 Iteration Tips

1. **Keep chat_terminal.py running** - Just edit files and restart
2. **Use `clear` command** - In chat, type `clear` to reset conversation
3. **Test incrementally** - Change one response at a time
4. **Check logs** - Look for intent classification in console output
5. **Test both languages** - Try English and Roman Urdu messages

## 📊 Response Flow Diagram

```
User Message
    ↓
[Intent Classification] ← nlu/agent.py (Gemini AI)
    ↓
Intent + Entities
    ↓
[Query Execution] ← agent/tools.py
    ↓
Query Results
    ↓
[Response Generation] ← agent/nodes.py (HARDCODED)
    ↓
Final Response
```

## 🎯 Most Common Edits

**90% of your edits will be in**:
- `backend/agent/nodes.py` - `generate_response_node()` function
  - Lines 292-310: Greeting responses
  - Lines 382-435: Availability responses  
  - Lines 437-463: Pricing responses
  - Lines 465-469: Error/unknown responses

**10% of your edits will be in**:
- `backend/nlu/agent.py` - `_create_intent_prompt()` function
  - Lines 109-191: Intent classification prompt

## ⚡ Quick Reference

| What to Change | File | Line Range |
|---------------|------|------------|
| Greeting message | `agent/nodes.py` | 292-310 |
| Availability response | `agent/nodes.py` | 382-435 |
| Pricing response | `agent/nodes.py` | 437-463 |
| Error message | `agent/nodes.py` | 465-469 |
| Intent understanding | `nlu/agent.py` | 109-191 |
| Entity extraction | `nlu/agent.py` | 173-177 |

## 🚨 Important Notes

1. **Responses are HARDCODED** - Not using LLM for response generation
   - This means you have full control over exact wording
   - But you need to manually update each response template

2. **Intent classification uses Gemini** - This is AI-powered
   - The prompt in `nlu/agent.py` controls how Gemini understands messages
   - You can adjust the prompt to improve understanding

3. **No server restart needed** - Just restart `chat_terminal.py`
   - Changes take effect immediately when you restart the script

4. **Firestore is optional** - Agent works without it
   - Conversation history just won't persist between sessions

Happy iterating! 🎉

