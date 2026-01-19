"""
Social Features API
Handles Connections, Chat, Matchmaking, and Ranking
"""
from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional, Dict
from datetime import datetime
from google.cloud import firestore

# Import from your existing codebase
from app.config import settings
from app.firestore import firestore_db
from database.models_social import (
    PostCreate, PostResponse, PostType,
    MatchCreate, MatchResponse, MatchStatus, MatchType,
    ConversationCreate, ConversationResponse, MessageCreate, MessageResponse,
    NotificationResponse, UserProfileSocial
)
import os
import uuid
from pathlib import Path
from fastapi import File, UploadFile, Form
# Assuming you have an auth dependency to get current user
# If not, we'll mock it or you might need to import it from auth_api.py
# from database.auth_api import get_current_user 

router = APIRouter(
    prefix="/social",
    tags=["social"],
    responses={404: {"description": "Not found"}},
)

# Local alias for brevity
db = firestore_db.db

# --- Helpers ---

def get_user_profile_social(user_id: str) -> UserProfileSocial:
    """Helper to fetch minimal user profile for social display"""
    doc = db.collection('users').document(user_id).get()
    if not doc.exists:
        return UserProfileSocial(id=user_id, name="Unknown User")
    data = doc.to_dict()
    return UserProfileSocial(
        id=user_id,
        name=data.get('name', 'Unknown'),
        avatar_url=data.get('avatar_url'),
        rank=data.get('rank', 0),
        points=data.get('points', 0)
    )

# --- Uploads ---
UPLOAD_DIR = Path("uploads/social")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form("general") # post, chat_image, chat_audio
):
    """Upload a file for social features"""
    # Create type specific subdir
    type_dir = UPLOAD_DIR / type
    type_dir.mkdir(parents=True, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = type_dir / unique_filename
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    # Return URL (assuming static mount at /uploads)
    return {"url": f"/uploads/social/{type}/{unique_filename}", "type": type}

# --- 0. Posts ---

# --- 0. Posts ---

@router.post("/posts/create", response_model=PostResponse)
async def create_post(post: PostCreate):
    """Create a new social post"""
    doc_ref = db.collection('posts').document()
    post_data = post.dict()
    post_data['created_at'] = firestore.SERVER_TIMESTAMP
    post_data['updated_at'] = firestore.SERVER_TIMESTAMP
    post_data['likes_count'] = 0
    post_data['comments_count'] = 0
    post_data['likes'] = [] # List of user_ids who liked
    
    doc_ref.set(post_data)
    
    # Return response
    return PostResponse(
        id=doc_ref.id,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        author=get_user_profile_social(post.user_id),
        **post_data
    )

@router.get("/posts/feed", response_model=List[PostResponse])
async def get_posts_feed(
    limit: int = 20, 
    type: Optional[str] = None,
    media_only: bool = False
):
    """Get recent posts with filters"""
    query = db.collection('posts').order_by('created_at', direction=firestore.Query.DESCENDING)
    
    if type and type != 'all':
        query = query.where('type', '==', type)
        
    # Note: Firestore doesn't support inequality on different fields easily if not ordered by them
    # We are ordering by created_at. 'media_only' check might be better done in python if strictly needed
    # or ensure we have an index. For prototype, doing in python is safer/easier.
    
    docs = query.limit(limit).stream()
    
    posts = []
    for doc in docs:
        data = doc.to_dict()
        
        # Client side filters (due to Firestore limitations or simplicity)
        if media_only and not (data.get('image_url') or data.get('audio_url')):
            continue
            
        author_id = data.get('user_id')
        author = get_user_profile_social(author_id) if author_id else None
        
        posts.append(PostResponse(
            id=doc.id,
            author=author,
            **data
        ))
    return posts
    
    posts = []
    for doc in docs:
        data = doc.to_dict()
        author_id = data.get('user_id')
        author = get_user_profile_social(author_id) if author_id else None
        
        posts.append(PostResponse(
            id=doc.id,
            author=author,
            **data
        ))
    return posts

@router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user_id: str = Query(...)):
    """Toggle like on a post"""
    post_ref = db.collection('posts').document(post_id)
    doc = post_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")
        
    data = doc.to_dict()
    likes = data.get('likes', [])
    
    if user_id in likes:
        # Unlike
        likes.remove(user_id)
    else:
        # Like
        likes.append(user_id)
        
    post_ref.update({
        "likes": likes,
        "likes_count": len(likes)
    })
    
    return {"status": "success", "liked": user_id in likes, "count": len(likes)}

# --- 1. Connections (Follow/Friend) ---
# Note: Using a subcollection 'following' under users or a separate 'relationships' collection.
# Per plan, we'll use a `relationships` collection for scalability if specific query patterns are needed,
# or simple subcollections. Plan mentioned 'relationships' collection.

