import React, { useState } from 'react';
import { Send, X, Bot, User, MapPin, Phone, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  serviceResults?: ServiceResult[];
}

interface ServiceResult {
  name: string;
  location: string;
  phone: string;
  distance: string;
  rating: number;
  available: boolean;
}

interface Props {
  onClose: () => void;
}

const predefinedQueries = [
  "Where to get photocopy in Clifton?",
  "Best biryani near DHA Phase 5",
  "Emergency plumber contact",
  "Nearest pharmacy open now",
  "AC repair service in Gulshan",
  "Traffic update Shahrah-e-Faisal"
];

const mockResponses: Record<string, { text: string; serviceResults?: ServiceResult[] }> = {
  "photocopy": {
    text: "I found several photocopy shops in Clifton area:",
    serviceResults: [
      { name: "Quick Copy Center", location: "Clifton Block 2", phone: "+92 21 1234567", distance: "0.2 km", rating: 4.5, available: true },
      { name: "Digital Print Solutions", location: "Clifton Block 4", phone: "+92 21 9876543", distance: "0.4 km", rating: 4.3, available: true },
      { name: "Express Printing", location: "Boat Basin", phone: "+92 21 5555555", distance: "0.6 km", rating: 4.7, available: false }
    ]
  },
  "biryani": {
    text: "Here are the top-rated biryani places near DHA Phase 5:",
    serviceResults: [
      { name: "Karachi Darbar", location: "DHA Phase 5", phone: "+92 21 1111111", distance: "0.1 km", rating: 4.8, available: true },
      { name: "Sindhi Biryani", location: "DHA Phase 4", phone: "+92 21 2222222", distance: "0.3 km", rating: 4.6, available: true },
      { name: "Biryani Mahal", location: "Clifton", phone: "+92 21 3333333", distance: "0.5 km", rating: 4.4, available: true }
    ]
  },
  "plumber": {
    text: "Emergency plumber services available now:",
    serviceResults: [
      { name: "24/7 Plumbing Service", location: "DHA Phase 2", phone: "+92 300 1234567", distance: "0.4 km", rating: 4.9, available: true },
      { name: "Quick Fix Plumbers", location: "Clifton", phone: "+92 333 9876543", distance: "0.7 km", rating: 4.7, available: true }
    ]
  }
};

export function ChatbotAssistant({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your Karachi neighborhood assistant. I can help you find services, get local information, and answer questions about your area. What can I help you with today?",
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ["Find services", "Local information", "Emergency contacts", "Traffic updates"]
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const generateBotResponse = (query: string): Message => {
    const lowerQuery = query.toLowerCase();
    
    let response = { text: "I'm not sure about that. Can you try asking about services, local businesses, or emergency contacts?", serviceResults: [] };

    if (lowerQuery.includes('photocopy') || lowerQuery.includes('print')) {
      response = mockResponses.photocopy;
    } else if (lowerQuery.includes('biryani') || lowerQuery.includes('food')) {
      response = mockResponses.biryani;
    } else if (lowerQuery.includes('plumber') || lowerQuery.includes('emergency')) {
      response = mockResponses.plumber;
    } else if (lowerQuery.includes('pharmacy') || lowerQuery.includes('medical')) {
      response = {
        text: "Here are nearby pharmacies:",
        serviceResults: [
          { name: "Agha Khan Pharmacy", location: "DHA Phase 5", phone: "+92 21 4444444", distance: "0.2 km", rating: 4.6, available: true },
          { name: "CityLab Pharmacy", location: "Clifton", phone: "+92 21 5555555", distance: "0.5 km", rating: 4.4, available: true }
        ]
      };
    } else if (lowerQuery.includes('traffic')) {
      response = {
        text: "Current traffic update for Shahrah-e-Faisal: Moderate traffic from Airport to Drigh Road. Estimated travel time: 25-30 minutes. Consider using Korangi Road as alternate route."
      };
    }

    return {
      id: messages.length + 2,
      text: response.text,
      sender: 'bot',
      timestamp: new Date(),
      serviceResults: response.serviceResults,
      suggestions: ["Ask another question", "Find more services", "Get directions", "Emergency contacts"]
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold">KHI Assistant</h3>
            <p className="text-sm opacity-90">Your neighborhood helper</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick Queries */}
      <div className="p-4 border-b bg-blue-50">
        <p className="text-sm text-gray-600 mb-2">Popular questions:</p>
        <div className="flex flex-wrap gap-2">
          {predefinedQueries.slice(0, 3).map((query, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(query)}
              className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
              <div
                className={`p-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 rounded-bl-md border'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              
              {/* Service Results */}
              {message.serviceResults && message.serviceResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.serviceResults.map((service, index) => (
                    <Card key={index} className="p-3 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{service.name}</h5>
                            {service.available && (
                              <Badge className="bg-green-100 text-green-700 text-xs">Open</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin size={10} />
                              {service.location}
                            </div>
                            <div>{service.distance}</div>
                            <div>★ {service.rating}</div>
                          </div>
                          <button className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                            <Phone size={10} />
                            Call
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Suggestions */}
              {message.suggestions && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'order-2 ml-2 bg-blue-600 text-white' : 'order-1 mr-2 bg-gray-200'}`}>
              {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about services, locations, emergencies..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage(inputValue)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}