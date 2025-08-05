import React, { useState } from 'react';
import { Settings, Bell, Shield, MapPin, Smartphone, Globe, HelpCircle, Info, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useTheme } from './ThemeProvider';

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    security: true,
    community: true,
    services: false,
    property: true,
    emergency: true,
  });

  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    showProfile: false,
    allowMessages: true,
  });

  const settingsSections = [
    {
      title: 'Appearance',
      icon: Smartphone,
      items: [
        {
          title: 'Theme',
          subtitle: 'Choose your preferred theme',
          action: (
            <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          ),
        },
        {
          title: 'Language',
          subtitle: 'Select your language',
          action: (
            <Select defaultValue="en">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ur">اردو</SelectItem>
              </SelectContent>
            </Select>
          ),
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          title: 'Security Alerts',
          subtitle: 'Crime alerts and safety updates',
          action: (
            <Switch
              checked={notifications.security}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, security: checked }))}
            />
          ),
        },
        {
          title: 'Community Posts',
          subtitle: 'New posts in your neighborhood',
          action: (
            <Switch
              checked={notifications.community}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, community: checked }))}
            />
          ),
        },
        {
          title: 'Service Updates',
          subtitle: 'New services and offers',
          action: (
            <Switch
              checked={notifications.services}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, services: checked }))}
            />
          ),
        },
        {
          title: 'Property Alerts',
          subtitle: 'Price changes and new listings',
          action: (
            <Switch
              checked={notifications.property}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, property: checked }))}
            />
          ),
        },
        {
          title: 'Emergency Alerts',
          subtitle: 'Critical safety information',
          action: (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">Required</Badge>
              <Switch checked={notifications.emergency} disabled />
            </div>
          ),
        },
      ],
    },
    {
      title: 'Privacy & Safety',
      icon: Shield,
      items: [
        {
          title: 'Share Location',
          subtitle: 'Allow location-based features',
          action: (
            <Switch
              checked={privacy.shareLocation}
              onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, shareLocation: checked }))}
            />
          ),
        },
        {
          title: 'Public Profile',
          subtitle: 'Make your profile visible to others',
          action: (
            <Switch
              checked={privacy.showProfile}
              onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showProfile: checked }))}
            />
          ),
        },
        {
          title: 'Allow Messages',
          subtitle: 'Receive messages from neighbors',
          action: (
            <Switch
              checked={privacy.allowMessages}
              onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allowMessages: checked }))}
            />
          ),
        },
      ],
    },
    {
      title: 'Location',
      icon: MapPin,
      items: [
        {
          title: 'Primary Area',
          subtitle: 'DHA Phase 5, Karachi',
          action: <ChevronRight size={16} className="text-muted-foreground" />,
        },
        {
          title: 'Nearby Areas',
          subtitle: 'Get updates from nearby neighborhoods',
          action: (
            <Switch defaultChecked />
          ),
        },
      ],
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        {
          title: 'Help Center',
          subtitle: 'Get help and support',
          action: <ChevronRight size={16} className="text-muted-foreground" />,
        },
        {
          title: 'Report a Bug',
          subtitle: 'Let us know about issues',
          action: <ChevronRight size={16} className="text-muted-foreground" />,
        },
        {
          title: 'About',
          subtitle: 'App version and information',
          action: <ChevronRight size={16} className="text-muted-foreground" />,
        },
      ],
    },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Settings className="text-gray-600 dark:text-gray-400" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">Customize your app experience</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <section.icon size={18} className="text-muted-foreground" />
              <h3 className="font-semibold text-card-foreground">{section.title}</h3>
            </div>
            
            <Card className="overflow-hidden">
              {section.items.map((item, index) => (
                <div key={item.title}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <div className="ml-4">
                      {item.action}
                    </div>
                  </div>
                  {index < section.items.length - 1 && <div className="border-t border-border mx-4" />}
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>

      {/* App Info */}
      <Card className="p-4 bg-muted/50 border-muted">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">KHI Safe v1.0.0</span>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Making Karachi safer, one neighborhood at a time
        </p>
      </Card>
    </div>
  );
}