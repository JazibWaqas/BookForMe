# Slotify Backend

This folder contains the backend logic for Slotify, a web-based sports booking platform for time-based sports venues in Pakistan.

## Stack
- **Firebase Cloud Functions**: Handles backend logic, booking conflict prevention, AI chatbot, voice confirmations, and WhatsApp notifications.
- **Firestore**: NoSQL database for users, vendors, venues, slots, reviews, chat, and leaderboard.
- **Firebase Auth**: Authentication for users and vendors.
- **Firebase Storage**: For audio and image uploads.

## Structure
- `/functions` — Firebase Cloud Functions source code
- `/models` — (optional) Shared Firestore data models/schemas
- `/utils` — (optional) Utility functions for backend logic

## Responsibilities
- Prevent double-booking using Firestore transactions
- Integrate with Google Gemini API for AI chatbot
- Generate voice confirmations with Google Cloud Text-to-Speech
- Send WhatsApp messages via Twilio
- Expose HTTP endpoints for frontend to interact with backend

---

> See the main project README for overall architecture and setup instructions. 