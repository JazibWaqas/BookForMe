"""
FastAPI Main Application - BookForMe backend
REST API, auth, and chat API for your browser UI.
Chat: your index.html calls POST /dev-api/chat; static UI at /chat.
"""

import os
import logging

from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.config import settings
# Import Firestore at module level so the gRPC client is alive BEFORE uvicorn starts
# accepting requests. Previously this was a lazy import inside startup_event(), which
# created a race window where the first user request could arrive before firestore_db.db
# was constructed (visible in Render logs: Firestore init printed AFTER 'service is live').
from app.firestore import firestore_db  # noqa: E402  (must be early)
from database.rest_api import router as rest_api_router
from database.auth_api import router as auth_router
from database.social_api import router as social_router
from database.admin_api import router as admin_router

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Booking backend with chat API for browser UI"
)

os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")

_dev_chat_path = os.path.join(settings.BASE_DIR, "scripts", "dev_chat")
if os.path.exists(_dev_chat_path):
    app.mount("/chat", StaticFiles(directory=_dev_chat_path, html=True), name="dev_chat")

# Include REST API router
app.include_router(rest_api_router)

# Include Authentication router
app.include_router(auth_router)

# Include Social features router
app.include_router(social_router)

# Include Admin router
app.include_router(admin_router)


# Add CORS middleware (for frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# DEV-CHAT API (your index.html calls /dev-api/chat and /dev-api/upload-image)
# ============================================================================
dev_chat_agent = None

class ChatRequest(BaseModel):
    message: str
    phone_number: str

class ClearRequest(BaseModel):
    phone_number: str

class ChatResponse(BaseModel):
    response: str

@app.get("/chat", include_in_schema=False)
async def dev_chat_redirect():
    return RedirectResponse(url="/chat/index.html")

@app.post("/dev-api/chat", response_model=ChatResponse)
async def dev_chat_message(request: ChatRequest):
    agent = dev_chat_agent
    if not agent:
        raise HTTPException(status_code=503, detail="Chat agent not initialized")
    try:
        response_text = await agent.process_message(
            phone_number=request.phone_number,
            message=request.message
        )
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Dev chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dev-api/clear")
async def dev_chat_clear(request: ClearRequest):
    from nlu.state_manager import StateManager
    from agent.session_store import session_store
    try:
        state_manager = StateManager()
        await state_manager.clear_session(request.phone_number)
        session_store.clear_session(request.phone_number)
        return {"status": "success", "message": "History cleared"}
    except Exception as e:
        logger.error(f"Dev chat clear error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dev-api/upload-image", response_model=ChatResponse)
async def dev_chat_upload(
    file: UploadFile = File(...),
    phone_number: str = Form(...)
):
    agent = dev_chat_agent
    if not agent:
        raise HTTPException(status_code=503, detail="Chat agent not initialized")
    try:
        image_bytes = await file.read()
        response_text = await agent.process_payment_image(
            phone_number=phone_number,
            image_bytes=image_bytes,
            caption=file.filename or ""
        )
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Dev chat upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# STARTUP & SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    import time
    logger.info("Starting BookForMe Backend Server...")

    # firestore_db is already constructed at module level.
    # Log its readiness and do an eager warm-up query to force the gRPC channel
    # fully open before the first real user request arrives (prevents cold-start
    # 'silent 0 results' on the very first DB call).
    if firestore_db.db:
        logger.info("Firestore client ready (module-level init). Warming up gRPC channel...")
        try:
            t0 = time.time()
            # A cheap collection-existence probe — reads 0 documents but opens the channel.
            list(firestore_db.db.collection('vendors').limit(1).stream())
            logger.info(f"Firestore gRPC channel warmed up in {time.time()-t0:.3f}s")
        except Exception as e:
            logger.warning(f"Firestore warm-up probe failed (non-fatal): {e}")
    else:
        logger.error("Firestore client is None — check GOOGLE_APPLICATION_CREDENTIALS env var")

    # Clean up any expired slot locks left over from previous container lifetime
    try:
        from database.slot_service import SlotService
        result = SlotService(firestore_db.db).cleanup_expired_locks()
        if result.get('released_count', 0) > 0:
            logger.info("Startup: released %d expired slot locks", result['released_count'])
    except Exception as e:
        logger.warning("Startup slot cleanup failed: %s", e)

    try:
        from whatsapp.agent import WhatsAppAgent
        global dev_chat_agent
        dev_chat_agent = WhatsAppAgent()
        logger.info("Dev-chat agent initialized (for /dev-api/chat)")
    except Exception as e:
        logger.warning("Dev-chat agent not initialized: %s", e)

    logger.info("Server ready to accept requests")
    logger.info("Server started successfully!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on server shutdown"""
    logger.info("Shutting down server...")
    logger.info("Server shut down successfully")


# ============================================================================
# HEALTH CHECK & INFO ENDPOINTS
# ============================================================================

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    """Root endpoint - API information"""
    return {
        "service": settings.APP_NAME,
        "version": "0.1.0",
        "status": "running",
        "description": "WhatsApp booking bot with Firestore backend",
        "endpoints": {
            "whatsapp_webhook": "/webhook/whatsapp",
            "health": "/health",
            "api_docs": "/docs",
            "dev_chat": "/chat",
            "dev_api": "/dev-api/chat",
            "cleanup_cron": "/internal/cleanup-expired-locks"
        }
    }


@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "firestore",  # TODO: Check actual Firestore connection
        "ai": "gemini",           # TODO: Check Gemini API connection
        "whatsapp": "meta"        # Updated to reflect Meta API
    }

