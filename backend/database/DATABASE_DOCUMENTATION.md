# Database Documentation

Complete reference guide for the Firestore database schema, collections, relationships, and capabilities.

---

## The Big Picture: What This Database Does

This database powers a sports court booking platform where users can book padel, futsal, cricket, and pickleball courts through either a mobile app or WhatsApp. It also includes social features like finding players, chatting, and competing on leaderboards.

**The Core Problem We Solved**: How do you prevent two people from booking the same slot at the same time when requests come from different places (mobile app and WhatsApp)? The answer is a state machine with transactions.

**How It Works**: Every slot starts as `available`. When someone wants to book it, we `lock` it for 10 minutes. During that time, they upload payment proof and the slot becomes `pending`. The vendor then confirms it, making it `confirmed`. After the game, it becomes `completed`. All of this happens atomically using Firestore transactions, so two people can't grab the same slot.

**The Architecture**: We split the database into two parts. First, the booking system (8 collections) handles vendors, courts, services, slots, and payments. Second, social features (10 collections) handle forum posts, matches, chats, notifications, and reviews. They're separate but connected through user IDs.

**The Flow**: A vendor has multiple physical courts (resources) and offers different services (like "1-hour Padel Rental"). The system auto-generates slots based on operating hours. Users browse available slots, lock one, upload payment, vendor confirms, and the booking is done. Meanwhile, users can post in forums, find matches, chat with each other, and climb leaderboards.

**What Makes It Scalable**: We use denormalized counters (like `likes_count` on posts) so we don't have to count every time. We store booking source (App/WhatsApp/Manual) for analytics. The pricing structure is flexible enough to add peak/off-peak pricing later without changing the schema. Everything is designed so new features can be added without breaking existing ones.

