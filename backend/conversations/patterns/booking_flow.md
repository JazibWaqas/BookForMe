# Complete Booking Flow Pattern

Based on real conversations, here's the complete booking flow from initial message to confirmation.

## 🔄 Complete Flow States

### State Machine Flow:
```
greeting
  ↓
availability_inquiry / booking_request
  ↓
select_service (if not mentioned)
  ↓
select_date (if not mentioned)
  ↓
select_time (if not mentioned)
  ↓
price_inquiry (optional)
  ↓
confirm_booking
  ↓
collect_name (if not collected)
  ↓
share_payment_details
  ↓
wait_for_payment
  ↓
confirm_payment (via OCR if image sent)
  ↓
booking_complete
```

## 📋 Detailed Flow with Real Examples

### Phase 1: Initial Contact (greeting / booking_request)

**Customer:** "Aoa want to book a slot from 8-9 today"

**Agent Processing:**
1. Extract entities: date="today", time="8-9", intent="booking_request"
2. Check availability
3. Respond quickly

**Agent:** "AoA! Available. Plz share full name for booking"

**State:** `select_service` or `select_date` (depending on what's missing)

---

### Phase 2: Service Selection (if needed)

**Scenario A: Service not mentioned**
```
Customer: "Hi is there a slot available tomorrow Wednesday between 6-9"
Agent: "Yes, available! Which service:
• Padel
• Futsal  
• Cricket
Which one would you like?"
```

**Scenario B: Service mentioned**
```
Customer: "Aoa is there a slot available for paddle on Wednesday after 6"
Agent: "AoA! Yes, padel slots available Wednesday after 6pm. What time would you prefer?"
```

**State:** `select_date` or `select_time`

---

### Phase 3: Date Selection (if needed)

**Scenario A: Date already provided**
- Skip this phase, go to time selection

**Scenario B: Date not provided**
```
Agent: "What date would you like to book for?"
Customer: "Tomorrow"
Agent: "Great! Tomorrow is Wednesday. What time?"
```

**State:** `select_time`

---

### Phase 4: Time Selection (if needed)

**Scenario A: Time already provided**
- Check availability for that time

**Scenario B: Time range provided, need specific slot**
```
Customer: "between 6-9"
Agent: "Available slots:
• 6:00 PM - 7:00 PM
• 7:00 PM - 8:00 PM
• 8:00 PM - 9:00 PM
Which one would you like?"
```

**Scenario C: Time not provided**
```
Agent: "What time would you like to book?"
Customer: "7pm"
Agent: "Perfect! 7:00 PM slot available. Should I confirm?"
```

**State:** `confirm_booking` or `price_inquiry`

---

### Phase 5: Price Inquiry (optional)

**Customer:** "Ok and how much are the charges and is there any discounts on cards etc?"

**Agent:**
```
"Pricing:
• Rs 7500 per hour
• 20% discount available
• After discount: Rs 6000 per hour
• Card discount: Not available

Total for your slot: Rs 6000

Would you like to confirm the booking?"
```

**State:** `confirm_booking`

---

### Phase 6: Booking Confirmation

**Scenario A: Customer confirms**
```
Customer: "Yes" / "Ok I'd like to book it" / "Confirm"
Agent: "Perfect! Plz share full name for booking"
```

**Scenario B: Customer asks question**
```
Customer: "So for 1.5 hour?"
Agent: "Yes, for 1.5 hours (8-9:30 PM): Rs 5250. Confirm?"
```

**State:** `collect_name` or `share_payment_details`

---

### Phase 7: Name Collection

**Agent:** "Plz share full name for booking"

**Customer:** "Jazib Waqas"

**Agent:** "Thank you, Jazib! Booking details:
• Service: Padel
• Date: Today
• Time: 8:00 PM - 9:00 PM
• Price: Rs 6000

Payment details below..."

**State:** `share_payment_details`

---

### Phase 8: Payment Details Sharing

**Agent sends structured payment info:**
```
Payment Details:

Account Title: Capital Padel
Account Number: 00150900000721
IBAN: PK38ASCM0000150900000721
Bank Name: Askari Bank

Please transfer Rs 6000 and share payment proof.
```

**State:** `wait_for_payment`

---

### Phase 9: Payment Confirmation

**Scenario A: Customer confirms amount**
```
Customer: "Ok so want to book from 7-9 should transfer 8k?"
Agent: "Yes, correct. Rs 8000 for 7-9 PM slot. Please transfer and share screenshot."
```

**Scenario B: Customer changes mind**
```
Customer: "Actually just want 6-7 so transferring 3k"
Agent: "Ok, updated booking:
• Time: 6:00 PM - 7:00 PM
• Amount: Rs 3000
Please transfer and share screenshot."
```

**Scenario C: Customer sends payment proof**
```
Customer: [Sends payment screenshot image]
Agent: [Processes image with OCR]
Agent: "Payment received! Booking confirmed. Thank you!"
```

**State:** `confirm_payment` → `booking_complete`

---

### Phase 10: Booking Complete

**Agent:**
```
"🎉 Booking Confirmed!

Booking ID: BK-12345
Service: Padel
Date: Today (2025-01-15)
Time: 8:00 PM - 9:00 PM
Customer: Jazib Waqas
Amount: Rs 6000

Thank you for using BookForMe!"
```

**State:** `booking_complete`

---

## 🔀 Alternative Flows

### Flow A: Slot Unavailable

**Customer:** "Hi is there a slot available tomorrow Friday between 7-9"

**Agent:** "No I'm sorry we're completely booked but we do have a slot open from 8 to 9:30"

**Customer Options:**
1. Accept alternative → Continue booking flow
2. Ask for different date → Go back to date selection
3. Decline → End conversation or offer waitlist

---

### Flow B: Need to Check Availability

**Customer:** "Hi is there a slot available Wednesday anytime between 6-9"

**Agent:** "Let us check the availability and get back to you."

**Later:**
```
Agent: "Wednesday slots available:
• 6:00 PM - 7:00 PM
• 7:30 PM - 9:00 PM
Would you like to book one?"
```

---

### Flow C: Complex Pricing Calculation

**Customer:** "Ok I'd like to book it. Aaj Kal shayad discount bhi hei, price batadei pls for this 1.5 hr session"

**Agent:**
```
"Yes, discounts available!

Pricing (time-based):
• 03 AM - 11 AM: Rs 2000/hour
• 11 AM - 07 PM: Rs 2500/hour
• 07 PM - 03 AM: Rs 3500/hour

Your slot (8:00 PM - 9:30 PM = 1.5 hours):
Rs 3500 × 1.5 = Rs 5250

Would you like to confirm?"
```

**Customer:** "So for 1.5 hour?"

**Agent:** "Yes, Rs 5250 for 1.5 hours (8-9:30 PM). Confirm?"

**Customer:** "8-930 will be 5250"

**Agent:** "Yes, correct. Please share name and payment details will be sent."

---

## 📊 State Transition Matrix

| Current State | Customer Message | Next State | Agent Action |
|--------------|------------------|------------|--------------|
| greeting | "Hi" | greeting | Show services |
| greeting | "book slot tomorrow 6-9" | select_service | Check availability |
| select_service | "Padel" | select_date | Confirm service |
| select_date | "tomorrow" | select_time | Check available times |
| select_time | "7pm" | confirm_booking | Confirm details |
| confirm_booking | "yes" | collect_name | Ask for name |
| collect_name | "Jazib Waqas" | share_payment | Send payment details |
| wait_for_payment | [payment image] | confirm_payment | Process OCR |
| confirm_payment | (auto) | booking_complete | Send confirmation |

## 🎯 Key Decision Points

1. **Availability Check** - Always check availability immediately
2. **Missing Information** - Ask proactively, don't wait
3. **Language Matching** - Match customer's language style
4. **Price Calculation** - Handle complex time-based pricing
5. **Payment Confirmation** - Use OCR for payment proof validation

## ⏱️ Timeout Handling

**Conversation Timeout:** 1 hour
- If last message > 1 hour ago, reset to greeting state
- But preserve booking context if payment pending

**Slot Hold Timeout:** 15 minutes
- If customer confirms booking but doesn't pay within 15 minutes
- Release slot and notify customer

## 🔄 Error Recovery

**If customer provides wrong info:**
- Politely ask for clarification
- Don't restart entire flow
- Use context to understand intent

**If booking fails:**
- Apologize
- Offer alternative slots
- Suggest different date/time

