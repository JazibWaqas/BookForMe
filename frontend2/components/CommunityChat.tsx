import React, { useState } from 'react';
import { Send, Plus, Heart, MessageCircle, Share, MoreVertical, MapPin, Clock, AlertTriangle, Camera, Mic } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';

const communityPosts = [
  {
    id: 1,
    author: 'Ahmed Khan',
    avatar: '👨',
    location: 'DHA Phase 5',
    time: '2 hours ago',
    type: 'question',
    content: 'Does anyone know a good electrician who can fix AC wiring? Need urgent help!',
    likes: 8,
    comments: 12,
    hasImage: false,
    isUrgent: true,
    replies: [
      { author: 'Fatima Ali', content: 'Try Ali Electrical Services - +92 300 1234567. They fixed mine last week!', time: '1 hour ago' },
      { author: 'Hassan Ahmed', content: 'I can recommend Quick Fix - very reliable and reasonable rates.', time: '45 min ago' }
    ]
  },
  {
    id: 2,
    author: 'Karachi Police',
    avatar: '👮',
    location: 'Clifton Area',
    time: '4 hours ago',
    type: 'alert',
    content: 'Security patrol schedule updated for this week. Increased presence during evening hours 6-10 PM. Report any suspicious activity immediately.',
    likes: 45,
    comments: 8,
    hasImage: false,
    isOfficial: true,
    isUrgent: false
  },
  {
    id: 3,
    author: 'Sarah Sheikh',
    avatar: '👩',
    location: 'Gulshan-e-Iqbal',
    time: '6 hours ago',
    type: 'community',
    content: 'Organizing a community cleanup drive this Saturday at 8 AM. Join us to make our neighborhood cleaner! 🌱',
    likes: 23,
    comments: 15,
    hasImage: true,
    isUrgent: false,
    replies: [
      { author: 'Ali Raza', content: 'Count me in! What should we bring?', time: '5 hours ago' },
      { author: 'Maryam Khan', content: 'Great initiative! I\'ll bring some friends too.', time: '4 hours ago' }
    ]
  },
  {
    id: 4,
    author: 'Local Trader',
    avatar: '🏪',
    location: 'Saddar Bazaar',
    time: '8 hours ago',
    type: 'business',
    content: 'Fresh vegetables and fruits delivery available in DHA and Clifton areas. WhatsApp for orders: +92 333 9999999',
    likes: 12,
    comments: 6,
    hasImage: true,
    isUrgent: false
  },
  {
    id: 5,
    author: 'Dr. Ayesha Malik',
    avatar: '👩‍⚕️',
    location: 'DHA Phase 2',
    time: '1 day ago',
    type: 'health',
    content: 'Free health checkup camp this weekend at DHA Community Center. Blood pressure, diabetes screening available 9 AM - 2 PM.',
    likes: 67,
    comments: 24,
    hasImage: false,
    isUrgent: false
  }
];

const postTypes = [
  { id: 'question', label: 'Ask Question', icon: '❓', color: 'bg-blue-100 text-blue-700' },
  { id: 'alert', label: 'Safety Alert', icon: '⚠️', color: 'bg-red-100 text-red-700' },
  { id: 'community', label: 'Community', icon: '🏘️', color: 'bg-green-100 text-green-700' },
  { id: 'business', label: 'Business', icon: '💼', color: 'bg-purple-100 text-purple-700' },
  { id: 'general', label: 'General', icon: '💬', color: 'bg-gray-100 text-gray-700' }
];

export function CommunityChat() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [newPost, setNewPost] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('general');
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());

  const togglePostExpansion = (postId: number) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const filteredPosts = communityPosts.filter(post => 
    selectedFilter === 'all' || post.type === selectedFilter
  );

  const getPostTypeInfo = (type: string) => {
    return postTypes.find(t => t.id === type) || postTypes[4];
  };

  const handleSubmitPost = () => {
    if (newPost.trim()) {
      // Mock post submission
      setNewPost('');
      setShowNewPost(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <MessageCircle className="text-purple-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Community Chat</h2>
            <p className="text-sm text-gray-600">Connect with your neighbors</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center border-blue-200 bg-blue-50">
          <div className="text-lg font-bold text-blue-700">324</div>
          <div className="text-xs text-blue-600">Active Users</div>
        </Card>
        <Card className="p-3 text-center border-green-200 bg-green-50">
          <div className="text-lg font-bold text-green-700">89%</div>
          <div className="text-xs text-green-600">Response Rate</div>
        </Card>
        <Card className="p-3 text-center border-purple-200 bg-purple-50">
          <div className="text-lg font-bold text-purple-700">156</div>
          <div className="text-xs text-purple-600">Posts Today</div>
        </Card>
      </div>

      {/* Post Type Filters */}
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              selectedFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Posts
          </button>
          {postTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedFilter(type.id)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedFilter === type.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* New Post Button */}
      <Button
        onClick={() => setShowNewPost(!showNewPost)}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        <Plus size={20} className="mr-2" />
        Create New Post
      </Button>

      {/* New Post Form */}
      {showNewPost && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span>👤</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">You</p>
              <p className="text-sm text-gray-500">DHA Phase 5</p>
            </div>
          </div>

          {/* Post Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {postTypes.slice(0, 3).map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedPostType(type.id)}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  selectedPostType === type.id 
                    ? 'bg-blue-600 text-white' 
                    : type.color
                }`}
              >
                <div>{type.icon}</div>
                <div>{type.label}</div>
              </button>
            ))}
          </div>

          <textarea
            placeholder="What's happening in your neighborhood?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Camera size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Mic size={20} />
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewPost(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitPost} disabled={!newPost.trim()}>
                Post
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Community Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const postTypeInfo = getPostTypeInfo(post.type);
          const isExpanded = expandedPosts.has(post.id);
          
          return (
            <Card key={post.id} className={`p-4 ${post.isUrgent ? 'border-red-300 bg-red-50' : ''}`}>
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                    {post.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{post.author}</h4>
                      {post.isOfficial && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          Verified
                        </Badge>
                      )}
                      {post.isUrgent && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {post.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.time}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${postTypeInfo.color}`}>
                    {postTypeInfo.icon} {postTypeInfo.label}
                  </Badge>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-gray-700 mb-3">{post.content}</p>

              {/* Post Image Placeholder */}
              {post.hasImage && (
                <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-500">📷 Image attached</span>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <Heart size={16} />
                    <span>{post.likes}</span>
                  </button>
                  <button 
                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                    onClick={() => togglePostExpansion(post.id)}
                  >
                    <MessageCircle size={16} />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                    <Share size={16} />
                    Share
                  </button>
                </div>
              </div>

              {/* Replies */}
              {isExpanded && post.replies && (
                <div className="border-t pt-3 space-y-3">
                  {post.replies.map((reply, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{reply.author}</span>
                          <span className="text-xs text-gray-500">{reply.time}</span>
                        </div>
                        <p className="text-sm text-gray-700">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Reply Input */}
                  <div className="flex gap-2 mt-3">
                    <Input placeholder="Write a reply..." className="flex-1" />
                    <Button size="sm">
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Community Guidelines */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">Community Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Be respectful and helpful to neighbors</li>
          <li>• Verify information before sharing</li>
          <li>• Use appropriate post categories</li>
          <li>• Report inappropriate content</li>
        </ul>
      </Card>
    </div>
  );
}