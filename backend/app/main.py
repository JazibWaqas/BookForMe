"""
FastAPI Main Application - Simplified for WhatsApp + Firestore
Entry point for the BookForMe backend server
Handles WhatsApp webhook and provides REST API for frontend
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import settings

# Import from modular structure
from whatsapp.webhook import WhatsAppWebhookHandler
from database.rest_api import router as rest_api_router
from database.auth_api import router as auth_router

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
    description="AI-powered WhatsApp booking bot with Firestore backend"
)

# Include REST API router
app.include_router(rest_api_router)

# Include Authentication router
app.include_router(auth_router)

# Add CORS middleware (for frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# STARTUP & SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services"""
    logger.info(f"Starting {settings.APP_NAME}...")
    
    # Initialize WhatsApp webhook handler
    global whatsapp_handler
    whatsapp_handler = WhatsAppWebhookHandler()
    
    # TODO: Initialize Firestore connection
    # from app.firestore import firestore_db
    # await firestore_db.test_connection()
    
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
            "api_docs": "/docs"
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


@app.post("/test-webhook")
async def test_webhook(request: Request):
    """Test endpoint to debug webhook processing"""
    try:
        data = await request.json()
        logger.info(f"🧪 Test webhook received: {data}")
        
        # Test WhatsApp agent
        test_response = await whatsapp_handler.whatsapp_agent.process_message("+923001234567", "Hello")
        
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
    """
    Webhook endpoint for receiving WhatsApp messages via Meta API
    """
    try:
        # Use WhatsApp webhook handler
        result = await whatsapp_handler.handle_webhook(request)
        
        return JSONResponse(
            status_code=200,
            content=result
        )
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
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
        reload=settings.DEBUG
    )