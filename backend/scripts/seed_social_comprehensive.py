"""
Comprehensive Social Seed Script
Clears all existing social data and populates with realistic test data

Usage: python scripts/seed_social_comprehensive.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import random
from datetime import datetime, timedelta
from google.cloud import firestore
from app.firestore import firestore_db
from scripts.social_data_generators import (
    SAMPLE_USERS, SPORTS, POST_TEMPLATES,
    generate_post_content, generate_comment, generate_chat_message,
    random_datetime_in_past, random_future_datetime, distribute_likes
)

db = firestore_db.db

# Placeholder image URLs (using picsum.photos for random images)
IMAGE_URLS = [
    "https://picsum.photos/seed/sport1/800/600",
    "https://picsum.photos/seed/sport2/800/600",
    "https://picsum.photos/seed/sport3/800/600",
    "https://picsum.photos/seed/sport4/800/600",
    "https://picsum.photos/seed/sport5/800/600",
]

print("=" * 80)
print("🚀 COMPREHENSIVE SOCIAL SEED SCRIPT")
print("=" * 80)

# ============================================================================
# PHASE 1: CLEANUP
# ============================================================================

async def clear_all_social_data():
    """Delete all existing social data"""
    print("\n📝 PHASE 1: Cleaning up existing data...")
    
    collections_to_clear = ['posts', 'comments', 'matches', 'conversations', 'messages', 'friend_requests', 'notifications']
    
    for collection_name in collections_to_clear:
        print(f"   🗑️  Clearing {collection_name}...", end=" ")
        docs = await asyncio.to_thread(lambda: list(db.collection(collection_name).stream()))
        count = 0
        for doc in docs:
            await asyncio.to_thread(doc.reference.delete)
            count += 1
        print(f"✅ Deleted {count} documents")
    
    print("✅ Cleanup complete!\n")

# ============================================================================
# PHASE 2: USER CREATION
# ============================================================================

async def create_test_users(count: int = 15):
    """Create test users with social profiles"""
    print(f"👥 PHASE 2: Creating {count} test users...")
    
    users_collection = db.collection('users')
    created_users = []
    
    for i, user_data in enumerate(SAMPLE_USERS[:count]):
        user_id = f"social_user_{i+1}"
        
        # Check if user exists
        user_doc = await asyncio.to_thread(users_collection.document(user_id).get)
        
        if user_doc.exists:
            print(f"   ✓ User {user_data['name']} already exists")
            created_users.append({'id': user_id, **user_data})
            continue
        
        # Create new user
        user_profile = {
            'name': user_data['name'],
            'email': f"social{i+1}@jhat.com",
            'phone': f"+923{random.randint(100000000, 999999999)}",
            'role': 'customer',
            'created_at': datetime.now(),
            'avatar_url': f"https://i.pravatar.cc/150?u={user_id}",
            
            # Social fields
            'favorite_sports': [user_data['sport']],
            'skill_level': user_data['level'],
            'location': 'Lahore, Pakistan',
            'bio': f"Passionate {user_data['sport']} player. {user_data['level'].capitalize()} level.",
            
            # Gamification (will be updated later)
            'points': 0,
            'level': 1,
            'rank': 0,
            
            # Social stats
            'friends': [],
            'friends_count': 0,
        }
        
        await asyncio.to_thread(users_collection.document(user_id).set, user_profile)
        created_users.append({'id': user_id, **user_data})
        print(f"   ✅ Created: {user_data['name']} ({user_data['sport']})")
    
    print(f"✅ Created {len(created_users)} users\n")
    return created_users

# ============================================================================
# PHASE 3: POSTS, LIKES & COMMENTS
# ============================================================================

async def create_posts(users, count: int = 80):
    """Create posts with realistic content"""
    print(f"📝 PHASE 3: Creating {count} posts...")
    
    posts_collection = db.collection('posts')
    created_posts = []
    
    post_types = ['general', 'looking_for_players', 'tip', 'question']
    
    for i in range(count):
        user = random.choice(users)
        post_type = random.choice(post_types)
        sport = user['sport'] if random.random() < 0.7 else random.choice(SPORTS)
        
        # 30% chance of having an image
        image_url = random.choice(IMAGE_URLS) if random.random() < 0.3 else None
        
        post_data = {
            'user_id': user['id'],
            'type': post_type,
            'content': generate_post_content(post_type, sport),
            'sport_type': sport,
            'created_at': random_datetime_in_past(30),
            'updated_at': datetime.now(),
            'likes': [],
            'likes_count': 0,
            'comments_count': 0,
            'image_url': image_url,
        }
        
        doc_ref = await asyncio.to_thread(posts_collection.add, post_data)
        created_posts.append({'id': doc_ref[1].id, **post_data})
    
    print(f"✅ Created {len(created_posts)} posts\n")
    return created_posts

async def add_likes_to_posts(users, posts, total_likes: int = 300):
    """Distribute likes across posts"""
    print(f"❤️  Adding {total_likes} likes to posts...")
    
    likes_dist = distribute_likes(len(posts), len(users), total_likes)
    actual_likes = 0
    
    for post_idx, user_indices in likes_dist.items():
        if post_idx >= len(posts):
            continue
            
        post = posts[post_idx]
        post_id = post['id']
        likes = [users[idx]['id'] for idx in user_indices if idx < len(users)]
        
        if likes:
            await asyncio.to_thread(
                db.collection('posts').document(post_id).update,
                {
                    'likes': likes,
                    'likes_count': len(likes)
                }
            )
            actual_likes += len(likes)
    
    print(f"✅ Added {actual_likes} likes\n")

async def create_comments(users, posts, count: int = 150):
    """Create comments on posts"""
    print(f"💬 Creating {count} comments...")
    
    comments_collection = db.collection('comments')
    created_count = 0
    
    # Select random posts to comment on (not all posts get comments)
    posts_to_comment = random.sample(posts, k=min(len(posts), count // 2))
    
    for post in posts_to_comment:
        num_comments = random.randint(1, 5)
        
        for _ in range(num_comments):
            if created_count >= count:
                break
                
            commenter = random.choice(users)
            comment_data = {
                'post_id': post['id'],
                'user_id': commenter['id'],
                'content': generate_comment(),
                'created_at': post['created_at'] + timedelta(hours=random.randint(1, 48))
            }
            
            await asyncio.to_thread(comments_collection.add, comment_data)
            created_count += 1
        
        # Update post's comment count
        await asyncio.to_thread(
            db.collection('posts').document(post['id']).update,
            {'comments_count': firestore.Increment(num_comments)}
        )
    
    print(f"✅ Created {created_count} comments\n")

# ============================================================================
# PHASE 4: MATCHES
# ============================================================================

async def create_matches(users, count: int = 25):
    """Create matches with participants"""
    print(f"🏆 PHASE 4: Creating {count} matches...")
    
    matches_collection = db.collection('matches')
    match_statuses = ['open', 'full', 'in_progress', 'completed']
    
    for i in range(count):
        host = random.choice(users)
        sport = host['sport'] if random.random() < 0.6 else random.choice(SPORTS)
        max_players = random.choice([4, 6, 8, 10])
        
        # Determine participants
        num_participants = random.randint(2, max_players)
        participants = random.sample([u['id'] for u in users], k=num_participants)
        if host['id'] not in participants:
            participants[0] = host['id']
        
        # Determine status based on participants
        if num_participants >= max_players:
            status = random.choice(['full', 'in_progress', 'completed'])
        else:
            status = 'open'
        
        # Past or future
        if status in ['completed', 'in_progress']:
            match_date = random_datetime_in_past(14)
        else:
            match_date = random_future_datetime(14)
        
        match_data = {
            'host_user_id': host['id'],
            'sport_type': sport,
            'match_type': random.choice(['casual', 'ranked']),
            'date': match_date.strftime('%Y-%m-%d'),
            'time': f"{random.randint(8, 20):02d}:00",
            'location': 'Lahore Sports Complex',
            'max_players': max_players,
            'current_players': num_participants,
            'participants_ids': participants,
            'status': status,
            'created_at': random_datetime_in_past(30),
            'updated_at': datetime.now(),
        }
        
        await asyncio.to_thread(matches_collection.add, match_data)
    
    print(f"✅ Created {count} matches\n")

# ============================================================================
# PHASE 5: CONVERSATIONS & MESSAGES
# ============================================================================

async def create_conversations_and_messages(users, num_conversations: int = 20, num_messages: int = 250):
    """Create chat conversations with messages"""
    print(f"💬 PHASE 5: Creating {num_conversations} conversations with {num_messages} messages...")
    
    conversations_collection = db.collection('conversations')
    messages_collection = db.collection('messages')
    
    messages_created = 0
    
    for i in range(num_conversations):
        # Direct conversation between 2 users
        participants = random.sample([u['id'] for u in users], k=2)
        
        conv_data = {
            'type': 'direct',
            'participants_ids': participants,
            'created_at': random_datetime_in_past(30),
            'updated_at': datetime.now(),
        }
        
        conv_ref = await asyncio.to_thread(conversations_collection.add, conv_data)
        conv_id = conv_ref[1].id
        
        # Create messages for this conversation
        num_msgs = random.randint(5, 20)
        conversation_start = random_datetime_in_past(20)
        
        for j in range(min(num_msgs, num_messages - messages_created)):
            sender = random.choice(participants)
            
            message_data = {
                'conversation_id': conv_id,
                'sender_id': sender,
                'content': generate_chat_message(),
                'type': 'text',
                'created_at': conversation_start + timedelta(hours=j * 2),
                'read': random.choice([True, False]),
            }
            
            await asyncio.to_thread(messages_collection.add, message_data)
            messages_created += 1
            
            if messages_created >= num_messages:
                break
        
        if messages_created >= num_messages:
            break
    
    print(f"✅ Created {num_conversations} conversations with {messages_created} messages\n")

# ============================================================================
# PHASE 6: FRIEND REQUESTS & LEADERBOARD
# ============================================================================

async def create_friend_requests(users, count: int = 30):
    """Create friend requests between users"""
    print(f"👫 PHASE 6: Creating friend network...")
    
    friend_requests_collection = db.collection('friend_requests')
    users_collection = db.collection('users')
    
    # Create some accepted friendships
    friendships_created = 0
    for i in range(count // 2):
        user1, user2 = random.sample(users, k=2)
        
        # Add to each other's friends list
        user1_doc = users_collection.document(user1['id'])
        user2_doc = users_collection.document(user2['id'])
        
        await asyncio.to_thread(user1_doc.update, {
            'friends': firestore.ArrayUnion([user2['id']]),
            'friends_count': firestore.Increment(1)
        })
        
        await asyncio.to_thread(user2_doc.update, {
            'friends': firestore.ArrayUnion([user1['id']]),
            'friends_count': firestore.Increment(1)
        })
        
        friendships_created += 1
    
    # Create pending friend requests
    requests_created = 0
    for i in range(count // 2):
        sender, receiver = random.sample(users, k=2)
        
        # Make sure they're not already friends
        sender_doc = await asyncio.to_thread(users_collection.document(sender['id']).get)
        sender_friends = sender_doc.to_dict().get('friends', [])
        
        if receiver['id'] not in sender_friends:
            request_data = {
                'from_user_id': sender['id'],
                'to_user_id': receiver['id'],
                'status': 'pending',
                'created_at': random_datetime_in_past(7),
            }
            
            await asyncio.to_thread(friend_requests_collection.add, request_data)
            requests_created += 1
    
    print(f"✅ Created {friendships_created} friendships and {requests_created} pending requests\n")

async def populate_leaderboard_data(users):
    """Update users with leaderboard data"""
    print(f"🏅 Populating leaderboard data for {len(users)} users...")
    
    users_collection = db.collection('users')
    
    # Generate realistic point distribution
    points_list = [random.randint(50, 500) for _ in users]
    points_list.sort(reverse=True)
    
    for idx, user in enumerate(users):
        points = points_list[idx]
        level = min(5, (points // 100) + 1)
        rank = idx + 1
        
        await asyncio.to_thread(
            users_collection.document(user['id']).update,
            {
                'points': points,
                'level': level,
                'rank': rank,
            }
        )
    
    print(f"✅ Leaderboard data populated\n")

# ============================================================================
# PHASE 7: STATISTICS
# ============================================================================

async def print_statistics():
    """Print summary statistics"""
    print("=" * 80)
    print("📊 SEEDING COMPLETE - STATISTICS")
    print("=" * 80)
    
    collections = ['users', 'posts', 'comments', 'matches', 'conversations', 'messages', 'friend_requests']
    
    for collection_name in collections:
        docs = await asyncio.to_thread(lambda: list(db.collection(collection_name).stream()))
        print(f"   {collection_name.capitalize()}: {len(docs)}")
    
    # Additional stats
    posts = await asyncio.to_thread(lambda: list(db.collection('posts').stream()))
    total_likes = sum(len(p.to_dict().get('likes', [])) for p in posts)
    
    print(f"\n   Total Likes: {total_likes}")
    print(f"   Avg Comments per Post: {len(await asyncio.to_thread(lambda: list(db.collection('comments').stream()))) / max(len(posts), 1):.1f}")
    
    print("\n" + "=" * 80)
    print("✅ SEED SCRIPT COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print("\n💡 You can now test the app with realistic social data!\n")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def main():
    """Main execution function"""
    try:
        # Phase 1: Cleanup
        await clear_all_social_data()
        
        # Phase 2: Users
        users = await create_test_users(15)
        
        # Phase 3: Posts, Likes, Comments
        posts = await create_posts(users, 80)
        await add_likes_to_posts(users, posts, 300)
        await create_comments(users, posts, 150)
        
        # Phase 4: Matches
        await create_matches(users, 25)
        
        # Phase 5: Conversations & Messages
        await create_conversations_and_messages(users, 20, 250)
        
        # Phase 6: Friends & Leaderboard
        await create_friend_requests(users, 30)
        await populate_leaderboard_data(users)
        
        # Phase 7: Statistics
        await print_statistics()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
