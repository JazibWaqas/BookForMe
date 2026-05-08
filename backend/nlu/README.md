# NLU Module

Current NLU is DeepSeek-backed text understanding for the sports booking agent.
Payment screenshot OCR is separate and uses Groq vision in `ocr.py`.

## Scope

The booking agent should understand sports court booking conversations for:

- padel
- futsal
- cricket
- pickleball

The system is not a salon, restaurant, outreach, or generic appointment agent.
Older prompt/data files may mention those ideas; treat them as historical
experiments unless they are explicitly wired into the current agent.

## Key Files

- `agent.py` - DeepSeek NLU calls and structured parsing.
- `ocr.py` - Groq vision amount extraction for payment screenshots.
- `state_manager.py` - Firestore conversation history/context persistence.
- `usage_tracker.py` - usage accounting helper.

## Testing

Prefer full-flow tests:

```bash
python backend/scripts/booking_conversation_tests.py
```

For manual testing:

```bash
python backend/scripts/chat_web.py
```
