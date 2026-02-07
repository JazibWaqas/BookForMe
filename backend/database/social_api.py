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
    NotificationResponse, UserProfileSocial, CommentCreate, CommentResponse
)
from database.rest_api import get_current_user_id
import os
import uuid
from pathlib import Path
from fastapi import File, UploadFile, Form
# Assuming you have an auth dependency to get current user
# If not, we'll mock it or you might need to import it from auth_api.py
# from database.auth_api import get_current_user 

router = APIRouter(
    prefix="/api/social",
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

# --- Service Initialization ---
from database.gamification_service import GamificationService
from database.notification_service import NotificationService
gamification_service = GamificationService(db)
notification_service = NotificationService(db)

# --- 0. Posts ---

@router.post("/posts/create", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new social post"""
    doc_ref = db.collection('posts').document()
    post_data = post.dict()
    post_data['user_id'] = user_id
    post_data['created_at'] = firestore.SERVER_TIMESTAMP
    post_data['updated_at'] = firestore.SERVER_TIMESTAMP
    post_data['likes_count'] = 0
    post_data['comments_count'] = 0
    post_data['likes'] = [] # List of user_ids who liked
    
    doc_ref.set(post_data)
    
    # Hook: Gamification
    gamification_service.award_post_creation(user_id)
    
    # Prepare response data
    response_data = post_data.copy()
    response_data['id'] = doc_ref.id
    response_data['created_at'] = datetime.now()
    response_data['updated_at'] = datetime.now()
    response_data['author'] = get_user_profile_social(user_id)
    
    return PostResponse(**response_data)

@router.post("/posts/{post_id}/like")
async def toggle_like_post(
    post_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Toggle like on a post - uses Firestore transaction for atomic operation"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    post_ref = db.collection('posts').document(post_id)
    
    # Use transaction to ensure consistency
    @firestore.transactional
    def toggle_like_transaction(transaction):
        snapshot = post_ref.get(transaction=transaction)
        if not snapshot.exists:
            raise HTTPException(status_code=404, detail="Post not found")
        
        post_data = snapshot.to_dict()
        likes = post_data.get('likes', [])
        
        if user_id in likes:
            # Unlike
            likes.remove(user_id)
        else:
            # Like
            likes.append(user_id)
        
        # Update with new likes array and count
        transaction.update(post_ref, {
            'likes': likes,
            'likes_count': len(likes)
        })
        
        return {
            "success": True,
            "liked": user_id in likes,
            "likes_count": len(likes),
            "likes": likes
        }
    
    # Execute transaction
    transaction = db.transaction()
    result = toggle_like_transaction(transaction)
    
    return result

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user_id: str = Query(...), limit: int = 50):
    """Get user notifications"""
    # Query without order_by to avoid Firestore composite index requirement
    docs = db.collection('notifications')\
             .where('user_id', '==', user_id)\
             .stream()
    
    notifications = []
    for doc in docs:
        data = doc.to_dict()
        notifications.append(NotificationResponse(id=doc.id, **data))
    
    # Sort in memory by created_at descending
    notifications.sort(key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)
    return notifications[:limit]

@router.get("/posts/feed", response_model=List[PostResponse])
async def get_posts_feed(
    limit: int = 20, 
    type: Optional[str] = None,
    media_only: bool = False
):
    """Get recent posts with filters"""
    # Query without order_by to avoid Firestore composite index requirement
    docs = db.collection('posts').stream()
    
    posts = []
    for doc in docs:
        data = doc.to_dict()
        
        # Filter by type
        if type and type != 'all':
            if data.get('type') != type:
                continue
        
        # Client side filters (due to Firestore limitations or simplicity)
        if media_only and not (data.get('image_url') or data.get('audio_url')):
            continue
            
        author_id = data.get('user_id')
        author = get_user_profile_social(author_id) if author_id else None
        
        # Ensure required fields have defaults
        if 'created_at' not in data or data['created_at'] is None:
            data['created_at'] = datetime.now()
        if 'updated_at' not in data or data['updated_at'] is None:
            data['updated_at'] = data.get('created_at', datetime.now())
        
        posts.append(PostResponse(
            id=doc.id,
            author=author,
            **data
        ))
    
    # Sort in memory by created_at descending
    posts.sort(key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)
    return posts[:limit]

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: str, 
    comment: CommentCreate, 
    user_id: str = Depends(get_current_user_id)
):
    """Add a comment to a post"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # 1. Verify Post Exists
    post_ref = db.collection('posts').document(post_id)
    post = post_ref.get()
    if not post.exists:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # 2. Create Comment
    comment_data = {
        "post_id": post_id,
        "user_id": user_id,
        "content": comment.content,
        "created_at": datetime.now()
    }
    doc_ref = db.collection('comments').add(comment_data)[1]
    
    # 3. Update Post Stats (Increment comments_count)
    post_ref.update({"comments_count": firestore.Increment(1)})
    
    # 4. Notify Post Author
    post_data = post.to_dict()
    if post_data.get('user_id') != user_id:
        # Avoid self-notification
        notification_service.create_notification(
            user_id=post_data.get('user_id'),
            type=NotificationType.FORUM_REPLY,
            title="New Comment",
            message=f"Someone commented on your post: {comment.content[:20]}...",
            data={"post_id": post_id, "comment_id": doc_ref.id, "click_action": "POST_DETAIL"}
        )
        
    return CommentResponse(
        id=doc_ref.id,
        author=get_user_profile_social(user_id),
        **comment_data
    )

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    """Get comments for a post"""
    # FIXED: Remove order_by to avoid index requirement, sort in memory instead
    comments_ref = db.collection('comments').where('post_id', '==', post_id)
    docs = comments_ref.stream()
    
    comments = []
    for doc in docs:
        data = doc.to_dict()
        comments.append(CommentResponse(
            id=doc.id,
            author=get_user_profile_social(data.get('user_id')),
            **data
        ))
    
    # Sort in memory by created_at (newest first)
    comments.sort(key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)
    return comments

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
    
    # Denormalize Venue Data (Karachi-First Rule) or Slot Handshake
    if match.slot_id:
        # Handshake: Fetch Slot Data
        slot_ref = db.collection('slots').document(match.slot_id)
        slot_doc = slot_ref.get()
        if not slot_doc.exists:
            raise HTTPException(status_code=404, detail="linked slot_id not found")
        
        slot_data = slot_doc.to_dict()
        
        # Verify ownership
        if slot_data.get('user_id') != match.host_user_id:
             raise HTTPException(status_code=403, detail="You do not own this booking slot")
             
        # Auto-fill Match Details from Slot
        match_data['venue_id'] = slot_data.get('vendor_id')
        match_data['date'] = slot_data.get('date')
        
        # Safe time extraction
        start_time = slot_data.get('start_time')
        if hasattr(start_time, 'strftime'):
             match_data['time'] = start_time.strftime('%H:%M')
        elif isinstance(start_time, str) and 'T' in start_time:
             match_data['time'] = start_time.split('T')[1][:5]
        else:
             match_data['time'] = str(start_time)
             
        # Fetch Vendor Name for Location
        if match_data.get('venue_id'):
             vendor = db.collection('vendors').document(match_data['venue_id']).get()
             if vendor.exists:
                 match_data['location'] = vendor.get('business_name') or vendor.get('name')

    elif match.venue_id:
        # User selected venue manually but no slot
        vendor = db.collection('vendors').document(match.venue_id).get()
        if vendor.exists:
           match_data['location'] = vendor.get('business_name') or vendor.get('name')

    doc_ref.set(match_data)
    
    # Prepare response data
    response_data = match_data.copy()
    response_data['id'] = doc_ref.id
    response_data['created_at'] = datetime.now()
    response_data['updated_at'] = datetime.now()
    response_data['participants'] = [get_user_profile_social(match.host_user_id)]
    
    return MatchResponse(**response_data)

@router.post("/matches/{match_id}/link_slot")
async def link_match_slot(match_id: str, slot_id: str, user_id: str = Query(...)):
    """Handshake: Link an existing match to a booking slot"""
    # 1. Get Match
    match_ref = db.collection('matches').document(match_id)
    match_doc = match_ref.get()
    if not match_doc.exists:
        raise HTTPException(status_code=404, detail="Match not found")
    
    match_data = match_doc.to_dict()
    if match_data.get('host_user_id') != user_id:
        raise HTTPException(status_code=403, detail="Only host can link a booking")
        
    # 2. Get Slot
    slot_ref = db.collection('slots').document(slot_id)
    slot_doc = slot_ref.get()
    if not slot_doc.exists:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    slot_data = slot_doc.to_dict()
    if slot_data.get('user_id') != user_id:
         raise HTTPException(status_code=403, detail="You do not own this booking slot")

    # 3. Update Match
    update_data = {
        "slot_id": slot_id,
        "venue_id": slot_data.get('vendor_id'),
        "date": slot_data.get('date'),
        "updated_at": firestore.SERVER_TIMESTAMP
    }
    
    # Safe time extraction
    start_time = slot_data.get('start_time')
    if hasattr(start_time, 'strftime'):
            update_data['time'] = start_time.strftime('%H:%M')
    elif isinstance(start_time, str) and 'T' in start_time:
            update_data['time'] = start_time.split('T')[1][:5]
            
    # Location
    if update_data.get('venue_id'):
         vendor = db.collection('vendors').document(update_data['venue_id']).get()
         if vendor.exists:
             update_data['location'] = vendor.get('business_name') or vendor.get('name')
             
    match_ref.update(update_data)
    
    # Optional: Gamification for "Confirmed Match"
    # if slot_data.get('status') == 'confirmed': ...
    
    return {"status": "success", "message": "Match linked to booking"}

@router.get("/matches/list", response_model=List[MatchResponse])
async def list_matches(
    sport: Optional[str] = None,
    search: Optional[str] = None
):
    """List open matches with filters"""
    # Simple query without composite index requirement
    # Filter by status only, then filter sport and sort in memory
    docs = db.collection('matches').stream()
    
    matches_list = []
    for doc in docs:
        data = doc.to_dict()
        
        # Filter by status (open matches only)
        if data.get('status') != MatchStatus.OPEN and data.get('status') != 'open':
            continue
        
        # Filter by sport
        if sport and sport != 'all':
            if data.get('sport_type', '').lower() != sport.lower():
                continue
        
        # Filter by search term (location or sport or description)
        if search:
            search_lower = search.lower()
            location = data.get('location', '').lower()
            desc = data.get('description', '').lower()
            sp = data.get('sport_type', '').lower()
            if search_lower not in location and search_lower not in desc and search_lower not in sp:
                continue

        # Prepare response data
        response_data = data.copy()
        response_data['id'] = doc.id
        p_ids = data.get('participants_ids', [])
        response_data['participants'] = [get_user_profile_social(pid) for pid in p_ids]
        
        # Handle timestamp conversion
        if 'created_at' not in response_data or response_data['created_at'] is None:
            response_data['created_at'] = datetime.now()
        if 'updated_at' not in response_data or response_data['updated_at'] is None:
            response_data['updated_at'] = datetime.now()
        
        matches_list.append(MatchResponse(**response_data))
    
    # Sort in memory by created_at (newest first)
    matches_list.sort(key=lambda x: x.created_at, reverse=True)
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
    
    # Hook: Notification to Host
    host_id = data.get('host_user_id')
    if host_id and host_id != user_id:
        joiner_profile = get_user_profile_social(user_id)
        notification_service.notify_match_join(host_id, joiner_profile.name, match_id)

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
    # Simple query without composite index requirement
    docs = db.collection('conversations').stream()
    
    conversations = []
    for doc in docs:
        data = doc.to_dict()
        
        # Filter by participant in memory
        participants = data.get('participants', [])
        if user_id not in participants:
            continue
        
        # Prepare response data
        response_data = data.copy()
        response_data['id'] = doc.id
        
        # Handle timestamp conversion
        if 'created_at' not in response_data or response_data['created_at'] is None:
            response_data['created_at'] = datetime.now()
        if 'updated_at' not in response_data or response_data['updated_at'] is None:
            response_data['updated_at'] = datetime.now()
            
        conversations.append(ConversationResponse(**response_data))
    
    # Sort in memory by updated_at (newest first)
    conversations.sort(key=lambda x: x.updated_at, reverse=True)
    return conversations

@router.get("/chat/history/{conversation_id}", response_model=List[MessageResponse])
async def get_chat_history(conversation_id: str, limit: int = 50):
    """Get messages for a conversation"""
    # Simple query without composite index requirement
    docs = db.collection('messages')\
             .where('conversation_id', '==', conversation_id)\
             .limit(limit)\
             .stream()
    
    messages = []
    for doc in docs:
        data = doc.to_dict()
        # Handle missing created_at
        if 'created_at' not in data or data['created_at'] is None:
            data['created_at'] = datetime.now()
        messages.append(MessageResponse(id=doc.id, **data))
    
    # Sort in memory by created_at (oldest first for chat)
    messages.sort(key=lambda x: x.created_at)
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
