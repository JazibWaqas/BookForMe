import { useState } from 'react';
import { 
  Home, 
  Search, 
  Calendar, 
  MessageCircle, 
  Users, 
  User, 
  Bell,
  MapPin,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

interface DesktopLayoutProps {
  currentScreen: string;
  userRole: 'customer' | 'vendor';
  onNavigate: (screen: string, data?: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function DesktopLayout({ currentScreen, userRole, onNavigate, onLogout, children }: DesktopLayoutProps) {
  const [notifications] = useState([
    { id: 1, text: "Booking confirmed for Padel Court A", unread: true },
    { id: 2, text: "New match available nearby", unread: true },
    { id: 3, text: "Venue review reminder", unread: false }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, description: 'Discover venues' },
    { id: 'chatbot', label: 'AI Assistant', icon: MessageCircle, description: 'Get help & recommendations' },
    { id: 'social', label: 'Community', icon: Users, description: 'Connect & find matches' },
    { id: 'profile', label: 'Profile', icon: User, description: 'Your bookings & settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand and Navigation */}
            <div className="flex items-center gap-8">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                  B
                </div>
                <div>
                  <h1 className="text-xl font-bold">BookForMe</h1>
                  <p className="text-xs text-muted-foreground">Venue booking made easy</p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="flex items-center gap-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      className={`flex items-center gap-2 px-4 py-2 ${
                        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => onNavigate(item.id)}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  );
                })}
              </nav>
            </div>

            {/* Right Side - Location, Notifications, User Menu */}
            <div className="flex items-center gap-4">
              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span>Karachi, Pakistan</span>
              </div>

              {/* Special Offer Card (only on home) */}
              {currentScreen === 'home' && (
                <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  <CardContent className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        %
                      </div>
                      <div>
                        <p className="text-sm font-medium">Special Offer!</p>
                        <p className="text-xs opacity-90">Up to 30% off today</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('notifications')}
                className="relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {userRole === 'customer' ? 'CU' : 'VE'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {userRole === 'customer' ? 'John Customer' : 'Jane Vendor'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                    </div>
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onNavigate('profile')}>
                    <User size={16} className="mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('profile')}>
                    <Settings size={16} className="mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-700">
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold">
              {currentScreen === 'home' ? 'Discover Venues' :
               currentScreen === 'chatbot' ? 'AI Assistant' :
               currentScreen === 'social' ? 'Community' :
               currentScreen === 'profile' ? 'My Profile' :
               currentScreen === 'venues' ? 'Browse Venues' :
               currentScreen === 'venue-detail' ? 'Venue Details' :
               currentScreen === 'notifications' ? 'Notifications' :
               currentScreen}
            </h2>
            <p className="text-muted-foreground mt-1">
              {currentScreen === 'home' ? 'Find and book amazing venues near you' :
               currentScreen === 'chatbot' ? 'Get personalized recommendations and support' :
               currentScreen === 'social' ? 'Connect with others and find matches' :
               currentScreen === 'profile' ? 'Manage your account and bookings' :
               currentScreen === 'venues' ? 'Explore available venues and their amenities' :
               currentScreen === 'venue-detail' ? 'View details and make a booking' :
               currentScreen === 'notifications' ? 'Stay updated with your latest activities' :
               'Navigate through the app'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}