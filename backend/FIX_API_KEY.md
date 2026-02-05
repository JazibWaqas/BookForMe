# Fix: Invalid Groq API Key Error

## Problem
You're getting `401 Unauthorized - Invalid API Key` errors when trying to use the WhatsApp agent.

## Root Cause
The `.env` file is missing or has an invalid `GROQ_API_KEY`. The code requires a valid Groq API key to function.

## Solution

### Step 1: Get Your Groq API Key

1. Go to https://console.groq.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (it starts with `gsk_...`)

### Step 2: Add API Key to .env File

1. Open `backend/.env` file
2. Find the line: `GROQ_API_KEY=your_groq_api_key_here`
3. Replace `your_groq_api_key_here` with your actual API key:
   ```
   GROQ_API_KEY=gsk_your_actual_key_here
   ```
4. Save the file

### Step 3: Clear Conversation History (Optional)

To start fresh, run:
```bash
python backend/scripts/clear_conversation_history.py +923001234567
```

Or use the `clear` command in the chat terminal.

### Step 4: Restart the Application

Restart your terminal chat or server for changes to take effect.

## Verification

After setting the API key, test it:
```bash
python backend/scripts/test_groq_migration.py
```

This will verify your API key is working correctly.

## Notes

- The Groq API key is free for development (with rate limits)
- Keep your API key secret - never commit it to git
- The `.env` file is already in `.gitignore` so it won't be committed
