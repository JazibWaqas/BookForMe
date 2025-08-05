import React, { useState } from 'react';
import { User, MapPin, Shield, Star, Edit3, Camera, Phone, Mail, Calendar, Award, Users, MessageSquare } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Ahmed Khan',
    bio: 'Resident of DHA Phase 5. Passionate about community safety and helping neighbors.',
    phone: '+92 300 1234567',
    email: 'ahmed.khan@email.com',
    joinDate: 'January 2024',
    location: 'DHA Phase 5, Karachi',
  });

  const stats = [
    { label: 'Posts', value: 24, icon: MessageSquare },
    { label: 'Helpful Reviews', value: 89, icon: Star },
    { label: 'Community Score', value: 4.8, icon: Award },
  ];

  const achievements = [
    { title: 'Community Helper', description: 'Helped 50+ neighbors', icon: '🤝', earned: true },
    { title: 'Safety Guardian', description: 'Reported 10+ safety issues', icon: '🛡️', earned: true },
    { title: 'Local Expert', description: 'Shared 25+ service recommendations', icon: '⭐', earned: true },
    { title: 'Super Reviewer', description: 'Write 100+ helpful reviews', icon: '📝', earned: false },
  ];

  const recentActivity = [
    { type: 'review', content: 'Reviewed "Ali Plumbing Services"', time: '2 hours ago', rating: 5 },
    { type: 'post', content: 'Posted about electricity outage in Block L', time: '1 day ago' },
    { type: 'complaint', content: 'Reported street light issue', time: '3 days ago', status: 'resolved' },
    { type: 'help', content: 'Helped neighbor find electrician', time: '1 week ago' },
  ];

  const handleSave = () => {
    setIsEditing(false);
    // Save profile logic here
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <User className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Your Profile</h2>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <div className="w-full h-full bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-blue-600" />
              </div>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <Camera size={12} />
            </button>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="font-semibold"
                />
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">Save</Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-card-foreground">{profile.name}</h3>
                  <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    <Shield size={12} className="mr-1" />
                    Verified
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3">{profile.bio}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {profile.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    Joined {profile.joinDate}
                  </div>
                </div>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="mt-3">
                  <Edit3 size={14} className="mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <stat.icon className="text-blue-600" size={20} />
            </div>
            <div className="text-xl font-bold text-card-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Contact Info */}
      <Card className="p-4">
        <h4 className="font-semibold text-card-foreground mb-3">Contact Information</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-muted-foreground" />
            <span className="text-sm">{profile.phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-muted-foreground" />
            <span className="text-sm">{profile.email}</span>
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-4">
        <h4 className="font-semibold text-card-foreground mb-3">Achievements</h4>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.title}
              className={`p-3 rounded-lg border-2 transition-colors ${
                achievement.earned 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
              }`}
            >
              <div className="text-2xl mb-2">{achievement.icon}</div>
              <h5 className={`text-sm font-medium mb-1 ${
                achievement.earned ? 'text-green-800 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {achievement.title}
              </h5>
              <p className={`text-xs ${
                achievement.earned ? 'text-green-600 dark:text-green-500' : 'text-gray-500'
              }`}>
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4">
        <h4 className="font-semibold text-card-foreground mb-3">Recent Activity</h4>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-card-foreground">{activity.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                  {activity.rating && (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-500 fill-current" />
                      <span className="text-xs">{activity.rating}</span>
                    </div>
                  )}
                  {activity.status && (
                    <Badge variant="secondary" className="text-xs">
                      {activity.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}