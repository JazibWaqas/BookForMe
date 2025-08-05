import React from 'react';
import { Alert, AlertTriangle, Car, Zap, Users, Clock, MapPin, MessageSquare, Heart } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

const alertData = [
  {
    id: 1,
    type: 'robbery',
    title: 'Robbery Alert - DHA Phase 2',
    location: 'Near Zamzama Park',
    time: '2 hours ago',
    severity: 'high',
    icon: AlertTriangle,
    description: 'Armed robbery reported near Zamzama Park. Avoid the area if possible.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    id: 2,
    type: 'traffic',
    title: 'Heavy Traffic - Shahrah-e-Faisal',
    location: 'Airport to Drigh Road',
    time: '30 minutes ago',
    severity: 'medium',
    icon: Car,
    description: 'Heavy traffic due to VIP movement. Use alternate routes.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 3,
    type: 'utility',
    title: 'Power Outage - Gulshan-e-Iqbal',
    location: 'Block 7 & 8',
    time: '1 hour ago',
    severity: 'medium',
    icon: Zap,
    description: 'Scheduled maintenance, power expected back by 6 PM.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  {
    id: 4,
    type: 'community',
    title: 'Community Meeting - Clifton',
    location: 'Block 4 Community Center',
    time: '4 hours ago',
    severity: 'low',
    icon: Users,
    description: 'Monthly security meeting scheduled for tomorrow 7 PM.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
];

const communityPosts = [
  {
    id: 1,
    author: 'Ahmed Khan',
    location: 'DHA Phase 6',
    time: '3 hours ago',
    content: 'Looking for a reliable electrician in the area. Any recommendations?',
    likes: 12,
    comments: 5,
    avatar: '👨'
  },
  {
    id: 2,
    author: 'Fatima Ali',
    location: 'Clifton Block 2',
    time: '5 hours ago',
    content: 'Great job by the security guards last night. Feeling safer in our neighborhood!',
    likes: 24,
    comments: 8,
    avatar: '👩'
  },
  {
    id: 3,
    author: 'Karachi Police',
    location: 'Saddar',
    time: '6 hours ago',
    content: 'Regular patrol increased in the area. Report any suspicious activity on 15.',
    likes: 45,
    comments: 12,
    avatar: '👮',
    verified: true
  }
];

export function HomeDashboard() {
  return (
    <div className="p-4 space-y-6">
      {/* Location Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Your Location</h2>
            <p className="text-sm text-gray-600">DHA Phase 5, Karachi</p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
            Safe Zone
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center border-green-200 bg-green-50">
          <div className="text-2xl font-bold text-green-700">98%</div>
          <div className="text-xs text-green-600">Safety Score</div>
        </Card>
        <Card className="p-3 text-center border-blue-200 bg-blue-50">
          <div className="text-2xl font-bold text-blue-700">4.2</div>
          <div className="text-xs text-blue-600">Area Rating</div>
        </Card>
        <Card className="p-3 text-center border-purple-200 bg-purple-50">
          <div className="text-2xl font-bold text-purple-700">156</div>
          <div className="text-xs text-purple-600">Active Users</div>
        </Card>
      </div>

      {/* Alerts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Alerts</h3>
          <Badge variant="outline" className="text-xs">
            Live Updates
          </Badge>
        </div>
        <div className="space-y-3">
          {alertData.map((alert) => (
            <Card key={alert.id} className={`p-4 border-l-4 ${alert.borderColor} ${alert.bgColor}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${alert.bgColor} flex items-center justify-center`}>
                  <alert.icon className={alert.color} size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <Badge 
                      variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      {alert.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {alert.time}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Community Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Community Feed</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {communityPosts.map((post) => (
            <Card key={post.id} className="p-4 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {post.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{post.author}</h4>
                    {post.verified && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      {post.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.time}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
                      <Heart size={14} />
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500">
                      <MessageSquare size={14} />
                      {post.comments}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}