# Real Conversation Analysis & Agent Development Guide

This folder contains real WhatsApp conversations, analysis, and comprehensive guides for developing the BookForMe AI agent.

## 📁 Folder Structure

```
conversations/
├── README.md                          # This file
├── examples/                          # Real conversation examples
│   ├── conversation_1_simple_booking.txt
│   ├── conversation_2_multi_turn.txt
│   ├── conversation_3_pricing_inquiry.txt
│   ├── conversation_4_payment_flow.txt
│   └── conversation_5_slot_unavailable.txt
├── analysis/                          # Pattern analysis
│   ├── conversation_patterns.md       # Common patterns extracted
│   ├── entity_extraction_guide.md     # How to extract entities
│   └── language_patterns.md           # Roman Urdu/English patterns
├── prompts/                           # Prompt templates
│   ├── intent_classification.md       # Intent prompts
│   ├── entity_extraction.md           # Entity extraction prompts
│   ├── response_generation.md         # Response generation prompts
│   └── booking_flow_prompts.md        # Booking-specific prompts
└── patterns/                          # Conversation patterns
    ├── initial_messages.md            # Types of first messages
    ├── booking_flow.md                # Complete booking flow
    └── use_cases.md                   # All use cases to handle

```

## 🎯 Purpose

These conversations serve as:
1. **Training Data** - Real examples of how customers communicate
2. **Prompt Engineering** - Base for creating effective NLU prompts
3. **Flow Validation** - Ensure agent handles all real scenarios
4. **Testing** - Use as test cases for agent responses

## 📊 Key Insights from Real Conversations

### Language Patterns
- **Roman Urdu is dominant**: "Aoa", "mujhe", "karna hai", "mil jayega"
- **Code-switching is natural**: Mix of English and Urdu in same message
- **Abbreviations common**: "Aoa" (As-salamu alaykum), "Han g" (Haan ji)

### Booking Flow Patterns
1. Availability check → Price inquiry → Booking confirmation → Payment
2. Often customers provide all info in first message
3. Agent asks for missing pieces (name, payment proof)
4. Payment details shared as structured text
5. Payment proof sent as image/screenshot

### Entity Extraction Challenges
- Date references: "tomorrow", "Friday", "next Wednesday"
- Time ranges: "6-9", "7:30-9", "between 6-9"
- Service types: "padel", "paddle", "futsal", "cricket"
- Pricing: Complex calculations (8-hour blocks, hourly rates, discounts)

## 🚀 How to Use

1. **For NLU Development**: See `prompts/` folder for Gemini prompt templates
2. **For Flow Design**: See `patterns/booking_flow.md` for state machine design
3. **For Testing**: Use examples as test cases
4. **For Prompt Engineering**: Base prompts on real patterns in `analysis/`

