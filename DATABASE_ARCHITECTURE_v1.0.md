# 📘 BookForMe – Database Architecture v1.0

**Post-Reset Canonical State (Structural Foundation Lock-In)**

---

## 1️⃣ Purpose of This Document

This document defines the **authoritative Firestore schema and architectural decisions** after the full structural reset.

This version establishes:

* Canonical user schema
* Unified identity model
* Referential integrity guarantees
* Booking state machine invariants
* Vendor analytics foundation
* Seeding methodology
* Reset strategy
* Expansion rules (additive-only future policy)

This marks the transition from prototype-phase database to structured production foundation.

---

## 2️⃣ Why We Performed a Full Reset

### Problems Identified Before Reset

1. **Dual User Shapes**
   * App-registered users had full social fields.
   * WhatsApp-created users lacked `stats`, `preferences`, `points`, etc.
   * Result: Potential nested update failures.

2. **Ghost Users**
   * Slot generator used hardcoded fake user IDs.
   * Slots referenced users that did not exist.
   * Booking history appeared empty for real users.

3. **Schema Drift**
   * Seeding bypassed business logic.
   * Direct DB writes introduced inconsistent structures.

4. **Low Trust in Data Integrity**
   * Uncertainty whether booking issues were DB-related.
   * Hard to debug because schema was not guaranteed.

---

## 3️⃣ Core Architectural Goals of Reset

The reset aimed to:

* Enforce **single canonical user schema**
* Eliminate ghost references
* Guarantee referential integrity
* Preserve slot state machine
* Maintain WhatsApp agent compatibility
* Avoid changing identity model
* Lock in additive-only future changes

---

## 4️⃣ Identity Model (Finalized & Locked)

### 🔐 User Document ID Strategy

* Firestore auto-generated random UID
* Phone number stored as indexed field
* All references use UID
* Phone is NOT used as document ID

### Why This Is Correct

* Prevents PII exposure in URLs
* Allows phone number changes
* Keeps composite key relationships clean
* Maintains privacy

This model is permanent.

---

## 5️⃣ Canonical User Schema (Unified)

All users (App + WhatsApp + Seeded) now share identical structure.

```json
{
  "phone": string,
  "email": string,
  "name": string,
  "role": "customer" | "vendor",
  "vendor_id": string | null,
  "created_at": timestamp,
  "last_active": timestamp,
  "is_online": boolean,
  "password_hash": string | null,

  "points": number,
  "level": number,
  "skill_rating": number,
  "avatar_url": string,
  "bio": string,
  "badges": [],

  "stats": {
    "wins": number,
    "losses": number,
    "matches_played": number,
    "win_rate": number
  },

  "preferences": {
    "notifications": boolean
  }
}
```

### Guarantees

* `stats` map always exists
* `preferences` map always exists
* No nested update failures
* No shape divergence possible

---

## 6️⃣ Vendor Schema (Analytics-Ready)

Vendor documents now include analytics fields:

```json
{
  "rating_sum": number,
  "rating_count": number,
  "average_rating": number,

  "revenue_today": number,
  "revenue_week": number,
  "revenue_month": number,

  "booking_count_today": number
}
```

These fields are initialized to zero during seeding.

Purpose:
* Support vendor dashboard
* Enable analytics without migrations
* Keep additive-only growth

---

## 7️⃣ Slot State Machine (Unchanged & Verified)

Slots follow strict enum states:

```
available
locked
pending
confirmed
completed
cancelled
blocked
```

### State Invariants

* `available` → user_id must be null
* `locked` → hold_expires_at must exist
* `confirmed` → payment_id must exist
* `completed` → user_id must exist
* `cancelled` → cancelled_by must exist

All invariants verified post-reset.

---

## 8️⃣ Timestamp Policy

* All slot times stored in UTC
* Conversion handled at display layer
* No naive datetime usage
* Verified PKT alignment (UTC+5)

Example:
```
2026-02-13 02:00:00+00:00
= 07:00 PKT
```

---

## 9️⃣ Social Layer (Validated)

Collections populated and verified:

* matches
* posts
* post_likes
* post_comments
* conversations
* messages
* friend_requests

Referential integrity confirmed:

* All user references exist
* No orphan documents
* No ghost participants

---

## 🔟 system_config (Runtime Control)

Document:
```
system_config/global
```

```json
{
  "schema_version": "1.0",
  "booking_lock_minutes": 10,
  "maintenance_mode": false,
  "payment_verification_mode": "test"
}
```

Purpose:
* Centralized runtime behavior control
* Future-safe toggles
* Version tracking

---

## 1️⃣1️⃣ Seeding Methodology (Standardized)

Seeding now follows strict order:

1. system_config
2. vendors
3. resources
4. services
5. slots
6. users via API
7. bookings via API
8. social data

No direct user injection.
No hardcoded user IDs.
No bypassing business logic.

---

## 1️⃣2️⃣ Structural Integrity Verification

Audit confirmed:

* No ghost user references
* No missing nested maps
* Vendor analytics fields present
* Booking invariants respected
* Slot timestamps correct
* system_config exists
* Density healthy

Collections populated:

* users: 10
* vendors: 11
* slots: 4224
* matches: 3
* posts: 4
* conversations: 3

---

## 1️⃣3️⃣ What We Explicitly Did NOT Add

The following were intentionally excluded to avoid feature creep:

* Loyalty system
* Surge pricing
* Deposits
* Promo codes
* Tournament engine
* Attendance tracking
* Revenue aggregation services
* Match result engine

All future changes must be additive-only.

---

## 1️⃣4️⃣ Expansion Policy (Locked Rule)

From this version forward:

* No changing ID strategy
* No renaming collections
* No altering slot state machine
* No removing required user fields
* No structural rewrites

Only additive fields and new collections.

No future wipe required.

---

## 1️⃣5️⃣ Current Status

Database is:

* Clean
* Unified
* Referentially correct
* Analytics-ready
* Social-ready
* WhatsApp-compatible
* Structurally production-grade

Confidence level: High.

---

## 1️⃣6️⃣ Next Phase

Development focus now shifts to:

* Vendor dashboard
* Frontend API integration
* UX refinement
* Feature expansion (additive only)

**Database foundation is locked.**
