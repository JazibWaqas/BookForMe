import { Search, Calendar, TrendingUp, Star, MapPin, Clock } from 'lucide-react';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DesktopHomeScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function DesktopHomeScreen({ onNavigate }: DesktopHomeScreenProps) {
  const categories = [
    {
      id: 'sports',
      name: 'Sports Courts',
      subtitle: 'Padel, Tennis, Cricket & More',
      image: 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'bg-blue-500',
      venues: 156,
      avgPrice: '₹1,200/hr'
    },
    {
      id: 'gaming',
      name: 'Gaming Zones',
      subtitle: 'Arcade, VR & Console Gaming',
      image: 'https://images.unsplash.com/photo-1721372261034-525a25737f5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjB6b25lJTIwYXJjYWRlfGVufDF8fHx8MTc1OTMwMjkzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'bg-purple-500',
      venues: 89,
      avgPrice: '₹800/hr'
    },
    {
      id: 'cinema',
      name: 'Cinemas',
      subtitle: 'Latest Movies & Premium Seats',
      image: 'https://images.unsplash.com/photo-1485700330317-57a99a571ecb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjB0aGVhdGVyJTIwc2VhdHN8ZW58MXx8fHwxNzU5MzAyOTMxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'bg-red-500',
      venues: 45,
      avgPrice: '₹350/ticket'
    },
    {
      id: 'beach',
      name: 'Beach Huts & Farmhouses',
      subtitle: 'Getaways & Private Events',
      image: 'https://images.unsplash.com/photo-1606923750120-6cd6e3f378ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMGh1dCUyMHJlc29ydHxlbnwxfHx8fDE3NTkzMDI5MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'bg-green-500',
      venues: 67,
      avgPrice: '₹5,000/day'
    },
    {
      id: 'salon',
      name: 'Salons',
      subtitle: 'Hair, Beauty & Wellness',
      image: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyJTIwc2Fsb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTkyNjM2NTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'bg-pink-500',
      venues: 234,
      avgPrice: '₹2,500/service'
    }
  ];

  const recentBookings = [
    {
      id: 1,
      venue: 'Elite Padel Club',
      date: 'Today, 6:00 PM',
      status: 'Confirmed',
      image: 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 2,
      venue: 'GameZone Pro',
      date: 'Tomorrow, 3:00 PM',
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1721372261034-525a25737f5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjB6b25lJTIwYXJjYWRlfGVufDF8fHx8MTc1OTMwMjkzMHww&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];

  const trendingVenues = [
    {
      id: 1,
      name: 'Skyline Sports Complex',
      category: 'Sports',
      rating: 4.8,
      price: '₹1,500/hr',
      image: 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      distance: '2.3 km'
    },
    {
      id: 2,
      name: 'VR Galaxy',
      category: 'Gaming',
      rating: 4.6,
      price: '₹900/hr',
      image: 'https://images.unsplash.com/photo-1721372261034-525a25737f5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjB6b25lJTIwYXJjYWRlfGVufDF8fHx8MTc1OTMwMjkzMHww&ixlib=rb-4.1.0&q=80&w=1080',
      distance: '1.8 km'
    },
    {
      id: 3,
      name: 'Coastal Paradise Resort',
      category: 'Beach Huts',
      rating: 4.9,
      price: '₹6,000/day',
      image: 'https://images.unsplash.com/photo-1606923750120-6cd6e3f378ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMGh1dCUyMHJlc29ydHxlbnwxfHx8fDE3NTkzMDI5MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      distance: '15.2 km'
    }
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      {/* Search Section */}
      <Card className="dark:bg-gray-800">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input 
                placeholder="Search venues, sports, locations..." 
                className="pl-10 h-11 lg:h-12 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <Button size="lg" className="w-full sm:w-auto px-6 lg:px-8">
              <Search size={20} className="mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Categories */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div>
            <h2 className="font-bold mb-4 lg:mb-6 dark:text-white">Explore Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group dark:bg-gray-800 dark:border-gray-700"
                  onClick={() => onNavigate('venues', { category })}
                >
                  <CardContent className="p-0">
                    <div className="relative h-48">
                      <ImageWithFallback
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-lg font-bold">{category.name}</h3>
                        <p className="text-sm opacity-90 mb-2">{category.subtitle}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{category.venues} venues</span>
                          <span className="text-xs">From {category.avgPrice}</span>
                        </div>
                      </div>
                      <Badge 
                        className={`absolute top-4 right-4 ${category.color} text-white border-0`}
                      >
                        Popular
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Trending Venues */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-orange-500" size={24} />
              <h2 className="text-2xl font-bold">Trending Venues</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingVenues.map((venue) => (
                <Card key={venue.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative h-32">
                      <ImageWithFallback
                        src={venue.image}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold truncate">{venue.name}</h4>
                      <p className="text-sm text-muted-foreground">{venue.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="text-yellow-500 fill-current" size={14} />
                          <span className="text-sm">{venue.rating}</span>
                        </div>
                        <span className="text-sm font-medium">{venue.price}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{venue.distance} away</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate('chatbot')}
              >
                Get Recommendations
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate('social')}
              >
                Find Playing Partners
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate('profile')}
              >
                View My Bookings
              </Button>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 overflow-hidden rounded-lg">
                    <ImageWithFallback
                      src={booking.image}
                      alt={booking.venue}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{booking.venue}</p>
                    <p className="text-sm text-muted-foreground">{booking.date}</p>
                    <Badge 
                      variant={booking.status === 'Confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-sm">
                View All Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}