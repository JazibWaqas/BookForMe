# AI Agent Architecture - Location Guide

This document identifies where the AI agent logic, system prompts, and conversation handling are located in the backend.

## 🎯 Main AI Agent Logic

### 1. **Core Agent Graph** (`backend/agent/graph.py`)
- **Location**: `backend/agent/graph.py`
- **Purpose**: Main LangGraph workflow definition
- **Key Class**: `BookingAgent`
- **Flow**: 
  - START → `classify_intent` → `query` → `generate_response` → END
- **Entry Point**: `BookingAgent.process(user_phone, message, conversation_history)`

### 2. **Agent Nodes** (`backend/agent/nodes.py`)
- **Location**: `backend/agent/nodes.py`
- **Purpose**: Individual node functions that execute in the graph
- **Key Functions**:
  - `classify_intent_node(state)` - Classifies user intent using NLU
  - `query_node(state)` - Executes queries based on intent (availability, pricing, etc.)
  - `generate_response_node(state)` - Generates natural language responses
- **Note**: Response generation is **hardcoded** in this file (lines 272-480), not using LLM prompts

### 3. **Agent State** (`backend/agent/state.py`)
- **Location**: `backend/agent/state.py`
- **Purpose**: Defines the state structure passed between nodes
- **Key Class**: `AgentState` (TypedDict)
- **Contains**: messages, user_phone, current_intent, entities, booking context, etc.

### 4. **Agent Tools** (`backend/agent/tools.py`)
- **Location**: `backend/agent/tools.py`
- **Purpose**: Functions that query data (availability, pricing, vendor info)
- **Key Functions**:
  - `check_availability(date, time_range, duration_hours)`
  - `get_pricing()`
  - `get_vendor_info()`
  - `suggest_alternatives(date, requested_time)`

---

## 🤖 System Prompts & NLU Logic

### 1. **NLU Agent** (`backend/nlu/agent.py`)
- **Location**: `backend/nlu/agent.py`
- **Purpose**: Natural Language Understanding using Gemini API
- **Key Class**: `NLUAgent`
- **System Prompts**:

#### **Intent Classification Prompt** (Lines 109-191)
- **Method**: `_create_intent_prompt(message, context)`
- **Location**: `backend/nlu/agent.py:109-191`
- **Purpose**: Classifies user intent (greeting, booking_request, availability_inquiry, etc.)
- **Key Features**:
  - Handles Roman Urdu + English mixed language
  - Detects incomplete queries (80% of initial messages)
  - Extracts entities (service_type, date, time, customer_name)
  - Returns JSON with intent, confidence, reasoning, entities

#### **Entity Extraction Prompt** (Lines 193-215)
- **Method**: `_create_entity_prompt(message, intent)`
- **Location**: `backend/nlu/agent.py:193-215`
- **Purpose**: Extracts specific entities from messages

#### **Response Generation Prompt** (Lines 304-323)
- **Method**: `_create_response_prompt(intent, entities, context)`
- **Location**: `backend/nlu/agent.py:304-323`
- **Purpose**: Generates responses (currently not used - responses are hardcoded in nodes.py)

### 2. **Prompt Documentation** (`backend/conversations/prompts/`)
- **Location**: `backend/conversations/prompts/`
- **Files**:
  - `intent_classification.md` - Detailed intent classification prompts
  - `response_generation.md` - Response generation templates and guidelines
  - `entity_extraction.md` - Entity extraction patterns
  - `IMPLEMENTATION_GUIDE.md` - Implementation guide based on real conversations

---

## 💬 Conversation Logic

### 1. **WhatsApp Agent** (`backend/whatsapp/agent.py`)
- **Location**: `backend/whatsapp/agent.py`
- **Purpose**: Wrapper around BookingAgent for WhatsApp integration
- **Key Class**: `WhatsAppAgent`
- **Method**: `process_message(phone_number, message)` - Entry point for WhatsApp messages

### 2. **WhatsApp Webhook** (`backend/whatsapp/webhook.py`)
- **Location**: `backend/whatsapp/webhook.py`
- **Purpose**: Handles incoming WhatsApp webhook requests
- **Key Class**: `WhatsAppWebhookHandler`
- **Method**: `handle_webhook(request)` - Processes Meta WhatsApp webhook

### 3. **Conversation Optimizer** (`backend/ai_logic/conversation_optimizer.py`)
- **Location**: `backend/ai_logic/conversation_optimizer.py`
- **Purpose**: Optimizes conversation flow and user experience
- **Key Class**: `ConversationOptimizer`
- **Features**:
  - Detects missing information
  - Detects user confusion
  - Detects repetition
  - Generates suggestions

