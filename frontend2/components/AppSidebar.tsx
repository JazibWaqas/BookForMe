import React from 'react';
import {
  Home,
  Search,
  FileText,
  Users,
  Map,
  TrendingUp,
  CheckCircle,
  Heart,
  Settings,
  User,
  Moon,
  Sun,
  Star,
  MapPin,
  Building,
  MessageSquare,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from './ui/sidebar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from './ThemeProvider';
import { useFavorites } from './FavoritesProvider';
import { Switch } from './ui/switch';
import { Avatar } from './ui/avatar';

type Screen = 'home' | 'search' | 'chatbot' | 'complaint' | 'rankings' | 'property' | 'listings' | 'chat' | 'favorites' | 'settings' | 'profile';

interface AppSidebarProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const navigationItems = [
  { id: 'home' as Screen, icon: Home, label: 'Dashboard', color: 'text-blue-600' },
  { id: 'search' as Screen, icon: Search, label: 'Find Services', color: 'text-green-600' },
  { id: 'complaint' as Screen, icon: FileText, label: 'Report Issue', color: 'text-orange-600' },
  { id: 'chat' as Screen, icon: Users, label: 'Community', color: 'text-purple-600' },
];

const exploreItems = [
  { id: 'rankings' as Screen, icon: Map, label: 'Area Rankings', color: 'text-blue-500' },
  { id: 'property' as Screen, icon: TrendingUp, label: 'Property Insights', color: 'text-green-500' },
  { id: 'listings' as Screen, icon: CheckCircle, label: 'Verified Listings', color: 'text-indigo-500' },
];

const personalItems = [
  { id: 'favorites' as Screen, icon: Heart, label: 'Favorites', color: 'text-red-500' },
  { id: 'profile' as Screen, icon: User, label: 'Profile', color: 'text-gray-600' },
  { id: 'settings' as Screen, icon: Settings, label: 'Settings', color: 'text-gray-600' },
];

export function AppSidebar({ currentScreen, onScreenChange }: AppSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { favorites, getFavoritesByType } = useFavorites();

  const recentFavorites = favorites.slice(0, 3);

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">KHI Safe</h1>
            <p className="text-xs text-sidebar-foreground/60">Karachi Safety Hub</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onScreenChange(item.id)}
                    isActive={currentScreen === item.id}
                    className="w-full"
                  >
                    <item.icon className={currentScreen === item.id ? item.color : 'text-sidebar-foreground/60'} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Explore Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onScreenChange(item.id)}
                    isActive={currentScreen === item.id}
                    className="w-full"
                  >
                    <item.icon className={currentScreen === item.id ? item.color : 'text-sidebar-foreground/60'} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Quick Favorites */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            Recent Favorites
            {favorites.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {favorites.length}
              </Badge>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentFavorites.length > 0 ? (
                <>
                  {recentFavorites.map((favorite) => (
                    <SidebarMenuItem key={favorite.id}>
                      <SidebarMenuButton className="w-full text-left">
                        <div className="flex items-center gap-2 min-w-0">
                          {favorite.type === 'service' && <Search size={16} className="text-green-500 shrink-0" />}
                          {favorite.type === 'location' && <MapPin size={16} className="text-blue-500 shrink-0" />}
                          {favorite.type === 'listing' && <Building size={16} className="text-indigo-500 shrink-0" />}
                          {favorite.type === 'post' && <MessageSquare size={16} className="text-purple-500 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{favorite.title}</p>
                            {favorite.subtitle && (
                              <p className="text-xs text-sidebar-foreground/60 truncate">{favorite.subtitle}</p>
                            )}
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onScreenChange('favorites')} className="w-full">
                      <ChevronRight size={16} />
                      <span className="text-sm">View all favorites</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <div className="px-4 py-2 text-sm text-sidebar-foreground/60">
                    No favorites yet. Start exploring!
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Personal Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onScreenChange(item.id)}
                    isActive={currentScreen === item.id}
                    className="w-full"
                  >
                    <item.icon className={currentScreen === item.id ? item.color : 'text-sidebar-foreground/60'} />
                    <span>{item.label}</span>
                    {item.id === 'favorites' && favorites.length > 0 && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {favorites.length}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Quick Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  <span className="text-sm">Dark Mode</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={16} />
                  <span className="text-sm">Notifications</span>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onScreenChange('profile')} className="w-full">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <div className="w-full h-full bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </Avatar>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium">Ahmed Khan</p>
                  <p className="text-xs text-sidebar-foreground/60">DHA Phase 5</p>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}