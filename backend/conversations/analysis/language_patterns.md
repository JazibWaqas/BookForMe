# Language Patterns Analysis

## 🌐 Overview

Customers use a mix of English and Roman Urdu (Urdu written in English script). The agent must handle code-switching naturally.

## 📝 Common Roman Urdu Phrases

### Greetings
- **"Aoa"** or **"AoA"** = As-salamu alaykum (Peace be upon you)
- **"Salam"** = Hello (shortened greeting)
- **Agent Response:** Match style - "AoA" or "Salam"

### Availability
- **"mil jayega"** = "will be available" / "you'll get it"
- **"hai"** = "is" / "available"
- **Example:** "Yes mil jayega" = "Yes, it will be available"

### Confirmation
- **"Han g"** or **"Haan g"** = "Yes" (polite)
- **"Han"** = "Yes"
- **"ok"** = "okay" (used in both languages)

### Requests
- **"karna hai"** = "want to do" / "need to"
- **"chahiye"** = "need" / "want"
- **Example:** "mujhe slot book karna hai" = "I want to book a slot"

### Instructions
- **"batadei"** or **"batado"** = "tell me"
- **"lagwa da"** = "make/do" (imperative)
- **"Karwa data hn"** = "I will do/get it done"
- **Example:** "Ok ap payment lagwa da m booking Karwa data hn" = "Okay, you make the payment, I will get the booking done"

### Time References
- **"kal"** = "tomorrow"
- **"aaj"** = "today"
- **"parson"** = "day after tomorrow"
- **"shaam"** = "evening"
- **"raat"** = "night"
- **"subah"** = "morning"

### Common Words
- **"mujhe"** = "to me" / "I"
- **"ap"** or **"aap"** = "you" (polite)
- **"sir"** = "sir" (respectful address)
- **"bhai"** = "brother" (informal address)

## 🔀 Code-Switching Examples

### Example 1: Greeting + English
```
Customer: "Aoa want to book a slot from 8-9 today"
Analysis:
- "Aoa" (Roman Urdu greeting)
- Rest in English
Style: Mixed (greeting in Urdu, request in English)
```

### Example 2: Mixed Request
```
Customer: "Aaj Kal shayad discount bhi hei, price batadei pls"
Analysis:
- "Aaj Kal" = "these days" (Roman Urdu)
- "shayad discount bhi hei" = "maybe discount is also there" (Mixed)
- "price batadei pls" = "tell me price please" (Mixed)
Style: Heavy code-switching
```

### Example 3: Full English
```
Customer: "Hi is there a slot available tomorrow Wednesday between 6-9"
Analysis:
- Complete English
Style: English
```

### Example 4: Roman Urdu Response
```
Agent: "Ok ap payment lagwa da m booking Karwa data hn"
Analysis:
- "ap" = "you" (Roman Urdu)
- "payment lagwa da" = "make payment" (Mixed)
- "m booking Karwa data hn" = "I will get booking done" (Mixed)
Style: Mixed (matches customer's style)
```

## 🎯 Agent Response Strategy

### Match Customer's Style

**If customer uses "Aoa":**
- Agent responds: "AoA" (match greeting style)

**If customer uses English:**
- Agent responds in English

**If customer code-switches:**
- Agent can code-switch naturally
- But keep technical terms in English (account numbers, prices)

### When to Use Roman Urdu

**Use Roman Urdu for:**
- Greetings (match customer)
- Friendly confirmations ("mil jayega", "Han g")
- Common phrases ("batadei", "Karwa data hn")

**Keep in English:**
- Technical details (account numbers, IBAN)
- Pricing information
- Structured information
- Dates and times (can be in English or Roman Urdu)

### Examples of Good Agent Responses

**Customer:** "Aoa want to book a slot from 8-9 today"
**Agent:** "AoA! Available. Plz share full name for booking"
```
Good because:
- Matches greeting style (AoA)
- Confirms availability clearly
- Uses simple English for instructions
```

**Customer:** "Ok and how much are the charges"
**Agent:** "Rs7500/per hour 20 % discount after discount Rs6000/per hour"
```
Good because:
- Clear pricing in English
- Structured format
- Easy to parse
```

**Customer:** [After payment]
**Agent:** "Ok ap payment lagwa da m booking Karwa data hn"
```
Good because:
- Matches customer's language style (if they use Roman Urdu)
- Natural, friendly tone
```

## 📊 Language Distribution in Conversations

Based on analyzed conversations:

1. **60% Mixed** - Roman Urdu + English code-switching
2. **30% English** - Full English
3. **10% Roman Urdu** - Mostly Roman Urdu

**Key Insight:** Most customers code-switch, so agent must handle this naturally.

## 🔧 NLU Prompt Engineering Tips

### For Intent Classification

Include examples like:
```
Examples:
- "Aoa want to book a slot" → booking_request (mixed language)
- "Hi is there a slot available" → booking_request (English)
- "mujhe slot chahiye kal" → booking_request (Roman Urdu)
```

### For Entity Extraction

Handle Roman Urdu date/time:
```
Examples:
- "kal" = tomorrow
- "aaj" = today
- "shaam" = evening (6-9 PM)
- "raat" = night (9 PM - 12 AM)
- "subah" = morning (9 AM - 12 PM)
```

### For Response Generation

Match language style:
```
If customer uses "Aoa", respond with "AoA"
If customer uses English, respond in English
If customer code-switches, you can code-switch naturally
Keep technical terms (account numbers, prices) in English
```

## 🎓 Best Practices

1. **Greet in customer's style** - If they say "Aoa", say "AoA"
2. **Use simple language** - Avoid complex Urdu if customer uses simple English
3. **Keep technical info in English** - Account numbers, IBAN, prices
4. **Be natural** - Code-switching is normal, don't force one language
5. **Clarity over style** - If unclear, use simpler language

## ⚠️ Common Mistakes to Avoid

1. **Don't over-Urdu-ize** - If customer uses English, don't force Urdu
2. **Don't mix scripts** - Use Roman Urdu, not Urdu script (WhatsApp limitation)
3. **Don't translate technical terms** - Keep "account number", "IBAN" in English
4. **Don't be too formal** - "ap" is fine, but "aap" is also acceptable (both are polite)