### 4. **Conversation Examples** (`backend/conversations/examples/`)
- **Location**: `backend/conversations/examples/`
- **Purpose**: Real conversation examples for reference
- **Files**:
  - `conversation_1_simple_booking.txt`
  - `conversation_2_multi_turn.txt`
  - `conversation_3_pricing_inquiry.txt`
  - `conversation_4_payment_flow.txt`
  - `conversation_5_slot_unavailable.txt`
  - `conversation_6_complex_pricing.txt`
  - `conversation_7_incomplete_queries.txt`

### 5. **Conversation Patterns** (`backend/conversations/analysis/` & `backend/conversations/patterns/`)
- **Location**: `backend/conversations/analysis/` and `backend/conversations/patterns/`
- **Purpose**: Analysis of conversation patterns and flows
- **Files**:
  - `conversation_patterns.md`
  - `entity_extraction_guide.md`
  - `language_patterns.md`
  - `booking_flow.md`
  - `initial_messages.md`
  - `use_cases.md`

---

## 🔄 Message Flow

```
1. WhatsApp Webhook (webhook/whatsapp.py)
   ↓
2. WhatsAppAgent.process_message() (whatsapp/agent.py)
   ↓
3. BookingAgent.process() (agent/graph.py)
   ↓
4. LangGraph Workflow:
   a. classify_intent_node() → Uses NLUAgent.extract_intent() (nlu/agent.py)
      - System Prompt: _create_intent_prompt() (nlu/agent.py:109-191)
   b. query_node() → Calls tools (agent/tools.py)
   c. generate_response_node() → Hardcoded responses (agent/nodes.py:272-480)
   ↓
5. Response sent back via WhatsAppService
```

---

## 📍 Key Locations Summary

| Component | File Path | Key Function/Class |
|-----------|-----------|-------------------|
| **Main Agent** | `backend/agent/graph.py` | `BookingAgent.process()` |
| **Agent Nodes** | `backend/agent/nodes.py` | `classify_intent_node()`, `query_node()`, `generate_response_node()` |
| **Agent State** | `backend/agent/state.py` | `AgentState` (TypedDict) |
| **Agent Tools** | `backend/agent/tools.py` | `check_availability()`, `get_pricing()`, etc. |
| **NLU System Prompt** | `backend/nlu/agent.py:109-191` | `_create_intent_prompt()` |
| **Entity Extraction** | `backend/nlu/agent.py:193-215` | `_create_entity_prompt()` |
| **Response Generation** | `backend/agent/nodes.py:272-480` | `generate_response_node()` (hardcoded) |
| **WhatsApp Handler** | `backend/whatsapp/webhook.py` | `WhatsAppWebhookHandler.handle_webhook()` |
| **WhatsApp Agent** | `backend/whatsapp/agent.py` | `WhatsAppAgent.process_message()` |
| **Conversation Optimizer** | `backend/ai_logic/conversation_optimizer.py` | `ConversationOptimizer` |
| **Prompt Docs** | `backend/conversations/prompts/` | Intent, response, entity extraction guides |

---

## ⚠️ Important Notes

1. **Response Generation**: Currently **hardcoded** in `agent/nodes.py:272-480`. The NLU agent has a response generation method (`_create_response_prompt()`), but it's not being used in the main flow.

2. **System Prompts**: The main system prompt for intent classification is in `backend/nlu/agent.py:109-191` in the `_create_intent_prompt()` method.

3. **Language Support**: The system is designed to handle Roman Urdu + English mixed language, with prompts specifically tuned for Pakistani customers.

4. **Incomplete Queries**: The system is specifically designed to handle incomplete queries (80% of initial messages), as documented in the prompts.

5. **Conversation History**: Managed by `nlu/state_manager.py` (referenced in `whatsapp/agent.py:12`), which stores conversation history in Firestore.

---

## 🔍 To Modify System Behavior

- **Change Intent Classification**: Edit `backend/nlu/agent.py:_create_intent_prompt()` (lines 109-191)
- **Change Response Generation**: Edit `backend/agent/nodes.py:generate_response_node()` (lines 272-480)
- **Add New Tools**: Add functions to `backend/agent/tools.py`
- **Modify Agent Flow**: Edit `backend/agent/graph.py` to add/remove nodes or edges
- **Update Conversation Logic**: Edit `backend/ai_logic/conversation_optimizer.py`

