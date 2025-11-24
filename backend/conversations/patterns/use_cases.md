# Complete Use Cases

All use cases the agent must handle, based on real conversations.

## ✅ Primary Use Cases

### UC1: Simple Booking Request
**Description:** Customer provides all info in first message

**Example:**
```
Customer: "Hi is there a slot available tomorrow Wednesday between 6-9"
Agent: "Yes, available! Which service: Padel, Futsal, or Cricket?"
Customer: "Padel"
Agent: "Perfect! Please share your full name for booking"
Customer: "Jazib Waqas"
Agent: [Sends payment details]
Customer: [Sends payment screenshot]
Agent: "Booking confirmed! Thank you."
```

**Key Points:**
- Extract date, time, service from first message
- Quick availability confirmation
- Collect missing info (name)
- Payment flow

---

### UC2: Multi-turn Booking
**Description:** Customer provides info piece by piece

**Example:**
```
Customer: "Aoa"
Agent: "AoA! What service would you like to book?"
Customer: "Padel"
Agent: "Great! What date?"
Customer: "Tomorrow"
Agent: "What time?"
Customer: "Evening"
Agent: "Available slots: 6-7 PM, 7-8 PM. Which one?"
Customer: "7-8"
Agent: "Perfect! Please share your name"
[... continues to payment]
```

**Key Points:**
- Guide customer through each step
- Ask one question at a time
- Maintain context across turns

---

### UC3: Slot Unavailable with Alternatives
**Description:** Requested slot unavailable, offer alternatives

**Example:**
```
Customer: "Hi is there a slot available tomorrow Friday between 7-9"
Agent: "No I'm sorry we're completely booked but we do have a slot open from 8 to 9:30"
Customer: "Ok that works"
Agent: "Perfect! Please share your name"
[... continues]
```

**Key Points:**
- Apologize politely
- Offer closest alternative immediately
- Don't ask customer to suggest alternatives

---

### UC4: Price Inquiry Before Booking
**Description:** Customer asks about prices first

**Example:**
```
Customer: "How much do you charge for padel?"
Agent: "Rs 7500 per hour. 20% discount available, so Rs 6000 per hour after discount."
Customer: "Ok I want to book tomorrow 7-8"
Agent: "Perfect! Please share your name"
[... continues]
```

**Key Points:**
- Provide clear pricing
- Mention discounts upfront
- Move to booking after price inquiry

---

### UC5: Complex Pricing Calculation
**Description:** Time-based pricing blocks

**Example:**
```
Customer: "What's the price for 8-9:30 PM slot?"
Agent: "Pricing based on time:
• 7 PM - 3 AM: Rs 3500/hour
Your slot (1.5 hours): Rs 5250"
Customer: "So for 1.5 hour it's 5250?"
Agent: "Yes, correct. Confirm?"
Customer: "Yes"
[... continues]
```

**Key Points:**
- Handle time-based pricing logic
- Calculate duration correctly
- Confirm calculations with customer

---

### UC6: Payment Flow
**Description:** Complete payment and confirmation flow

**Example:**
```
Agent: [Sends payment details]
Customer: "Ok so want to book from 7-9 should transfer 8k?"
Agent: "Yes, correct. Rs 8000 for 7-9 PM. Please transfer and share screenshot."
Customer: [Sends payment screenshot]
Agent: [Processes OCR, validates amount]
Agent: "Payment received! Booking confirmed. Thank you!"
```

**Key Points:**
- Send structured payment details
- Confirm amount before transfer
- Use OCR for payment proof validation
- Validate amount matches booking price

---

### UC7: Change of Mind / Modification
**Description:** Customer changes booking details

**Example:**
```
Customer: "Ok so want to book from 7-9 should transfer 8k?"
Agent: "Yes, confirmed."
Customer: "Actually just want 6-7 so transferring 3k"
Agent: "Ok, updated booking: 6-7 PM for Rs 3000. Please transfer."
```

**Key Points:**
- Allow modifications before payment
- Recalculate price
- Update booking details

---

### UC8: Follow-up After Delay
**Description:** Customer follows up after delay

**Example:**
```
Customer: "And how about tomorrow Wednesday"
Agent: [No response for 45 minutes]
Customer: "?"
Agent: "Wednesday 7:30 to 9 pm available"
```

**Key Points:**
- Handle "?" as follow-up prompt
- Respond with requested information
- Don't restart conversation

---

### UC9: Service Type Clarification
**Description:** Multiple services, need to clarify

**Example:**
```
Customer: "I would like to book 6:30-8"
Agent: "Padel Futsal Cricket?"
Customer: "Padel"
Agent: "Perfect! Please share your name"
```

**Key Points:**
- Ask clearly when ambiguous
- List options
- Confirm before proceeding

---

### UC10: Name Collection
**Description:** Collect customer name for booking

**Example:**
```
Agent: "Available. Plz share full name for booking"
Customer: "Jazib Waqas"
Agent: "Thank you, Jazib! Payment details below..."
```

**Key Points:**
- Ask proactively after availability confirmed
- Use name in subsequent messages (personalization)
- Collect before sharing payment details

