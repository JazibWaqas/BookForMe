# Conversation Patterns Analysis

## 📊 Overview

Based on real WhatsApp conversations, here are the common patterns and how the agent should handle them.

## 1. Initial Message Patterns

### Pattern A: Direct Availability Inquiry
**Format:** `[Greeting] + [Availability request] + [Date] + [Time]`
- "Hi is there a slot available tomorrow Wednesday between 6-9"
- "Aoa want to book a slot from 8-9 today"
- "Aoa is there a slot available between 7-9 tommorow Friday"

**Intent:** `booking_request` or `availability_inquiry`
**Entities:**
- Date: "tomorrow", "Friday", "today", "Wednesday"
- Time: "6-9", "8-9", "7-9", "between 6-9"
- Service: Often omitted (defaults to vendor's service)

**Agent Response:**
1. Acknowledge greeting (match language style: "Aoa" → "AoA")
2. Check availability
3. Confirm or offer alternatives

### Pattern B: Service-Specific Inquiry
**Format:** `[Greeting] + [Service type] + [Date] + [Time]`
- "Aoa is there a slot available for paddle on Wednesday after 6"

**Intent:** `booking_request`
**Entities:**
- Service: "paddle", "padel", "futsal", "cricket"
- Date: "Wednesday"
- Time: "after 6"

**Agent Response:**
1. Confirm service type
2. Check availability for that service
3. Provide options

### Pattern C: Simple Greeting
**Format:** `[Greeting only]`
- "Hi"
- "Aoa"

**Intent:** `greeting`
**Entities:** None

**Agent Response:**
1. Friendly greeting
2. Offer services
3. Ask how can help

## 2. Availability Response Patterns

### Pattern A: Slot Available
**Response:** Quick confirmation
- "Yes"
- "Available"
- "Yes mil jayega" (in Roman Urdu)

### Pattern B: Slot Unavailable with Alternative
**Response:** Apologize + Offer alternative
- "No I'm sorry were completely booked but we do have a slot open from 8 to 9:30"

### Pattern C: Need to Check
**Response:** Set expectation
- "Let us check the availability and get back to you."

### Pattern D: Multiple Options
**Response:** List available slots
- "Sir today 6 to 7pm\n11 to 2am available"

## 3. Price Inquiry Patterns

### Pattern A: Direct Price Question
**Format:** `[Price request] + [Discount inquiry]`
- "Ok and how much are the charges and is there any discounts on cards etc?"
- "Aaj Kal shayad discount bhi hei, price batadei pls for this 1.5 hr session"

**Intent:** `price_inquiry`
**Entities:**
- Duration: "1.5 hr session", implied from booking slot

**Agent Response:**
- Base price per hour
- Discount percentage (if any)
- Final price after discount
- Card discount availability (usually "Card discount is not available")

**Example:**
```
"Rs7500/per hour 20 % discount after discount Rs6000/per hour
Card discount is not available"
```

### Pattern B: Time-Based Pricing
**Response:** Price blocks by time of day
```
"03Am to 11Am "2000""
"11Am to 07pm "2500""
"07Pm to 03Am "3500""
```

**Calculation Logic:**
- Determine which time block(s) the slot falls into
- Calculate based on duration
- Example: 8-9:30 PM = 1.5 hours × Rs 3500 = Rs 5250

## 4. Booking Confirmation Patterns

### Pattern A: Customer Confirms Intent
- "Ok I'd like to book it"
- "I would like to book 6:30-8"

**Agent Response:**
1. Collect missing information (name, service type)
2. Confirm details
3. Share payment information

### Pattern B: Service Type Clarification
**Agent:** "Padel Futsal Cricket ?"
**Customer:** "Padel"

**Agent Response:**
- Confirm service type
- Proceed with booking

### Pattern C: Booking Details Confirmation
**Customer:** "So for 1.5 hour?"
**Agent:** "8-930 will be 5250"
**Customer:** "Ok so want to book from 7-9 should transfer 8k?"

**Agent Response:**
- Confirm amount
- Share payment details
- "Ok ap payment lagwa da m booking Karwa data hn"

## 5. Payment Flow Patterns

### Pattern A: Payment Details Sharing
**Agent sends structured payment info:**
```
Payment Details:
Account Title: Capital Padel
Account Number: 00150900000721
IBAN: PK38ASCM0000150900000721
Bank Name: Askari Bank
```

### Pattern B: Payment Amount Confirmation
**Customer:** "Ok so want to book from 7-9 should transfer 8k?"
**Agent:** "ok"

**Customer:** "Actually just want 6-7 so transferring 3k"
**Agent:** Confirms

### Pattern C: Payment Proof
- Customer sends payment screenshot/image
- Agent confirms receipt
- Booking finalized

## 6. Name Collection Pattern

**Agent:** "Plz share full name for booking"
**Customer:** "Jazib Waqas"

**When to ask:**
- After availability confirmed
- Before sharing payment details
- Or after booking confirmed (depends on flow)

## 7. Follow-up Patterns

### Pattern A: Delay Follow-up
**Customer:** "?" (after delay)
**Agent:** Responds with requested information

### Pattern B: Change of Mind
**Customer:** "Actually just want 6-7 so transferring 3k"
- Previously mentioned 7-9 for 8k
- Changed to 6-7 for 3k

**Agent Response:**
- Acknowledge change
- Confirm new details
- Update booking

### Pattern C: Additional Questions
**Customer:** "Is it possible that I just decide over there if I want the 7-8 slot"

**Agent Response:**
- Address flexibility request
- Confirm or clarify policy

## 8. Language Patterns

### Roman Urdu Greetings
- "Aoa" → Agent responds "AoA"
- "Salam" → Agent responds "Salam"

### Code-Switching Examples
- "Aoa want to book a slot from 8-9 today" (Aoa + English)
- "Ok I'd like to book it" (English)
- "Aaj Kal shayad discount bhi hei, price batadei pls" (Mixed)

### Common Roman Urdu Phrases
- "mil jayega" = "will be available"
- "Han g" = "Yes"
- "karna hai" = "want to do"
- "batadei" = "tell me"
- "lagwa da" = "make/do"
- "Karwa data hn" = "I will do/get done"

**Agent Should:**
- Match customer's language style
- Use Roman Urdu when customer uses it
- Code-switch naturally

## 9. Error Handling Patterns

### OCR Errors (from screenshots)
- "8 own words are available" (likely "8 slots are available")
- Agent should have spell-check/validation

### Typos
- "alot" = "slot"
- "tommorow" = "tomorrow"

**Agent Should:**
- Handle common typos
- Use fuzzy matching for entity extraction

## 10. Multi-Day Conversation Patterns

**Pattern:**
- Day 1: Initial inquiry, no booking
- Day 2: Follow-up inquiry
- Day 3: Actual booking

**Key Points:**
- Context should be preserved
- But not too long (1 hour timeout per conversation)
- Each new inquiry can be treated as new if no booking in progress

