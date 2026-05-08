# Context Files Archive

This folder contains historical planning documents, old architecture notes, and
FYP reference material.

It is not the current source of truth for implementation.

For fresh sessions, read these current docs instead:

1. `README.md`
2. `backend/README.md`
3. `backend/agent/README.md`
4. `backend/database/README.md`
5. `backend/database/seed/README.md`
6. `backend/scripts/README.md`

Current product scope:

- WhatsApp-first sports court booking agent.
- Karachi vendors.
- Supported sports: padel, futsal, cricket, pickleball.
- Firestore canonical collections: `vendors`, `resources`, `services`,
  `slots`, `payments`, `vendor_payment_accounts`, `conversation_states`.
- DeepSeek text model for NLU/conversation.
- Groq vision model for payment screenshot OCR.

Historical docs in this folder may mention Gemini, Qwen/Groq text NLU, generic
services, salons, old slot generators, or other prototype ideas. Treat those as
archive material unless the current code/docs explicitly confirm them.
