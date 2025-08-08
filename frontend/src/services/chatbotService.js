import { auth } from './firebaseConfig';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

class ChatbotService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authentication token
  async getAuthToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  }

  // Send message to chatbot
  async sendMessage(message) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chatbot service error:', error);
      throw error;
    }
  }

  // Clear chat history
  async clearHistory() {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/chatbot/clear-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear history');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Clear history error:', error);
      throw error;
    }
  }

  // Check if service is available
  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Service availability check failed:', error);
      return false;
    }
  }
}

export default new ChatbotService(); 