@app.get("/ping")
def ping():
    """Keep-alive endpoint for uptime monitors (no DB overhead)."""
    return {"status": "alive"}


@app.get("/internal/cleanup-expired-locks", include_in_schema=False)
async def cleanup_expired_locks(x_cron_secret: str = Header(None, alias="X-Cron-Secret")):
    """
    Release expired slot locks. Intended for external cron (e.g. cron-job.org)
    hitting every 10 minutes. If CLEANUP_CRON_SECRET is set, X-Cron-Secret header must match.
    """
    if settings.CLEANUP_CRON_SECRET and x_cron_secret != settings.CLEANUP_CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Cron-Secret")
    from app.firestore import firestore_db
    from database.slot_service import SlotService
    result = SlotService(firestore_db.db).cleanup_expired_locks()
    return result


@app.post("/test-webhook")
async def test_webhook(request: Request):
    """Test endpoint to debug webhook processing"""
    try:
        data = await request.json()
        logger.info(f"🧪 Test webhook received: {data}")
        
        if not dev_chat_agent:
            return {"status": "error", "message": "Chat agent not initialized"}
        test_response = await dev_chat_agent.process_message("+923001234567", "Hello")
        
        return {
            "status": "success",
            "received_data": data,
            "test_response": test_response
        }
    except Exception as e:
        logger.error(f"Test webhook error: {e}")
        return {"status": "error", "message": str(e)}


# ============================================================================
# WHATSAPP WEBHOOK (Member 1 - WhatsApp Channel Lead)
# ============================================================================

@app.get("/webhook/whatsapp")
async def whatsapp_webhook_verify(request: Request):
    """
    Webhook verification endpoint for Meta WhatsApp
    """
    try:
        # Get verification parameters
        mode = request.query_params.get("hub.mode")
        token = request.query_params.get("hub.verify_token")
        challenge = request.query_params.get("hub.challenge")
        
        # Debug: Log verification parameters
        logger.info(f"Webhook verification: mode={mode}, token={token}, challenge={challenge}")
        logger.info(f"Expected token: {settings.WHATSAPP_VERIFY_TOKEN}")
        
        # Verify the webhook
        if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
            logger.info("WhatsApp webhook verified successfully")
            return int(challenge)  # Meta expects challenge as integer
        else:
            logger.error("WhatsApp webhook verification failed")
            return JSONResponse(
                status_code=403,
                content={"error": "Forbidden"}
            )
            
    except Exception as e:
        logger.error(f"WhatsApp webhook verification error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )


@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """WhatsApp webhook disabled when using browser chat only."""
    return JSONResponse(
        status_code=503,
        content={"error": "WhatsApp webhook disabled; using browser chat"}
    )


# REST API endpoints are now handled by the database.rest_api module
# See database/rest_api.py for all API endpoints


# ============================================================================
# RUN SERVER (Development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=False
    )
