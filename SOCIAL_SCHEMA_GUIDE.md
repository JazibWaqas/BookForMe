# 🚀 Social & Community Engine: Technical Specification

**Project:** BookForMe

**Objective:** Transition from a booking tool to a **Social Sports Ecosystem**.

**Core Responsibility:** User Registration, Player Identities, Matchmaking, and Community.

---

## 🔗 **Integration Points with Existing System**

### **Existing Collections (DO NOT MODIFY)**
- `/users/{phone}` - Core user auth (phone, name, role)
- `/vendors/{id}` - Sports facilities (11 courts in Karachi)
- `/slots/{id}` - Bookable time slots (60-min intervals)
- `/services/{id}` - Service definitions (padel, futsal, cricket, pickleball)

### **Your New Collections (Create These)**
- `/matches/{id}` - Social matchmaking
- `/conversations/{id}` - Chat threads
- `/messages/{id}` - Individual messages
- `/posts/{id}` - Community forum posts
- `/notifications/{id}` - User notifications

---

## 1. User Identity Enhancement (Extend Existing Users)

**Current `/users/{phone}` structure:**
```json
{
  "phone": "+923001112223",
  "name": "Ahmad Khan",
  "role": "customer",
  "vendor_id": null,
  "created_at": "2025-01-20T10:00:00Z"
}
```

**ADD these social fields to existing users:**

```json
{
  // EXISTING fields (don't touch)
  "phone": "+923001112223",
  "name": "Ahmad Khan",
  "role": "customer",
  "vendor_id": null,
  "created_at": "2025-01-20T10:00:00Z",

  // NEW social fields (add these)
  "bio": "Padel enthusiast in DHA",
  "points": 0,
  "level": 1,
  "skill_rating": 1000.0,
  "avatar_url": "https://i.pravatar.cc/150?u=user_phone",
  "stats": {
    "matches_played": 0,
    "wins": 0,
    "losses": 0,
    "win_rate": 0.0
  },
  "preferences": {
    "favorite_sports": ["padel", "futsal"],
    "skill_level": "intermediate",
    "play_areas": ["DHA", "Clifton"]
  },
  "badges": [],
  "last_active": "2025-01-20T10:00:00Z",
  "is_online": false
}
```

### **🔄 ATOMIC REGISTRATION PROCESS**

**Critical:** User registration must be **atomic** - create user with ALL social fields at once.

**Why Atomic?**
- Prevents partial user creation
- Ensures social features work immediately
- No "patch later" operations that could fail

**Implementation:**
```python
def create_social_user(phone, name, email=None):
    # Use Firestore transaction for atomicity
    @firestore.transactional
    def create_atomic_user(transaction):
        # Check if user exists
        user_ref = firestore_db.db.collection('users').document(phone)
        if user_ref.get(transaction=transaction).exists:
            return {'error': 'User already exists'}

        # Create complete social user document
        user_data = {
            # Core auth fields
            'phone': phone,
            'name': name,
            'email': email or '',
            'role': 'customer',

            # Social fields (all initialized)
            'bio': '',
            'points': 0,
            'level': 1,
            'skill_rating': 1000.0,
            'avatar_url': f'https://i.pravatar.cc/150?u={phone}',
            'stats': {
                'matches_played': 0,
                'wins': 0,
                'losses': 0,
                'win_rate': 0.0
            },
            'preferences': {
                'favorite_sports': [],
                'skill_level': 'beginner',
                'play_areas': ['DHA']  # Default to DHA
            },
            'badges': [],
            'last_active': firestore.SERVER_TIMESTAMP,
            'is_online': True,
            'created_at': firestore.SERVER_TIMESTAMP
        }

        transaction.set(user_ref, user_data)
        return {'success': True, 'user_id': phone}

    # Execute transaction
    transaction = firestore_db.db.transaction()
    result = create_atomic_user(transaction)

    if result.get('success'):
        # Award welcome points
        award_points(phone, 50, 'welcome_bonus')

    return result
```

**Migration for Existing Users:**
```python
def migrate_existing_users():
    # Add social fields to users created before social system
    users = firestore_db.db.collection('users').stream()

    for user_doc in users:
        user_data = user_doc.to_dict()

        # Check if social fields exist
        if 'points' not in user_data:
            # Add social fields
            social_updates = {
                'bio': '',
                'points': 0,
                'level': 1,
                'skill_rating': 1000.0,
                'stats': {'matches_played': 0, 'wins': 0, 'losses': 0, 'win_rate': 0.0},
                'preferences': {'favorite_sports': [], 'skill_level': 'beginner', 'play_areas': ['DHA']},
                'badges': [],
                'last_active': firestore.SERVER_TIMESTAMP,
                'is_online': False
            }

            user_doc.reference.update(social_updates)
            print(f"Migrated user: {user_data.get('name')}")
```

