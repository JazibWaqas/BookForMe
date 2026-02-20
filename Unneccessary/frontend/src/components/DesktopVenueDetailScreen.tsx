import { useState } from 'react';
import { Star, MapPin, Clock, Calendar, Wifi, Car, Coffee, Phone, Mail, Share2, Heart, Users, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DesktopVenueDetailScreenProps {
  venue: any;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export function DesktopVenueDetailScreen({ venue, onBack, onNavigate }: DesktopVenueDetailScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const amenities = [
    { icon: Wifi, label: 'Free WiFi', available: true },
    { icon: Car, label: 'Parking', available: true },
    { icon: Coffee, label: 'Refreshments', available: true },
    { icon: Users, label: 'Group Rates', available: false },
  ];

  const reviews = [
    {
      id: 1,
      user: 'Rahul S.',
      rating: 5,
      comment: 'Excellent facility with top-notch courts. Very well maintained and staff is helpful.',
      date: '2 days ago'
    },
    {
      id: 2,
      user: 'Priya M.',
      rating: 4,
      comment: 'Great place for playing padel. Good booking system and fair pricing.',
      date: '1 week ago'
    },
    {
      id: 3,
      user: 'Arjun K.',
      rating: 5,
      comment: 'Amazing venue! Professional courts and excellent coaching available.',
      date: '2 weeks ago'
    }
  ];

  const similarVenues = [
    {
      id: 1,
      name: 'Champion Sports Arena',
      image: venue?.image,
      rating: 4.6,
      price: 1000,
      distance: '3.5 km'
    },
    {
      id: 2,
      name: 'Prime Court Complex',
      image: venue?.image,
      rating: 4.9,
      price: 1800,
      distance: '5.2 km'
    }
  ];

  const handleBooking = () => {
    if (!selectedTime) {
      alert('Please select a time slot');
      return;
    }
    alert('Booking confirmed! You will receive a confirmation shortly.');
    onNavigate('profile');
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Venues
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-96">
                  <ImageWithFallback
                    src={venue?.image || 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080'}
                    alt={venue?.name || 'Sports Court'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button variant="outline" size="icon" className="bg-white">
                      <Share2 size={16} />
                    </Button>
                    <Button variant="outline" size="icon" className="bg-white">
                      <Heart size={16} />
                    </Button>
                  </div>
                  {venue?.discount > 0 && (
                    <Badge className="absolute bottom-4 left-4 bg-red-500 text-white border-0">
                      {venue.discount}% OFF Today
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Venue Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{venue?.name || 'Elite Sports Complex'}</h1>
                    <p className="text-lg text-muted-foreground mb-3">{venue?.type || 'Sports Court'}</p>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="fill-yellow-400 text-yellow-400" size={20} />
                        <span className="font-semibold">{venue?.rating || 4.8}</span>
                        <span className="text-muted-foreground">({venue?.reviewCount || 124} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin size={16} />
                        <span>{venue?.location || 'Bandra West'} • {venue?.distance || '2.1 km'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-bold">₹{venue?.price || 1200}</span>
                      {venue?.originalPrice > venue?.price && (
                        <span className="text-lg text-muted-foreground line-through">
                          ₹{venue.originalPrice}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">per hour</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <Clock size={16} />
                  <span>{venue?.openTime || '6:00 AM - 11:00 PM'}</span>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {venue?.description || 'Premium sports complex with state-of-the-art facilities and professional coaching available. Perfect for both casual players and serious athletes looking for high-quality courts and amenities.'}
                </p>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="amenities" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="amenities" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {amenities.map((amenity, index) => {
                        const Icon = amenity.icon;
                        return (
                          <div
                            key={index}
                            className={`flex flex-col items-center p-4 rounded-lg border ${
                              amenity.available ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'
                            }`}
                          >
                            <Icon 
                              size={24} 
                              className={amenity.available ? 'text-green-600 mb-2' : 'text-gray-400 mb-2'} 
                            />
                            <span className={`text-sm text-center ${amenity.available ? 'text-green-800' : 'text-gray-500'}`}>
                              {amenity.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-6">
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                {review.user.charAt(0)}
                              </div>
                              <span className="font-medium">{review.user}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="fill-yellow-400 text-yellow-400" size={14} />
                              ))}
                              <span className="text-sm text-muted-foreground ml-2">{review.date}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="photos" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <ImageWithFallback
                            src={venue?.image || 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080'}
                            alt={`${venue?.name} photo ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  Book Your Slot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium mb-3">Select Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-medium mb-3">Available Time Slots</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Court rental (1 hour)</span>
                    <span>₹{venue?.originalPrice || 1500}</span>
                  </div>
                  {venue?.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({venue.discount}%)</span>
                      <span>-₹{(venue?.originalPrice || 1500) - (venue?.price || 1200)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Service fee</span>
                    <span>₹50</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{(venue?.price || 1200) + 50}</span>
                  </div>
                </div>

                <Button onClick={handleBooking} className="w-full" size="lg">
                  Book Now
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Phone size={16} className="mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail size={16} className="mr-2" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Similar Venues */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Venues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {similarVenues.map((similar) => (
                  <div key={similar.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={similar.image}
                        alt={similar.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{similar.name}</h4>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="fill-yellow-400 text-yellow-400" size={12} />
                        <span className="text-sm">{similar.rating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">₹{similar.price}/hr</span>
                        <span className="text-xs text-muted-foreground">{similar.distance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}