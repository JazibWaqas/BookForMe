"""
Social Features API
Handles Connections, Chat, Matchmaking, and Ranking
"""
from fastapi import APIRouter, HTTPException, Depends, Query, status, Request
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
import logging
import asyncio

logger = logging.getLogger(__name__) 

router = APIRouter(
    prefix="/api/social",
    tags=["social"],
    responses={404: {"description": "Not found"}},
)

# Local alias for brevity
db = firestore_db.db

import asyncio
from app.cache import cache, cached

# --- Helpers ---

def _user_doc_is_vendor(data: dict) -> bool:
    if not data:
        return False
    role = data.get('role')
    if role is not None and str(role).strip().lower() == 'vendor':
        return True
    vid = data.get('vendor_id')
    if vid is None:
        return False
    s = str(vid).strip().lower()
    return s not in ('', 'none', 'null')


async def get_user_profile_social(user_id: str) -> UserProfileSocial:
    """Helper to fetch minimal user profile for social display (Cached)"""
    cache_key = f"social:profile:{user_id}"
    cached_profile = cache.get(cache_key)
    
    if cached_profile:
        return cached_profile

    doc = await asyncio.to_thread(db.collection('users').document(user_id).get)
    
    if not doc.exists:
        profile = UserProfileSocial(id=user_id, name="Unknown User")
    else:
        data = doc.to_dict()
        profile = UserProfileSocial(
            id=user_id,
            name=data.get('name', 'Unknown'),
            avatar_url=data.get('avatar_url'),
            rank=data.get('rank', 0),
            points=data.get('points', 0)
        )
    
    # Cache for 15 minutes
    cache.set(cache_key, profile, ttl_seconds=900)
    return profile

# --- Uploads ---
UPLOAD_DIR = Path(settings.UPLOADS_DIR) / "social"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# DEBUG ENDPOINT - accepts ANY body
@router.post("/upload-debug")
async def upload_debug(request: Request):
    """Debug endpoint to see what we're actually receiving"""
    try:
        logger.info("=" * 60)
        logger.info("🔍 DEBUG UPLOAD - Raw Request Analysis")
        logger.info("=" * 60)
        logger.info(f"Method: {request.method}")
        logger.info(f"URL: {request.url}")
        logger.info(f"Headers:")
        for key, value in request.headers.items():
            logger.info(f"  {key}: {value}")
        
        # Try to read body
        body = await request.body()
        logger.info(f"Body length: {len(body)} bytes")
        logger.info(f"Body preview (first 1000 chars):")
        logger.info(body[:1000])
        logger.info("=" * 60)
        
        return {"status": "received", "body_length": len(body)}
    except Exception as e:
        logger.error(f"Debug endpoint error: {e}", exc_info=True)
        return {"error": str(e)}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form("post")
):
    """Upload a file for social features"""
    try:
        logger.info(f"📤 Upload request received!")
        logger.info(f"   - filename: {file.filename}")
        logger.info(f"   - content_type: {file.content_type}")
        logger.info(f"   - type param: {type}")
        
        # Create type specific subdir
        type_dir = UPLOAD_DIR / type
        type_dir.mkdir(parents=True, exist_ok=True)
        
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = type_dir / unique_filename
        
        logger.info(f"💾 Saving to: {file_path}")
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            logger.info(f"✅ File saved successfully - size: {len(content)} bytes")
        
        # Return URL (assuming static mount at /uploads)
        url = f"/uploads/social/{type}/{unique_filename}"
        logger.info(f"🔗 Generated URL: {url}")
        
        return {"url": url, "type": type, "filename": unique_filename}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Upload failed: {str(e)}")
        logger.error(f"   Exception type: {type(e).__name__}")
        logger.error(f"   Traceback:", exc_info=True)
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

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
    # doc_ref = db.collection('posts').document() # Sync call
    doc_ref = db.collection('posts').document()
    
    post_data = post.dict()
    post_data['user_id'] = user_id
    post_data['created_at'] = firestore.SERVER_TIMESTAMP
    post_data['updated_at'] = firestore.SERVER_TIMESTAMP
    post_data['likes_count'] = 0
    post_data['comments_count'] = 0
    post_data['likes'] = [] # List of user_ids who liked
    
    await asyncio.to_thread(doc_ref.set, post_data)
    
    # Hook: Gamification
    # gamification_service.award_post_creation(user_id) # Make async if possible or wrap
    await asyncio.to_thread(gamification_service.award_post_creation, user_id)
    
    # Prepare response data
    response_data = post_data.copy()
    response_data['id'] = doc_ref.id
    response_data['created_at'] = datetime.now()
    response_data['updated_at'] = datetime.now()
    response_data['author'] = await get_user_profile_social(user_id)
    
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
            # Check if we should raise inside transaction (usually safe)
             return None # Signal not found
        
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
        return likes

    # Execute transaction
    transaction = db.transaction()
    likes = await asyncio.to_thread(toggle_like_transaction, transaction)
    
    if likes is None:
         raise HTTPException(status_code=404, detail="Post not found")
    
    return {
        "success": True,
        "liked": user_id in likes,
        "likes_count": len(likes),
        "likes": likes
    }

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user_id: str = Query(...), limit: int = 50):
    """Get user notifications"""
    # Query without order_by to avoid Firestore composite index requirement
    # docs = db.collection('notifications').where('user_id', '==', user_id).stream()
    
    docs = await asyncio.to_thread(
        lambda: list(db.collection('notifications').where('user_id', '==', user_id).stream())
    )
    
    notifications = []
    for doc in docs:
        data = doc.to_dict()
        notifications.append(NotificationResponse(id=doc.id, **data))
    
    # Sort in memory by created_at descending
    notifications.sort(key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)
    return notifications[:limit]

