import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for the KHI Safe assistant
const SYSTEM_PROMPT = `You are KHI Safe Assistant, a helpful AI assistant for the KHI Safe neighborhood safety app. Your role is to:

1. Help users with safety-related questions and concerns
2. Provide information about emergency services and contacts
3. Guide users on how to report incidents
4. Offer safety tips and best practices
5. Help users find local services and resources
6. Provide general assistance with the app features

Key information about KHI Safe:
- Emergency numbers: Police (15), Rescue (1122), Fire (16), Ambulance (115)
- Users can report incidents through the "Report" tab
- Local services can be found in the "Near Me" section
- The app focuses on neighborhood safety and community awareness

Always be helpful, friendly, and safety-focused. Keep responses concise but informative. If you don't know something specific about the app, suggest the user check the relevant section or contact support.`;

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.chatHistory = new Map(); // Store chat history per user
  }

  // Initialize or get existing chat session
  async getChatSession(userId) {
    if (!this.chatHistory.has(userId)) {
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Hello, I need help with the KHI Safe app.' }],
          },
          {
            role: 'model',
            parts: [{ text: 'Hello! I\'m your KHI Safe assistant. How can I help you today? I can assist you with safety information, emergency contacts, reporting incidents, finding local services, and general app guidance.' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });
      this.chatHistory.set(userId, chat);
    }
    return this.chatHistory.get(userId);
  }

  // Send message to Gemini and get response
  async sendMessage(userId, message) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const chat = await this.getChatSession(userId);
      
      // Add context about the app
      const contextualMessage = `${SYSTEM_PROMPT}\n\nUser message: ${message}`;
      
      const result = await chat.sendMessage(contextualMessage);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback responses for common scenarios
      const fallbackResponse = this.getFallbackResponse(message);
      
      return {
        success: false,
        message: fallbackResponse,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Fallback responses when Gemini API is unavailable
  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('help')) {
      return 'For immediate emergencies:\n• Police: 15\n• Rescue: 1122\n• Fire: 16\n• Ambulance: 115\n\nIs there anything specific I can help you with?';
    } else if (lowerMessage.includes('safety') || lowerMessage.includes('tips')) {
      return 'Here are some safety tips:\n• Avoid displaying expensive items\n• Stay in well-lit areas at night\n• Keep emergency contacts handy\n• Use official transportation\n• Trust your instincts';
    } else if (lowerMessage.includes('report') || lowerMessage.includes('incident')) {
      return 'To report an incident:\n1. Go to the "Report" tab\n2. Select incident type\n3. Provide details and location\n4. Add photos if possible\n5. Submit the report\n\nWould you like me to guide you there?';
    } else if (lowerMessage.includes('services') || lowerMessage.includes('find')) {
      return 'You can find local services in the "Near Me" section:\n• Food & Restaurants\n• Shopping centers\n• Emergency services\n• Healthcare facilities\n• Utilities (plumber, electrician)\n\nWhat type of service are you looking for?';
    } else {
      return 'I understand you\'re asking about "' + userMessage + '". I can help you with:\n• Emergency information\n• Safety tips\n• Reporting incidents\n• Finding local services\n\nWhat would you like to know more about?';
    }
  }

  // Clear chat history for a user
  clearChatHistory(userId) {
    this.chatHistory.delete(userId);
  }

  // Get chat history for a user
  getChatHistory(userId) {
    return this.chatHistory.has(userId);
  }
}

export default new GeminiService(); 