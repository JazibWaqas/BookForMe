# LangGraph Agent - Booking Conversation Workflow

**Last Updated**: January 15, 2025  
**Status**: Implemented and Functional  
**Purpose**: Stateful AI agent for handling WhatsApp booking conversations

---

## 🎯 Core Vision

The LangGraph agent orchestrates the entire booking conversation flow. It processes user messages through a state machine that:
1. **Understands** what the user wants (intent classification)
2. **Queries** the database for availability/pricing
3. **Generates** context-aware responses

**Key Principle**: The agent maintains conversation state across multiple turns, allowing natural multi-turn booking flows like:
- User: "Kal slot hai?"
- Agent: "Han g! Available slots: 6 PM, 7 PM..."
- User: "7 baje ka book karna hai"
- Agent: "Perfect! Booking confirmed..."

---

## 🏗️ Architecture

### Workflow Graph (`graph.py`)

```
START → classify_intent → query → generate_response → END
```

**Flow**:
1. **classify_intent_node**: Uses Gemini NLU to extract intent and entities
2. **query_node**: Calls tools based on intent (check availability, get pricing)
3. **generate_response_node**: Generates natural language response

**Entry Point**: `BookingAgent.process(user_phone, message, conversation_history)`

### State Structure (`state.py`)

The `AgentState` TypedDict maintains conversation context:

```python
{
    "messages": List[Dict],           # Full conversation history
    "user_phone": str,                # User identifier
    "current_intent": str,            # Classified intent
    "entities": Dict[str, Any],      # Extracted entities (date, time, service)
    "selected_slot": Optional[Dict],  # Currently selected slot
    "selected_duration": Optional[float],
    "selected_date": Optional[str],
    "booking_in_progress": bool,
    "vendor_id": str,                 # Currently "ace_padel_club" (hardcoded)
    "vendor_data": Optional[Dict],
    "query_result": Optional[Dict],   # Results from tools
    "response": str                   # Final response text
}
```

**Critical**: State persists across messages, enabling multi-turn conversations.

---

## 📁 Key Files

### `graph.py` - Main Workflow
- **Class**: `BookingAgent`
- **Method**: `process()` - Entry point for processing messages
- **Workflow**: Builds LangGraph StateGraph with 3 nodes

### `nodes.py` - Node Functions
- **classify_intent_node**: Calls NLU agent, extracts intent/entities
- **query_node**: Executes tools based on intent (availability, pricing)
- **generate_response_node**: Generates hardcoded responses (not LLM)

**Important**: Response generation is **hardcoded** in `generate_response_node()` (lines 272-480). To change responses, edit the string templates directly.

### `state.py` - State Definition
- **AgentState**: TypedDict defining state structure
- Used by all nodes to read/write conversation context

### `tools.py` - Database Query Tools
- **check_availability()**: Queries Firestore for available slots
- **get_pricing()**: Gets vendor pricing information
- **get_vendor_info()**: Gets vendor details
- **suggest_alternatives()**: Finds alternative slots if requested time unavailable

**Note**: Tools are called by `query_node` based on intent.

---

## ✅ Current Implementation Status

### Working ✅
- LangGraph workflow compiled and functional
- Intent classification via Gemini NLU
- Entity extraction (date, time, service_type)
- Tool calling for availability checks
- Multi-turn conversation state persistence
- Hardcoded response generation

### Known Issues ⚠️
1. **Hardcoded Vendor ID**: `vendor_id` always set to `"ace_padel_club"` (line 204 in nodes.py)
   - **Impact**: Only works for one vendor
   - **Fix Needed**: Dynamic vendor lookup based on service_type

2. **Hardcoded Responses**: Response generation uses string templates, not LLM
   - **Impact**: Responses are fixed, not adaptive
   - **Location**: `nodes.py:272-480`

3. **No Slot Locking**: Agent doesn't lock slots during conversation
   - **Impact**: User might lose slot while chatting
   - **Fix Needed**: Add slot locking to booking flow

