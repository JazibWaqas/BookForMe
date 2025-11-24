# Entity Extraction Guide

Based on real conversations, here's how to extract entities effectively.

## 📅 Date Extraction

### Common Patterns

**Relative Dates:**
- "tomorrow" → Calculate tomorrow's date
- "today" → Current date
- "next Friday" → Next occurrence of Friday
- "kal" (Roman Urdu) → tomorrow
- "parson" (Roman Urdu) → day after tomorrow

**Day Names:**
- "Wednesday", "Friday", "Sunday"
- Context needed: Next Wednesday or this Wednesday?
- Default: Next occurrence if past, same week if future

**Examples from Conversations:**
- "tomorrow Wednesday" → Wednesday (tomorrow)
- "next Friday" → Next Friday
- "today" → Current date

**Extraction Logic:**
```python
def extract_date(text: str, context: dict) -> str:
    """
    Extract date from text.
    
    Common patterns:
    - "tomorrow" → date + 1 day
    - "Friday" → next Friday
    - "next Friday" → Friday next week
    - "today" → current date
    - "kal" (Roman Urdu) → tomorrow
    """
    # Parse relative dates
    # Parse day names
    # Return YYYY-MM-DD format
```

## ⏰ Time Extraction

### Common Patterns

**Time Ranges:**
- "6-9" → 6:00 PM - 9:00 PM (assume PM if evening context)
- "7-9" → 7:00 PM - 9:00 PM
- "8-9:30" → 8:00 PM - 9:30 PM
- "between 6-9" → 6:00 PM - 9:00 PM
- "6:30-8" → 6:30 PM - 8:00 PM

**Relative Times:**
- "after 6" → 6:00 PM onwards
- "evening" → 6:00 PM - 9:00 PM (context-dependent)
- "morning" → 9:00 AM - 12:00 PM
- "night" → 9:00 PM - 12:00 AM

**Specific Times:**
- "5pm" → 17:00
- "7:30" → 19:30 (assume PM if evening context)
- "12am" → 00:00

**Duration:**
- "1.5 hr session" → 90 minutes
- "for 1.5 hour" → 90 minutes

**Examples from Conversations:**
- "between 6-9" → start: 18:00, end: 21:00
- "from 8-9:30" → start: 20:00, end: 21:30
- "6:30-8" → start: 18:30, end: 20:00
- "after 6" → start: 18:00, end: null (open-ended)

**Extraction Logic:**
```python
def extract_time(text: str, context: dict) -> dict:
    """
    Extract time range from text.
    
    Returns:
    {
        'start': '18:00',
        'end': '21:00',
        'duration': 180,  # minutes
        'type': 'range'  # 'range', 'after', 'before'
    }
    """
    # Parse time ranges
    # Handle "between X-Y", "X-Y", "from X-Y"
    # Handle relative times ("after 6", "evening")
    # Determine AM/PM from context
```

## 🎾 Service Type Extraction

### Common Service Types

**Exact Matches:**
- "padel" → padel
- "paddle" → padel (typo variant)
- "futsal" → futsal
- "cricket" → cricket
- "salon" → salon

