import { useState } from 'react';
import { 
  Home, 
  Search, 
  MessageCircle, 
  Users, 
  User, 
  Bell,
  MapPin,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  X,
  Moon,
  Sun,
  Calendar
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from './ui/utils';

interface ResponsiveLayoutProps {
  currentScreen: string;
  userRole: 'customer' | 'vendor';
  onNavigate: (screen: string, data?: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function ResponsiveLayout({ 
  currentScreen, 
  userRole, 
  onNavigate, 
  onLogout, 
  children 
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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

  const getPageTitle = () => {
    switch (currentScreen) {
      case 'home': return 'Discover Venues';
      case 'chatbot': return 'AI Assistant';
      case 'social': return 'Community';
      case 'profile': return 'My Profile';
      case 'venues': return 'Browse Venues';
      case 'venue-detail': return 'Venue Details';
      case 'notifications': return 'Notifications';
      case 'booking-confirmation': return 'Confirm Booking';
      case 'booking-success': return 'Booking Success';
      default: return currentScreen;
    }
  };

  const getPageDescription = () => {
    switch (currentScreen) {
      case 'home': return 'Find and book amazing venues near you';
      case 'chatbot': return 'Get personalized recommendations and support';
      case 'social': return 'Connect with others and find matches';
      case 'profile': return 'Manage your account and bookings';
      case 'venues': return 'Explore available venues and their amenities';
      case 'venue-detail': return 'View details and make a booking';
      case 'notifications': return 'Stay updated with your latest activities';
      default: return 'Navigate through the app';
    }
  };

  const handleNavigate = (screen: string) => {
    onNavigate(screen);
    setSidebarOpen(false);
    setMobileMenuOpen(false);
  };

  // Sidebar Navigation Component
  const SidebarNav = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
            B
          </div>
          <div>
            <h1 className="font-bold">BookForMe</h1>
            <p className="text-xs text-muted-foreground">Venue booking</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 px-4 py-3 h-auto transition-all duration-200 ease-in-out",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground",
                "active:bg-accent active:text-accent-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate(item.id)}
            >
              <Icon size={20} className="flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm leading-tight">{item.label}</div>
                <div className="text-xs opacity-70 leading-tight mt-0.5">{item.description}</div>
              </div>
            </Button>
          );
        })}
      </nav>

      {/* Theme Toggle & Settings */}
      <div className="p-4 border-t dark:border-gray-700 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 py-3"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 py-3 text-red-600 dark:text-red-400"
          onClick={onLogout}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar - Fixed width 320px (80 * 4px) */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex-shrink-0 overflow-y-auto">
          <SidebarNav />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Page Title */}
              <div>
                <h2 className="text-xl font-semibold dark:text-white">{getPageTitle()}</h2>
                <p className="text-sm text-muted-foreground">{getPageDescription()}</p>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-4">
                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={14} />
                  <span>Karachi, Pakistan</span>
                </div>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigate('notifications')}
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
                        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          {userRole === 'customer' ? 'CU' : 'VE'}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleNavigate('profile')}>
                      <User size={16} className="mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigate('profile')}>
                      <Settings size={16} className="mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === 'light' ? <Moon size={16} className="mr-2" /> : <Sun size={16} className="mr-2" />}
                      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
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
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden flex flex-col h-screen">
        {/* Mobile Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Access all navigation options</SheetDescription>
                </SheetHeader>
                <SidebarNav isMobile />
              </SheetContent>
            </Sheet>

            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                B
              </div>
              <h1 className="font-bold dark:text-white">BookForMe</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate('notifications')}
                className="relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-2 py-2">
          <div className="flex items-center justify-around">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 h-auto",
                    isActive && "text-primary"
                  )}
                  onClick={() => handleNavigate(item.id)}
                >
                  <Icon size={20} />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