---

## 🔄 Secondary Use Cases

### UC11: Greeting Only
**Description:** Just a greeting, no booking intent yet

**Example:**
```
Customer: "Hi"
Agent: "Hi! Welcome to BookForMe. What service would you like to book?"
```

**Key Points:**
- Friendly greeting
- Show services
- Guide to booking

---

### UC12: Information Request
**Description:** General questions about services

**Example:**
```
Customer: "What services do you offer?"
Agent: "We offer:
• ⚽ Futsal courts
• 🏓 Padel courts
• 🏏 Cricket pitches
• 💇 Salon appointments

What would you like to book?"
```

**Key Points:**
- Provide helpful information
- Guide to booking
- Don't overload with info

---

### UC13: Cancellation
**Description:** Customer wants to cancel

**Example:**
```
Customer: "Actually I don't want to book anymore"
Agent: "No problem! Feel free to reach out if you change your mind."
```

**Key Points:**
- Handle politely
- Release any held slots
- Keep door open for future

---

### UC14: Booking Status Check
**Description:** Customer asks about existing booking

**Example:**
```
Customer: "What's the status of my booking?"
Agent: "Your booking:
• Service: Padel
• Date: Tomorrow
• Time: 7-8 PM
• Status: Confirmed
• Payment: Received

All set! See you tomorrow!"
```

**Key Points:**
- Access booking history
- Provide clear status
- Include all relevant details

---

### UC15: Multiple Bookings
**Description:** Customer wants to book multiple slots

**Example:**
```
Customer: "Can I book two slots? Tomorrow 6-7 and day after 7-8"
Agent: "Yes! Let me check availability..."
[Processes both bookings]
Agent: "Both slots available! Total: Rs 6000. Confirm?"
```

**Key Points:**
- Handle multiple bookings
- Calculate total price
- Process each booking separately

---

### UC16: Discount Inquiry
**Description:** Customer asks about discounts

**Example:**
```
Customer: "Are there any discounts?"
Agent: "Yes! 20% discount available. After discount: Rs 6000/hour.
Card discount: Not available."
```

**Key Points:**
- Provide discount information clearly
- Mention what discounts are/aren't available
- Calculate final price

---

### UC17: Unclear Message
**Description:** Can't understand customer message

**Example:**
```
Customer: "asdfgh"
Agent: "I'm sorry, I didn't understand that. Could you please rephrase?
Or tell me: What service would you like to book?"
```

**Key Points:**
- Apologize politely
- Don't get stuck
- Guide customer back to flow

---

### UC18: Payment Amount Confirmation
**Description:** Customer confirms/asks about payment amount

**Example:**
```
Customer: "So for 1.5 hour it's 5250?"
Agent: "Yes, correct. Rs 5250 for 1.5 hours (8-9:30 PM). Confirm?"
Customer: "8-930 will be 5250"
Agent: "Yes, exactly. Please share name and payment details will be sent."
```

**Key Points:**
- Confirm calculations
- Use customer's wording for clarity
- Proceed after confirmation

---

### UC19: Roman Urdu Conversations
**Description:** Full conversation in Roman Urdu

**Example:**
```
Customer: "Aoa kal shaam ka slot hai?"
Agent: "AoA! Han g, kal shaam slots available hain. Kaunsa time chahiye?"
Customer: "6 se 9 tak"
Agent: "Perfect! 6-9 PM slot available. Name share karein"
```

**Key Points:**
- Match customer's language completely
- Use natural Roman Urdu phrases
- Maintain professional tone

---

### UC20: Mixed Language (Code-Switching)
**Description:** Natural mixing of English and Roman Urdu

**Example:**
```
Customer: "Aoa I want to book tomorrow 7pm ka slot"
Agent: "AoA! Perfect, tomorrow 7 PM slot available. Service: Padel, Futsal, ya Cricket?"
Customer: "Padel"
Agent: "Great! Name share karein"
```

**Key Points:**
- Match code-switching style
- Natural mixing is normal
- Keep technical terms in English

---

## 🎯 Use Case Priority

### Priority 1 (Must Handle):
- UC1: Simple Booking Request
- UC2: Multi-turn Booking
- UC3: Slot Unavailable
- UC6: Payment Flow
- UC10: Name Collection

### Priority 2 (Should Handle):
- UC4: Price Inquiry
- UC5: Complex Pricing
- UC7: Modification
- UC9: Service Clarification
- UC16: Discount Inquiry

### Priority 3 (Nice to Have):
- UC11: Greeting Only
- UC12: Information Request
- UC13: Cancellation
- UC14: Booking Status
- UC15: Multiple Bookings

### Priority 4 (Edge Cases):
- UC8: Follow-up
- UC17: Unclear Message
- UC18: Payment Confirmation
- UC19: Roman Urdu
- UC20: Code-Switching

---

## 🔧 Implementation Notes

Each use case should:
1. ✅ Extract correct intent
2. ✅ Extract all relevant entities
3. ✅ Maintain conversation context
4. ✅ Handle errors gracefully
5. ✅ Match customer's language style
6. ✅ Provide clear, helpful responses

