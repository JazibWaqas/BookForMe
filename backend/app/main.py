"""
FastAPI Main Application
Entry point for the BookForMe backend server
Handles webhook endpoints and API routes
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

from app.config import settings

# TODO: Import agents and services when implemented
# from agents.whatsapp_agent import WhatsAppAgent
# from services.sheets_service import GoogleSheetsService

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
    description="AI-powered auto-receptionist for booking platform"
)

# Add CORS middleware (for web app integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scheduler for periodic tasks (Google Sheets sync)
scheduler = AsyncIOScheduler()


# ============================================================================
# STARTUP & SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services and start background tasks"""
    logger.info(f"Starting {settings.APP_NAME}...")
    
    # TODO: Initialize database connection
    # await database.connect()
    
    # TODO: Initialize agents and services
    # global whatsapp_agent, sheets_service
    # whatsapp_agent = WhatsAppAgent()
    # sheets_service = GoogleSheetsService()
    
    # Start periodic Google Sheets sync (Member 4)
    # scheduler.add_job(
    #     sync_all_vendor_sheets,
    #     'interval',
    #     minutes=settings.SHEET_SYNC_INTERVAL_MINUTES
    # )
    # scheduler.start()
    
    logger.info("Server started successfully!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on server shutdown"""
    logger.info("Shutting down server...")
    
    # Stop scheduler
    if scheduler.running:
        scheduler.shutdown()
    
    # TODO: Close database connection
    # await database.disconnect()
    
    logger.info("Server shut down successfully")


# ============================================================================
# HEALTH CHECK & INFO ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "service": settings.APP_NAME,
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "whatsapp_webhook": "/webhook/whatsapp",
            "health": "/health",
            "api_docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Check actual DB connection
        "redis": "connected",     # TODO: Check actual Redis connection
    }


# ============================================================================
# WHATSAPP WEBHOOK (Member 1 - WhatsApp Channel Lead)
# ============================================================================

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    Webhook endpoint for receiving WhatsApp messages via Twilio
    
    Member 1: Implement this endpoint
    - Parse incoming Twilio request (form data)
    - Extract message body and phone number
    - Call whatsapp_agent.process_message()
    - Return TwiML response
    
    Reference: FlightChatbot app.py lines 700-725
    """
    try:
        form_data = await request.form()
        incoming_msg = form_data.get('Body', '').strip()
        phone_number = form_data.get('From', '')
        
        logger.info(f"Received WhatsApp message from {phone_number}: {incoming_msg}")
        
        # TODO: Process message through agent (Member 1)
        # response_text = await whatsapp_agent.process_message(phone_number, incoming_msg)
        
        # Temporary response for testing
        response_text = "Hello! BookForMe backend is working. (Integration pending)"
        
        # TODO: Return proper Twilio TwiML response
        return {
            "message": response_text,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )


# ============================================================================
# REST API ENDPOINTS (For Web App - Member 3)
# ============================================================================

@app.get("/api/vendors")
async def get_vendors():
    """Get list of all vendors"""
    # TODO: Member 3 - Query vendors from database
    return {"vendors": []}


@app.get("/api/vendors/{vendor_id}/availability")
async def get_vendor_availability(vendor_id: int, date: str):
    """
    Get available time slots for a vendor on a specific date
    
    Member 3: Implement availability checking
    - Query availability_slots table
    - Filter by vendor_id, date, and status='available'
    - Return list of available time slots
    """
    # TODO: Member 3 - Query availability from database
    return {
        "vendor_id": vendor_id,
        "date": date,
        "available_slots": []
    }


@app.post("/api/bookings")
async def create_booking(booking_data: dict):
    """
    Create a new booking via web app
    
    Member 3: Implement booking creation with concurrency control
    - Use availability_service.check_and_book_slot()
    - Apply row-level locking to prevent double-booking
    - Return booking confirmation
    """
    # TODO: Member 3 - Create booking with locking
    return {
        "success": False,
        "message": "Booking endpoint not yet implemented"
    }


# ============================================================================
# BACKGROUND TASKS (Member 4 - Google Sheets Integration)
# ============================================================================

async def sync_all_vendor_sheets():
    """
    Periodic task to sync vendor Google Sheets with database
    Runs every SHEET_SYNC_INTERVAL_MINUTES minutes
    
    Member 4: Implement this function
    - Get all vendors with sheet_id from database
    - For each vendor, call sheets_service.sync_to_database()
    - Handle errors gracefully (log and continue)
    
    Reference: WhatsAppCabBookingBot cron pattern lines 291-327
    """
    logger.info("Starting periodic Google Sheets sync...")
    
    # TODO: Member 4 - Implement sheet sync
    # vendors = await db.get_vendors_with_sheets()
    # for vendor in vendors:
    #     try:
    #         await sheets_service.sync_to_database(vendor.id, vendor.sheet_id)
    #         logger.info(f"Synced sheet for vendor {vendor.id}")
    #     except Exception as e:
    #         logger.error(f"Sheet sync failed for vendor {vendor.id}: {e}")
    
    logger.info("Google Sheets sync completed")


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

