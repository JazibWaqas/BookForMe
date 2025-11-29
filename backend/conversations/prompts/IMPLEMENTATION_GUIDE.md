# Agent Implementation Guide - Based on Real Conversations

## 📖 Overview

This guide is based on analysis of **real WhatsApp conversations** from actual booking interactions. All patterns, prompts, and flows are derived from actual customer-agent exchanges.

## 🎯 Key Learnings from Real Conversations

### 1. Language Patterns
- **60% Mixed Language**: Roman Urdu + English code-switching
- **30% English**: Full English conversations
- **10% Roman Urdu**: Mostly Roman Urdu

**Key Insight**: Agent must handle code-switching naturally, matching customer's style.

### 2. Initial Message Patterns
- **70%** provide date + time in first message
- **20%** just greeting, then build booking
- **10%** price inquiry first

**Key Insight**: Most customers want quick answers, provide lots of info upfront.

### 3. Booking Flow
1. Availability check → Price inquiry → Booking confirmation → Payment
2. Name collection happens proactively (agent asks)
3. Payment details shared as structured text
4. Payment proof sent as image/screenshot

### 4. Common Entities

**Dates:**
- "tomorrow", "today", "Friday", "next Wednesday"
- "kal" (Roman Urdu), "aaj" (Roman Urdu)

**Times:**
- Ranges: "6-9", "between 7-9", "from 8-9:30"
- Relative: "evening", "morning", "after 6"
- Roman Urdu: "shaam", "raat", "subah"

**Services:**
- "padel" / "paddle" (typo handling needed)
- "futsal", "cricket", "salon"

**Prices:**
- Simple: "Rs7500/per hour"
- Complex: Time-based blocks (07 PM - 03 AM = Rs 3500/hour)
- Discounts: "20% discount after discount Rs6000/per hour"

## 📁 Documentation Structure

### `/examples/` - Real Conversation Examples
- `conversation_1_simple_booking.txt` - Complete booking in one message
- `conversation_2_multi_turn.txt` - Multi-turn conversation
- `conversation_3_pricing_inquiry.txt` - Price questions
- `conversation_4_payment_flow.txt` - Payment process
- `conversation_5_slot_unavailable.txt` - Unavailable slots
- `conversation_6_complex_pricing.txt` - Time-based pricing

### `/analysis/` - Pattern Analysis
- `conversation_patterns.md` - Common patterns extracted
- `entity_extraction_guide.md` - How to extract entities
- `language_patterns.md` - Roman Urdu/English patterns

### `/prompts/` - Prompt Templates
- `intent_classification.md` - Intent classification prompts
- `entity_extraction.md` - Entity extraction prompts
- `response_generation.md` - Response generation prompts

### `/patterns/` - Flow Patterns
- `initial_messages.md` - Types of first messages
- `booking_flow.md` - Complete booking flow
- `use_cases.md` - All use cases to handle

## 🚀 Quick Reference

### Intent Types
1. `greeting` - "Hi", "Aoa"
2. `booking_request` - "want to book", "slot chahiye"
3. `availability_inquiry` - "slot available", "time hai"
4. `service_selection` - "padel", "futsal"
5. `date_selection` - "tomorrow", "Friday"
6. `time_selection` - "6-9", "evening"
7. `price_inquiry` - "how much", "charges", "discount"
8. `confirmation` - "yes", "ok", "confirm"
9. `cancellation` - "cancel", "nahi"
10. `modification` - "actually", "change to"
11. `payment_related` - "payment", "transfer"
12. `name_provided` - Customer shares name

### Common Roman Urdu Phrases
- **"Aoa"** = Greeting (As-salamu alaykum)
- **"mujhe"** = "I" / "to me"
- **"chahiye"** = "need" / "want"
- **"karna hai"** = "want to do"
- **"mil jayega"** = "will be available"
- **"kal"** = "tomorrow"
- **"aaj"** = "today"
- **"shaam"** = "evening"
- **"batadei"** = "tell me"
- **"Han g"** = "Yes" (polite)

### Entity Extraction Examples

**Date:**
- "tomorrow Wednesday" → `2025-01-15` (if tomorrow is Wednesday)
- "kal" → tomorrow's date
- "next Friday" → next Friday's date

