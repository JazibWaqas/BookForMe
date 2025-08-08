# Gemini AI Integration for KHI Safe App

This document explains how to set up and use the Gemini AI integration in the KHI Safe neighborhood safety app.

## Overview

The KHI Safe app now includes an AI-powered chatbot assistant using Google's Gemini API. The chatbot provides:

- Safety information and tips
- Emergency contact numbers
- Guidance on reporting incidents
- Help with finding local services
- General app assistance

## Architecture

### Backend (Node.js + Express)
- **Gemini Service** (`backend/src/gemini.js`): Handles AI interactions
- **API Endpoints** (`backend/src/index.js`): REST endpoints for chatbot
- **Authentication**: Firebase Auth integration
- **Chat History**: Per-user session management

### Frontend (React Native + Expo)
- **ChatbotAssistant Component** (`frontend/src/screens/ChatbotAssistant.js`): UI for the chatbot
- **Chatbot Service** (`frontend/src/services/chatbotService.js`): API communication
- **Navigation**: Integrated into main app navigation

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key for use in the backend

### 2. Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your-actual-gemini-api-key
   ```

3. **Start the Backend**
   ```bash
   npm start
   ```

### 3. Frontend Setup

1. **Environment Configuration**
   ```bash
   cd frontend
   cp env.example .env
   ```
   
   Edit `.env` and set the API URL:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3001
   ```

2. **Start the Frontend**
   ```bash
   npm start
   ```

## Features

### AI-Powered Responses
- Contextual understanding of safety-related queries
- Personalized responses based on user history
- Fallback responses when API is unavailable

### User Experience
- Real-time chat interface
- Loading indicators during AI processing
- Quick action buttons for common queries
- Service availability status

### Security
- Firebase authentication required
- User-specific chat sessions
- Secure API communication

## API Endpoints

### POST /chatbot/message
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "What are the emergency numbers?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "For immediate emergencies:\n• Police: 15\n• Rescue: 1122\n• Fire: 16\n• Ambulance: 115",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /chatbot/clear-history
Clear the user's chat history.

**Response:**
```json
{
  "message": "Chat history cleared successfully"
}
```

## Usage

### In the App
1. Navigate to the "Assistant" tab in the bottom navigation
2. Type your question or use quick action buttons
3. The AI will respond with helpful information
4. Chat history is maintained per user session

### Quick Actions
- **Emergency numbers**: Get contact information
- **Safety tips**: Receive safety advice
- **Report incident**: Guidance on reporting
- **Find services**: Help locating local services

## Error Handling

### Fallback System
- If Gemini API is unavailable, the app uses predefined responses
- Users are notified when using fallback mode
- Service status is displayed in the UI

### Common Issues
1. **API Key Missing**: Check `.env` file configuration
2. **Network Issues**: Verify backend is running
3. **Authentication**: Ensure user is logged in

## Development

### Adding New Features
1. **Backend**: Extend `gemini.js` with new functionality
2. **Frontend**: Update `ChatbotAssistant.js` UI
3. **API**: Add new endpoints in `index.js`

### Testing
- Test with various user inputs
- Verify fallback responses work
- Check authentication flow
- Test network error scenarios

## Security Considerations

- API keys are stored securely in environment variables
- User authentication is required for all chatbot interactions
- Chat history is isolated per user
- No sensitive data is stored in chat sessions

## Troubleshooting

### Backend Issues
- Check `.env` file configuration
- Verify Gemini API key is valid
- Check server logs for errors
- Ensure Firebase configuration is correct

### Frontend Issues
- Verify API URL in environment
- Check network connectivity
- Ensure user is authenticated
- Clear app cache if needed

## Support

For issues with the Gemini integration:
1. Check the console logs for error messages
2. Verify API key and configuration
3. Test with simple queries first
4. Check network connectivity

## Future Enhancements

- Voice input/output
- Image analysis for incident reports
- Multi-language support
- Advanced context awareness
- Integration with other AI services 