---

## 🔑 Critical Implementation Details

### Intent Classification Flow

```python
# In classify_intent_node (nodes.py:161)
1. Check if message is greeting (fallback check)
2. Call NLUAgent.extract_intent(message, history)
3. Extract intent and entities from NLU result
4. Normalize date entities (handle "tomorrow", "kal", etc.)
5. Set vendor_id (currently hardcoded)
6. Update state with intent and entities
```

**NLU Integration**: Uses `backend/nlu/agent.py` - Gemini API calls for intent/entity extraction.

### Query Execution Flow

```python
# In query_node (nodes.py:400)
1. Check current_intent
2. If availability_inquiry → call check_availability tool
3. If price_inquiry → call get_pricing tool
4. Store results in state["query_result"]
```

**Tool Location**: `tools.py` - All tools query Firestore via `firestore_v2.py`.

### Response Generation Flow

```python
# In generate_response_node (nodes.py:272)
1. Check current_intent
2. Check if Roman Urdu (detect "Aoa", "kal", etc.)
3. Select response template based on intent
4. Fill template with entities and query results
5. Set state["response"]
```

**Response Templates**: Hardcoded strings in `nodes.py`. To change responses, edit these strings directly.

---

## 🚧 What Needs to Be Done

### High Priority
1. **Dynamic Vendor Lookup** (Target: January 20, 2025)
   - Remove hardcoded `"ace_padel_club"`
   - Query vendors by service_type from entities
   - Set vendor_id dynamically

2. **Slot Locking Integration** (Target: January 22, 2025)
   - When user confirms booking, lock slot via `slot_service.lock_slot()`
   - Handle lock expiry (10 minutes)
   - Release lock if user doesn't complete booking

3. **Payment Flow Integration** (Target: January 25, 2025)
   - Handle payment screenshot uploads
   - Call OCR verification
   - Update slot status to pending

### Medium Priority
1. **LLM Response Generation**: Replace hardcoded templates with Gemini-generated responses
2. **Error Handling**: Better handling of unclear messages
3. **Bilingual Enhancement**: Improve Roman Urdu/English code-switching

---

## 🐛 Common Gotchas

1. **State Mutation**: LangGraph nodes should return new state dict, not mutate existing
   ```python
   # ✅ Correct
   return {**state, "current_intent": intent}
   
   # ❌ Wrong
   state["current_intent"] = intent
   return state
   ```

2. **Async Nodes**: All nodes are async - use `await` for NLU calls and tools
   ```python
   nlu_result = await nlu_agent.extract_intent(message, history)
   ```

3. **Entity Normalization**: NLU returns various date formats - normalize to "YYYY-MM-DD"
   ```python
   # Handle "tomorrow", "kal", "Friday", etc.
   normalized_date = normalize_date(entities.get("date"))
   ```

4. **Vendor ID**: Currently hardcoded - needs dynamic lookup
   ```python
   # Current (wrong)
   state["vendor_id"] = "ace_padel_club"
   
   # Should be
   vendor = await get_vendor_by_service(entities.get("service_type"))
   state["vendor_id"] = vendor["id"]
   ```

---

## 📚 Related Documentation

- **NLU Module**: `backend/nlu/README.md` - Intent classification details
- **Database Tools**: `backend/database/README.md` - Query operations
- **State Management**: See `state.py` for complete state structure

---

## 🧪 Testing

### Test Locally
```bash
# Test full agent workflow
python backend/scripts/chat_terminal.py

# Test specific node
python backend/scripts/test_langgraph_agent.py
```

### Debug Logging
Agent logs extensively:
- Intent classification results
- Entity extraction
- Tool execution
- Response generation

Check logs for: `[extract_intent]`, `[query_node]`, `[generate_response]`

---

**Last Updated**: January 15, 2025  
**Maintained By**: AI Agent Team  
**Key Files**: `graph.py`, `nodes.py`, `state.py`, `tools.py`

