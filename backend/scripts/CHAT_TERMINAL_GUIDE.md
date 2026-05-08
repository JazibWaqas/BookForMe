# Terminal Chat Guide - Test Your AI Agent

## 🎯 Quick Start

You already have a terminal chat script! Use it to test your AI agent directly in the terminal.

### Run the Chat Interface

```bash
# From the backend directory
cd backend
python scripts/chat_terminal.py
```

Or from the project root:
```bash
python backend/scripts/chat_terminal.py
```

## 📋 What It Does

The `chat_terminal.py` script:
- ✅ Uses the **exact same WhatsAppAgent** as production
- ✅ Tests the full LangGraph workflow (classify_intent → query → generate_response)
- ✅ Maintains conversation history (if Firestore is configured)
- ✅ Supports Roman Urdu + English mixed language
- ✅ Handles incomplete queries gracefully

## 🎮 Commands

Once the chat starts, you can use:

- `exit` or `quit` or `q` - Exit the chat
- `clear` - Clear conversation history (restart fresh)
- `/help` - Show help with example messages

## 💬 Example Messages to Try

### Greetings
```
Hi
Aoa
Salam
Hello
```

### Availability Queries (Incomplete - Agent will ask for missing info)
```
koi slot hei?
kal slot hai?
evening ka slot hai?
kal evening ka slot hai?
padel slot available?
```

### Pricing
```
kitna hai price?
kitna charge hai?
what are the rates?
```

### Booking Requests
```
book slot tomorrow 6pm
mujhe slot chahiye kal evening
I want to book for Friday
```

## ⚙️ Requirements

The script requires:
1. **DeepSeek API Key** - Set in `.env` as `DEEPSEEK_API_KEY`
2. **Firestore (Optional)** - For conversation history persistence
   - If not configured, it will still work but won't persist history
   - The StateManager has error handling to work without Firestore

## 🔧 Troubleshooting

### Error: "DEEPSEEK_API_KEY is not configured"
- Check that `DEEPSEEK_API_KEY` is set in your `.env` file
- Verify the API key is valid

### Error: "Firestore connection failed"
- This is OK! The chat will still work
- Conversation history just won't be persisted
- The agent will work with in-memory conversation history

### Error: "Module not found"
- Make sure you're running from the backend directory or have the path set correctly
- The script automatically adds the backend directory to Python path

## 🎯 What You'll See

```
======================================================================
  TERMINAL CHAT - LangGraph Agent Testing (WhatsApp Workflow)
======================================================================

⏳ Initializing LangGraph Agent...
✅ Agent ready!

----------------------------------------------------------------------
💬 Type messages to chat (exact same as WhatsApp webhook)

Commands:
  • 'exit' or 'quit' - End chat
  • 'clear' - Clear conversation history
  • '/help' - Show help and examples
----------------------------------------------------------------------

You: Hi
Agent: Hello! Welcome to Ace Padel Club.

I can help you with:
• Slot availability
• Pricing information
• Booking

How can I help you today?

You: koi slot hei?
Agent: [Response asking for date/time]
```

## 🔍 How It Works

1. **Input**: You type a message
2. **Processing**: Message goes through the full LangGraph workflow:
   - `classify_intent_node` → Uses fast-path extraction plus DeepSeek fallback
   - `query_node` → Calls tools (check_availability, get_pricing, etc.)
   - `generate_response_node` → Generates natural language response
3. **Output**: Agent response is printed
4. **History**: Conversation history is maintained (if Firestore is configured)

## 📝 Alternative: Simple NLU Chat

If you want to test just the NLU (intent classification) without the full agent:

```bash
python scripts/chat.py
```

The current recommended deeper test is `booking_conversation_tests.py`, which
runs multi-turn booking scenarios through the full agent and records reports.

## 🚀 Next Steps

1. Run `python scripts/chat_terminal.py`
2. Try the example messages above
3. Test incomplete queries to see how the agent handles them
4. Test Roman Urdu + English mixed language
5. Test the full booking flow

Enjoy testing your AI agent! 🎉

