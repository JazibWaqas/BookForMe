# Backend Scripts

This folder contains local testing and maintenance helpers. Most database seed
logic now lives in `backend/database/seed/`.

## Current Testing Scripts

- `chat_web.py` - local browser-style WhatsApp tester using the production
  agent flow.
- `chat_terminal.py` - terminal tester for the same booking agent flow.
- `booking_conversation_tests.py` - automated multi-turn conversation suite.
- `guardrails_test.py` - guardrail behavior tests.
- `test_api.py` - read-only Firestore smoke check for current collections.
- `clear_conversation_history.py` - clears one user's conversation history.

Generated conversation reports are written to `backend/scripts/reports/`, which
is ignored by git.

## Current Database Maintenance

For database/slot scripts, start here:

```text
backend/database/seed/README.md
```

The current safe slot-maintenance path is:

```bash
python backend/database/seed/smart_reseed.py
```

That path is additive: it creates missing canonical slot documents and skips
existing slots.

## Legacy Scripts

These scripts are old prototype or broad demo-data helpers. They now require
explicit flags before writing because they can create outdated data or mutate
Firestore:

- `init_firestore.py` - old `availability_slots` prototype setup.
- `seed_database.py` - old social/demo data with non-current locations/sports.
- `seed_all.py` - wrapper around the core seed package; requires `--write`.
- `test_workflow.py` - mostly mocked early workflow test.
- `check_slot_status.py` - hardcoded historical slot check.

## Recommended Demo Workflow

Run the backend, then use either:

```bash
python backend/scripts/chat_web.py
```

or:

```bash
python backend/scripts/booking_conversation_tests.py
```

The conversation test suite stops at the confirmation prompt and does not send
`yes`, so it does not lock slots or exercise payment OCR.
