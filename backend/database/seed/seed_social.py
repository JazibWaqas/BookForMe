"""
Seed script for social features
Run after seed_all.py to populate social collections
"""

import os
import sys
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from google.cloud import firestore

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_firestore_client():
    from app.config import settings
    import json
    import tempfile
    
    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        creds_data = json.loads(settings.GOOGLE_APPLICATION_CREDENTIALS)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(creds_data, f)
            temp_file = f.name
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file
    else:
        creds_file = settings.FIRESTORE_CREDENTIALS_FILE
        if not os.path.isabs(creds_file):
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            creds_file = os.path.join(backend_dir, 'credentials', 'firestore-service-account.json')
        
        if os.path.exists(creds_file):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_file
    
    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)


def seed_posts(db):
    from database.seed.social_data import POSTS_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding posts collection...")
    
    for post in POSTS_DATA:
        post_doc = {
            "user_id": post["user_id"],
            "type": post["type"],
            "content": post["content"],
            "sport_type": post["sport_type"],
            "location": post["location"],
            "likes_count": post["likes_count"],
            "comments_count": post["comments_count"],
            "image_url": post["image_url"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.POSTS).document(post["id"]).set(post_doc)
        logger.info(f"  Created post: {post['id']}")
    
    logger.info(f"Seeded {len(POSTS_DATA)} posts")


def seed_post_comments(db):
    from database.seed.social_data import POST_COMMENTS_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding post_comments collection...")
    
    for comment in POST_COMMENTS_DATA:
        comment_doc = {
            "post_id": comment["post_id"],
            "user_id": comment["user_id"],
            "content": comment["content"],
            "likes_count": comment["likes_count"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.POST_COMMENTS).document(comment["id"]).set(comment_doc)
    
    logger.info(f"Seeded {len(POST_COMMENTS_DATA)} comments")


def seed_post_likes(db):
    from database.seed.social_data import POST_LIKES_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding post_likes collection...")
    
    for like in POST_LIKES_DATA:
        like_doc = {
            "post_id": like["post_id"],
            "user_id": like["user_id"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.POST_LIKES).document(like["id"]).set(like_doc)
    
    logger.info(f"Seeded {len(POST_LIKES_DATA)} likes")


def seed_matches(db):
    from database.seed.social_data import MATCHES_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding matches collection...")
    
    for match in MATCHES_DATA:
        match_doc = {
            "host_user_id": match["host_user_id"],
            "sport_type": match["sport_type"],
            "match_type": match["match_type"],
            "status": match["status"],
            "date": match["date"],
            "time": match["time"],
            "location": match["location"],
            "venue_id": match["venue_id"],
            "max_players": match["max_players"],
            "current_players": match["current_players"],
            "description": match["description"],
            "slot_id": match["slot_id"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.MATCHES).document(match["id"]).set(match_doc)
        logger.info(f"  Created match: {match['id']}")
    
    logger.info(f"Seeded {len(MATCHES_DATA)} matches")


def seed_match_participants(db):
    from database.seed.social_data import MATCH_PARTICIPANTS_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding match_participants collection...")
    
    for mp in MATCH_PARTICIPANTS_DATA:
        mp_doc = {
            "match_id": mp["match_id"],
            "user_id": mp["user_id"],
            "role": mp["role"],
            "status": mp["status"],
            "joined_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.MATCH_PARTICIPANTS).document(mp["id"]).set(mp_doc)
    
    logger.info(f"Seeded {len(MATCH_PARTICIPANTS_DATA)} participants")


def seed_conversations(db):
    from database.seed.social_data import CONVERSATIONS_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding conversations collection...")
    
    for conv in CONVERSATIONS_DATA:
        conv_doc = {
            "type": conv["type"],
            "participants": conv["participants"],
            "name": conv["name"],
            "last_message": conv["last_message"],
            "last_message_time": conv["last_message_time"],
            "unread_count": conv["unread_count"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.CONVERSATIONS).document(conv["id"]).set(conv_doc)
        logger.info(f"  Created conversation: {conv['id']}")
    
    logger.info(f"Seeded {len(CONVERSATIONS_DATA)} conversations")


def seed_messages(db):
    from database.seed.social_data import MESSAGES_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding messages collection...")
    
    for msg in MESSAGES_DATA:
        msg_doc = {
            "conversation_id": msg["conversation_id"],
            "sender_id": msg["sender_id"],
            "content": msg["content"],
            "read_by": msg["read_by"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.MESSAGES).document(msg["id"]).set(msg_doc)
    
    logger.info(f"Seeded {len(MESSAGES_DATA)} messages")


def seed_notifications(db):
    from database.seed.social_data import NOTIFICATIONS_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding notifications collection...")
    
    for notif in NOTIFICATIONS_DATA:
        notif_doc = {
            "user_id": notif["user_id"],
            "type": notif["type"],
            "title": notif["title"],
            "message": notif["message"],
            "read": notif["read"],
            "data": notif["data"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.NOTIFICATIONS).document(notif["id"]).set(notif_doc)
        logger.info(f"  Created notification: {notif['title']}")
    
    logger.info(f"Seeded {len(NOTIFICATIONS_DATA)} notifications")


def seed_reviews(db):
    from database.seed.social_data import REVIEWS_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding reviews collection...")
    
    for review in REVIEWS_DATA:
        review_doc = {
            "vendor_id": review["vendor_id"],
            "user_id": review["user_id"],
            "slot_id": review["slot_id"],
            "rating": review["rating"],
            "title": review["title"],
            "content": review["content"],
            "status": review["status"],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.REVIEWS).document(review["id"]).set(review_doc)
        logger.info(f"  Created review for: {review['vendor_id']}")
    
    logger.info(f"Seeded {len(REVIEWS_DATA)} reviews")


def seed_chatbot_sessions(db):
    from database.seed.social_data import CHATBOT_SESSIONS_DATA
    from database.schema_social import SocialCollections
    
    logger.info("Seeding chatbot_sessions collection...")
    
    for session in CHATBOT_SESSIONS_DATA:
        session_doc = {
            "user_id": session["user_id"],
            "messages": session["messages"],
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        db.collection(SocialCollections.CHATBOT_SESSIONS).document(session["id"]).set(session_doc)
    
    logger.info(f"Seeded {len(CHATBOT_SESSIONS_DATA)} chatbot sessions")


def update_user_stats(db):
    from database.seed.social_data import USER_STATS_DATA
    from database.schema import Collections
    
    logger.info("Updating user stats...")
    
    for user_id, stats in USER_STATS_DATA.items():
        db.collection(Collections.USERS).document(user_id).update({
            "points": stats["points"],
            "matches_played": stats["matches_played"],
            "wins": stats["wins"],
            "losses": stats["losses"],
            "win_rate": stats["win_rate"],
            "rank": stats["rank"],
            "avatar_url": f"https://i.pravatar.cc/150?u={user_id}",
            "online_status": False
        })
        logger.info(f"  Updated stats for: {user_id}")
    
    logger.info(f"Updated {len(USER_STATS_DATA)} user stats")


def seed_social_all():
    logger.info("=" * 60)
    logger.info("Starting Social Features seed process")
    logger.info("=" * 60)
    
    try:
        db = get_firestore_client()
        logger.info("Firestore client initialized")
        
        seed_posts(db)
        seed_post_comments(db)
        seed_post_likes(db)
        seed_matches(db)
        seed_match_participants(db)
        seed_conversations(db)
        seed_messages(db)
        seed_notifications(db)
        seed_reviews(db)
        seed_chatbot_sessions(db)
        update_user_stats(db)
        
        logger.info("=" * 60)
        logger.info("Social features seed completed successfully")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"Seed process failed: {e}")
        raise


if __name__ == "__main__":
    seed_social_all()
