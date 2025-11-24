# Initial Message Patterns

Based on real conversations, here are the types of initial messages customers send and how the agent should respond.

## 📱 Initial Message Types

### Type 1: Complete Booking Request
**Pattern:** Greeting + Service + Date + Time in first message

**Examples:**
- "Hi is there a slot available tomorrow Wednesday between 6-9"
- "Aoa want to book a slot from 8-9 today"
- "Aoa is there a slot available between 7-9 tommorow Friday"

**What to Extract:**
- Date: "tomorrow", "Wednesday", "today", "Friday"
- Time: "6-9", "8-9", "between 7-9"
- Intent: `booking_request` or `availability_inquiry`

**Agent Response:**
1. Acknowledge greeting (match style: "Hi" → "Hi", "Aoa" → "AoA")
2. Check availability for specified date/time
3. If available: "Yes" / "Available" / "Yes mil jayega"
4. If unavailable: Offer closest alternative
5. Ask for missing info (name, service type if not mentioned)

**Example Response:**
```
Customer: "Aoa want to book a slot from 8-9 today"
Agent: "AoA! Available. Plz share full name for booking"
```

### Type 2: Service-Specific Request
**Pattern:** Greeting + Service Type + Date + Time

**Examples:**
- "Aoa is there a slot available for paddle on Wednesday after 6"
- "Hi I want to book futsal tomorrow at 5pm"

**What to Extract:**
- Service: "paddle" → "padel", "futsal"
- Date: "Wednesday", "tomorrow"
- Time: "after 6", "5pm"

**Agent Response:**
1. Confirm service type
2. Check availability
3. Confirm or offer alternatives

**Example Response:**
```
Customer: "Aoa is there a slot available for paddle on Wednesday after 6"
Agent: "AoA! Yes, padel slots available Wednesday after 6pm. What time would you prefer?"
```

### Type 3: Simple Greeting
**Pattern:** Just greeting

**Examples:**
- "Hi"
- "Aoa"
- "Salam"
- "Hello"

**What to Extract:**
- Intent: `greeting`
- No entities (yet)

**Agent Response:**
1. Match greeting style
2. Introduce service
3. Ask how can help
4. Show available services

**Example Response:**
```
Customer: "Aoa"
Agent: "AoA! Welcome to BookForMe. I can help you book:
• ⚽ Futsal courts
• 🏓 Padel courts
• 🏏 Cricket pitches
• 💇 Salon appointments

What would you like to book today?"
```

### Type 4: Availability Check (No Booking Yet)
**Pattern:** Check availability without committing

**Examples:**
- "Hi do u have a slot available tomorrow Friday between 7-9"
- "Any slot available Wednesday between 7-9"

**What to Extract:**
- Date: "tomorrow Friday", "Wednesday"
- Time: "between 7-9"

**Agent Response:**
1. Check availability
2. List available slots
3. Ask if they want to book

**Example Response:**
```
Customer: "Hi do u have a slot available tomorrow Friday between 7-9"
Agent: "Hi! Tomorrow Friday slots available:
• 7:00 PM - 8:00 PM
• 8:00 PM - 9:00 PM

Would you like to book one of these slots?"
```

### Type 5: Price Inquiry First
**Pattern:** Ask about prices before booking

**Examples:**
- "How much do you charge?"
- "Kitna hai rate?"
- "What are the prices for padel?"

**What to Extract:**
- Intent: `price_inquiry`
- Service: If mentioned

**Agent Response:**
1. Provide pricing information
2. Mention any discounts
3. Ask if they want to book

**Example Response:**
```
Customer: "How much do you charge?"
Agent: "Pricing:
• Rs 7500 per hour
• 20% discount available
• After discount: Rs 6000 per hour

Would you like to book a slot?"
```

## 🎯 Response Strategy by Initial Message Type

### Strategy 1: Information Rich (Type 1)
**Customer provides:** Date + Time + (maybe Service)
**Agent should:**
1. ✅ Confirm availability
2. ✅ Ask for missing info (name, service type if not clear)
3. ✅ Proceed to booking

### Strategy 2: Service Specific (Type 2)
**Customer provides:** Service + Date + Time
**Agent should:**
1. ✅ Confirm service
2. ✅ Check availability for that service
3. ✅ Proceed to booking

### Strategy 3: Just Greeting (Type 3)
**Customer provides:** Nothing
**Agent should:**
1. ✅ Greet back
2. ✅ Show services
3. ✅ Ask what they want

### Strategy 4: Just Checking (Type 4)
**Customer provides:** Date + Time (exploratory)
**Agent should:**
1. ✅ Check availability
2. ✅ Show options
3. ✅ Wait for booking confirmation

### Strategy 5: Price First (Type 5)
**Customer provides:** Nothing (just price question)
**Agent should:**
1. ✅ Provide pricing
2. ✅ Ask if they want to book
3. ✅ Collect booking details when ready

## 🔄 State Transition Based on Initial Message

```
Initial Message Type → Agent State

Type 1 (Complete Request) → select_service or select_date
Type 2 (Service Specific) → select_date
Type 3 (Just Greeting) → greeting
Type 4 (Availability Check) → availability_inquiry
Type 5 (Price Inquiry) → price_inquiry
```

## 💡 Best Practices

1. **Match Language Style** - If "Aoa", respond "AoA"
2. **Be Quick** - First response should be fast (availability check)
3. **Ask Proactively** - Don't wait for customer to provide name
4. **Show Options** - If multiple slots, list them
5. **Be Friendly** - Keep tone conversational

## ⚠️ Common Mistakes to Avoid

1. ❌ Don't ask for all info at once if customer already provided it
2. ❌ Don't ignore date/time mentioned in first message
3. ❌ Don't force English if customer uses Roman Urdu
4. ❌ Don't make customer repeat information