@router.get("/posts/feed", response_model=List[PostResponse])
@cached(ttl_seconds=60, key_prefix="social_feed")
async def get_posts_feed(
    limit: int = 20, 
    type: Optional[str] = None,
    media_only: bool = False
):
    """Get recent posts with filters - Optimized with Parallel Fetching and Caching"""
    # OPTIMIZED: Limit at Firestore level instead of fetching all
    docs = await asyncio.to_thread(lambda: list(db.collection('posts').limit(50).stream()))
    
    posts_data = []
    
    # First pass: Filter and basic processing
    for doc in docs:
        data = doc.to_dict()
        
        # Filter by type
        if type and type != 'all':
            if data.get('type') != type:
                continue
        
        # Client side filters 
        if media_only and not (data.get('image_url') or data.get('audio_url')):
            continue
            
        # Ensure required fields
        if 'created_at' not in data or data['created_at'] is None:
            data['created_at'] = datetime.now()
        if 'updated_at' not in data or data['updated_at'] is None:
            data['updated_at'] = data.get('created_at', datetime.now())
            
        posts_data.append({'id': doc.id, **data})

    # Sort in memory by created_at descending BEFORE fetching authors (to limit fetches)
    posts_data.sort(key=lambda x: x['created_at'] if x.get('created_at') else datetime.min, reverse=True)
    
    # Apply limit
    posts_data = posts_data[:limit]

    # Second pass: Fetch authors in parallel for ONLY the posts we return
    async def process_post(data):
        author_id = data.get('user_id')
        author = await get_user_profile_social(author_id) if author_id else None
        
        return PostResponse(
            id=data['id'],
            author=author,
            **{k: v for k, v in data.items() if k != 'id'}
        )
    
    # Execute all profile fetches concurrently
    posts = await asyncio.gather(*(process_post(p) for p in posts_data))
    
    return posts

