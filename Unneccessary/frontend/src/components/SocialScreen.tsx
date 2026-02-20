import { useState } from 'react';
import { Heart, MessageCircle, Share, Trophy, Users, Search, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SocialScreenProps {
  onNavigate: (screen: string) => void;
}

interface Post {
  id: string;
  user: {
    name: string;
    avatar?: string;
    level: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  type: 'match' | 'experience' | 'promo';
}

interface Player {
  id: string;
  name: string;
  sport: string;
  level: string;
  location: string;
  rating: number;
  avatar?: string;
}

export function SocialScreen({ onNavigate }: SocialScreenProps) {
  const [activeTab, setActiveTab] = useState('feed');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'match' | 'experience' | 'promo'>('match');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<string, number>>({});

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newLikedPosts = new Set(prev);
      if (newLikedPosts.has(postId)) {
        newLikedPosts.delete(postId);
        setPostLikes(prevLikes => ({
          ...prevLikes,
          [postId]: Math.max(0, (prevLikes[postId] || posts.find(p => p.id === postId)?.likes || 0) - 1)
        }));
      } else {
        newLikedPosts.add(postId);
        setPostLikes(prevLikes => ({
          ...prevLikes,
          [postId]: (prevLikes[postId] || posts.find(p => p.id === postId)?.likes || 0) + 1
        }));
      }
      return newLikedPosts;
    });
  };

  const handleComment = (postId: string) => {
    // TODO: Implement comment functionality
    console.log(`Opening comments for post ${postId}`);
  };

  const handleViewProfile = (playerId: string) => {
    const player = availablePlayers.find(p => p.id === playerId);
    if (player) {
      // In a real app, this would navigate to the player's profile page
      alert(`Viewing profile for ${player.name}\n\nSport: ${player.sport}\nLevel: ${player.level}\nLocation: ${player.location}\nRating: ⭐ ${player.rating}`);
    }
  };

  const handleInvitePlayer = (playerId: string) => {
    const player = availablePlayers.find(p => p.id === playerId);
    if (player) {
      // In a real app, this would send an invitation
      const confirmed = confirm(`Send match invitation to ${player.name}?\n\nSport: ${player.sport}\nLevel: ${player.level}`);
      if (confirmed) {
        alert(`Invitation sent to ${player.name}! They will be notified about your match request.`);
      }
    }
  };

  const handleStartRankedMatch = () => {
    // TODO: Implement start ranked match functionality
    console.log('Starting ranked match...');
    alert('Ranked match started! Looking for opponents...');
  };

  const posts: Post[] = [
    {
      id: '1',
      user: { name: 'Alex Kumar', level: 'Pro' },
      content: 'Just had an amazing padel match at Elite Sports! Looking for doubles partner for tomorrow 7 PM. Who\'s in? 🏓',
      image: 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      likes: 12,
      comments: 5,
      timestamp: '2 hours ago',
      type: 'match'
    },
    {
      id: '2',
      user: { name: 'Priya Shah', level: 'Intermediate' },
      content: 'GameZone Arcade is offering 50% off today! Perfect for a fun evening with friends. Who wants to join? 🎮',
      likes: 8,
      comments: 3,
      timestamp: '4 hours ago',
      type: 'promo'
    },
    {
      id: '3',
      user: { name: 'Raj Patel', level: 'Beginner' },
      content: 'First time playing tennis and loved it! Thanks to Sarah for being such a patient partner. Already booked another session! 🎾',
      likes: 15,
      comments: 7,
      timestamp: '1 day ago',
      type: 'experience'
    }
  ];

  const availablePlayers: Player[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      sport: 'Tennis',
      level: 'Intermediate',
      location: 'Clifton',
      rating: 4.8
    },
    {
      id: '2',
      name: 'Mike Johnson',
      sport: 'Padel',
      level: 'Advanced',
      location: 'DHA',
      rating: 4.9
    },
    {
      id: '3',
      name: 'Arjun Sharma',
      sport: 'Cricket',
      level: 'Pro',
      location: 'Gulshan',
      rating: 4.7
    }
  ];

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'match': return 'bg-blue-500';
      case 'promo': return 'bg-green-500';
      case 'experience': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    // In a real app, this would call an API to create the post
    console.log('Creating post:', { 
      content: newPostContent, 
      type: newPostType,
      timestamp: new Date().toISOString()
    });
    
    // Show success feedback
    alert('Post created successfully!');
    
    setIsCreatePostOpen(false);
    setNewPostContent('');
    setNewPostType('match');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      <div className="p-4 lg:p-6">
        {/* Create Post Dialog */}
        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogContent className="sm:max-w-[525px] mx-auto dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Create Post</DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                Share your thoughts, find matches, or promote offers with the community.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium dark:text-gray-200">Post Type</label>
                <Select value={newPostType} onValueChange={(value: any) => setNewPostType(value)}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Looking for Match</SelectItem>
                    <SelectItem value="experience">Share Experience</SelectItem>
                    <SelectItem value="promo">Promotion/Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-200">What's on your mind?</label>
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                  Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Post Button - Desktop Only */}
        <div className="hidden lg:flex justify-end mb-4">
          <Button 
            className="gap-2 transition-all duration-200 hover:bg-blue-600 hover:text-white hover:scale-105" 
            onClick={() => setIsCreatePostOpen(true)}
          >
            <Plus size={18} />
            Create Post
          </Button>
        </div>

        {/* Floating Action Button - Mobile Only */}
        <Button 
          className="lg:hidden fixed bottom-20 right-4 z-10 rounded-full w-14 h-14 shadow-lg transition-all duration-200 hover:bg-blue-600 hover:text-white hover:scale-110"
          size="icon"
          onClick={() => setIsCreatePostOpen(true)}
        >
          <Plus size={24} />
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6 dark:bg-gray-800">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="match">Find Match</TabsTrigger>
            <TabsTrigger value="ranked">Ranked</TabsTrigger>
            <TabsTrigger value="chat">Chats</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4 space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(post.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium dark:text-white">{post.user.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs dark:bg-gray-700">
                            {post.user.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getPostTypeColor(post.type)} text-white border-0 text-xs`}>
                      {post.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm dark:text-gray-200">{post.content}</p>
                  {post.image && (
                    <ImageWithFallback
                      src={post.image}
                      alt="Post image"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`gap-2 transition-all duration-200 ${
                          likedPosts.has(post.id) 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'hover:text-red-500'
                        }`}
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart 
                          size={16} 
                          className={likedPosts.has(post.id) ? 'fill-current' : ''} 
                        />
                        {postLikes[post.id] || post.likes}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:text-blue-500 transition-all duration-200"
                        onClick={() => handleComment(post.id)}
                      >
                        <MessageCircle size={16} />
                        {post.comments}
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hover:text-green-500 transition-all duration-200"
                      onClick={() => handleShare(post.id)}
                    >
                      <Share size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="match" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input placeholder="Search by sport, location, level..." className="pl-10 dark:bg-gray-800 dark:text-white" />
            </div>
            
            {availablePlayers.map((player) => (
              <Card key={player.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(player.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium dark:text-white">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.sport} • {player.level}</p>
                        <p className="text-xs text-muted-foreground">{player.location} • ⭐ {player.rating}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:border-blue-800 dark:hover:text-blue-300"
                        onClick={() => handleViewProfile(player.id)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm"
                        className="transition-all duration-200 hover:bg-green-600 hover:text-white"
                        onClick={() => handleInvitePlayer(player.id)}
                      >
                        Invite
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ranked" className="mt-4 space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2 dark:text-white">
                  <Trophy className="text-yellow-500" size={20} />
                  Ranked Matches
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Compete in ranked matches to improve your skill level and climb the leaderboards!
                </p>
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <div>
                    <p className="font-medium">Your Current Rank</p>
                    <p className="text-sm text-muted-foreground">Tennis - Intermediate Level</p>
                  </div>
                  <Badge className="bg-blue-500 text-white">
                    #247
                  </Badge>
                </div>
                <Button 
                  className="w-full transition-all duration-200 hover:bg-green-600 hover:text-white"
                  onClick={() => handleStartRankedMatch()}
                >
                  Start Ranked Match
                </Button>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h4 className="font-medium dark:text-white">Recent Ranked Games</h4>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950 rounded">
                  <span className="text-sm dark:text-white">vs. Sarah Chen</span>
                  <Badge className="bg-green-500 text-white">Won</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950 rounded">
                  <span className="text-sm dark:text-white">vs. Mike Johnson</span>
                  <Badge className="bg-red-500 text-white">Lost</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input placeholder="Search conversations..." className="pl-10 dark:bg-gray-800 dark:text-white" />
            </div>

            {[
              { name: 'Alex Kumar', lastMessage: 'Ready for tomorrow\'s match?', time: '2m ago', unread: 2 },
              { name: 'Tennis Group Chat', lastMessage: 'Sarah: Anyone free this weekend?', time: '1h ago', unread: 0 },
              { name: 'Elite Sports Support', lastMessage: 'Your booking has been confirmed', time: '3h ago', unread: 0 }
            ].map((chat, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="dark:bg-gray-700">
                          {getInitials(chat.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium dark:text-white">{chat.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">{chat.time}</span>
                      {chat.unread > 0 && (
                        <Badge className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {chat.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}