---

## 2. Matchmaking & The "Lobby" System

### **Match Document Schema (`/matches/{id}`)**

```json
{
  "id": "match_123",
  "host_user_id": "+923001112223",
  "sport_type": "padel",
  "match_type": "casual", // "casual" | "ranked"
  "status": "open", // "open" | "full" | "in_progress" | "completed" | "cancelled"
  "title": "Doubles Padel Game",
  "description": "Looking for 2 more players for a fun doubles match",

  // ⚡ DENORMALIZED for Speed (Karachi-First Rule)
  // Store venue info directly to avoid extra fetches when scrolling
  "venue_id": "ace_padel_dha", // Links to existing /vendors collection
  "venue_name": "Ace Padel Club", // DENORMALIZED - fetch once, store here
  "area": "DHA", // DENORMALIZED - for filtering without joins
  "venue_address": "Street 12, Phase 6, DHA, Karachi", // DENORMALIZED

  // Time & Date
  "date": "2025-01-25",
  "time": "18:00",
  "duration_hours": 1,

  // Player Management
  "max_players": 4,
  "current_players": 1,
  "min_skill_level": "beginner",
  "max_skill_level": "advanced",

  // 🎯 BOOKING INTEGRATION (Match-to-Slot Handshake)
  "slot_id": null, // Links to actual /slots booking if confirmed
  "is_booked": false, // Whether physical court is reserved
  "booking_required": true, // If true, prompt user to book when joining

  // Social features
  "tags": ["casual", "doubles", "weekend"],
  "rules": "Standard rules apply",

  // Metadata
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

### **⚡ KARACHI-FIRST PERFORMANCE RULE: Denormalization**

**Why denormalize venue data?**
- Users scroll through 50+ matches on slow mobile connections
- Can't afford 50 extra Firestore reads just to show venue names
- **Solution**: Store `venue_name`, `area`, `venue_address` directly in each match
- **When to update**: If a venue name changes, update all related matches

**Implementation:**
```python
# When creating a match, fetch venue once and store denormalized
venue_doc = firestore_db.db.collection('vendors').document(venue_id).get()
venue_data = venue_doc.to_dict()

match_data = {
    'venue_id': venue_id,
    'venue_name': venue_data.get('name'),  # Denormalized
    'area': venue_data.get('area'),        # Denormalized
    'venue_address': venue_data.get('address'),  # Denormalized
    # ... other fields
}
```

### **Match Participants (`/match_participants/{id}`)**

```json
{
  "id": "mp_123",
  "match_id": "match_123",
  "user_id": "+923001112223",
  "user_name": "Ahmad Khan", // Denormalized
  "role": "host", // "host" | "player"
  "status": "confirmed", // "pending" | "confirmed" | "declined"
  "skill_rating": 1200.5,
  "joined_at": "2025-01-20T10:00:00Z"
}
```

### **🎯 MATCH-TO-SLOT HANDSHAKE (Critical Integration)**

**The Social-to-Booking Conversion Funnel:**

1. **User sees match**: "Casual padel at Ace Club, 9 PM"
2. **User clicks "Join"**: Check `is_booked` status
3. **If `is_booked: false`**: Show popup - *"This match isn't confirmed yet. Book the court now for Rs. 2000?"*
4. **User books court**: Your existing booking API handles payment
5. **Update match**: Set `slot_id` and `is_booked: true`
6. **Notify all players**: "Match is now confirmed with booked court!"

**Implementation:**
```python
# In your match joining endpoint
def join_match(match_id, user_id):
    match = get_match(match_id)

    if not match['is_booked'] and match['booking_required']:
        # Return booking prompt to frontend
        return {
            'requires_booking': True,
            'venue_name': match['venue_name'],
            'date': match['date'],
            'time': match['time'],
            'estimated_price': 2000  # Calculate from venue + time
        }

    # If already booked, just add user to participants
    add_participant(match_id, user_id)
    return {'success': True}
