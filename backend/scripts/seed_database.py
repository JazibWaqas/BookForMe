"""
Seed script to populate Firestore with realistic demo data for JHAT app.
Run this script to add users, matches, conversations, and leaderboard data.
"""
import asyncio
from datetime import datetime, timedelta
import random
from google.cloud import firestore
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.firestore import firestore_db

db = firestore_db.db

# Realistic Pakistani/Middle Eastern names for sports app
SEED_USERS = [
    {"name": "Ahmed Malik", "email": "ahmed.malik@example.com", "level": 8, "points": 2450, "bio": "Padel enthusiast | 3x Tournament Winner"},
    {"name": "Sara Khan", "email": "sara.khan@example.com", "level": 7, "points": 2180, "bio": "Tennis & Badminton lover 🎾"},
    {"name": "Omar Hassan", "email": "omar.hassan@example.com", "level": 6, "points": 1920, "bio": "Weekend warrior | Fitness addict"},
    {"name": "Fatima Ali", "email": "fatima.ali@example.com", "level": 6, "points": 1850, "bio": "Padel player | Looking for doubles partners"},
    {"name": "Zain Ahmed", "email": "zain.ahmed@example.com", "level": 5, "points": 1650, "bio": "Love competitive matches 🏆"},
    {"name": "Aisha Noor", "email": "aisha.noor@example.com", "level": 5, "points": 1580, "bio": "New to padel, learning fast!"},
    {"name": "Hassan Raza", "email": "hassan.raza@example.com", "level": 5, "points": 1520, "bio": "Former tennis player, now padel convert"},
    {"name": "Mariam Yousuf", "email": "mariam.yousuf@example.com", "level": 4, "points": 1380, "bio": "Playing for fun and fitness"},
    {"name": "Bilal Sheikh", "email": "bilal.sheikh@example.com", "level": 4, "points": 1290, "bio": "Casual player | Always up for a game"},
    {"name": "Nadia Farooq", "email": "nadia.farooq@example.com", "level": 4, "points": 1180, "bio": "Sports lover | Badminton specialist"},
    {"name": "Imran Qureshi", "email": "imran.qureshi@example.com", "level": 3, "points": 980, "bio": "Just started playing, loving it!"},
    {"name": "Hiba Tariq", "email": "hiba.tariq@example.com", "level": 3, "points": 850, "bio": "Looking for friendly matches"},
    {"name": "Kareem Syed", "email": "kareem.syed@example.com", "level": 3, "points": 720, "bio": "Beginner but dedicated 💪"},
    {"name": "Layla Mahmood", "email": "layla.mahmood@example.com", "level": 2, "points": 540, "bio": "Learning padel, need partners"},
    {"name": "Faisal Aziz", "email": "faisal.aziz@example.com", "level": 2, "points": 380, "bio": "New player, excited to improve"},
]

SPORTS = ["Padel", "Tennis", "Badminton", "Football", "Basketball"]
LOCATIONS = [
    "JHAT Sports Club - Court 1",
    "JHAT Sports Club - Court 2", 
    "Dubai Sports World",
    "Al Quoz Sports Complex",
    "Meydan Tennis Academy",
    "JLT Sports Center",
]

MATCH_DESCRIPTIONS = [
    "Looking for competitive doubles match!",
    "Casual game, all levels welcome",
    "Practice session - beginners friendly",
    "Ranked match - intermediate+ only",
    "Fun weekend game 🎾",
    "Need 2 more for doubles",
]

async def seed_users():
    """Create demo users in Firestore"""
    print("🌱 Seeding users...")
    user_ids = []
    
    for i, user in enumerate(SEED_USERS):
        # Check if user already exists
        existing = db.collection('users').where('email', '==', user['email']).limit(1).stream()
        existing_list = list(existing)
        
        if existing_list:
            user_id = existing_list[0].id
            print(f"  ✓ User {user['name']} already exists")
        else:
            doc_ref = db.collection('users').document()
            user_data = {
                "name": user['name'],
                "email": user['email'],
                "phone": f"+971501234{100+i:03d}",
                "level": user['level'],
                "points": user['points'],
                "bio": user['bio'],
                "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['name'].replace(' ', '')}",
                "created_at": datetime.now() - timedelta(days=random.randint(30, 365)),
                "stats": {
                    "matches_played": random.randint(10, 100),
                    "wins": random.randint(5, 50),
                    "losses": random.randint(5, 50),
                },
                "role": "user",
            }
            doc_ref.set(user_data)
            user_id = doc_ref.id
            print(f"  ✓ Created user: {user['name']}")
        
        user_ids.append(user_id)
    
    return user_ids

async def seed_matches(user_ids):
    """Create demo matches"""
    print("\n🏆 Seeding matches...")
    
    for i in range(10):
        # Random future date within next 7 days
        match_date = datetime.now() + timedelta(days=random.randint(1, 7))
        hour = random.choice([9, 10, 11, 14, 15, 16, 17, 18, 19, 20])
        
        # Pick random participants
        num_participants = random.randint(1, 3)
        participants = random.sample(user_ids[:10], num_participants)
        
        match_data = {
            "sport_type": random.choice(SPORTS),
            "match_type": random.choice(["casual", "ranked"]),
            "date": match_date.strftime("%Y-%m-%d"),
            "time": f"{hour:02d}:00",
            "location": random.choice(LOCATIONS),
            "max_players": random.choice([2, 4, 6]),
            "current_players": num_participants,
            "participants": participants,
            "host_user_id": participants[0],
            "description": random.choice(MATCH_DESCRIPTIONS),
            "status": "open",
            "created_at": datetime.now(),
        }
        
        db.collection('matches').add(match_data)
        print(f"  ✓ Created match: {match_data['sport_type']} on {match_data['date']}")

