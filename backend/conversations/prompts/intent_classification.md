# Intent Classification Prompts

Based on real conversations, here are optimized prompts for Gemini NLU to classify intents accurately.

## 🎯 Primary Intent Classification Prompt

```
You are a booking assistant for sports facilities (padel courts, futsal, cricket) and salons in Karachi, Pakistan.

Analyze this WhatsApp message and classify the user's intent. The user may speak in Roman Urdu mixed with English.

Message: "{message}"

Conversation History:
{history}

Current Context:
{context}

Possible Intents:
1. **greeting** - Simple greeting: "Hi", "Aoa", "Salam", "Hello"
2. **booking_request** - Want to book a slot: "book slot", "want to book", "mujhe slot chahiye", "slot karna hai"
3. **availability_inquiry** - Check availability: "slot available", "time hai", "mil jayega", "is there a slot"
4. **service_selection** - Choose service type: "padel", "futsal", "cricket", "salon"
5. **date_selection** - Provide/ask about date: "tomorrow", "Friday", "kal", "next week"
6. **time_selection** - Provide/ask about time: "6-9", "evening", "shaam", "7pm"
7. **price_inquiry** - Ask about pricing: "how much", "charges", "price", "discount", "kitna"
8. **confirmation** - Confirm booking: "yes", "ok", "confirm", "book it", "Han g"
9. **cancellation** - Cancel booking: "cancel", "nahi", "don't want"
10. **modification** - Change booking: "actually", "change to", "instead"
11. **information** - General questions: "what services", "what are prices"
12. **payment_related** - Payment questions: "payment", "transfer", "account number"
13. **name_provided** - Sharing name: "Jazib Waqas", "My name is..."
14. **unknown** - Unclear or irrelevant message

Roman Urdu Patterns:
- "Aoa" / "AoA" = greeting (As-salamu alaykum)
- "mujhe" = "I want"
- "chahiye" = "need"
- "karna hai" = "want to do"
- "mil jayega" = "will be available"
- "kal" = "tomorrow"
- "aaj" = "today"

Context Clues:
- If previous message was about availability, "yes" likely means confirmation
- If asking about time slot, likely availability_inquiry or booking_request
- If customer provided date/time, likely confirming or asking for price

Respond in JSON format:
{
    "intent": "booking_request",
    "confidence": 0.95,
    "reasoning": "User wants to book a slot (Roman Urdu: 'mujhe slot chahiye')",
    "alternative_intents": []
}
```

## 🔍 Examples for Training

### Example 1: Greeting
```
Message: "Hi"
Intent: greeting
Confidence: 1.0
```

### Example 2: Booking Request (English)
```
Message: "Hi is there a slot available tomorrow Wednesday between 6-9"
Intent: booking_request
Confidence: 0.95
Reasoning: Contains date (tomorrow Wednesday), time (6-9), and availability inquiry
```

### Example 3: Booking Request (Roman Urdu)
```
Message: "Aoa want to book a slot from 8-9 today"
Intent: booking_request
Confidence: 0.98
Reasoning: Greeting "Aoa" + booking intent + specific time slot
```

### Example 4: Mixed Language
```
Message: "Aoa is there a slot available between 7-9 tommorow Friday"
Intent: booking_request
Confidence: 0.95
Reasoning: Roman Urdu greeting + English booking request + date/time
```

### Example 5: Price Inquiry
```
Message: "Ok and how much are the charges and is there any discounts on cards etc?"
Intent: price_inquiry
Confidence: 0.98
Reasoning: Direct price question + discount inquiry
```

### Example 6: Confirmation
```
Message: "Ok I'd like to book it"
Intent: confirmation
Confidence: 0.95
Reasoning: Explicit confirmation of booking intent
```

### Example 7: Service Selection
```
Message: "Padel"
Intent: service_selection
Confidence: 1.0
Reasoning: Single service type mentioned
```

### Example 8: Payment Related
```
Message: "Ok so want to book from 7-9 should transfer 8k?"
Intent: booking_request + payment_related
Confidence: 0.90
Reasoning: Booking confirmation with payment amount mention
```

## 🎨 Enhanced Prompt for Roman Urdu

```
You are analyzing messages from Pakistani customers who use Roman Urdu (Urdu written in English script) mixed with English.

Common Roman Urdu words for booking context:
- "Aoa" / "AoA" = greeting (As-salamu alaykum)
- "mujhe" = "I" / "to me"
- "chahiye" = "need" / "want"
- "karna hai" = "want to do"
- "mil jayega" = "will be available"
- "kal" = "tomorrow"
- "aaj" = "today"
- "parson" = "day after tomorrow"
- "shaam" = "evening"
- "raat" = "night"
- "subah" = "morning"
- "batadei" / "batado" = "tell me"
- "Han g" / "Haan g" = "Yes" (polite)
- "ap" / "aap" = "you" (polite)

When you see these words, classify intent accordingly:
- Greeting words → greeting intent
- "mujhe X chahiye" / "X karna hai" → booking_request
- "slot available" / "time hai" → availability_inquiry
- "kitna" / "price" / "charges" → price_inquiry
- "Han g" / "ok" / "yes" → confirmation (if booking context)
```

## 📊 Multi-Intent Handling

Sometimes a message has multiple intents. Handle priority:

```
Priority Order:
1. booking_request (highest priority)
2. availability_inquiry
3. price_inquiry
4. confirmation
5. service_selection
6. date_selection
7. time_selection
8. greeting
9. information
10. unknown (lowest priority)

Example:
Message: "Aoa want to book a slot from 8-9 today"
Analysis:
- Contains greeting ("Aoa") → greeting intent present
- Contains booking request ("want to book") → booking_request intent
- Primary intent: booking_request (has date/time info)
- Secondary intent: greeting
```