# ========================================
# Comments
# ========================================

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    """Get all comments for a post"""
    comments_ref = db.collection('comments').where('post_id', '==', post_id).order_by('created_at', direction=firestore.Query.DESCENDING)
    comments_docs = await asyncio.to_thread(lambda: list(comments_ref.stream()))
    
    comments = []
    for doc in comments_docs:
        data = doc.to_dict()
        author = await get_user_profile_social(data.get('user_id'))
        comments.append(CommentResponse(
            id=doc.id,
            author=author,
            **data
        ))
    
    return comments

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
    post = await asyncio.to_thread(post_ref.get)
    if not post.exists:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # 2. Create Comment
    comment_data = {
        "post_id": post_id,
        "user_id": user_id,
        "content": comment.content,
        "created_at": datetime.now()
    }
    doc_ref = await asyncio.to_thread(lambda: db.collection('comments').add(comment_data)[1])
    
    # 3. Update Post Stats (Increment comments_count)
    await asyncio.to_thread(post_ref.update, {"comments_count": firestore.Increment(1)})
    
    # 4. Notify Post Author
    post_data = post.to_dict()
    if post_data.get('user_id') != user_id:
        # Avoid self-notification
        notification_service.notify_post_comment(
            author_id=post_data.get('user_id'),
            commenter_name="Someone",
            post_id=post_id,
            comment_text=comment.content
        )
        
    return CommentResponse(
        id=doc_ref.id,
        author=await get_user_profile_social(user_id),
        **comment_data
    )

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    """Get comments for a post"""
    # FIXED: Remove order_by to avoid index requirement, sort in memory instead
    comments_ref = db.collection('comments').where('post_id', '==', post_id)
    docs = await asyncio.to_thread(lambda: list(comments_ref.stream()))
    
    async def process_comment(doc):
        data = doc.to_dict()
        return CommentResponse(
            id=doc.id,
            author=await get_user_profile_social(data.get('user_id')),
            **data
        )

    # Fetch all authors in parallel
    comments = await asyncio.gather(*(process_comment(doc) for doc in docs))
    
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
@cached(ttl_seconds=120, key_prefix="social_matches")
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
        # Await all participant profile fetches in parallel
        response_data['participants'] = await asyncio.gather(*[get_user_profile_social(pid) for pid in p_ids])
        
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
@cached(ttl_seconds=300, key_prefix="social_leaderboard")
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
        doc = await asyncio.to_thread(doc_ref.get)
        
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
        await asyncio.to_thread(doc_ref.set, new_chat)
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
    
    await asyncio.to_thread(doc_ref.set, new_chat)
    
    return ConversationResponse(
        id=doc_ref.id,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        **new_chat
    )

@router.get("/chat/conversations", response_model=List[ConversationResponse])
@cached(ttl_seconds=30, key_prefix="social_conversations")
async def get_conversations(user_id: str = Query(...)):
    """Get list of conversations for a user"""
    docs = await asyncio.to_thread(lambda: list(db.collection('conversations').limit(50).stream()))
    
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
        
        # Get other participant's info for display
        other_participant_id = [p for p in participants if p != user_id][0]
        if other_participant_id:
            other_user_doc = await asyncio.to_thread(db.collection('users').document(other_participant_id).get)
            if other_user_doc.exists:
                other_user_data = other_user_doc.to_dict()
                response_data['other_user'] = {
                    'id': other_participant_id,
                    'name': other_user_data.get('name', 'Unknown'),
                    'avatar_url': other_user_data.get('avatar_url')
                }
        
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
    docs = await asyncio.to_thread(
        lambda: list(db.collection('messages')
                 .where('conversation_id', '==', conversation_id)
                 .limit(limit)
                 .stream())
    )
    
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
    
    await asyncio.to_thread(msg_ref.set, msg_data)
    
    # 2. Update conversation (last_message, unread_count)
    conv_ref = db.collection('conversations').document(message.conversation_id)
    
    await asyncio.to_thread(
        lambda: conv_ref.update({
            "last_message": message.content,
            "last_message_time": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        })
    )
    
    return MessageResponse(
        id=msg_ref.id,
        **{k: v for k, v in msg_data.items() if k != 'created_at'},
        created_at=datetime.now()
    )

# ========================================
# FRIENDS SYSTEM
# ========================================

@router.get(
    "/users",
    response_model=List[UserProfileSocial],
    response_model_exclude_none=False,
)
async def list_users_for_friends(
    search: Optional[str] = None,
    limit: int = 50
):
    """List all users for finding friends (excludes sensitive data)"""
    cap = min(max(limit * 8, 80), 400)
    docs = await asyncio.to_thread(lambda: list(db.collection('users').limit(cap).stream()))

    users = []
    for doc in docs:
        data = doc.to_dict() or {}
        if _user_doc_is_vendor(data):
            continue

        if search and search.lower() not in (data.get('name', '')).lower():
            continue

        users.append(UserProfileSocial(
            id=doc.id,
            name=data.get('name', 'Unknown'),
            avatar_url=data.get('avatar_url'),
            rank=data.get('rank', 0),
            points=data.get('points', 0),
            role=data.get('role'),
            vendor_id=data.get('vendor_id'),
        ))
        if len(users) >= limit:
            break

    return users


@router.get("/friends")
async def get_friends(user_id: str = Query(...)):
    """Get current user's friends list"""
    # Get user document to access friends array
    user_doc = await asyncio.to_thread(db.collection('users').document(user_id).get)
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_doc.to_dict()
    friend_ids = user_data.get('friends', [])
    
    if not friend_ids:
        return {"friends": []}
    
    # Fetch friend profiles in parallel
    friends = await asyncio.gather(*[
        get_user_profile_social(fid) for fid in friend_ids
    ])
    
    return {"friends": [f.dict() for f in friends]}