@router.post("/follow/{target_user_id}")
async def follow_user(target_user_id: str, current_user_id: str = Query(...)): # in real app, get from token
    """Follow a user"""
    if current_user_id == target_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
    # Check if target exists
    target_ref = db.collection('users').document(target_user_id)
    if not target_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    # Create relationship doc
    # ID could be composite: follower_target
    rel_id = f"{current_user_id}_{target_user_id}"
    rel_data = {
        "follower_id": current_user_id,
        "following_id": target_user_id,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    db.collection('relationships').document(rel_id).set(rel_data)
    return {"status": "success", "message": f"Followed user {target_user_id}"}

@router.post("/unfollow/{target_user_id}")
async def unfollow_user(target_user_id: str, current_user_id: str = Query(...)):
    """Unfollow a user"""
    rel_id = f"{current_user_id}_{target_user_id}"
    db.collection('relationships').document(rel_id).delete()
    return {"status": "success", "message": f"Unfollowed user {target_user_id}"}

@router.get("/followers/{user_id}", response_model=List[UserProfileSocial])
async def get_followers(user_id: str):
    """Get list of followers for a user"""
    # Query relationships where following_id == user_id
    docs = db.collection('relationships').where('following_id', '==', user_id).stream()
    followers = []
    for doc in docs:
        data = doc.to_dict()
        follower_profile = get_user_profile_social(data['follower_id'])
        followers.append(follower_profile)
    return followers

@router.get("/following/{user_id}", response_model=List[UserProfileSocial])
async def get_following(user_id: str):
    """Get list of users followed by user_id"""
    docs = db.collection('relationships').where('follower_id', '==', user_id).stream()
    following = []
    for doc in docs:
        data = doc.to_dict()
        profile = get_user_profile_social(data['following_id'])
        following.append(profile)
    return following


# --- 2. Matchmaking (Queue) ---

@router.post("/matchmaking/queue")
async def join_matchmaking_queue(
    sport_type: str, 
    user_id: str = Query(...)
):
    """Join the matchmaking queue"""
    # Simple implementation: Add to a 'matchmaking_queue' collection
    # In a real system, you'd have a background worker processing this.
    queue_doc = {
        "user_id": user_id,
        "sport_type": sport_type,
        "joined_at": firestore.SERVER_TIMESTAMP,
        "status": "waiting"
    }
    # Use user_id as doc ID to prevent duplicate entries
    db.collection('matchmaking_queue').document(user_id).set(queue_doc)
    return {"status": "queued", "message": "Joined matchmaking queue"}

@router.delete("/matchmaking/queue")
async def leave_matchmaking_queue(user_id: str = Query(...)):
    """Leave the matchmaking queue"""
    db.collection('matchmaking_queue').document(user_id).delete()
    return {"status": "left", "message": "Left matchmaking queue"}

@router.get("/matchmaking/status")
async def get_matchmaking_status(user_id: str = Query(...)):
    """Check status (matched or waiting)"""
    doc = db.collection('matchmaking_queue').document(user_id).get()
    if not doc.exists:
        return {"status": "not_queued"}
    data = doc.to_dict()
    return {"status": data.get("status"), "match_id": data.get("match_id")}


# --- 2.1 Matches (CRUD) ---

@router.post("/matches/create", response_model=MatchResponse)
async def create_match(match: MatchCreate):
    """Create a new hosted match"""
    doc_ref = db.collection('matches').document()
    match_data = match.dict()
    match_data['created_at'] = firestore.SERVER_TIMESTAMP
    match_data['updated_at'] = firestore.SERVER_TIMESTAMP
    match_data['status'] = MatchStatus.OPEN
    match_data['current_players'] = 1
    match_data['participants_ids'] = [match.host_user_id]
    
    doc_ref.set(match_data)
    
    return MatchResponse(
        id=doc_ref.id,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        participants=[get_user_profile_social(match.host_user_id)],
        **match_data
    )

@router.get("/matches/list", response_model=List[MatchResponse])
async def list_matches(
    sport: Optional[str] = None,
    search: Optional[str] = None
):
    """List open matches with filters"""
    query = db.collection('matches').where('status', '==', MatchStatus.OPEN)
    
    if sport and sport != 'all':
        query = query.where('sport_type', '==', sport)
        
    docs = query.order_by('created_at', direction=firestore.Query.DESCENDING).stream()
    
    matches_list = []
    for doc in docs:
        data = doc.to_dict()
        
        # Filter by search term (location or sport or description)
        if search:
            search_lower = search.lower()
            location = data.get('location', '').lower()
            desc = data.get('description', '').lower()
            sp = data.get('sport_type', '').lower()
            if search_lower not in location and search_lower not in desc and search_lower not in sp:
                continue

        # Fetch participants
        p_ids = data.get('participants_ids', [])
        participants = [get_user_profile_social(pid) for pid in p_ids]
        
        matches_list.append(MatchResponse(
            id=doc.id,
            participants=participants,
            **data
        ))
    return matches_list

@router.post("/matches/{match_id}/join")
async def join_match(match_id: str, user_id: str = Query(...)):
    """Join an existing match"""
    match_ref = db.collection('matches').document(match_id)
    doc = match_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Match not found")
        
    data = doc.to_dict()
    
    if data['status'] != MatchStatus.OPEN:
        raise HTTPException(status_code=400, detail="Match is not open")
        
    current_ids = data.get('participants_ids', [])
    if user_id in current_ids:
        return {"status": "already_joined"}
        
    if len(current_ids) >= data['max_players']:
        raise HTTPException(status_code=400, detail="Match is full")
        
    # Add user
    current_ids.append(user_id)
    update_data = {
        "participants_ids": current_ids,
        "current_players": len(current_ids)
    }
    
    if len(current_ids) >= data['max_players']:
        update_data['status'] = MatchStatus.FULL
        
    match_ref.update(update_data)
    
    return {"status": "success", "message": "Joined match"}


# --- 3. Ranking ---

@router.get("/leaderboard", response_model=List[UserProfileSocial])
async def get_leaderboard(limit: int = 50):
    """Get top players by points"""
    # Requires index on 'points' descending
    docs = db.collection('users')\
             .order_by('points', direction=firestore.Query.DESCENDING)\
             .limit(limit)\
             .stream()
    
    leaderboard = []
    for doc in docs:
        data = doc.to_dict()
        leaderboard.append(UserProfileSocial(
            id=doc.id,
            name=data.get('name', 'Unknown'),
            avatar_url=data.get('avatar_url'),
            rank=data.get('rank', 0), # In real app, rank might be computed position
            points=data.get('points', 0)
        ))
    return leaderboard


# --- 4. Chat ---

@router.post("/chat/start", response_model=ConversationResponse)
async def start_chat(conversation: ConversationCreate, current_user_id: str = Query(...)):
    """Start or get existing conversation"""
    # Logic: If direct chat exists between these participants, return it.
    if conversation.type == "direct" and len(conversation.participants) == 2:
        participants = sorted(conversation.participants)
        # Check if exists (querying array contents in Firestore can be tricky, 
        # often easier to generate a deterministic ID for 1-1 chats)
        chat_id = f"direct_{participants[0]}_{participants[1]}"
        
        doc_ref = db.collection('conversations').document(chat_id)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            # Convert timestamps to datetime for Pydantic
            # Note: Firestore returns datetime objects, Pydantic handles them
            return ConversationResponse(id=doc.id, **data)
        
        # Create new
        new_chat = {
            "type": "direct",
            "participants": participants,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
            "unread_count": {p: 0 for p in participants}
        }
        doc_ref.set(new_chat)
        # return with ID and now (approx)
        new_chat['id'] = chat_id
        new_chat['created_at'] = datetime.now() # approximation for response
        new_chat['updated_at'] = datetime.now()
        return ConversationResponse(**new_chat)

    # For Groups, just create new
    doc_ref = db.collection('conversations').document()
    new_chat = conversation.dict()
    new_chat['created_at'] = firestore.SERVER_TIMESTAMP
    new_chat['updated_at'] = firestore.SERVER_TIMESTAMP
    new_chat['unread_count'] = {p: 0 for p in conversation.participants}
    
    doc_ref.set(new_chat)
    
    return ConversationResponse(
        id=doc_ref.id,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        **new_chat
    )

@router.get("/chat/conversations", response_model=List[ConversationResponse])
async def get_conversations(user_id: str = Query(...)):
    """Get list of conversations for a user"""
    # Query conversations where participants array contains user_id
    docs = db.collection('conversations')\
             .where('participants', 'array_contains', user_id)\
             .order_by('updated_at', direction=firestore.Query.DESCENDING)\
             .stream()
    
    conversations = []
    for doc in docs:
        data = doc.to_dict()
        conversations.append(ConversationResponse(id=doc.id, **data))
    return conversations

@router.get("/chat/history/{conversation_id}", response_model=List[MessageResponse])
async def get_chat_history(conversation_id: str, limit: int = 50):
    """Get messages for a conversation"""
    docs = db.collection('messages')\
             .where('conversation_id', '==', conversation_id)\
             .order_by('created_at', direction=firestore.Query.ASCENDING)\
             .limit(limit)\
             .stream()
    
    messages = []
    for doc in docs:
        data = doc.to_dict()
        messages.append(MessageResponse(id=doc.id, **data))
    return messages

@router.post("/chat/message", response_model=MessageResponse)
async def send_message(message: MessageCreate):
    """Send a message"""
    # 1. Create message doc
    msg_ref = db.collection('messages').document()
    msg_data = message.dict()
    msg_data['created_at'] = firestore.SERVER_TIMESTAMP
    msg_data['read_by'] = [message.sender_id]
    
    msg_ref.set(msg_data)
    
    # 2. Update conversation (last_message, unread_count)
    conv_ref = db.collection('conversations').document(message.conversation_id)
    
    # Ideally do this in a transaction or atomic update
    # Increment unread for everyone except sender
    # We need to fetch participants first to know who to increment
    # For simplicity here, just updating last_message
    conv_ref.update({
        "last_message": message.content,
        "last_message_time": firestore.SERVER_TIMESTAMP,
        "updated_at": firestore.SERVER_TIMESTAMP
    })
    
    return MessageResponse(
        id=msg_ref.id,
        created_at=datetime.now(),
        **msg_data
    )