**Context Clues:**
- "court" → likely padel/futsal/cricket
- "slot" → generic (check vendor's default service)
- No mention → default to vendor's primary service

**Examples from Conversations:**
- "Padel Futsal Cricket ?" → Customer needs to specify
- "Padel" → service = padel
- "paddle" → service = padel (normalize)

**Extraction Logic:**
```python
def extract_service_type(text: str, vendor_context: dict) -> str:
    """
    Extract service type from text.
    
    Returns:
    - Service type ID or name
    - Default to vendor's primary service if not specified
    """
    # Check for exact matches
    # Check for typos/variants
    # Check context clues
    # Default to vendor service
```

## 💰 Price Extraction

### Pricing Patterns

**Simple Hourly:**
- "Rs7500/per hour" → 7500 per hour
- "Rs6000" → 6000 (may be per hour or total)

**Time-Based Blocks:**
```
"03Am to 11Am "2000""
"11Am to 07pm "2500""
"07Pm to 03Am "3500""
```

**Discount Information:**
- "20 % discount" → 20% discount
- "after discount Rs6000/per hour" → final price after discount
- "Card discount is not available" → no card discount

**Total Amount:**
- "8k" → 8000
- "3k" → 3000
- "5250" → 5250

**Examples from Conversations:**
- "Rs7500/per hour 20 % discount after discount Rs6000/per hour"
- "8k" (for 2-hour slot) → 4000 per hour implied
- "3k" (for 1-hour slot) → 3000 per hour

**Extraction Logic:**
```python
def extract_price_info(text: str, booking_context: dict) -> dict:
    """
    Extract price information from text.
    
    Returns:
    {
        'base_price': 7500,
        'discount_percent': 20,
        'final_price': 6000,
        'currency': 'PKR',
        'unit': 'per_hour',  # or 'total'
        'time_blocks': [...]  # if time-based pricing
    }
    """
    # Extract base price
    # Extract discount
    # Calculate final price
    # Extract time blocks if present
```

## 👤 Customer Name Extraction

### Patterns

**Full Name:**
- "Jazib Waqas" → first: "Jazib", last: "Waqas"
- "My name is Ahmed" → "Ahmed"

**Partial Name:**
- "Ahmed" → first name only

**Examples from Conversations:**
- "Plz share full name for booking" → Agent requests
- "Jazib Waqas" → Customer provides

**Extraction Logic:**
```python
def extract_customer_name(text: str) -> dict:
    """
    Extract customer name from text.
    
    Returns:
    {
        'first_name': 'Jazib',
        'last_name': 'Waqas',
        'full_name': 'Jazib Waqas'
    }
    """
    # Split by spaces
    # First word = first name
    # Rest = last name
```

## 📱 Phone Number Extraction

### Patterns

**Direct:**
- "+923001234567"
- "03001234567"

**Context:**
- Phone number usually comes from WhatsApp metadata (sender number)
- Rarely mentioned in conversation

**Extraction Logic:**
```python
def extract_phone_number(text: str, whatsapp_metadata: dict) -> str:
    """
    Extract phone number.
    
    Usually from WhatsApp metadata (from field in webhook).
    """
    # Check WhatsApp metadata first
    # Fallback to text extraction if needed
```

## 🔄 Booking Status Extraction

### Patterns

**Confirmation:**
- "Yes" → confirm
- "ok" → confirm
- "confirm" → confirm
- "book it" → confirm

**Cancellation:**
- "No" → cancel
- "cancel" → cancel
- "don't want" → cancel

**Change:**
- "Actually just want 6-7" → change booking

**Examples from Conversations:**
- "Ok I'd like to book it" → confirmation intent
- "Actually just want 6-7" → modification intent

**Extraction Logic:**
```python
def extract_booking_action(text: str) -> str:
    """
    Extract booking action from text.
    
    Returns:
    - 'confirm'
    - 'cancel'
    - 'modify'
    - 'inquire'
    """
    # Check for confirmation phrases
    # Check for cancellation phrases
    # Check for modification phrases
```

## 🌐 Language Detection

### Patterns

**English:**
- "Hi is there a slot available"
- "How much are the charges"

**Roman Urdu:**
- "Aoa want to book a slot"
- "mujhe slot chahiye"
- "kal shaam ka time hai"

**Mixed:**
- "Aoa is there a slot available" (Aoa + English)
- "Aaj Kal shayad discount bhi hei, price batadei pls" (Mixed)

**Detection Logic:**
```python
def detect_language(text: str) -> dict:
    """
    Detect language from text.
    
    Returns:
    {
        'primary': 'urdu',  # or 'english'
        'secondary': 'english',  # or 'urdu'
        'style': 'mixed'  # 'english', 'urdu', 'mixed'
    }
    """
    # Check for Roman Urdu keywords
    # Check for English keywords
    # Determine style (match customer's style for responses)
```