```

**API Endpoints to Create:**
```python
POST /api/social/matches - Create new match
POST /api/social/matches/{id}/join - Join existing match (with booking prompt)
POST /api/social/matches/{id}/confirm-booking - Convert social match to booked match
GET /api/social/matches?area=DHA&sport=padel - Browse matches
```

---

## 3. Player Ranking & Gamification System

### **Point System Implementation**

**Points are awarded for:**
- **Booking a court:** +10 points
- **Completing a match:** +25 points
- **Winning a match:** +50 points (on top of completion)
- **Creating a social post:** +5 points
- **Getting a like on post:** +1 point
- **Referring a friend:** +100 points

**Level Progression:**
- Level 1: 0-99 points
- Level 2: 100-249 points
- Level 3: 250-499 points
- etc. (exponential scaling)

### **Skill Rating (Elo System)**

**For ranked matches only:**
```python
def update_skill_ratings(winner_rating, loser_rating, k_factor=32):
    expected_win = 1 / (1 + 10**((loser_rating - winner_rating) / 400))
    winner_new = winner_rating + k_factor * (1 - expected_win)
    loser_new = loser_rating + k_factor * (0 - (1 - expected_win))
    return winner_new, loser_new
```

**Skill brackets:**
- Beginner: 800-1199
- Intermediate: 1200-1599
- Advanced: 1600-1999
- Expert: 2000+

### **Leaderboard Queries**

```python
# City-wide leaderboard
users_ref.order_by('points', direction='desc').limit(50)

# Skill-based rankings
users_ref.where('skill_rating', '>=', 1200).order_by('skill_rating', direction='desc')

# Friend rankings (if you implement friends later)
# users_ref.where('friends', 'array_contains', current_user_id).order_by('points')
```

### **Match Result Recording**

**After a match ends, update:**
```json
// Update winner
{
  "stats.matches_played": firestore.FieldValue.increment(1),
  "stats.wins": firestore.FieldValue.increment(1),
  "points": firestore.FieldValue.increment(50),
  "skill_rating": new_rating
}

