import { useState } from 'react';
import { Settings, Star, Calendar, MapPin, Trophy, CreditCard, Heart, Edit, Save, X, User, Mail, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

interface ProfileScreenProps {
  userRole: 'customer' | 'vendor';
  onNavigate: (screen: string) => void;
}

export function ProfileScreen({ userRole, onNavigate }: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+92 300 1234567',
    location: 'Karachi, Pakistan',
    bio: 'Sports enthusiast and venue booking lover!'
  });

  const handleSaveProfile = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditDialogOpen(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pastBookings = [
    {
      id: '1',
      venue: 'Elite Sports Complex',
      type: 'Padel Court',
      date: '2025-09-28',
      time: '18:00',
      status: 'completed',
      amount: 1200,
      rating: 5
    },
    {
      id: '2',
      venue: 'GameZone Arcade',
      type: 'Gaming Session',
      date: '2025-09-25',
      time: '16:00',
      status: 'completed',
      amount: 800,
      rating: 4
    },
    {
      id: '3',
      venue: 'Luxe Beauty Salon',
      type: 'Hair Styling',
      date: '2025-09-22',
      time: '14:00',
      status: 'completed',
      amount: 2500,
      rating: 5
    },
    {
      id: '4',
      venue: 'Beach Paradise Resort',
      type: 'Beach Hut',
      date: '2025-10-05',
      time: '10:00',
      status: 'upcoming',
      amount: 5000,
      rating: null
    }
  ];

  const savedVenues = [
    { name: 'Elite Sports Complex', type: 'Sports', location: 'Bandra' },
    { name: 'Cineplex Premium', type: 'Cinema', location: 'Andheri' },
    { name: 'Zen Spa & Salon', type: 'Wellness', location: 'Powai' }
  ];

  const achievements = [
    { title: 'First Booking', description: 'Made your first venue booking', earned: true },
    { title: 'Sports Enthusiast', description: 'Booked 5 sports venues', earned: true },
    { title: 'Social Butterfly', description: 'Connected with 10 players', earned: true },
    { title: 'Weekend Warrior', description: 'Active 4 weekends in a row', earned: false },
    { title: 'Explorer', description: 'Tried all venue categories', earned: false }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Profile Header Card */}
      <div className="p-4 lg:p-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 lg:w-20 lg:h-20">
                  <AvatarFallback className="dark:bg-blue-900 dark:text-blue-300">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold dark:text-white">{profileData.name}</h2>
                  <p className="text-sm text-muted-foreground">{profileData.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="dark:bg-gray-700">{userRole === 'customer' ? 'Customer' : 'Vendor'}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="fill-yellow-400 text-yellow-400" size={14} />
                      <span className="text-sm">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="transition-all duration-200 hover:scale-105"
              >
                <Edit size={16} className="mr-2" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 lg:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 dark:bg-gray-800">
            <TabsTrigger value="profile">Stats</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="achievements">Awards</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            {/* Loyalty Card */}
            <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">BookForMe Plus</h3>
                    <p className="text-sm opacity-90">Gold Member</p>
                  </div>
                  <CreditCard size={24} />
                </div>
                <div className="mt-3">
                  <p className="text-sm opacity-90">Points Balance</p>
                  <p className="text-xl font-bold">2,450 pts</p>
                </div>
                <Progress value={75} className="mt-2 bg-white/20" />
                <p className="text-xs mt-1 opacity-75">550 points to Platinum</p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">24</div>
                  <div className="text-sm text-muted-foreground">Total Bookings</div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">₹18,200</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-500">8</div>
                  <div className="text-sm text-muted-foreground">Favorite Venues</div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500">12</div>
                  <div className="text-sm text-muted-foreground">Friends</div>
                </CardContent>
              </Card>
            </div>

            {/* Sport Preferences */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Sport Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Tennis</span>
                  <Progress value={80} className="w-24" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Padel</span>
                  <Progress value={65} className="w-24" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Gaming</span>
                  <Progress value={40} className="w-24" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="mt-4 space-y-4">
            {pastBookings.map((booking) => (
              <Card key={booking.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium dark:text-white">{booking.venue}</h3>
                    <Badge className={`${getStatusColor(booking.status)} text-white border-0`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{booking.type}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{booking.time}</span>
                    </div>
                    <div className="font-medium text-foreground dark:text-white">
                      ₹{booking.amount}
                    </div>
                  </div>
                  {booking.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm">Your rating:</span>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < booking.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} 
                        />
                      ))}
                    </div>
                  )}
                  {booking.status === 'upcoming' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        Modify
                      </Button>
                      <Button size="sm" variant="outline">
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="saved" className="mt-4 space-y-4">
            {savedVenues.map((venue, index) => (
              <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Heart className="fill-red-500 text-red-500" size={20} />
                      <div>
                        <h3 className="font-medium dark:text-white">{venue.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{venue.type}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span>{venue.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="mt-4 space-y-4">
            {achievements.map((achievement, index) => (
              <Card key={index} className={achievement.earned ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' : 'dark:bg-gray-800 dark:border-gray-700'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${achievement.earned ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400 dark:bg-gray-700'}`}>
                      <Trophy size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium dark:text-white">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    {achievement.earned && (
                      <Badge className="bg-green-500 text-white">
                        Earned
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px] mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <Input
                  id="name"
                  className="pl-10"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <Input
                  id="phone"
                  className="pl-10"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <Input
                  id="location"
                  className="pl-10"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                placeholder="Tell us about yourself..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <X className="mr-2" size={16} />
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="mr-2" size={16} />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
