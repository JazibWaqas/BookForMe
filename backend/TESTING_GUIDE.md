# LangGraph Agent Testing Guide

## What Was Built

✅ **LangGraph Agent System** - Replaced the old state machine with a LangGraph-based agent
✅ **Hardcoded Vendor Data** - Ace Padel Club data in `backend/data/ace_padel_club.py`
✅ **Tool System** - Tools to query availability, pricing, vendor info
✅ **WhatsApp Integration** - Updated `whatsapp/agent.py` to use LangGraph
✅ **Test Script** - Ready-to-run test suite

## Files Created/Modified

### New Files:
- `backend/agent/state.py` - Agent state definition
- `backend/agent/graph.py` - LangGraph workflow
- `backend/agent/nodes.py` - Agent nodes (classify, query, respond)
- `backend/agent/tools.py` - Query tools for hardcoded data
- `backend/data/ace_padel_club.py` - Hardcoded vendor data
- `backend/data/ace_padel_club.txt` - Reference file for verification
- `backend/scripts/test_langgraph_agent.py` - Test script

### Modified Files:
- `backend/whatsapp/agent.py` - Now uses LangGraph BookingAgent

## How to Test

### Option 1: Local Testing (Recommended First)

Test the agent locally without WhatsApp:

```bash
cd backend
python scripts/test_langgraph_agent.py
```

This will:
- Initialize the LangGraph agent
- Run 8 test cases (greetings, availability queries, price inquiries)
- Show responses for each test
- Display a summary of results

**Expected output:**
```
============================================================
LangGraph Agent Test Suite
============================================================

Test 1: Simple Greeting
User: Hi
Agent: Hello! Welcome to Ace Padel Club...
```

### Option 2: Test via WhatsApp (Local Server)

1. **Start your FastAPI server:**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **Expose server to internet (if not already deployed):**
   - Use ngrok: `ngrok http 8000`
   - Or deploy to your server

3. **Configure WhatsApp webhook:**
   - Point Meta webhook to: `https://your-url.com/webhook/whatsapp`
   - Or: `https://your-ngrok-url.ngrok.io/webhook/whatsapp`

4. **Send WhatsApp messages:**
   - "Hi"
   - "koi slot hei?"
   - "kal slot hai?"
   - "kitna hai price?"

### Option 3: Test on Deployed Server

If you already have a deployed server:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add LangGraph agent with hardcoded vendor data"
   git push
   ```

2. **Deploy to your server** (depends on your setup)

3. **Test via WhatsApp** - webhook will automatically use new LangGraph agent

## What the Agent Does

1. **Receives message** → WhatsApp webhook → `whatsapp/webhook.py`
2. **Processes via LangGraph** → `whatsapp/agent.py` → `agent/graph.py`
3. **Classifies intent** → Uses NLU to understand user message
4. **Queries data** → Tools query hardcoded Ace Padel Club data
5. **Generates response** → Formats natural language response
6. **Sends reply** → Via WhatsApp service

## Verifying Responses

Compare agent responses with reference data:
- Check `backend/data/ace_padel_club.txt` for expected data
- Verify slot times, prices match hardcoded data
- Check date normalization (tomorrow = correct date)

## Troubleshooting

### Import Errors
If you see import errors:
```bash
cd backend
python -c "from agent.graph import BookingAgent; print('OK')"
```

### Missing Dependencies
Install required packages:
```bash
pip install langgraph langchain
```

### WhatsApp Webhook Not Working
- Check server is running
- Verify webhook URL in Meta dashboard
- Check logs: `backend/logs/` or console output

## Next Steps

Once local testing works:
1. Test via WhatsApp webhook
2. Verify responses match hardcoded data
3. When ready: Migrate from hardcoded data to Firebase (swap tools implementation)

