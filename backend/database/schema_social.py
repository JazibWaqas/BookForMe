"""
Social Features Schema Extensions
Collections for forum, matches, chats, leaderboard, notifications, reviews, and chatbot
"""

from enum import Enum


class SocialCollections:
    POSTS = "posts"
    POST_COMMENTS = "post_comments"
    POST_LIKES = "post_likes"
    MATCHES = "matches"
    MATCH_PARTICIPANTS = "match_participants"
    CONVERSATIONS = "conversations"
    MESSAGES = "messages"
    NOTIFICATIONS = "notifications"
    REVIEWS = "reviews"
    CHATBOT_SESSIONS = "chatbot_sessions"


class PostType(str, Enum):
    GENERAL = "general"
    LOOKING_FOR_PLAYERS = "looking_for_players"
    TIP = "tip"
    QUESTION = "question"


class MatchType(str, Enum):
    CASUAL = "casual"
    RANKED = "ranked"


class MatchStatus(str, Enum):
    OPEN = "open"
    FULL = "full"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ConversationType(str, Enum):
    DIRECT = "direct"
    GROUP = "group"


class NotificationType(str, Enum):
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_REMINDER = "booking_reminder"
    BOOKING_CANCELLED = "booking_cancelled"
    PAYMENT_RECEIVED = "payment_received"
    MATCH_REQUEST = "match_request"
    MATCH_JOINED = "match_joined"
    FORUM_REPLY = "forum_reply"
    FORUM_LIKE = "forum_like"
    NEW_MESSAGE = "new_message"
    PROMO = "promo"
    SYSTEM = "system"


class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
