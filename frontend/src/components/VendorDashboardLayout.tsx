import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Settings,
  Plug,
  User,
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  X,
  Moon,
  Sun,
  MapPin,
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from './ui/utils';

interface VendorDashboardLayoutProps {
  currentScreen: string;
  vendorName: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function VendorDashboardLayout({
  currentScreen,
  vendorName,
  onNavigate,
  onLogout,
  children,
}: VendorDashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [notifications] = useState([
    { id: 1, text: 'New booking from WhatsApp', unread: true },
    { id: 2, text: 'Google Sheets sync completed', unread: false },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const navigationItems = [
    { id: 'vendor-dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Monitor performance' },
    { id: 'vendor-calendar', label: 'Calendar', icon: Calendar, description: 'View all bookings' },
    { id: 'vendor-bookings', label: 'Bookings', icon: BookOpen, description: 'Manage bookings' },
    { id: 'vendor-integrations', label: 'Integrations', icon: Plug, description: 'WhatsApp & Sheets' },
    { id: 'vendor-profile', label: 'Business Profile', icon: Settings, description: 'Update business info' },
  ];

  const getPageTitle = () => {
    switch (currentScreen) {
      case 'vendor-dashboard':
        return 'Dashboard';
      case 'vendor-calendar':
        return 'Calendar';
      case 'vendor-bookings':
        return 'Bookings';
      case 'vendor-integrations':
        return 'Integrations';
      case 'vendor-profile':
        return 'Business Profile';
      case 'notifications':
        return 'Notifications';
      default:
        return 'Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (currentScreen) {
      case 'vendor-dashboard':
        return 'Monitor your business performance and recent activity';
      case 'vendor-calendar':
        return 'View all bookings from all channels in one place';
      case 'vendor-bookings':
        return 'Manage and track all your bookings';
      case 'vendor-integrations':
        return 'Connect WhatsApp and Google Sheets for automated booking';
      case 'vendor-profile':
        return 'Update your business information and settings';
      case 'notifications':
        return 'Stay updated with your latest activities';
      default:
        return 'Manage your business';
    }
  };

  const handleNavigate = (screen: string) => {
    onNavigate(screen);
    setMobileMenuOpen(false);
  };

  // Sidebar Navigation Component
  const SidebarNav = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
            B
          </div>
          <div>
            <h1 className="font-bold dark:text-white">BookForMe</h1>
            <p className="text-xs text-muted-foreground">Vendor Dashboard</p>
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
        {/* Sidebar */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex-shrink-0">
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
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                          VE
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleNavigate('vendor-profile')}>
                      <User size={16} className="mr-2" />
                      Business Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigate('vendor-profile')}>
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
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
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
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm sm:text-base flex-shrink-0">
                B
              </div>
              <h1 className="font-bold dark:text-white text-sm sm:text-base truncate">BookForMe</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate('notifications')}
                className="relative p-2"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-3 sm:p-4">
            {children}
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-2 py-2">
          <div className="flex items-center justify-around">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 sm:px-3 py-2 h-auto transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "text-primary bg-accent"
                  )}
                  onClick={() => handleNavigate(item.id)}
                >
                  <Icon size={18} className="sm:w-5 sm:h-5" />
                  <span className="text-xs leading-tight">{item.label.split(' ')[0]}</span>
                </Button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
