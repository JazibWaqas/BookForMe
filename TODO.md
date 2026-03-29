# TODO — context for fixes and roadmap

Use this so a coding agent can see vision, current state, and gaps without reading the whole repo.

## Vision (one line)

BookForMe: customers book via app + WhatsApp AI; one Firestore inventory; vendors run themselves without an admin—same tooling should help you develop without scripts where possible.

---

## Agent (WhatsApp / LangGraph)

**Done:** Guardrails, Groq NLU, availability search, slot list + confirm, lock + payment instructions, payment screenshot path (OCR) outside the graph. Roman Urdu / English handled in prompts and templates.

**Fix / gap:** If user cancels after a slot is locked, session clears but Firestore may still hold the lock until expiry or cron—should call `release_lock` for that user/slot on cancel. Post-booking cancel via chat is not wired to `cancel_booking`. Minor: `name_provided` maps to `unknown`; `query_info` has dead branch; session is in-memory on the server.

---

## Vendor dashboard (React Native `App/app/vendor-dashboard/`)

**Done:** Home (today stats), bookings list + detail, approve/reject, calendar grid + polling, walk-in on empty cells, profile PATCH for basic vendor fields.

**Not done / gap:** Notifications UI is empty (no real feed). Slot creation exists on API (`POST /vendors/{id}/slots`) but not in the app—calendar still says “re-seed” instead of a real flow. Block slot API exists; grid does not expose block. Pricing, discounts, payment history, operating hours editor, cloud images—mostly absent or partial.

---

## What “aligned with vision” means here

- **Agent:** Correct lock lifecycle (release on cancel), optional later: NL cancel of confirmed bookings.
- **Vendor:** Inventory and money visible and editable in-app (slots, block, prices, payments)—no dependency on manual seed/Firestore for normal ops.

---

## Customer app (`App/app/` — browse, book, profile, social)

**Already implemented:** `(auth)/register.tsx` (customer vs vendor, validation, `register` + vendor `createVendorProfile`). `(tabs)/profile.tsx` with bookings/stats and `EditProfileModal` (name + phone → `PUT /api/auth/profile`). `vendor-dashboard/profile.tsx` (partial API + AsyncStorage for CNIC/images). Social tab + `services/social.ts` + components; backend `social_api.py` with many routes—not a blank slate.

**Registration / profile gaps:** No single written contract between forms and Firestore `users` / `vendors` (operating hours, `whatsapp_number`, payment accounts, resources). Vendor `vendor_id` from registration must stay consistent with slots and `vendor_id` on the user doc app-wide. CNIC/photos often local-only (AsyncStorage), not authoritative in DB. Customer profile is thin (schema has bio/avatar/stats—little editing in UI). Vendor onboarding overlaps vendor dashboard profile; “complete control from DB” is not true until fields live on the server.

**Social:** Built but fragile: auth/query mismatches, empty data, unfinished bits (e.g. notifications assumptions in code). **Hardening + smoke test** against live API and seeded data, not greenfield.

**Priority:** For demos, **booking path** (home → vendor → slot → lock → payment) beats social and registration polish.

**Difficulty:** Registration/profile ↔ schema alignment = **medium** (schema choices, migration for existing users). Social = **medium–high** if polishing everything; **lower** if only fixing broken API calls and core flows.

---

*Updated March 2026*
