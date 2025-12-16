# FastAPI Application - Main App Structure

**Last Updated**: January 15, 2025  
**Status**: Production Ready  
**Purpose**: FastAPI application entry point and configuration

---

## 🎯 Core Vision

The FastAPI app serves as the HTTP server for both REST API endpoints (mobile app) and WhatsApp webhooks. It initializes all services and handles routing.

---

## 📁 Key Files

### `main.py` - Application Entry Point ⭐
**Purpose**: FastAPI app initialization and route registration

**Key Components**:
- FastAPI app instance
- CORS configuration
- Route registration:
  - `/api/*` - REST API endpoints (from `database/rest_api.py`)
  - `/webhook/whatsapp` - WhatsApp webhook (from `whatsapp/webhook.py`)
  - `/health` - Health check endpoint

**Startup**:
```python
app = FastAPI(title="BookForMe API")
app.include_router(rest_api.router, prefix="/api")
app.include_router(whatsapp_router, prefix="/webhook")
```

### `config.py` - Configuration Settings
**Purpose**: Environment variables and settings

**Key Settings**:
- `GEMINI_API_KEY` - Gemini API key
- `FIRESTORE_PROJECT_ID` - Firestore project ID
- `WHATSAPP_ACCESS_TOKEN` - Meta WhatsApp token
- `WHATSAPP_PHONE_NUMBER_ID` - Meta phone number ID
- `DEBUG` - Debug mode flag

**Usage**: Import `settings` object throughout backend

### `firestore.py` - Database Connection
**Purpose**: Initialize Firestore client

**Key Components**:
- `FirestoreDB` class - Firestore operations wrapper
- Connection initialization
- Service instances (availability_service, etc.)

---

## 🚀 Running the App

### Development
```bash
uvicorn backend.app.main:app --reload
```

### Production
```bash
# Railway deployment uses app.py as entry point
python app.py
```

---

## 🔑 Key Details

### Route Structure
- `/api/vendors` - Vendor endpoints
- `/api/slots` - Slot endpoints
- `/api/bookings` - Booking endpoints
- `/api/payments` - Payment endpoints
- `/webhook/whatsapp` - WhatsApp webhook
- `/health` - Health check

### CORS Configuration
Allows requests from:
- Mobile app (Expo)
- Web dashboard
- Local development

### Error Handling
- Global exception handlers
- Logging for all errors
- User-friendly error messages

---

**Last Updated**: January 15, 2025  
**Maintained By**: Backend Team  
**Key Files**: `main.py`, `config.py`, `firestore.py`