async def seed_conversations(user_ids):
    """Create demo conversations and messages"""
    print("\n💬 Seeding conversations...")
    
    # Create a few conversations between random users
    conversation_pairs = [
        (0, 1), (0, 2), (1, 3), (2, 4), (0, 5),
    ]
    
    sample_messages = [
        "Hey! Want to play this weekend?",
        "Sure! What time works for you?",
        "How about 4pm on Saturday?",
        "Perfect! See you at JHAT courts",
        "Great game yesterday! 🎾",
        "Thanks! We should play again soon",
        "I'm free tomorrow if you want a rematch",
        "Let's do it! Same time?",
        "Looking for a doubles partner?",
        "Count me in! 💪",
    ]
    
    for idx, (user1_idx, user2_idx) in enumerate(conversation_pairs):
        if user1_idx >= len(user_ids) or user2_idx >= len(user_ids):
            continue
            
        user1_id = user_ids[user1_idx]
        user2_id = user_ids[user2_idx]
        
        # Create conversation
        conv_ref = db.collection('conversations').document()
        conv_data = {
            "participants": [user1_id, user2_id],
            "created_at": datetime.now() - timedelta(days=random.randint(1, 30)),
            "updated_at": datetime.now() - timedelta(hours=random.randint(1, 24)),
            "last_message": sample_messages[idx * 2 + 1] if idx * 2 + 1 < len(sample_messages) else "Hey!",
            "last_message_time": datetime.now() - timedelta(hours=random.randint(1, 24)),
            "unread_count": {user1_id: 0, user2_id: random.randint(0, 3)},
        }
        conv_ref.set(conv_data)
        
        # Add some messages to this conversation
        num_messages = random.randint(3, 8)
        for msg_idx in range(num_messages):
            sender = user1_id if msg_idx % 2 == 0 else user2_id
            msg_time = datetime.now() - timedelta(hours=num_messages - msg_idx)
            
            msg_data = {
                "conversation_id": conv_ref.id,
                "sender_id": sender,
                "content": sample_messages[msg_idx % len(sample_messages)],
                "media_type": "text",
                "created_at": msg_time,
                "read_by": [sender],
            }
            db.collection('messages').add(msg_data)
        
        print(f"  ✓ Created conversation with {num_messages} messages")

async def seed_posts(user_ids):
    """Create demo forum posts"""
    print("\n📝 Seeding forum posts...")
    
    posts_content = [
        {"content": "Just won my first tournament! 🏆 Thanks to everyone who supported me!", "likes": 24},
        {"content": "Looking for partners for doubles this weekend. Level 5+ preferred. DM me!", "likes": 8},
        {"content": "Great session at JHAT today! The new courts are amazing 🎾", "likes": 15},
        {"content": "Any tips for improving my backhand? Struggling with consistency.", "likes": 12},
        {"content": "New to Dubai - where are the best padel courts?", "likes": 6},
        {"content": "Epic match yesterday! Came back from 0-4 to win 6-4 💪", "likes": 31},
        {"content": "Anyone interested in starting a weekly practice group?", "likes": 18},
        {"content": "Just got new gear! Can't wait to test it out this weekend", "likes": 9},
    ]
    
    for idx, post in enumerate(posts_content):
        if idx >= len(user_ids):
            continue
        
        created_time = datetime.now() - timedelta(days=random.randint(0, 14))
        post_data = {
            "user_id": user_ids[idx % len(user_ids)],
            "content": post['content'],
            "type": "general",
            "likes_count": post['likes'],
            "comments_count": random.randint(0, 10),
            "liked_by": random.sample(user_ids[:10], min(post['likes'], 10)),
            "created_at": created_time,
            "updated_at": created_time,
        }
        db.collection('posts').add(post_data)
        print(f"  ✓ Created post: {post['content'][:40]}...")

async def update_leaderboard(user_ids):
    """Ensure leaderboard collection is populated"""
    print("\n📊 Updating leaderboard...")
    
    # Get all users and add them to leaderboard
    users_ref = db.collection('users').stream()
    
    leaderboard_data = []
    for doc in users_ref:
        user = doc.to_dict()
        leaderboard_data.append({
            "id": doc.id,
            "name": user.get('name', 'Unknown'),
            "avatar_url": user.get('avatar_url'),
            "level": user.get('level', 1),
            "points": user.get('points', 0),
        })
    
    # Sort by points
    leaderboard_data.sort(key=lambda x: x['points'], reverse=True)
    
    # Update leaderboard collection (or just use users collection directly)
    for rank, entry in enumerate(leaderboard_data[:20], 1):
        print(f"  #{rank}: {entry['name']} - {entry['points']} pts")
    
    print(f"\n  ✓ Leaderboard has {len(leaderboard_data)} entries")

async def main():
    print("=" * 50)
    print("🚀 JHAT Database Seed Script")
    print("=" * 50)
    
    try:
        user_ids = await seed_users()
        await seed_matches(user_ids)
        await seed_conversations(user_ids)
        await seed_posts(user_ids)
        await update_leaderboard(user_ids)
        
        print("\n" + "=" * 50)
        print("✅ Database seeding complete!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