// Update loser
{
  "stats.matches_played": firestore.FieldValue.increment(1),
  "stats.losses": firestore.FieldValue.increment(1),
  "points": firestore.FieldValue.increment(25),
  "skill_rating": new_rating
}
```

---

## 4. Chat & Messaging System

### **Conversations Collection (`/conversations/{id}`)**

```json
{
  "id": "conv_123",
  "type": "direct", // "direct" | "group"
  "participants": ["+923001112223", "+923002223334"],
  "participant_names": {
    "+923001112223": "Ahmad Khan",
    "+923002223334": "Sara Ahmed"
  },
  "name": null, // For group chats: "Padel Squad DHA"
  "description": null, // Group description
  "avatar_url": null,

  // Last message info
  "last_message": "Anyone up for padel tomorrow?",
  "last_message_sender": "+923001112223",
  "last_message_time": "2025-01-20T15:30:00Z",

  // Unread counts
  "unread_count": {
    "+923001112223": 0,
    "+923002223334": 2
  },

  // Metadata
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T15:30:00Z",
  "created_by": "+923001112223"
}
```

### **Messages Collection (`/messages/{id}`)**

```json
{
  "id": "msg_123",
  "conversation_id": "conv_123",
  "sender_id": "+923001112223",
  "sender_name": "Ahmad Khan", // Denormalized
  "content": "Hey, anyone free for padel at Ace Club tomorrow evening?",
  "message_type": "text", // "text" | "image" | "location"
  "reply_to": null, // Message ID if replying
  "read_by": ["+923001112223"], // Array of user IDs
  "edited_at": null,
  "created_at": "2025-01-20T15:30:00Z"
}
```

### **Chat API Endpoints**

```python
POST /api/social/conversations - Create new conversation
POST /api/social/conversations/{id}/messages - Send message
GET /api/social/conversations - List user's conversations
GET /api/social/conversations/{id}/messages - Get message history
PUT /api/social/conversations/{id}/read - Mark as read
```

---

## 5. Community Forums & Social Feed

### **Posts Collection (`/posts/{id}`)**

```json
{
  "id": "post_123",
  "user_id": "+923001112223",
  "user_name": "Ahmad Khan", // Denormalized
  "user_avatar": "https://i.pravatar.cc/150?u=user",

  "type": "general", // "general" | "looking_for_players" | "tip" | "question"
  "title": "Best padel rackets in Karachi?",
  "content": "Looking for recommendations for intermediate-level rackets under 50k PKR",

  "sport_type": "padel", // null for general posts
  "location": "DHA", // null for general posts

  // Social metrics
  "likes_count": 12,
  "comments_count": 5,
  "shares_count": 2,

  // Media
  "images": ["https://example.com/racket.jpg"],
  "tags": ["gear", "padel", "recommendations"],

  // Engagement
  "is_pinned": false,
  "is_featured": false,

  "created_at": "2025-01-20T14:00:00Z",
  "updated_at": "2025-01-20T14:00:00Z"
}
```

### **Comments Subcollection (`/posts/{post_id}/comments/{id}`)**

```json
{
  "id": "comment_123",
  "post_id": "post_123",
  "user_id": "+923001112223",
  "user_name": "Sara Ahmed",
  "content": "Check out the Wilson Hyper Hammer. Great for intermediates!",
  "likes_count": 3,
  "parent_comment_id": null, // For nested replies
  "created_at": "2025-01-20T14:30:00Z"
}
```

### **Likes Collection (`/post_likes/{id}`)**

```json
{
  "id": "like_123",
  "post_id": "post_123", // Or comment_id
  "user_id": "+923001112223",
  "created_at": "2025-01-20T14:15:00Z"
}
```

---

## 6. Notifications System

### **Notifications Collection (`/notifications/{id}`)**

```json
{
  "id": "notif_123",
  "user_id": "+923001112223",
  "type": "match_invite", // See enum below
  "title": "Match Invitation",
  "message": "Ahmad invited you to join a padel match",
  "is_read": false,

  // Context data
  "data": {
    "match_id": "match_123",
    "sender_name": "Ahmad Khan"
  },

  "created_at": "2025-01-20T15:00:00Z",
  "expires_at": "2025-01-27T15:00:00Z" // Auto-cleanup
}
```

**Notification Types:**
- `match_invite` - Invited to join a match
- `match_full` - Match you joined is now full
- `match_starting` - Match is about to start
- `forum_reply` - Someone replied to your post
- `forum_like` - Someone liked your post
- `friend_request` - New friend request (future)
- `achievement` - Unlocked a badge or level
- `leaderboard` - Moved up in rankings

---

## ⚠️ **CRITICAL: Database Boundaries**

### **SAFE ZONE (You Can Modify)**
- ✅ Add new collections (`matches`, `conversations`, `messages`, `posts`, `notifications`)
- ✅ Add social fields to existing `/users` documents
- ✅ Create subcollections under your new documents
- ✅ Read from existing collections (`vendors`, `slots`, `services`)

### **DANGER ZONE (DO NOT TOUCH)**
- ❌ Modify existing `/users` auth fields (phone, role, vendor_id)
- ❌ Change `/vendors` structure or data
- ❌ Modify `/slots` documents or creation logic
- ❌ Alter `/services` or `/resources` data
- ❌ Change booking system APIs

### **READ-ONLY Collections**
If you need vendor info for matchmaking, **fetch it** - don't store it:

```python
# SAFE: Fetch vendor info when needed
vendor = firestore_db.db.collection('vendors').document(venue_id).get()
venue_name = vendor.get('name')
```

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Foundation (Week 1-2)**
1. **Extend user profiles** with social fields
2. **Create match creation/joining** system
3. **Build basic leaderboard** queries

### **Phase 2: Social Features (Week 3-4)**
1. **Implement chat system** (conversations + messages)
2. **Build community forums** (posts + comments + likes)
3. **Add notifications** system

### **Phase 3: Gamification (Week 5-6)**
1. **Point system** implementation
2. **Elo skill ratings** for ranked matches
3. **Badge/achievement** system

### **Phase 4: Integration (Week 7-8)**
1. **Link matches to bookings** (slot_id integration)
2. **Real-time features** (online status, typing indicators)
3. **Advanced matchmaking** (skill-based matching)

---

## 🧪 **Testing & Seed Data**

### **Generate Test Users Script**

```python
# backend/scripts/seed_social_users.py
def create_test_users():
    users = [
        {"phone": "+923331119999", "name": "Ahmad Social", "points": 450, "skill_rating": 1250},
        {"phone": "+923332229999", "name": "Fatima Social", "points": 380, "skill_rating": 1100},
        {"phone": "+923333339999", "name": "Zain Social", "points": 520, "skill_rating": 1350},
        # Add 50+ more with varied stats
    ]
    # Implementation here
```

### **Seed Social Data**

```python
# backend/scripts/seed_social_data.py
def create_sample_matches():
    # Create matches with different statuses
    # Link some to actual booked slots

def create_sample_posts():
    # Create forum posts about different sports
    # Add comments and likes
```

---

## 🔗 **API Integration Points**

Your social features should integrate with existing booking flow:

1. **After booking a court**: Auto-create a match or post about it
2. **Match completion**: Update player stats and ratings
3. **Venue integration**: Show social activity per venue
4. **User profiles**: Link booking history with social activity

---

## 📊 **Success Metrics**

- **User engagement**: Daily active users, session length
- **Match completion rate**: % of social matches that happen
- **Community growth**: Posts/comments per day
- **Retention**: Users returning for social features

This transforms BookForMe from a booking app into a **thriving sports community** where players connect, compete, and grow together.

