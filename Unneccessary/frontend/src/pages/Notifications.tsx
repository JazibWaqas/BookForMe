import React from 'react';
import Header from '../components/Header';
import '../styles/Notifications.css';

// Types
interface NotificationItem {
  id: string;
  type: 'booking' | 'match' | 'post' | 'achievement' | 'offer';
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  actions?: {
    primary?: string;
    secondary?: string;
  };
}

const Notifications: React.FC = () => {
  // Sample notifications data
  const notifications: NotificationItem[] = [
    {
      id: '1',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking at Elite Sports Complex for Oct 5, 6:00 PM has been confirmed.',
      time: '2 minutes ago',
      isUnread: true,
      actions: {
        primary: 'Add to Calendar',
        secondary: 'View Details'
      }
    },
    {
      id: '2',
      type: 'match',
      title: 'Match Invitation',
      message: 'Alex Kumar invited you to a padel match tomorrow at 7:00 PM.',
      time: '1 hour ago',
      isUnread: true,
      actions: {
        primary: 'Accept',
        secondary: 'Decline'
      }
    },
    {
      id: '3',
      type: 'post',
      title: 'New Post',
      message: 'Priya Shah shared a gaming zone promo in your community feed.',
      time: '3 hours ago',
      isUnread: true
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'Congratulations! You\'ve earned the "Sports Enthusiast" badge.',
      time: '1 day ago',
      isUnread: false
    },
    {
      id: '5',
      type: 'offer',
      title: 'Special Offer',
      message: 'Get 30% off your next booking at Premium Gaming Lounge. Valid until Oct 10.',
      time: '1 day ago',
      isUnread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'match':
        return '🏓';
      case 'post':
        return '💬';
      case 'achievement':
        return '🏆';
      case 'offer':
        return '🎁';
      default:
        return '🔔';
    }
  };

  const handleMarkAllRead = () => {
    // Implement mark all as read functionality
    console.log('Mark all as read');
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Implement notification click functionality
    console.log('Notification clicked:', notification.id);
  };

  const handleActionClick = (action: string, notificationId: string) => {
    // Implement action click functionality
    console.log('Action clicked:', action, 'for notification:', notificationId);
  };

  return (
    <>
      {/* Header Component */}
      <Header />
      
      <div className="notifications-page">
      {/* Notifications Content */}
      <div className="notifications-content">
        <div className="container">
          {/* Notifications Header */}
          <div className="notifications-section-header">
            <div className="notifications-count">
              <span className="unread-count">{unreadCount} unread notifications</span>
            </div>
            <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.isUnread ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">{notification.title}</h3>
                    <span className="notification-time">{notification.time}</span>
                    {notification.isUnread && <div className="unread-indicator"></div>}
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.actions && (
                    <div className="notification-actions">
                      {notification.actions.secondary && (
                        <button
                          className="action-btn secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(notification.actions!.secondary!, notification.id);
                          }}
                        >
                          {notification.actions.secondary}
                        </button>
                      )}
                      {notification.actions.primary && (
                        <button
                          className="action-btn primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(notification.actions!.primary!, notification.id);
                          }}
                        >
                          {notification.actions.primary}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Notifications;
