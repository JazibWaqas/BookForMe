# WhatsApp Integration - Meta Business API

**Last Updated**: January 15, 2025  
**Status**: Functional, Receiving and Sending Messages  
**Purpose**: Handle WhatsApp messages via Meta Business API webhook

---

## 🎯 Core Vision

The WhatsApp module receives messages from users via Meta Business API webhook and processes them through the LangGraph agent. It handles:
- Webhook verification (GET request)
- Message receiving (POST request)
- Message sending (Meta API calls)
- Response formatting for WhatsApp

**Key Principle**: Every WhatsApp message goes through the LangGraph agent workflow, ensuring consistent behavior with the mobile app.

---

## 🏗️ Architecture

```
Meta Webhook → webhook.py → LangGraph Agent → Response → Meta API → User
```

**Flow**:
1. Meta sends webhook to `/webhook/whatsapp`
2. `webhook.py` extracts message and phone number
3. Calls `BookingAgent.process()` (LangGraph)
4. Sends response back via `WhatsAppService.send_message()`

---

## 📁 Key Files

### `webhook.py` - Webhook Handler ⭐
**Purpose**: Handle incoming WhatsApp webhooks

**Key Methods**:
- `handle_webhook(request)` - Process webhook request
- `verify_webhook()` - Handle Meta webhook verification (GET)

**Webhook Format** (Meta Business API):
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "923001234567",
          "text": {"body": "Kal slot hai?"}
        }]
      }
    }]
  }]
}
```

**Extraction Logic**:
```python
# Extract phone number
phone_number = change['value']['messages'][0]['from']

# Extract message text
message_text = change['value']['messages'][0]['text']['body']

# Process via agent
response = await booking_agent.process(phone_number, message_text)

# Send response
await whatsapp_service.send_message(phone_number, response)
```

### `service.py` - Meta API Client
**Purpose**: Send messages via Meta Business API

**Key Methods**:
- `send_message(phone_number, text)` - Send text message
- `send_template_message()` - Send template message (not used)

**API Call**:
```python
url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}
data = {
    "messaging_product": "whatsapp",
    "to": phone_number,
    "type": "text",
    "text": {"body": message_text}
}
```

### `agent.py` - Legacy Agent (Deprecated)
**Purpose**: Old agent implementation (being replaced by LangGraph)

**Status**: ⚠️ Still exists but not used - LangGraph agent in `backend/agent/` is the active implementation

---

## ✅ Current Implementation Status

### Working ✅
- Webhook verification (GET `/webhook/whatsapp`)
- Message receiving (POST `/webhook/whatsapp`)
- Message sending via Meta API
- Phone number extraction
- Message text extraction

### Integration ✅
- Connected to LangGraph agent (`backend/agent/graph.py`)
- Processes messages through full workflow
- Sends agent responses back to users

---

## 🔑 Key Implementation Details

### Webhook Verification

Meta requires webhook verification on first setup:
```python
# GET /webhook/whatsapp?hub.mode=subscribe&hub.verify_token=...
if verify_token == expected_token:
    return challenge_string  # Meta expects this back
```

### Message Extraction

Meta webhook format is nested:
```python
entry = data['entry'][0]
change = entry['changes'][0]
value = change['value']
message = value['messages'][0]
phone_number = message['from']
message_text = message['text']['body']
```

### Error Handling

**If message processing fails**:
- Log error
- Send generic error message to user
- Don't crash webhook handler

**If Meta API fails**:
- Retry logic (not implemented yet)
- Log error for monitoring

---

## 🚧 What Needs to Be Done

### High Priority
1. **Error Handling** (Target: January 18, 2025)
   - Better error messages for users
   - Retry logic for failed API calls
   - Graceful degradation

2. **Message Types** (Target: January 20, 2025)
   - Handle image messages (payment screenshots)
   - Handle location messages
   - Handle button responses

### Medium Priority
1. **Template Messages**: Use Meta templates for structured responses
2. **Media Messages**: Send images, documents
3. **Read Receipts**: Mark messages as read

---

## 🐛 Common Issues

### Webhook Not Receiving Messages
**Symptom**: No messages logged
**Causes**:
- Webhook URL not configured in Meta Console
- Verify token mismatch
- Server not accessible from internet

**Solution**: 
1. Check webhook URL in Meta Developer Console
2. Verify token matches `.env` file
3. Use ngrok for local testing

### Messages Not Sending
**Symptom**: User doesn't receive response
**Causes**:
- Invalid access token
- Phone number format wrong
- API rate limits

**Solution**:
1. Check `WHATSAPP_ACCESS_TOKEN` in `.env`
2. Verify phone number format (country code + number)
3. Check Meta API error responses

---

## 📚 Related Documentation

- **LangGraph Agent**: `backend/agent/README.md` - How messages are processed
- **Meta API Docs**: [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- **Webhook Setup**: See `backend/README.md` for setup instructions

---

## 🧪 Testing

### Test Webhook Locally
```bash
# Start ngrok
ngrok http 8000

# Configure webhook URL in Meta Console:
# https://your-ngrok-url.ngrok.io/webhook/whatsapp

# Send test message from WhatsApp
# Check server logs for processing
```

### Test Message Sending
```bash
# Test sending message
python backend/scripts/test_whatsapp_nlu.py
```

---

**Last Updated**: January 15, 2025  
**Maintained By**: WhatsApp Integration Team  
**Key Files**: `webhook.py`, `service.py`

