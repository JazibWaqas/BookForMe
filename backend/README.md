# BookForMe Backend

FastAPI backend for the BookForMe sports court booking system.

The active product is a WhatsApp-first booking agent plus supporting app/vendor
APIs for Karachi sports venues. Supported sports are:

- padel
- futsal
- cricket
- pickleball

Anything mentioning salons, restaurants, generic appointments, `availability_slots`,
Gemini NLU, or Qwen/Groq text NLU is historical/prototype context, not the
current system.

## Current Architecture

```text
WhatsApp / dev chat
-> LangGraph booking agent
-> Firestore canonical inventory
-> slot transaction/payment flow
```

The `slots` collection is both availability and booking state. A booking is a
slot document moving through:

```text
available -> locked -> pending -> confirmed -> completed
```

## Key Packages

- `agent/` - LangGraph booking flow, entity normalization, slot selection.
- `database/` - Firestore access, REST API, slot transactions.
- `nlu/` - DeepSeek-backed NLU and Groq-backed payment OCR.
- `whatsapp/` - WhatsApp webhook/service integration.
- `app/` - FastAPI app, config, Firestore bootstrap.
- `scripts/` - local testing helpers.

## Current AI Providers

- DeepSeek text model for NLU/conversation.
- Groq vision model for payment screenshot OCR.

See `app/config.py` for exact model names and environment variables.

## Slot Maintenance

For adding future slots, use the canonical additive reseed script:

```bash
python backend/database/seed/smart_reseed.py
```

That is a dry run. To actually create missing slots:

```bash
python backend/database/seed/smart_reseed.py --write
```

Do not use destructive/reset scripts for routine slot generation.

## Local Testing

```bash
python backend/scripts/chat_web.py
python backend/scripts/booking_conversation_tests.py
```

The automated conversation suite stops at the confirmation prompt and does not
send `yes`, so it does not lock slots or exercise payment OCR.
