"""
Social features seed data for Firestore
Includes posts, matches, conversations, notifications, reviews
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta
from database.schema_social import (
    PostType, MatchType, MatchStatus, ConversationType, 
    NotificationType, ReviewStatus
)
from database.schema import SportType


POSTS_DATA = [
    {
        "id": "post_1",
        "user_id": "user_ahmad",
        "type": PostType.LOOKING_FOR_PLAYERS.value,
        "content": "Looking for doubles partners for tomorrow evening at DHA courts. Anyone interested?",
        "sport_type": SportType.PADEL.value,
        "location": "DHA",
        "likes_count": 12,
        "comments_count": 5,
        "image_url": None
    },
    {
        "id": "post_2",
        "user_id": "user_sara",
        "type": PostType.GENERAL.value,
        "content": "Just finished an amazing match at Ace Padel Club! The new courts are fantastic. Highly recommend!",
        "sport_type": SportType.PADEL.value,
        "location": "DHA",
        "likes_count": 24,
        "comments_count": 8,
        "image_url": None
    },
    {
        "id": "post_3",
        "user_id": "user_bilal",
        "type": PostType.QUESTION.value,
        "content": "Tips for improving backhand? Been struggling lately... Any coaches available?",
        "sport_type": SportType.PADEL.value,
        "location": None,
        "likes_count": 18,
        "comments_count": 12,
        "image_url": None
    },
    {
        "id": "post_4",
        "user_id": "user_taha",
        "type": PostType.TIP.value,
        "content": "Pro tip: Always warm up for at least 10 minutes before playing. Prevents injuries and improves performance!",
        "sport_type": None,
        "location": None,
        "likes_count": 45,
        "comments_count": 3,
        "image_url": None
    }
]


POST_COMMENTS_DATA = [
    {
        "id": "comment_1",
        "post_id": "post_1",
        "user_id": "user_taha",
        "content": "I'm in! What time are you thinking?",
        "likes_count": 2
    },
    {
        "id": "comment_2",
        "post_id": "post_1",
        "user_id": "user_maryam",
        "content": "Count me in too! Been looking for padel partners.",
        "likes_count": 1
    },
    {
        "id": "comment_3",
        "post_id": "post_2",
        "user_id": "user_ahmad",
        "content": "Agreed! Their courts are top notch.",
        "likes_count": 3
    },
    {
        "id": "comment_4",
        "post_id": "post_3",
        "user_id": "user_sara",
        "content": "Try focusing on your grip and follow through. Happy to help if you want to practice!",
        "likes_count": 5
    }
]


POST_LIKES_DATA = [
    {"id": "like_1", "post_id": "post_1", "user_id": "user_taha"},
    {"id": "like_2", "post_id": "post_1", "user_id": "user_sara"},
    {"id": "like_3", "post_id": "post_2", "user_id": "user_ahmad"},
    {"id": "like_4", "post_id": "post_2", "user_id": "user_bilal"},
    {"id": "like_5", "post_id": "post_3", "user_id": "user_maryam"},
]


now = datetime.now()
tomorrow = now + timedelta(days=1)
day_after = now + timedelta(days=2)

MATCHES_DATA = [
    {
        "id": "match_1",
        "host_user_id": "user_ahmad",
        "sport_type": SportType.PADEL.value,
        "match_type": MatchType.CASUAL.value,
        "status": MatchStatus.OPEN.value,
        "date": tomorrow.strftime("%Y-%m-%d"),
        "time": "18:00",
        "location": "DHA",
        "venue_id": "ace_padel_dha",
        "max_players": 4,
        "current_players": 2,
        "description": "Casual doubles game, all skill levels welcome!",
        "slot_id": None
    },
    {
        "id": "match_2",
        "host_user_id": "user_sara",
        "sport_type": SportType.PADEL.value,
        "match_type": MatchType.RANKED.value,
        "status": MatchStatus.OPEN.value,
        "date": day_after.strftime("%Y-%m-%d"),
        "time": "08:00",
        "location": "Clifton",
        "venue_id": "smash_padel_clifton",
        "max_players": 4,
        "current_players": 3,
        "description": "Competitive match for intermediate+ players",
        "slot_id": None
    },
    {
        "id": "match_3",
        "host_user_id": "user_bilal",
        "sport_type": SportType.FUTSAL.value,
        "match_type": MatchType.CASUAL.value,
        "status": MatchStatus.OPEN.value,
        "date": day_after.strftime("%Y-%m-%d"),
        "time": "19:00",
        "location": "Gulshan",
        "venue_id": "goal_zone_gulshan",
        "max_players": 10,
        "current_players": 6,
        "description": "5v5 friendly futsal game",
        "slot_id": None
    }
]


MATCH_PARTICIPANTS_DATA = [
    {"id": "mp_1", "match_id": "match_1", "user_id": "user_ahmad", "role": "host", "status": "confirmed"},
    {"id": "mp_2", "match_id": "match_1", "user_id": "user_taha", "role": "player", "status": "confirmed"},
    {"id": "mp_3", "match_id": "match_2", "user_id": "user_sara", "role": "host", "status": "confirmed"},
    {"id": "mp_4", "match_id": "match_2", "user_id": "user_maryam", "role": "player", "status": "confirmed"},
    {"id": "mp_5", "match_id": "match_2", "user_id": "user_bilal", "role": "player", "status": "confirmed"},
    {"id": "mp_6", "match_id": "match_3", "user_id": "user_bilal", "role": "host", "status": "confirmed"},
    {"id": "mp_7", "match_id": "match_3", "user_id": "user_ahmad", "role": "player", "status": "confirmed"},
    {"id": "mp_8", "match_id": "match_3", "user_id": "user_taha", "role": "player", "status": "confirmed"},
]


CONVERSATIONS_DATA = [
    {
        "id": "conv_1",
        "type": ConversationType.DIRECT.value,
        "participants": ["user_ahmad", "user_taha"],
        "name": None,
        "last_message": "See you tomorrow!",
        "last_message_time": now - timedelta(minutes=10),
        "unread_count": {"user_ahmad": 0, "user_taha": 2}
    },
    {
        "id": "conv_2",
        "type": ConversationType.GROUP.value,
        "participants": ["user_ahmad", "user_taha", "user_sara", "user_bilal"],
        "name": "Padel Squad",
        "last_message": "Who's in for Saturday?",
        "last_message_time": now - timedelta(hours=1),
        "unread_count": {"user_ahmad": 5, "user_taha": 0, "user_sara": 3, "user_bilal": 5}
    },
    {
        "id": "conv_3",
        "type": ConversationType.DIRECT.value,
        "participants": ["user_ahmad", "user_sara"],
        "name": None,
        "last_message": "Thanks for the game!",
        "last_message_time": now - timedelta(hours=2),
        "unread_count": {"user_ahmad": 0, "user_sara": 0}
    }
]


MESSAGES_DATA = [
    {
        "id": "msg_1",
        "conversation_id": "conv_1",
        "sender_id": "user_ahmad",
        "content": "Hey, are we still on for tomorrow?",
        "read_by": ["user_ahmad"]
    },
    {
        "id": "msg_2",
        "conversation_id": "conv_1",
        "sender_id": "user_taha",
        "content": "Yes! 6 PM at Ace Padel right?",
        "read_by": ["user_ahmad", "user_taha"]
    },
    {
        "id": "msg_3",
        "conversation_id": "conv_1",
        "sender_id": "user_ahmad",
        "content": "See you tomorrow!",
        "read_by": ["user_ahmad"]
    },
    {
        "id": "msg_4",
        "conversation_id": "conv_2",
        "sender_id": "user_taha",
        "content": "Who's in for Saturday?",
        "read_by": ["user_taha"]
    }
]


NOTIFICATIONS_DATA = [
    {
        "id": "notif_1",
        "user_id": "user_ahmad",
        "type": NotificationType.BOOKING_CONFIRMED.value,
        "title": "Booking Confirmed",
        "message": "Your booking at Ace Padel Club for tomorrow at 6:00 PM has been confirmed.",
        "read": False,
        "data": {"slot_id": "some_slot_id", "vendor_id": "ace_padel_dha"}
    },
    {
        "id": "notif_2",
        "user_id": "user_ahmad",
        "type": NotificationType.PROMO.value,
        "title": "20% Off Weekend Slots",
        "message": "Book any weekend slot this week and get 20% off!",
        "read": False,
        "data": {"promo_code": "WEEKEND20"}
    },
    {
        "id": "notif_3",
        "user_id": "user_ahmad",
        "type": NotificationType.MATCH_REQUEST.value,
        "title": "New Match Request",
        "message": "Taha Hussain wants to play Padel with you on Saturday.",
        "read": True,
        "data": {"match_id": "match_1", "from_user_id": "user_taha"}
    },
    {
        "id": "notif_4",
        "user_id": "user_taha",
        "type": NotificationType.BOOKING_REMINDER.value,
        "title": "Booking Reminder",
        "message": "Your booking at Elite Futsal Arena is tomorrow at 7:00 PM.",
        "read": True,
        "data": {"slot_id": "some_slot_id"}
    },
    {
        "id": "notif_5",
        "user_id": "user_sara",
        "type": NotificationType.FORUM_REPLY.value,
        "title": "New Forum Reply",
        "message": "Ahmad Khan replied to your post.",
        "read": True,
        "data": {"post_id": "post_2", "comment_id": "comment_3"}
    }
]


REVIEWS_DATA = [
    {
        "id": "review_1",
        "vendor_id": "ace_padel_dha",
        "user_id": "user_ahmad",
        "slot_id": None,
        "rating": 5,
        "title": "Excellent facility!",
        "content": "Best padel courts in DHA. Clean, well-maintained, and great staff.",
        "status": ReviewStatus.APPROVED.value
    },
    {
        "id": "review_2",
        "vendor_id": "ace_padel_dha",
        "user_id": "user_sara",
        "slot_id": None,
        "rating": 4,
        "title": "Great courts, slightly expensive",
        "content": "Courts are top notch but pricing is on the higher side. Worth it for special occasions.",
        "status": ReviewStatus.APPROVED.value
    },
    {
        "id": "review_3",
        "vendor_id": "elite_futsal_clifton",
        "user_id": "user_bilal",
        "slot_id": None,
        "rating": 5,
        "title": "Perfect for futsal",
        "content": "Floodlights are great for evening games. Pitch is well maintained.",
        "status": ReviewStatus.APPROVED.value
    },
    {
        "id": "review_4",
        "vendor_id": "golden_court_dha",
        "user_id": "user_taha",
        "slot_id": None,
        "rating": 4,
        "title": "Good value",
        "content": "Affordable pricing and decent courts. Good for casual games.",
        "status": ReviewStatus.APPROVED.value
    }
]


CHATBOT_SESSIONS_DATA = [
    {
        "id": "chat_session_1",
        "user_id": "user_ahmad",
        "messages": [
            {"role": "user", "content": "Find me cheap padel courts in DHA", "timestamp": now - timedelta(hours=2)},
            {"role": "assistant", "content": "I found 3 padel courts in DHA...", "timestamp": now - timedelta(hours=2)}
        ]
    },
    {
        "id": "chat_session_2",
        "user_id": "user_sara",
        "messages": [
            {"role": "user", "content": "What futsal courts are available tomorrow evening?", "timestamp": now - timedelta(days=1)},
            {"role": "assistant", "content": "Here are the available futsal courts for tomorrow evening...", "timestamp": now - timedelta(days=1)}
        ]
    }
]


USER_STATS_DATA = {
    "user_ahmad": {"points": 1250, "matches_played": 45, "wins": 28, "losses": 17, "win_rate": 62, "rank": 12},
    "user_taha": {"points": 980, "matches_played": 32, "wins": 18, "losses": 14, "win_rate": 56, "rank": 24},
    "user_sara": {"points": 1450, "matches_played": 58, "wins": 42, "losses": 16, "win_rate": 72, "rank": 5},
    "user_maryam": {"points": 850, "matches_played": 25, "wins": 14, "losses": 11, "win_rate": 56, "rank": 35},
    "user_bilal": {"points": 1100, "matches_played": 40, "wins": 24, "losses": 16, "win_rate": 60, "rank": 18}
}


LEADERBOARD_DATA = [
    {"rank": 1, "user_id": "leader_1", "name": "Hassan Raza", "points": 2450, "matches": 120, "win_rate": 78, "sport": SportType.PADEL.value},
    {"rank": 2, "user_id": "leader_2", "name": "Fatima Malik", "points": 2280, "matches": 98, "win_rate": 72, "sport": SportType.PADEL.value},
    {"rank": 3, "user_id": "leader_3", "name": "Ali Ahmed", "points": 2100, "matches": 85, "win_rate": 68, "sport": SportType.FUTSAL.value},
    {"rank": 4, "user_id": "leader_4", "name": "Zainab Khan", "points": 1950, "matches": 76, "win_rate": 65, "sport": SportType.PADEL.value},
    {"rank": 5, "user_id": "user_sara", "name": "Sara Ahmed", "points": 1450, "matches": 58, "win_rate": 72, "sport": SportType.PADEL.value},
]
