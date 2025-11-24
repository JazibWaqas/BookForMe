# Entity Extraction Prompts

Prompts optimized for extracting entities from real conversation patterns.

## 📅 Date Extraction Prompt

```
You are extracting date information from WhatsApp booking messages.

Message: "{message}"
Current Date: {current_date}
Conversation Context: {context}

Extract date information. Users may use:
- Relative dates: "tomorrow", "today", "next Friday"
- Roman Urdu: "kal" (tomorrow), "aaj" (today), "parson" (day after tomorrow)
- Day names: "Wednesday", "Friday", etc.
- Combined: "tomorrow Wednesday"

Date Extraction Rules:
1. "tomorrow" = current_date + 1 day
2. "today" = current_date
3. "kal" (Roman Urdu) = current_date + 1 day
4. "aaj" (Roman Urdu) = current_date
5. Day names = next occurrence of that day
6. "next [day]" = next week's occurrence
7. "this [day]" = this week's occurrence

Output Format (JSON):
{
    "date": "2025-01-15",  // YYYY-MM-DD format
    "date_text": "tomorrow Wednesday",  // Original text
    "date_type": "relative",  // "relative", "absolute", "day_name"
    "confidence": 0.95
}

Examples:
1. "tomorrow Wednesday" → date: tomorrow if it's Wednesday, else next Wednesday
2. "kal" → date: tomorrow
3. "next Friday" → date: next Friday
4. "today" → date: current date
```

## ⏰ Time Extraction Prompt

```
You are extracting time information from booking messages.

Message: "{message}"
Conversation Context: {context}

Extract time range or specific time. Users may use:
- Time ranges: "6-9", "7-9", "between 6-9", "from 8-9:30"
- Relative times: "after 6", "evening", "morning", "night"
- Roman Urdu: "shaam" (evening 6-9 PM), "raat" (night 9 PM-12 AM), "subah" (morning 9 AM-12 PM)
- Specific times: "5pm", "7:30", "12am"

Time Extraction Rules:
1. Default to PM for evening times (after 12 PM context)
2. "evening" / "shaam" = 6:00 PM - 9:00 PM
3. "morning" / "subah" = 9:00 AM - 12:00 PM
4. "night" / "raat" = 9:00 PM - 12:00 AM
5. "after X" = X:00 onwards (no end time)
6. Time ranges like "6-9" = assume PM if evening context

Output Format (JSON):
{
    "start_time": "18:00",  // HH:MM format (24-hour)
    "end_time": "21:00",  // HH:MM format (null if open-ended)
    "duration_minutes": 180,  // Calculated duration
    "time_text": "between 6-9",  // Original text
    "time_type": "range",  // "range", "after", "before", "specific"
    "confidence": 0.95
}

Examples:
1. "between 6-9" → start: 18:00, end: 21:00
2. "from 8-9:30" → start: 20:00, end: 21:30
3. "after 6" → start: 18:00, end: null
4. "evening" → start: 18:00, end: 21:00
5. "6:30-8" → start: 18:30, end: 20:00
```

## 🎾 Service Type Extraction Prompt

```
Extract service type from booking messages.

Message: "{message}"
Available Services: {available_services}  // ["padel", "futsal", "cricket", "salon"]

Common Service Types:
- "padel" / "paddle" → padel
- "futsal" → futsal
- "cricket" → cricket
- "salon" → salon

Extraction Rules:
1. Look for exact service name mentions
2. Handle typos: "paddle" = "padel"
3. If no service mentioned, return null (will use vendor default)
4. Check context: "court" hints at sports, "appointment" hints at salon

Output Format (JSON):
{
    "service_type": "padel",  // Service ID
    "service_text": "paddle",  // Original text
    "confidence": 0.90
}

Examples:
1. "Padel" → service_type: "padel"
2. "paddle" → service_type: "padel" (typo handling)
3. "futsal court" → service_type: "futsal"
4. No mention → service_type: null
```

## 💰 Price Extraction Prompt

```
Extract price information from messages.

Message: "{message}"
Conversation Context: {context}

Extract:
1. Base price: "Rs7500/per hour"
2. Discount: "20 % discount"
3. Final price: "after discount Rs6000/per hour"
4. Time-based pricing blocks (if mentioned)
5. Total amount: "8k", "3k", "5250"

Price Extraction Rules:
1. "Rs" or "PKR" = Pakistani Rupees
2. "k" = thousands (8k = 8000)
3. Look for "per hour" or "per session"
4. Discount usually percentage followed by final price
5. Time blocks format: "03Am to 11Am "2000""

Output Format (JSON):
{
    "base_price": 7500,
    "currency": "PKR",
    "unit": "per_hour",  // "per_hour", "per_session", "total"
    "discount_percent": 20,
    "final_price": 6000,
    "total_amount": null,  // If specific total mentioned
    "time_blocks": null,  // Array if time-based pricing
    "confidence": 0.95
}

Examples:
1. "Rs7500/per hour 20 % discount after discount Rs6000/per hour"
   → base: 7500, discount: 20%, final: 6000
2. "8k" → total_amount: 8000
3. Time blocks pricing → parse time blocks array
```

## 👤 Customer Name Extraction Prompt

```
Extract customer name from messages.

Message: "{message}"
Conversation Context: {context}

Name Extraction Rules:
1. Full names: "Jazib Waqas" → first: "Jazib", last: "Waqas"
2. Single name: "Ahmed" → first: "Ahmed", last: null
3. "My name is X" → extract X
4. "I am X" → extract X

Output Format (JSON):
{
    "first_name": "Jazib",
    "last_name": "Waqas",
    "full_name": "Jazib Waqas",
    "confidence": 0.95
}

Examples:
1. "Jazib Waqas" → first: "Jazib", last: "Waqas"
2. "Ahmed" → first: "Ahmed", last: null
3. "My name is Ali Khan" → first: "Ali", last: "Khan"
```

## 🔄 Combined Entity Extraction Prompt

```
You are extracting all entities from a WhatsApp booking message.

Message: "{message}"
Current Date: {current_date}
Current Time: {current_time}
Available Services: {services}
Conversation History: {history}
Current Context: {context}

Extract ALL entities from the message:

1. **Date** - When they want to book
   - Relative: "tomorrow", "today", "next Friday"
   - Roman Urdu: "kal", "aaj"
   - Day names: "Wednesday", "Friday"

2. **Time** - What time slot
   - Ranges: "6-9", "between 7-9", "from 8-9:30"
   - Relative: "evening", "morning", "after 6"
   - Roman Urdu: "shaam", "raat", "subah"

3. **Service Type** - What service
   - "padel", "futsal", "cricket", "salon"
   - Handle typos: "paddle" = "padel"

4. **Price Information** - Pricing details
   - Base price, discounts, final price
   - Total amounts: "8k", "3k"

5. **Customer Name** - If mentioned
   - Full names or first names

6. **Booking Action** - What they want to do
   - "confirm", "cancel", "modify", "inquire"

Respond in JSON format:
{
    "date": {
        "value": "2025-01-15",
        "text": "tomorrow Wednesday",
        "confidence": 0.95
    },
    "time": {
        "start": "18:00",
        "end": "21:00",
        "text": "between 6-9",
        "confidence": 0.95
    },
    "service_type": {
        "value": "padel",
        "text": "paddle",
        "confidence": 0.90
    },
    "price": {
        "base_price": null,
        "final_price": null,
        "confidence": 0.0
    },
    "customer_name": {
        "first_name": null,
        "last_name": null,
        "confidence": 0.0
    },
    "booking_action": "inquire"
}
```

