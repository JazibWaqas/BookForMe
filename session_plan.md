# Session plan — vendor dashboard (complete, no placeholders)

Purpose: give coding agents and humans a single source of truth for **vision**, **scope**, and **ordered work** so implementation stays aligned. Main surface: React Native `App/app/vendor-dashboard/`. Backend: FastAPI + Firestore (`backend/database/rest_api.py` and related).



## Vision (high level)

Vendors run their venue **from the app** without depending on an admin or scripts: see inventory, money, and bookings; change prices, hours, and payment instructions; act on holds and payments. **Placeholders are not acceptable** for this milestone: notifications, empty states, and “re-seed” copy must be replaced with real flows or removed.

Align with the product line: **one Firestore inventory** shared with the customer app and WhatsApp AI—vendor actions must match the same slot model and APIs.

---

## Current baseline (what already exists)

- Home: today metrics, upcoming list, quick actions.
- Calendar: live grid, polling, walk-in on free cells.
- Bookings: list, filters, search; booking detail with approve/reject and payment screenshot.
- Profile: partial PATCH to API; some fields only local (AsyncStorage).
- APIs already present for many actions: vendor PATCH, grid, bookings, approve/reject/block, walk-in, analytics today, `POST /vendors/{id}/slots` (slot creation not wired in UI).

---

## Work items (checklist)

### Core operations (inventory and calendar)

1. **Slot inventory without scripts**  
   Wire `POST /api/vendors/{vendor_id}/slots` (or equivalent rules as `smart_reseed`) so vendors can create or extend availability in-app: date range, resources, default price. Replace calendar copy that references re-seeding with a real flow or remove it once this exists.

2. **Block / unblock slots**  
   Expose `POST .../slots/{slot_id}/block` (and unlock if available) from the calendar (e.g. long-press or action sheet) for maintenance and closed hours.

3. **Empty / edge states**  
   If no slot documents exist for a day, show a clear message and CTA (“Generate slots” / in-app flow)—not a dead-end referencing seed scripts.

### Money and bookings

4. **Payment verification loop**  
   Booking detail: complete states for pending OCR, failed verification, vendor override; clear who/when for audit-style clarity.

5. **Payment history**  
   List payments for this vendor: date, amount, booking/slot ref, status, link to booking—backed by real queries, no fake rows.

6. **Pricing control**  
   Edit base price (and per service/court or time band if schema supports) via API + UI so vendors are not tied to seed defaults.

7. **Discounts / promos**  
   Only if in product scope: minimal model (code, %, window) + UI. If out of scope, remove UI that implies discounts exist.

### Business profile and settings

8. **Vendor profile = server truth**  
   Move CNIC, category, photos off AsyncStorage-only into Firestore + storage URLs (or API), consistent with customer app and booking flows.

9. **Operating hours**  
   Editable weekly hours (PATCH `operating_hours`) with validation so slots and calendar stay consistent.

10. **Payment instructions**  
    Edit JazzCash / EasyPaisa / bank details shown to customers after a lock (`vendor_payment_accounts` or canonical vendor fields)—no static placeholder text.

### Notifications (no empty shell)

11. **Real notification feed**  
    Replace placeholder bell with data from a real source, e.g. bookings needing action, payment submitted/rejected, hold expiring soon. Options: query-driven lists and/or a notifications collection + API. Tap-through to booking; optional read state.

12. **Push (optional, after 11)**  
    Expo push for vendors when events fire—only after the in-app feed is defined.

### Analytics and reporting

13. **Beyond “today”**  
    Dashboard: last 7 / 30 days revenue and booking counts (and simple charts if desired)—real aggregates or queries, not hardcoded demo numbers.

14. **Export**  
    CSV export of bookings or payments for accounting.

### Quality bar

15. **No misleading demo data**  
    Remove or label placeholder defaults that could pass as live.

16. **Loading / error / empty**  
    Every screen: loading, error with retry, empty state—no silent failure or infinite spinners.

17. **Auth**  
    All vendor calls use JWT; handle 401 with re-login.

---

## Suggested order (for steady progress)

1. Block/unblock (2), slot creation/extension in-app (1), empty states (3)—unblocks “we run the venue from the app.”
2. Real notifications (11), payment history (5), profile on server (8).
3. Operating hours (9), payment accounts (10), pricing (6), analytics/export (13–14).
4. Discounts (7) only if promised; push (12) after notifications work.

---

## Scope honesty

Shipping **everything** at full polish is multiple iterations (UI + API + Firestore). For a defensible “vendor ops complete” milestone, prioritize **(1)(2)(11)(5)(8)(9)(10)**; treat **discounts, advanced analytics, push** as a second wave unless requirements demand them.

---

## Related repo context

- Slot top-up script (additive): `backend/database/seed/smart_reseed.py` (does not replace in-app vendor slot creation long term).
- Gaps tracked in `TODO.md` (agent, customer app, vendor summary).

---

*Created for session work — update this file when milestones close or scope changes.*