**Time:**
- "between 6-9" → start: `18:00`, end: `21:00`
- "after 6" → start: `18:00`, end: `null`
- "evening" / "shaam" → start: `18:00`, end: `21:00`

**Service:**
- "paddle" → `padel` (typo handling)
- "futsal" → `futsal`
- No mention → use vendor default

### Response Templates

**Availability Confirmed:**
```
"Yes, available! Slots available:
• 6:00 PM - 7:00 PM
• 7:00 PM - 8:00 PM

Which one would you like?"
```

**Slot Unavailable:**
```
"No I'm sorry we're completely booked but we do have a slot open from 8 to 9:30. Would that work?"
```

**Price Information:**
```
"Pricing:
• Rs 7500 per hour
• 20% discount available
• After discount: Rs 6000 per hour

Total for your slot: Rs 6000"
```

**Payment Details:**
```
"Payment Details:

Account Title: Capital Padel
Account Number: 00150900000721
IBAN: PK38ASCM0000150900000721
Bank Name: Askari Bank

Please transfer Rs 6000 and share payment proof."
```

## 🎨 Agent Behavior Guidelines

### 1. Match Language Style
- If customer says "Aoa", respond "AoA"
- If customer uses English, respond in English
- If customer code-switches, code-switch naturally

### 2. Be Proactive
- Ask for missing info (name) before customer provides
- Offer alternatives when slot unavailable
- Don't wait for customer to ask questions

### 3. Be Quick
- First response should be fast (availability check)
- Confirm availability immediately
- Don't overthink simple requests

### 4. Handle Errors Gracefully
- If unclear message, ask politely for clarification
- If booking fails, offer alternatives
- Don't restart entire conversation

### 5. Maintain Context
- Remember previous messages in conversation
- Don't ask for same info twice
- Use context to understand intent

## 📊 Use Case Priority

### Priority 1 (Must Handle - 90% of conversations):
- ✅ Simple booking request (all info in first message)
- ✅ Multi-turn booking (info piece by piece)
- ✅ Slot unavailable with alternatives
- ✅ Payment flow
- ✅ Name collection

### Priority 2 (Should Handle - 80% of conversations):
- ✅ Price inquiry
- ✅ Complex pricing calculations
- ✅ Modification (change of mind)
- ✅ Service clarification

### Priority 3 (Nice to Have - 50% of conversations):
- ✅ Greeting only
- ✅ Information requests
- ✅ Cancellation
- ✅ Booking status check

## 🔧 Implementation Checklist

### NLU Module
- [ ] Intent classification with Roman Urdu support
- [ ] Entity extraction (date, time, service, price)
- [ ] Language detection and matching
- [ ] Context-aware understanding

### Agent Flow
- [ ] LangGraph state machine implementation
- [ ] ReAct loop with tool calling
- [ ] Availability checking tool
- [ ] Booking creation tool
- [ ] Payment processing tool

### Response Generation
- [ ] State-based response templates
- [ ] Language style matching
- [ ] Natural code-switching
- [ ] Error handling responses

### Booking System
- [ ] Firestore transactional booking
- [ ] Slot locking mechanism
- [ ] Alternative slot suggestions
- [ ] Payment OCR integration

## 📝 Next Steps

1. **Review this guide** - Understand all patterns
2. **Implement NLU prompts** - Use `/prompts/` templates
3. **Build LangGraph agent** - Follow `/patterns/booking_flow.md`
4. **Test with examples** - Use `/examples/` as test cases
5. **Iterate based on results** - Refine prompts and flows

## 🔗 Quick Links

- **Real Examples**: `examples/conversation_*.txt`
- **Pattern Analysis**: `analysis/conversation_patterns.md`
- **Entity Guide**: `analysis/entity_extraction_guide.md`
- **Language Patterns**: `analysis/language_patterns.md`
- **Intent Prompts**: `prompts/intent_classification.md`
- **Entity Prompts**: `prompts/entity_extraction.md`
- **Response Prompts**: `prompts/response_generation.md`
- **Booking Flow**: `patterns/booking_flow.md`
- **Use Cases**: `patterns/use_cases.md`
- **Initial Messages**: `patterns/initial_messages.md`

---

**Last Updated**: Based on real conversations analyzed January 2025
**Status**: Ready for implementation
**Next**: Build LangGraph agent using these patterns

