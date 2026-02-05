from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

# --- Enums (Mirroring schema_social.py) ---
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

# --- Shared Models ---

class UserProfileSocial(BaseModel):
    """Subset of User profile for social displays"""
    id: str
    name: str
    avatar_url: Optional[str] = None
    rank: Optional[int] = 0
    points: Optional[int] = 0

# --- Post Models ---

class PostBase(BaseModel):
    type: PostType = PostType.GENERAL
    content: str
    sport_type: Optional[str] = None # padel, futsal, etc.
    location: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: str
    user_id: str
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime
    updated_at: datetime
    # Optional: include author details if needed often
    author: Optional[UserProfileSocial] = None 

# --- Match Models ---

class MatchBase(BaseModel):
    host_user_id: str
    sport_type: str
    match_type: MatchType = MatchType.CASUAL
    date: str # YYYY-MM-DD
    time: str # HH:MM
    location: str
    venue_id: Optional[str] = None
    slot_id: Optional[str] = None
    max_players: int
    description: Optional[str] = None

class MatchCreate(MatchBase):
    pass

class MatchResponse(MatchBase):
    id: str
    status: MatchStatus = MatchStatus.OPEN
    current_players: int = 1
    created_at: datetime
    updated_at: datetime
    participants: Optional[List[UserProfileSocial]] = []

# --- Chat Models ---

class ConversationBase(BaseModel):
    type: ConversationType = ConversationType.DIRECT
    participants: List[str] # List of user_ids
    name: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: str
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: Dict[str, int] = {} # user_id -> count
    created_at: datetime
    updated_at: datetime

class MessageBase(BaseModel):
    conversation_id: str
    sender_id: str
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = "text"

class MessageCreate(BaseModel):
    conversation_id: str
    sender_id: str
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = "text" # text, image, audio

class MessageResponse(MessageBase):
    id: str
    read_by: List[str] = []
    created_at: datetime

# --- Notification Models ---

class NotificationBase(BaseModel):
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None

class NotificationResponse(NotificationBase):
    id: str
    read: bool = False
    created_at: datetime

# --- Review Models (Social aspect) ---

class ReviewCreate(BaseModel):
    vendor_id: str
    user_id: str
    slot_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    title: str
    content: str

# --- Comment Models ---

class CommentBase(BaseModel):
    post_id: str
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.now)

class CommentCreate(BaseModel):
    content: str

class CommentResponse(CommentBase):
    id: str
    author: Optional[UserProfileSocial] = None
