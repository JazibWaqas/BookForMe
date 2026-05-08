# Database Layer

The backend uses Firestore as the single source of truth.

## Current Booking Collections

- `vendors`
- `resources`
- `services`
- `slots`
- `payments`
- `vendor_payment_accounts`
- `conversation_states`

The `slots` collection is both availability inventory and booking state. A
booking is represented by a slot document moving through statuses such as
`available`, `locked`, `pending`, and `confirmed`.

## Current Slot Maintenance

Read the seed guide before running any maintenance script:

```text
backend/database/seed/README.md
```

Canonical additive slot generation is implemented in:

```text
backend/database/seed/smart_reseed.py
```

That same function is called by the live admin/vendor APIs, so script behavior
and app behavior stay aligned.

Running the script with no flags is read-only dry-run. Use `--write` only after
reviewing the dry-run count.

## Deprecated Data Shape

Older prototype files mention `availability_slots`, `slot_date`, vendor-level
`service_type`, Gemini NLU, or generic sample vendors. Those are not the current
booking model.
