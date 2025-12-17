# Conversations - Analysis & Agent Development

**Last Updated**: January 15, 2025  
**Purpose**: Real WhatsApp conversation analysis and AI agent prompt development

---

## 🎯 Overview

This folder contains:
- **Real WhatsApp conversations** - Actual user interactions for analysis
- **Conversation patterns** - Common flows and use cases
- **Prompt templates** - Gemini prompts for intent classification and entity extraction
- **Analysis guides** - How to improve NLU based on conversations

---

## 📁 Structure

```
conversations/
├── examples/              # Real conversation examples (.txt files)
├── patterns/              # Conversation flow patterns
│   ├── booking_flow.md
│   ├── initial_messages.md
│   └── use_cases.md
├── prompts/              # Gemini prompt templates
│   ├── intent_classification.md
│   ├── entity_extraction.md
│   └── response_generation.md
└── analysis/             # Analysis guides
    ├── conversation_patterns.md
    ├── entity_extraction_guide.md
    └── language_patterns.md
```

---

## 📚 Key Files

### Conversation Examples (`examples/`)
Real WhatsApp conversations showing:
- Simple booking requests
- Multi-turn conversations
- Pricing inquiries
- Payment flows
- Slot unavailability scenarios
- Complex pricing negotiations

### Patterns (`patterns/`)
Documented conversation flows:
- **booking_flow.md**: Complete booking conversation flow
- **initial_messages.md**: Common greeting patterns
- **use_cases.md**: Various use case scenarios

### Prompts (`prompts/`)
Gemini prompt templates used in `backend/nlu/agent.py`:
- **intent_classification.md**: How to classify user intent
- **entity_extraction.md**: How to extract entities (date, time, service)
- **response_generation.md**: How to generate responses

### Analysis (`analysis/`)
Guides for improving NLU:
- **conversation_patterns.md**: Common patterns in conversations
- **entity_extraction_guide.md**: How to improve entity extraction
- **language_patterns.md**: Roman Urdu/English patterns

---

## 🔧 Usage

### For NLU Development
1. Review `examples/` to understand real user behavior
2. Check `patterns/` for common flows
3. Update prompts in `backend/nlu/agent.py` based on `prompts/` templates
4. Test with `backend/scripts/chat_terminal.py`

### For Agent Improvement
1. Analyze `analysis/conversation_patterns.md` for common issues
2. Update intent classification prompts based on patterns
3. Improve entity extraction using `analysis/entity_extraction_guide.md`
4. Test bilingual support with `analysis/language_patterns.md`

---

## 📝 Notes

- **Real Conversations**: Examples are from actual WhatsApp interactions
- **Prompt Templates**: Used by `NLUAgent` in `backend/nlu/agent.py`
- **Patterns**: Help identify common user behaviors
- **Analysis**: Guides for continuous improvement

---

**Last Updated**: January 15, 2025  
**Maintained By**: AI Agent Team
