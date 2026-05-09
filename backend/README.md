# BookForMe Backend

FastAPI backend for the BookForMe sports court booking system.

The active product is a completed Web-first AI Chat booking agent plus supporting
app/vendor/admin APIs for Karachi sports venues. Current launch work is focused
on final React Native app polish and stable demo builds. Supported sports are:

- padel
- futsal
- cricket
- pickleball

Anything mentioning salons, restaurants, generic appointments, `availability_slots`,
Gemini NLU, or Qwen/Groq text NLU is historical/prototype context, not the
current system.

## Current Architecture

```text
Web Chat / API clients
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
- `nlu/` - DeepSeek-backed NLU and payment OCR helpers.
- `whatsapp/` - Core AI Agent logic (shared brain for Web and WhatsApp).
- `app/` - FastAPI app, config, Firestore bootstrap.
- `scripts/` - local testing helpers.

## Current AI/OCR Status

- DeepSeek text model for NLU/conversation.
- Payment screenshot OCR is wired through the backend pipeline. Groq vision is
  the current provider; Gemini is a valid candidate for improving extraction
  accuracy on local wallet/bank screenshots.
- The booking agent itself is complete and passing current regression/manual
  testing. OCR accuracy issues should be treated as provider/model tuning unless
  the payment state transition or upload pipeline is failing.

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