**What's Missing**: Promo codes, match results tracking, friends system, and tournaments aren't implemented yet, but the database structure can accommodate them when needed.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Booking Collections](#core-booking-collections)
3. [Social Features Collections](#social-features-collections)
4. [Collection Relationships](#collection-relationships)
5. [State Machines](#state-machines)
6. [Features Enabled](#features-enabled)
7. [Limitations](#limitations)
8. [Future Additions](#future-additions)
9. [Usage Examples](#usage-examples)

---

## Overview

This is a NoSQL Firestore database designed for a sports court booking platform with social features. The database supports:

- **Dual-App Architecture**: Mobile App (React Native) and WhatsApp AI Agent
- **Concurrency Control**: Optimistic Concurrency Control (OCC) using Firestore Transactions
- **Scalable Design**: Flexible schema that can grow without breaking changes
- **Social Features**: Forum, matches, chat, leaderboard, notifications, reviews

**Total Collections**: 18
- **Core Booking**: 8 collections
- **Social Features**: 10 collections

---

## Core Booking Collections

### 1. `/users`

User accounts for both App users and WhatsApp users.

**Schema:**
```typescript
{
  id: string                    // Document ID
  name: string
  phone: string                 // Unique identifier
  email?: string                // Optional for App users
  password_hash?: string        // Bcrypt hashed password (for email/phone login)
  role: "customer" | "vendor"
  vendor_id?: string            // If role is vendor
  avatar_url?: string           // Profile picture
  online_status: boolean        // Real-time presence
  last_login?: Timestamp        // Last login timestamp
  points?: number               // Leaderboard points
  matches_played?: number       // Total matches
  wins?: number
  losses?: number
  win_rate?: number             // Percentage
  rank?: number                 // Leaderboard rank
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Key Features:**
- Auto-created for WhatsApp users on first contact
- App users can register with email/password or phone/password
- Password authentication via bcrypt hashing
- JWT token-based sessions
- App users can link accounts via phone number
- Supports both customer and vendor roles
- Tracks social stats (points, rank, matches)

**Indexes Needed:**
- `phone` (unique)
- `email` (unique, for login)
- `role`
- `points` (descending, for leaderboard)

---

### 2. `/vendors`

Sports court vendors (Padel, Futsal, Cricket, Pickleball clubs).

**Schema:**
```typescript
{
  id: string                    // Document ID
  name: string
  location: string               // Area: DHA, Clifton, etc.
  address?: string
  phone: string
  email?: string
  whatsapp_phone?: string       // For WhatsApp agent
  description?: string
  images?: string[]              // Cloud Storage URLs
  amenities?: string[]            // ["parking", "cafe", "showers"]
  operating_hours: {
    mon: { open: "07:00", close: "00:00" }
    tue: { open: "07:00", close: "00:00" }
    // ... all days
  }
  rating?: number                // Average from reviews
  review_count?: number          // Total reviews
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Key Features:**
- Operating hours template for slot generation
- Supports multiple locations per vendor
- Rating aggregated from reviews collection

**Indexes Needed:**
- `location`
- `rating` (descending)

---

### 3. `/resources`

Physical courts/pitches that can be booked.

**Schema:**
```typescript
{
  id: string                    // Document ID
  vendor_id: string             // Reference to vendor
  resource_name: string          // "Court 1", "Pitch A"
  capacity?: number              // Max players
  description?: string
  created_at: Timestamp
}
```

**Key Features:**
- Decoupled from services (same court can offer different services)
- Multiple resources per vendor
- Resource name is user-facing

**Indexes Needed:**
- `vendor_id`

---

### 4. `/services`

Product definitions (what users are booking).

**Schema:**
```typescript
{
  id: string                    // Document ID
  vendor_id: string             // Reference to vendor
  service_name: string           // "Padel Court Rental"
  sport_type: "padel" | "futsal" | "cricket" | "pickleball"
  duration_min: number          // Fixed duration (e.g., 60 minutes)
  pricing: {
    base: number                 // Base price (PKR)
    // Future: peak, off_peak, discount tiers
  }
  description?: string
  created_at: Timestamp
}
```

**Key Features:**
- Defines price and duration
- Sport type determines equipment/requirements
- Pricing structure ready for variable pricing (peak/off-peak)

**Indexes Needed:**
- `vendor_id`
- `sport_type`

---

### 5. `/slots`

The core transactional document. Represents availability and bookings.

**Schema:**
```typescript
{
  id: string                    // Document ID
  vendor_id: string
  service_id: string            // Reference to service
  resource_id: string           // Reference to resource
  date: string                  // "2024-12-14"
  start_time: Timestamp         // ISO timestamp
  end_time: Timestamp           // ISO timestamp
  price: number                 // Final price (can override service base)
  price_tier_used: "base" | "peak" | "discount"
  status: "available" | "locked" | "pending" | "confirmed" | "completed" | "cancelled" | "blocked"
  user_id?: string              // Set when locked/pending/confirmed
  booking_source?: "app" | "whatsapp" | "manual"
  payment_id?: string           // Reference to payment document
  hold_expires_at?: Timestamp   // For locked slots (10 min expiry)
  block_reason?: string         // If status is blocked
  customer_name?: string        // For manual bookings
  customer_phone?: string       // For manual bookings
  created_at: Timestamp
  updated_at: Timestamp
  completed_at?: Timestamp      // When status becomes completed
}
```

**Key Features:**
- Single source of truth for availability and bookings
- State machine with OCC (prevents double-booking)
- Supports manual vendor bookings
- Tracks booking source for analytics

**State Transitions:**
- `available` → `locked` (user holds slot)
- `locked` → `pending` (payment proof uploaded)
- `pending` → `confirmed` (vendor approves)
- `pending` → `cancelled` (vendor rejects)
- `confirmed` → `completed` (session done)
- `confirmed` → `cancelled` (user/vendor cancels)
- `available` → `blocked` (vendor maintenance)
- `blocked` → `available` (vendor unblocks)

**Indexes Needed:**
- `vendor_id`, `date`, `status` (composite)
- `service_id`, `date`, `status` (composite)
- `user_id`, `status` (composite)
- `status`, `hold_expires_at` (for cleanup)

---

### 6. `/payments`

Payment proof storage and OCR verification.

**Schema:**
```typescript
{
  id: string                    // Document ID
  slot_id: string               // Reference to slot
  user_id: string               // Who paid
  vendor_id: string             // Who receives payment
  amount: number                // Expected amount
  screenshot_url: string         // Cloud Storage URL
  ocr_status: "pending" | "verified" | "rejected"
  ocr_verified_amount?: number  // AI-extracted amount
  ocr_confidence?: number       // 0-1 confidence score
  status: "uploaded" | "verified" | "rejected"
  rejection_reason?: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Key Features:**
- Separate collection for audit trail
- OCR verification fields for AI processing
- Links to slot via `slot_id`

**Indexes Needed:**
- `slot_id` (unique)
- `user_id`, `status`
- `vendor_id`, `status`

---

### 7. `/vendor_payment_accounts`

Vendor payment methods (JazzCash, EasyPaisa, Bank).

**Schema:**
```typescript
{
  id: string                    // Document ID
  vendor_id: string
  type: "jazzcash" | "easypaisa" | "bank"
  account_number: string
  account_title: string
  bank_name?: string            // If type is bank
  is_default: boolean
  created_at: Timestamp
}
```

**Key Features:**
- Multiple payment methods per vendor
- Default method for display
- Secure storage (separate from vendor document)

**Indexes Needed:**
- `vendor_id`, `is_default`

---

### 8. `/conversation_states`

WhatsApp AI agent conversation tracking.

**Schema:**
```typescript
{
  id: string                    // Document ID (phone number)
  vendor_id: string            // Which vendor's agent
  state: string                 // Current conversation state
  current_slot_id?: string      // Slot being discussed
  hold_expires_at?: Timestamp   // When slot hold expires
  history: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: Timestamp
  }>
  updated_at: Timestamp
}
```

**Key Features:**
- Tracks agent state per phone number
- Prevents double-booking during conversations
- Stores conversation history

**Indexes Needed:**
- `vendor_id`, `updated_at`

---

## Social Features Collections

### 9. `/posts`

Forum posts (looking for players, tips, questions).

**Schema:**
```typescript
{
  id: string                    // Document ID
  user_id: string
  type: "general" | "looking_for_players" | "tip" | "question"
  content: string
  sport_type?: "padel" | "futsal" | "cricket" | "pickleball"
  location?: string
  image_url?: string            // Cloud Storage URL
  likes_count: number          // Denormalized counter
  comments_count: number       // Denormalized counter
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes Needed:**
- `user_id`, `created_at` (descending)
- `type`, `sport_type`, `created_at` (descending)
- `location`, `created_at` (descending)

---

### 10. `/post_comments`

Comments on forum posts.

**Schema:**
```typescript
{
  id: string                    // Document ID
  post_id: string
  user_id: string
  content: string
  likes_count: number
  created_at: Timestamp
}
```

**Indexes Needed:**
- `post_id`, `created_at` (ascending)

---

### 11. `/post_likes`

Likes on posts (separate collection for scalability).

**Schema:**
```typescript
{
  id: string                    // Document ID
  post_id: string
  user_id: string
  created_at: Timestamp
}
```

**Indexes Needed:**
- `post_id`, `user_id` (unique composite)
- `user_id`, `created_at` (descending)

---

### 12. `/matches`

Find-a-match feature (casual/ranked games).

**Schema:**
```typescript
{
  id: string                    // Document ID
  host_user_id: string
  sport_type: "padel" | "futsal" | "cricket" | "pickleball"
  match_type: "casual" | "ranked"
  status: "open" | "full" | "in_progress" | "completed" | "cancelled"
  date: string                  // "2024-12-14"
  time: string                  // "18:00"
  location: string
  venue_id?: string             // Optional vendor reference
  slot_id?: string              // Optional slot reference
  max_players: number
  current_players: number       // Denormalized counter
  description?: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes Needed:**
- `sport_type`, `match_type`, `status`, `date`
- `host_user_id`, `status`
- `venue_id`, `date`

---

### 13. `/match_participants`

Players who joined matches.

**Schema:**
```typescript
{
  id: string                    // Document ID
  match_id: string
  user_id: string
  role: "host" | "player"
  status: "confirmed" | "cancelled"
  joined_at: Timestamp
}
```

**Indexes Needed:**
- `match_id`, `user_id` (unique composite)
- `user_id`, `joined_at` (descending)

---

### 14. `/conversations`

Chat conversations (DMs and groups).

**Schema:**
```typescript
{
  id: string                    // Document ID
  type: "direct" | "group"
  participants: string[]        // Array of user_ids
  name?: string                 // Group name (if type is group)
  last_message?: string
  last_message_time?: Timestamp
  unread_count: {               // Per-user unread counts
    [user_id: string]: number
  }
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes Needed:**
- `participants` (array-contains)
- `type`, `updated_at` (descending)

---

### 15. `/messages`

Individual chat messages.

**Schema:**
```typescript
{
  id: string                    // Document ID
  conversation_id: string
  sender_id: string
  content: string
  read_by: string[]             // Array of user_ids who read it
  created_at: Timestamp
}
```

**Indexes Needed:**
- `conversation_id`, `created_at` (ascending)
- `sender_id`, `created_at` (descending)

---

### 16. `/notifications`

User notifications (booking, social, promo).

**Schema:**
```typescript
{
  id: string                    // Document ID
  user_id: string
  type: "booking_confirmed" | "booking_reminder" | "booking_cancelled" | 
        "payment_received" | "match_request" | "match_joined" | 
        "forum_reply" | "forum_like" | "new_message" | "promo" | "system"
  title: string
  message: string
  read: boolean
  data?: {                      // Flexible metadata
    slot_id?: string
    vendor_id?: string
    match_id?: string
    post_id?: string
    // ... etc
  }
  created_at: Timestamp
}
```

**Indexes Needed:**
- `user_id`, `read`, `created_at` (descending)
- `user_id`, `type`, `created_at` (descending)

---

### 17. `/reviews`

Vendor reviews and ratings.

**Schema:**
```typescript
{
  id: string                    // Document ID
  vendor_id: string
  user_id: string
  slot_id?: string              // Optional booking reference
  rating: number                // 1-5 stars
  title: string
  content: string
  status: "pending" | "approved" | "rejected"
  created_at: Timestamp
}
```

**Indexes Needed:**
- `vendor_id`, `status`, `created_at` (descending)
- `user_id`, `created_at` (descending)

---

### 18. `/chatbot_sessions`

AI chatbot conversation history.

**Schema:**
```typescript
{
  id: string                    // Document ID
  user_id: string
  messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: Timestamp
  }>
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes Needed:**
- `user_id`, `updated_at` (descending)

---

## Collection Relationships

### Entity Relationship Diagram

```
users
  ├── slots (user_id) → bookings
  ├── posts (user_id) → forum posts
  ├── matches (host_user_id) → hosted matches
  ├── match_participants (user_id) → joined matches
  ├── conversations (participants[]) → chats
  ├── messages (sender_id) → sent messages
  ├── notifications (user_id) → alerts
  ├── reviews (user_id) → written reviews
  └── chatbot_sessions (user_id) → AI chat history

vendors
  ├── resources (vendor_id) → physical courts
  ├── services (vendor_id) → product definitions
  ├── slots (vendor_id) → availability/bookings
  ├── vendor_payment_accounts (vendor_id) → payment methods
  ├── reviews (vendor_id) → received reviews
  └── conversation_states (vendor_id) → WhatsApp agent

services
  └── slots (service_id) → bookings for this service

resources
  └── slots (resource_id) → bookings for this court

slots
  ├── payments (slot_id) → payment proof
  └── reviews (slot_id) → optional review link

posts
  ├── post_comments (post_id) → comments
  └── post_likes (post_id) → likes

matches
  └── match_participants (match_id) → players
```

---

## State Machines

### Slot Status Flow

```
┌───────────┐
│ available │
└─────┬─────┘
      │
      ├─[lock_slot()]──────────┐
      │                         │
      ▼                         ▼
┌──────────┐              ┌──────────┐
│  locked  │              │ blocked  │
└─────┬────┘              └────┬─────┘
      │                         │
      │[submit_payment()]       │[unblock_slot()]
      │                         │
      ▼                         ▼
┌──────────┐              ┌──────────┐
│ pending  │              │available │
└─────┬────┘              └──────────┘
      │
      ├─[confirm_booking()]──┐
      │                       │
      ├─[reject_booking()]────┤
      │                       │
      ▼                       ▼
┌──────────┐          ┌──────────┐
│confirmed │          │cancelled │
└─────┬────┘          └──────────┘
      │
      ├─[complete_booking()]──┐
      │                       │
      ├─[cancel_booking()]────┤
      │                       │
      ▼                       ▼
┌──────────┐          ┌──────────┐
│completed │          │cancelled │
└──────────┘          └──────────┘
```

**Key Rules:**
- Only `available` slots can be locked
- `locked` slots auto-expire after 10 minutes
- `pending` requires payment proof
- `confirmed` slots can be completed or cancelled
- `blocked` slots are vendor-maintained (maintenance, private events)

---

## Features Enabled

### Booking System
- ✅ Multi-vendor support
- ✅ Multi-resource per vendor (Court 1, Court 2, etc.)
- ✅ Multi-service per vendor (Padel + Futsal)
- ✅ Slot auto-generation from operating hours
- ✅ Optimistic Concurrency Control (prevents double-booking)
- ✅ 10-minute hold expiry with auto-release
- ✅ Payment proof upload with OCR verification
- ✅ Vendor manual bookings (walk-in, phone)
- ✅ Vendor slot blocking (maintenance, private events)
- ✅ Booking source tracking (App/WhatsApp/Manual)
- ✅ Complete booking lifecycle (available → completed)

### Social Features
- ✅ Forum posts (looking for players, tips, questions)
- ✅ Post likes and comments
- ✅ Find-a-match (casual/ranked)
- ✅ Match participation tracking
- ✅ Direct messages (1:1 chat)
- ✅ Group chats
- ✅ Online status tracking
- ✅ Leaderboard (points, rank, win rate)
- ✅ Notifications (booking, social, promo)
- ✅ Vendor reviews and ratings
- ✅ AI chatbot session history

### Vendor Management
- ✅ Multi-payment method support
- ✅ Operating hours management
- ✅ Calendar view with booking sources
- ✅ Review aggregation
- ✅ Manual booking creation
- ✅ Slot blocking/unblocking

### WhatsApp Integration
- ✅ Per-vendor WhatsApp agent
- ✅ Conversation state tracking
- ✅ Slot hold management
- ✅ Booking via WhatsApp

---

## Limitations

### Current Limitations

1. **Fixed Slot Duration**
   - Slots have fixed duration per service (e.g., 60 min for Padel)
   - Cannot book consecutive slots as single booking (must book separately)
   - **Workaround**: Frontend can group consecutive slots visually

2. **Base Pricing Only**
   - Currently only base price is used
   - Peak/off-peak pricing structure exists but not implemented
   - **Future**: Add pricing tier logic in slot generation

3. **No Promo Codes**
   - No discount code system
   - **Future**: Add `promo_codes` collection

4. **No Match Results**
   - Matches track participation but not scores/winners
   - **Future**: Add `match_results` collection

5. **No Friends/Following**
   - No social graph (friends, followers)
   - **Future**: Add `friendships` or `follows` collection

6. **No Tournament System**
   - No brackets, tournaments, or competitions
   - **Future**: Add `tournaments` collection

7. **Leaderboard Computed On-Demand**
   - No pre-computed leaderboard collection
   - Must query users and sort by points
   - **Future**: Add `leaderboard` collection with Cloud Functions

8. **No Real-Time Chat**
   - Messages stored but no WebSocket/real-time delivery
   - **Future**: Integrate Firebase Realtime Database or Cloud Messaging

9. **No Image Storage Schema**
   - Image URLs stored but no metadata (size, format, etc.)
   - **Future**: Add `media` collection for image metadata

10. **No Analytics Events**
    - No event tracking collection
    - **Future**: Add `analytics_events` collection

---

## Future Additions

### High Priority

1. **Promo Codes Collection**
   ```typescript
   {
     id: string
     code: string
     vendor_id?: string        // Vendor-specific or global
     discount_type: "percentage" | "fixed"
     discount_value: number
     valid_from: Timestamp
     valid_until: Timestamp
     usage_limit?: number
     used_count: number
     is_active: boolean
   }
   ```

2. **Match Results Collection**
   ```typescript
   {
     id: string
     match_id: string
     winner_user_ids: string[]
     scores?: { [user_id: string]: number }
     completed_at: Timestamp
   }
   ```

3. **Leaderboard Collection** (Pre-computed)
   ```typescript
   {
     id: string
     sport_type: string
     period: "daily" | "weekly" | "monthly" | "all_time"
     rankings: Array<{
       user_id: string
       rank: number
       points: number
     }>
     updated_at: Timestamp
   }
   ```

### Medium Priority

4. **Friendships Collection**
   ```typescript
   {
     id: string
     user_id_1: string
     user_id_2: string
     status: "pending" | "accepted" | "blocked"
     created_at: Timestamp
   }
   ```

5. **Tournaments Collection**
   ```typescript
   {
     id: string
     name: string
     sport_type: string
     format: "single_elimination" | "double_elimination" | "round_robin"
     start_date: Timestamp
     end_date: Timestamp
     max_participants: number
     current_participants: number
     bracket_data?: object
   }
   ```

6. **User Preferences Collection**
   ```typescript
   {
     id: string                  // user_id
     notification_settings: {
       booking_updates: boolean
       social_updates: boolean
       promo_emails: boolean
     }
     preferred_sports: string[]
     preferred_locations: string[]
   }
   ```

### Low Priority

7. **Achievements/Badges Collection**
   ```typescript
   {
     id: string
     user_id: string
     achievement_type: string
     unlocked_at: Timestamp
   }
   ```

8. **Media Collection** (Image metadata)
   ```typescript
   {
     id: string
     url: string
     type: "post_image" | "profile_picture" | "vendor_image"
     owner_id: string
     size_bytes: number
     mime_type: string
     created_at: Timestamp
   }
   ```

9. **Analytics Events Collection**
   ```typescript
   {
     id: string
     event_type: string
     user_id?: string
     vendor_id?: string
     metadata: object
     timestamp: Timestamp
   }
   ```

---

## Usage Examples

### Booking Flow (App)

```python
# 1. User searches for available slots
slots = db.collection('slots')\
    .where('vendor_id', '==', 'ace_padel_dha')\
    .where('date', '==', '2024-12-14')\
    .where('status', '==', 'available')\
    .stream()

# 2. User locks a slot
slot_service = SlotService(db)
result = slot_service.lock_slot(
    slot_id='slot_123',
    user_id='user_ahmad',
    booking_source='app'
)

# 3. User uploads payment proof
payment_ref = db.collection('payments').add({
    'slot_id': 'slot_123',
    'user_id': 'user_ahmad',
    'vendor_id': 'ace_padel_dha',
    'amount': 1500,
    'screenshot_url': 'gs://bucket/payment.jpg',
    'ocr_status': 'pending',
    'status': 'uploaded'
})

# 4. Submit payment (moves slot to pending)
slot_service.submit_payment(
    slot_id='slot_123',
    user_id='user_ahmad',
    payment_id=payment_ref.id
)

# 5. Vendor confirms booking
slot_service.confirm_booking(
    slot_id='slot_123',
    vendor_id='ace_padel_dha'
)
```

### Social Features

```python
# Create a forum post
post_ref = db.collection('posts').add({
    'user_id': 'user_ahmad',
    'type': 'looking_for_players',
    'content': 'Looking for doubles partners tomorrow!',
    'sport_type': 'padel',
    'location': 'DHA',
    'likes_count': 0,
    'comments_count': 0
})

# Like a post
db.collection('post_likes').add({
    'post_id': post_ref.id,
    'user_id': 'user_taha'
})

# Update denormalized counter
db.collection('posts').document(post_ref.id).update({
    'likes_count': firestore.Increment(1)
})

# Create a match
match_ref = db.collection('matches').add({
    'host_user_id': 'user_ahmad',
    'sport_type': 'padel',
    'match_type': 'casual',
    'status': 'open',
    'date': '2024-12-15',
    'time': '18:00',
    'location': 'DHA',
    'max_players': 4,
    'current_players': 1
})
```

### Vendor Management

```python
# Block a slot for maintenance
slot_service.block_slot(
    slot_id='slot_456',
    vendor_id='ace_padel_dha',
    reason='Court maintenance'
)

# Create manual booking
slot_service.manual_booking(
    slot_id='slot_789',
    vendor_id='ace_padel_dha',
    customer_name='John Doe',
    customer_phone='+92 333 1234567'
)

# Complete a booking
slot_service.complete_booking(
    slot_id='slot_123',
    vendor_id='ace_padel_dha'
)
```

---

## Best Practices

1. **Always Use Transactions for Slot State Changes**
   - Prevents race conditions
   - Ensures atomicity

2. **Denormalize Counters**
   - Use Cloud Functions to update `likes_count`, `comments_count`, etc.
   - Improves read performance

3. **Index All Query Fields**
   - Composite indexes for complex queries
   - Monitor index usage in Firebase Console

4. **Use Timestamps, Not Strings**
   - Store dates as Firestore Timestamps
   - Easier to query and sort

5. **Validate State Transitions**
   - Check current status before transitions
   - Return clear error messages

6. **Clean Up Expired Locks**
   - Run `cleanup_expired_locks()` periodically
   - Consider Cloud Scheduler for automation

---

## Migration Notes

### Adding New Fields

When adding optional fields to existing collections:

1. **Backward Compatible**: New fields should be optional
2. **Default Values**: Handle missing fields in application code
3. **Migration Script**: Optionally backfill existing documents

### Adding New Collections

1. **No Impact**: New collections don't affect existing ones
2. **Seed Data**: Create seed scripts for test data
3. **Indexes**: Create necessary indexes in Firebase Console

### Breaking Changes

Avoid breaking changes:
- Don't rename required fields
- Don't change enum values
- Don't remove required fields

If breaking changes are necessary:
1. Add new field alongside old one
2. Migrate data gradually
3. Update application code
4. Remove old field after migration

---

## Summary

This database is **production-ready** for MVP with:
- ✅ Complete booking system with concurrency control
- ✅ Full social features implementation
- ✅ Scalable, flexible schema
- ✅ Ready for future enhancements

**Total Collections**: 18
- **Core Booking**: 8 collections
- **Social Features**: 10 collections

**Key Strengths**:
- NoSQL flexibility allows easy additions
- Transaction-based concurrency control
- Denormalized counters for performance
- Clear separation of concerns

**Next Steps**:
- Build REST API layer on top of this schema
- Implement Cloud Functions for denormalized counters
- Add indexes in Firebase Console
- Set up monitoring and alerts
