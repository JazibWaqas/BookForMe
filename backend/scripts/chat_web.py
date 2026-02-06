"""
Web Chat for Testing LangGraph Agent (Standalone)
Mimics chat_terminal.py but uses a Web UI (backend/app/static/dev_chat/index.html).

Run with:
    python scripts/chat_web.py
Opens on
    http://localhost:8000
"""

import sys
import os
import logging
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("WebChat")

# Add backend directory to Python path (same as chat_terminal.py)
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import Agent
try:
    from whatsapp.agent import WhatsAppAgent
    from nlu.state_manager import StateManager
    from agent.session_store import session_store
    logger.info("Imports successful")
except ImportError as e:
    logger.error(f"Failed to import backend modules: {e}")
    sys.exit(1)

# Initialize FastAPI
app = FastAPI(title="Agent Web Chat")

# CORS (Allow all for local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Agent Instance
agent = None

@app.on_event("startup")
async def startup_event():
    global agent
    logger.info("Initializing WhatsApp Agent...")
    try:
        agent = WhatsAppAgent()
        logger.info("Agent ready!")
    except Exception as e:
        logger.error(f"Error initializing agent: {e}")
        # We don't exit here so the UI still loads, but chat will fail
        pass

# --- API Models ---
class ChatRequest(BaseModel):
    message: str
    phone_number: str = "+923001234567"

class ClearRequest(BaseModel):
    phone_number: str = "+923001234567"

class ChatResponse(BaseModel):
    response: str

# --- API Endpoints ---
@app.post("/dev-api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    global agent
    if not agent:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    try:
        logger.info(f"Message from {request.phone_number}: {request.message}")
        response_text = await agent.process_message(
            phone_number=request.phone_number,
            message=request.message
        )
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dev-api/clear")
async def clear_history(request: ClearRequest):
    try:
        logger.info(f"Clearing history for {request.phone_number}")
        
        # Clear Firestore session
        state_manager = StateManager()
        await state_manager.clear_session(request.phone_number)
        
        # Clear in-memory session
        session_store.clear_session(request.phone_number)
        
        # Re-initialize agent (optional, consistent with chat_terminal.py)
        global agent
        agent = WhatsAppAgent()
        
        return {"status": "success", "message": "History cleared"}
    except Exception as e:
        logger.error(f"Error clearing history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dev-api/upload-image", response_model=ChatResponse)
async def upload_image(
    file: UploadFile = File(...),
    phone_number: str = Form(...)
):
    global agent
    if not agent:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    try:
        logger.info(f"Received image from {phone_number}: {file.filename}")
        
        # Read file bytes
        image_bytes = await file.read()
        
        # Process image
        response_text = await agent.process_payment_image(
            phone_number=phone_number,
            image_bytes=image_bytes,
            caption=file.filename
        )
        
        return ChatResponse(response=response_text)
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# --- Static Files ---
# Serve the specific static directory where index.html is located
static_path = os.path.join(backend_dir, "app", "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")
else:
    logger.warning(f"Static directory not found at {static_path}")

# Redirect root to the chat UI
@app.get("/")
async def root():
    return RedirectResponse(url="/static/dev_chat/index.html")

# --- Main Entry Point ---
if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  WEB CHAT - LangGraph Agent Testing")
    print("  Open http://localhost:8000 to chat")
    print("=" * 70 + "\n")
    
    # Run Uvicorn directly
    uvicorn.run(app, host="0.0.0.0", port=8000)
