import { useState } from 'react';
import { Send, Mic, Bot, User, HelpCircle, Settings, Zap, MessageSquare, Lightbulb, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';

interface DesktopChatbotScreenProps {
  onNavigate: (screen: string) => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'recommendation' | 'booking';
  data?: any;
}

export function DesktopChatbotScreen({ onNavigate }: DesktopChatbotScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'m your BookForMe AI assistant. I can help you find venues, make bookings, answer questions, and even act as your personal booking agent. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [activeMode, setActiveMode] = useState<'ask' | 'agent'>('ask');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { text: 'Find sports courts near me', icon: MapPin, category: 'search' },
    { text: 'Recommend venues for badminton', icon: Lightbulb, category: 'recommend' },
    { text: 'Check my bookings', icon: MessageSquare, category: 'booking' },
    { text: 'Cancel a booking', icon: Settings, category: 'booking' },
    { text: 'Book a venue for tonight', icon: Zap, category: 'agent' },
    { text: 'Best gaming zones in the city', icon: Lightbulb, category: 'recommend' }
  ];

  const agentCapabilities = [
    {
      title: 'Smart Booking',
      description: 'I can book venues automatically based on your preferences',
      icon: Zap
    },
    {
      title: 'Price Comparison',
      description: 'Compare prices across multiple venues to find the best deals',
      icon: HelpCircle
    },
    {
      title: 'Schedule Management',
      description: 'Manage your bookings and send reminders',
      icon: Settings
    }
  ];

  const mockResponses = {
    'Find sports courts near me': {
      content: 'I found several great sports courts in your area! Here are the top recommendations:',
      type: 'recommendation' as const,
      data: [
        { name: 'Elite Sports Complex', distance: '2.1 km', price: '₹1,200/hr', rating: 4.8 },
        { name: 'Champion Sports Arena', distance: '3.5 km', price: '₹1,000/hr', rating: 4.6 },
        { name: 'Prime Court Complex', distance: '5.2 km', price: '₹1,800/hr', rating: 4.9 }
      ]
    },
    'Check my bookings': {
      content: 'Here are your upcoming bookings:',
      type: 'booking' as const,
      data: [
        { venue: 'Elite Padel Club', date: 'Today, 6:00 PM', status: 'Confirmed' },
        { venue: 'GameZone Pro', date: 'Tomorrow, 3:00 PM', status: 'Pending' }
      ]
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const response = mockResponses[inputValue as keyof typeof mockResponses];
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response?.content || `I understand you're looking for help with "${inputValue}". Let me assist you with that. In the real app, I would process this request and provide personalized recommendations based on your preferences and location.`,
        sender: 'bot',
        timestamp: new Date(),
        type: response?.type || 'text',
        data: response?.data
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className={isUser ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
            
            {/* Render special content types */}
            {message.type === 'recommendation' && message.data && (
              <div className="mt-3 space-y-2">
                {message.data.map((venue: any, index: number) => (
                  <div key={index} className="bg-white/10 rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{venue.name}</span>
                      <span>{venue.price}</span>
                    </div>
                    <div className="flex justify-between text-xs opacity-80">
                      <span>{venue.distance}</span>
                      <span>★ {venue.rating}</span>
                    </div>
                  </div>
                ))}
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="mt-2"
                  onClick={() => onNavigate('venues')}
                >
                  View All Venues
                </Button>
              </div>
            )}
            
            {message.type === 'booking' && message.data && (
              <div className="mt-3 space-y-2">
                {message.data.map((booking: any, index: number) => (
                  <div key={index} className="bg-white/10 rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{booking.venue}</span>
                      <Badge variant={booking.status === 'Confirmed' ? 'default' : 'secondary'} className="text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-xs opacity-80">{booking.date}</div>
                  </div>
                ))}
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="mt-2"
                  onClick={() => onNavigate('profile')}
                >
                  Manage Bookings
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mode Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Assistant Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'ask' | 'agent')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ask" className="text-sm">Ask</TabsTrigger>
                  <TabsTrigger value="agent" className="text-sm">Agent</TabsTrigger>
                </TabsList>
                
                <div className="mt-4">
                  {activeMode === 'ask' ? (
                    <div>
                      <h4 className="font-medium mb-2">Ask Mode</h4>
                      <p className="text-sm text-muted-foreground">
                        Get answers to your questions about venues, bookings, and more.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium mb-2">Agent Mode</h4>
                      <p className="text-sm text-muted-foreground">
                        Let AI handle your bookings automatically based on your preferences.
                      </p>
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left h-auto p-4 transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      "active:bg-accent active:text-accent-foreground"
                    )}
                    onClick={() => handleQuickAction(action.text)}
                  >
                    <Icon size={18} className="mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium leading-relaxed break-words">{action.text}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Agent Capabilities */}
          {activeMode === 'agent' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentCapabilities.map((capability, index) => {
                  const Icon = capability.icon;
                  return (
                    <div key={index} className="flex gap-3">
                      <Icon size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-sm">{capability.title}</h5>
                        <p className="text-xs text-muted-foreground">{capability.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    <Bot size={20} />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">BookForMe Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeMode === 'ask' ? 'Ask me anything!' : 'Your personal booking agent'}
                  </p>
                </div>
              </div>
              <Badge variant={activeMode === 'agent' ? 'default' : 'secondary'}>
                {activeMode === 'ask' ? 'Q&A Mode' : 'Agent Mode'}
              </Badge>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map(renderMessage)}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          <Bot size={16} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      activeMode === 'ask' 
                        ? "Ask me anything about venues..." 
                        : "Tell me what you want to book..."
                    }
                    className="pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    <Mic size={16} />
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                  <Send size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}