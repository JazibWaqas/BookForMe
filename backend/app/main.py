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

# TODO: Import agents and services when implemented
# from agents.whatsapp_agent import WhatsAppAgent
# from services.availability_service import AvailabilityService

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

@app.get("/")
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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "firestore",  # TODO: Check actual Firestore connection
        "ai": "gemini",           # TODO: Check Gemini API connection
        "whatsapp": "twilio"      # TODO: Check Twilio connection
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
        
        logger.info(f"📱 Received WhatsApp message from {phone_number}: {incoming_msg}")
        
        # TODO: Process message through WhatsApp agent (Member 1)
        # response_text = await whatsapp_agent.process_message(phone_number, incoming_msg)
        
        # Temporary response for testing
        response_text = f"Hello! BookForMe bot received your message: '{incoming_msg}'. Integration pending..."
        
        # TODO: Return proper Twilio TwiML response (Member 1)
        return {
            "message": response_text,
            "status": "success",
            "phone_number": phone_number
        }
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )


# ============================================================================
# REST API ENDPOINTS (For Frontend Dashboard)
# ============================================================================

@app.get("/api/vendors")
async def get_vendors():
    """Get list of all vendors"""
    # TODO: Member 3 - Query vendors from Firestore
    return {
        "vendors": [
            {
                "id": "vendor1",
                "name": "Karachi Futsal Arena",
                "service_type": "futsal",
                "whatsapp_connected": True
            },
            {
                "id": "vendor2", 
                "name": "Elite Salon & Spa",
                "service_type": "salon",
                "whatsapp_connected": True
            }
        ]
    }


@app.get("/api/vendors/{vendor_id}/availability")
async def get_vendor_availability(vendor_id: str, date: str):
    """
    Get available time slots for a vendor on a specific date
    
    Member 3: Implement availability checking
    - Query availability_slots collection in Firestore
    - Filter by vendor_id, date, and status='available'
    - Return list of available time slots
    """
    # TODO: Member 3 - Query availability from Firestore
    return {
        "vendor_id": vendor_id,
        "date": date,
        "available_slots": [
            {"time": "14:00", "price": 2000.0, "status": "available"},
            {"time": "15:00", "price": 2000.0, "status": "available"},
            {"time": "16:00", "price": 2000.0, "status": "available"}
        ]
    }


@app.post("/api/bookings")
async def create_booking(booking_data: dict):
    """
    Create a new booking via frontend
    
    Member 3: Implement booking creation with Firestore transaction
    - Use availability_service.check_and_book_slot()
    - Apply Firestore transaction to prevent double-booking
    - Return booking confirmation
    """
    # TODO: Member 3 - Create booking with Firestore transaction
    return {
        "success": False,
        "message": "Booking endpoint not yet implemented",
        "booking_data": booking_data
    }


@app.get("/api/vendors/{vendor_id}/bookings")
async def get_vendor_bookings(vendor_id: str, date: str = None):
    """
    Get bookings for a vendor
    
    Member 3: Implement booking retrieval
    - Query bookings collection in Firestore
    - Filter by vendor_id and optionally by date
    - Return list of bookings
    """
    # TODO: Member 3 - Query bookings from Firestore
    return {
        "vendor_id": vendor_id,
        "date": date,
        "bookings": []
    }


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