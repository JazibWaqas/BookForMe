import { Bell, Calendar, Users, Trophy, Tag, MessageCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface NotificationsScreenProps {
  onNavigate: (screen: string) => void;
}

interface Notification {
  id: string;
  type: 'booking' | 'match' | 'community' | 'promo' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
}

export function NotificationsScreen({ onNavigate }: NotificationsScreenProps) {
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking at Elite Sports Complex for Oct 5, 6:00 PM has been confirmed.',
      timestamp: '2 minutes ago',
      read: false,
      actionable: true
    },
    {
      id: '2',
      type: 'match',
      title: 'Match Invitation',
      message: 'Alex Kumar invited you to a padel match tomorrow at 7:00 PM.',
      timestamp: '1 hour ago',
      read: false,
      actionable: true
    },
    {
      id: '3',
      type: 'community',
      title: 'New Post',
      message: 'Priya Shah shared a gaming zone promo in your community feed.',
      timestamp: '3 hours ago',
      read: false
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'Congratulations! You\'ve earned the "Sports Enthusiast" badge.',
      timestamp: '1 day ago',
      read: true
    },
    {
      id: '5',
      type: 'promo',
      title: 'Special Offer',
      message: 'Get 25% off at Beach Paradise Resort this weekend only!',
      timestamp: '1 day ago',
      read: true,
      actionable: true
    },
    {
      id: '6',
      type: 'booking',
      title: 'Booking Reminder',
      message: 'Your appointment at Luxe Beauty Salon is in 2 hours.',
      timestamp: '2 days ago',
      read: true
    },
    {
      id: '7',
      type: 'match',
      title: 'Match Result',
      message: 'You won your ranked tennis match! Your ranking improved to #245.',
      timestamp: '3 days ago',
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return Calendar;
      case 'match': return Users;
      case 'community': return MessageCircle;
      case 'achievement': return Trophy;
      case 'promo': return Tag;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-blue-500';
      case 'match': return 'text-green-500';
      case 'community': return 'text-purple-500';
      case 'achievement': return 'text-yellow-500';
      case 'promo': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header - Mobile Only */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold dark:text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm">
            Mark all read
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-4 lg:p-6 space-y-3">
        {/* Header - Desktop */}
        <div className="hidden lg:flex items-center justify-between mb-4">
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
          <Button variant="ghost" size="sm">
            Mark all read
          </Button>
        </div>
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          const iconColor = getNotificationColor(notification.type);
          
          return (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-all dark:bg-gray-800 dark:border-gray-700 ${
                !notification.read 
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20' 
                  : 'hover:shadow-md'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full bg-gray-100 ${iconColor}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className={`font-medium ${!notification.read ? 'text-foreground dark:text-white' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {notification.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${!notification.read ? 'text-foreground dark:text-gray-200' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                    {notification.actionable && (
                      <div className="flex gap-2 mt-3">
                        {notification.type === 'booking' && (
                          <>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm">
                              Add to Calendar
                            </Button>
                          </>
                        )}
                        {notification.type === 'match' && (
                          <>
                            <Button size="sm" variant="outline">
                              Decline
                            </Button>
                            <Button size="sm">
                              Accept
                            </Button>
                          </>
                        )}
                        {notification.type === 'promo' && (
                          <Button size="sm">
                            View Offer
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State (when no notifications) */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
          <p className="text-muted-foreground max-w-sm">
            We'll notify you about booking confirmations, match invitations, and special offers.
          </p>
        </div>
      )}
    </div>
  );
}