# LangGraph Booking Agent

This package contains the WhatsApp booking conversation graph.

## Current Architecture

The agent is a hybrid flow:

1. Fast-path regex/dictionary extraction for obvious booking details.
2. DeepSeek NLU fallback for novel or ambiguous phrasing.
3. Template fallbacks for transactional booking responses.

The priority is booking correctness: collect sport, date, time/range, and
optional area/vendor, show real available slots, resolve the user's selected
slot, then ask for confirmation.

## Key Files

- `graph.py` - LangGraph wiring and session persistence.
- `nodes.py` - intent handling, entity normalization, slot selection, response
  generation.
- `tools.py` - availability lookup, caching, and vendor/service queries.
- `session_store.py` - in-memory booking lifecycle state.
- `state.py` - graph state schema.

## Current Booking Flow

```text
guardrails
-> classify_intent
-> normalize_entities
-> extract_slot
-> validate_state
-> query_availability / check_confirmation / query_info
-> execute_booking
-> generate_response
```

Session state preserves booking context across unclear turns. The state is
cleared on explicit cancellation, successful booking/payment completion, fresh
greeting reset paths, or expiry.

## Database Contract

The agent reads canonical Firestore collections:

- `vendors`
- `services`
- `resources`
- `slots`

It does not use old `availability_slots` prototype data. Slot locking and
confirmation are handled by `database.slot_service.SlotService` transactions.

## Local Testing

```bash
python backend/scripts/chat_web.py
python backend/scripts/booking_conversation_tests.py
```

The automated conversation suite stops at the confirmation prompt and does not
lock slots.