@router.get("/friends/requests")
async def get_friend_requests(user_id: str = Query(...)):
    """Get pending friend requests for current user"""
    # Get incoming requests
    incoming_docs = await asyncio.to_thread(
        lambda: list(db.collection('friend_requests')
                     .where('to_user_id', '==', user_id)
                     .where('status', '==', 'pending')
                     .stream())
    )
    
    requests = []
    for doc in incoming_docs:
        data = doc.to_dict()
        from_user = await get_user_profile_social(data.get('from_user_id'))
        requests.append({
            "id": doc.id,
            "from_user": from_user.dict(),
            "status": data.get('status'),
            "created_at": data.get('created_at')
        })
    
    return {"requests": requests}


@router.post("/friends/request")
async def send_friend_request(
    to_user_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Add a friend directly (no acceptance required for demo)"""
    if user_id == to_user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a friend")
    
    # Check if already friends
    user_doc = await asyncio.to_thread(db.collection('users').document(user_id).get)
    user_data = user_doc.to_dict()
    
    if to_user_id in user_data.get('friends', []):
        raise HTTPException(status_code=400, detail="Already friends with this user")
    
    # Add each user to the other's friends array directly
    from_user_ref = db.collection('users').document(user_id)
    to_user_ref = db.collection('users').document(to_user_id)
    
    await asyncio.to_thread(
        lambda: from_user_ref.update({'friends': firestore.ArrayUnion([to_user_id])})
    )
    await asyncio.to_thread(
        lambda: to_user_ref.update({'friends': firestore.ArrayUnion([user_id])})
    )
    
    # Clear cache
    cache.clear()
    
    return {"success": True, "message": "Friend added!"}


@router.post("/friends/accept")
async def accept_friend_request(
    request_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Accept a friend request"""
    request_doc = await asyncio.to_thread(db.collection('friend_requests').document(request_id).get)
    
    if not request_doc.exists:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    request_data = request_doc.to_dict()
    
    if request_data.get('to_user_id') != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this request")
    
    if request_data.get('status') != 'pending':
        raise HTTPException(status_code=400, detail="Request already processed")
    
    from_user_id = request_data.get('from_user_id')
    
    # Add each user to the other's friends array
    from_user_ref = db.collection('users').document(from_user_id)
    to_user_ref = db.collection('users').document(user_id)
    
    # Update both users' friends arrays
    await asyncio.to_thread(
        lambda: from_user_ref.update({'friends': firestore.ArrayUnion([user_id])})
    )
    await asyncio.to_thread(
        lambda: to_user_ref.update({'friends': firestore.ArrayUnion([from_user_id])})
    )
    
    # Update request status
    await asyncio.to_thread(
        lambda: db.collection('friend_requests').document(request_id).update({'status': 'accepted'})
    )
    
    # Clear users cache (invalidate all user list caches by clearing prefix matches)
    # Note: In production, use cache.invalidate_pattern() or Redis
    cache.clear()  # Simple solution for demo - clears all cache
    
    return {"success": True, "message": "Friend request accepted"}


@router.post("/friends/reject")
async def reject_friend_request(
    request_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Reject a friend request"""
    request_doc = await asyncio.to_thread(db.collection('friend_requests').document(request_id).get)
    
    if not request_doc.exists:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    request_data = request_doc.to_dict()
    
    if request_data.get('to_user_id') != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this request")
    
    # Update request status
    await asyncio.to_thread(
        lambda: db.collection('friend_requests').document(request_id).update({'status': 'rejected'})
    )
    
    return {"success": True, "message": "Friend request rejected"}


@router.post("/friends/remove")
async def remove_friend(
    friend_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Remove a friend"""
    # Remove from both users' friends arrays
    user_ref = db.collection('users').document(user_id)
    friend_ref = db.collection('users').document(friend_id)
    
    await asyncio.to_thread(
        lambda: user_ref.update({'friends': firestore.ArrayRemove([friend_id])})
    )
    await asyncio.to_thread(
        lambda: friend_ref.update({'friends': firestore.ArrayRemove([user_id])})
    )
    
    # Clear cache
    cache.clear()  # Simple solution for demo
    
    return {"success": True, "message": "Friend removed"}
