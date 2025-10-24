import { useState } from 'react';
import { Search, Filter, Star, MapPin, Clock, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DesktopVenuesScreenProps {
  category: any;
  onVenueSelect: (venue: any) => void;
}

export function DesktopVenuesScreen({ category, onVenueSelect }: DesktopVenuesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Mock venues data based on category
  const venues = [
    {
      id: '1',
      name: 'Elite Sports Complex',
      type: 'Sports Court',
      rating: 4.8,
      reviewCount: 124,
      price: 1200,
      originalPrice: 1500,
      location: 'Bandra West',
      distance: '2.1 km',
      image: category?.image || 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      amenities: ['Parking', 'WiFi', 'Changing Rooms', 'AC Courts'],
      openTime: '6:00 AM - 11:00 PM',
      discount: 20,
      description: 'Premium sports complex with state-of-the-art facilities and professional coaching available.'
    },
    {
      id: '2',
      name: 'Champion Sports Arena',
      type: 'Multi-Sport Facility',
      rating: 4.6,
      reviewCount: 89,
      price: 1000,
      originalPrice: 1200,
      location: 'Andheri East',
      distance: '3.5 km',
      image: category?.image || 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      amenities: ['Coaching', 'Equipment Rental', 'Refreshments'],
      openTime: '7:00 AM - 10:00 PM',
      discount: 15,
      description: 'Multi-sport facility perfect for groups and tournaments with equipment rental available.'
    },
    {
      id: '3',
      name: 'Prime Court Complex',
      type: 'Premium Courts',
      rating: 4.9,
      reviewCount: 201,
      price: 1800,
      originalPrice: 2000,
      location: 'Powai',
      distance: '5.2 km',
      image: category?.image || 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      amenities: ['AC Courts', 'Valet Parking', 'Pro Shop', 'Lounge'],
      openTime: '5:00 AM - 12:00 AM',
      discount: 10,
      description: 'Luxury sports facility with premium amenities and extended hours for serious players.'
    },
    {
      id: '4',
      name: 'Community Sports Center',
      type: 'Local Courts',
      rating: 4.3,
      reviewCount: 67,
      price: 800,
      originalPrice: 1000,
      location: 'Kandivali West',
      distance: '8.1 km',
      image: category?.image || 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      amenities: ['Basic Facilities', 'Group Rates'],
      openTime: '6:00 AM - 10:00 PM',
      discount: 25,
      description: 'Affordable community center perfect for casual games and group activities.'
    },
    {
      id: '5',
      name: 'Metro Sports Hub',
      type: 'Indoor Courts',
      rating: 4.7,
      reviewCount: 156,
      price: 1400,
      originalPrice: 1600,
      location: 'Lower Parel',
      distance: '4.8 km',
      image: category?.image || 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      amenities: ['AC Courts', 'Parking', 'Cafe', 'WiFi'],
      openTime: '6:00 AM - 11:00 PM',
      discount: 12,
      description: 'Modern indoor facility with climate control and convenient metro connectivity.'
    },
    {
      id: '6',
      name: 'Ocean View Sports',
      type: 'Outdoor Courts',
      rating: 4.5,
      reviewCount: 92,
      price: 1100,
      originalPrice: 1300,
      location: 'Worli',
      distance: '6.3 km',
      image: category?.image || 'https://images.unsplash.com/photo-1606151595697-648a9a840cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb3VydHMlMjBwYWRlbCUyMHRlbm5pc3xlbnwxfHx8fDE3NTkzMDI5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      amenities: ['Sea View', 'Open Air', 'Parking'],
      openTime: '6:00 AM - 10:00 PM',
      discount: 18,
      description: 'Beautiful outdoor courts with stunning sea views for a unique playing experience.'
    }
  ];

  const allAmenities = Array.from(new Set(venues.flatMap(v => v.amenities)));

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = venue.price >= priceRange[0] && venue.price <= priceRange[1];
    const matchesAmenities = selectedAmenities.length === 0 || 
                           selectedAmenities.some(amenity => venue.amenities.includes(amenity));
    return matchesSearch && matchesPrice && matchesAmenities;
  });

  const sortedVenues = [...filteredVenues].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        return parseFloat(a.distance) - parseFloat(b.distance);
      default:
        return 0;
    }
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedVenues.map((venue) => (
        <Card 
          key={venue.id} 
          className="cursor-pointer hover:shadow-lg transition-all duration-300 group overflow-hidden"
          onClick={() => onVenueSelect(venue)}
        >
          <CardContent className="p-0">
            <div className="relative h-48">
              <ImageWithFallback
                src={venue.image}
                alt={venue.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {venue.discount > 0 && (
                <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0">
                  {venue.discount}% OFF
                </Badge>
              )}
              <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                <MapPin size={12} className="inline mr-1" />
                {venue.distance}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold truncate">{venue.name}</h3>
                  <p className="text-sm text-muted-foreground">{venue.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="fill-yellow-400 text-yellow-400" size={14} />
                  <span className="text-sm font-medium">{venue.rating}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{venue.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold">₹{venue.price}</span>
                  {venue.originalPrice > venue.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{venue.originalPrice}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">/hr</span>
                </div>
                <Button size="sm">Book</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      {sortedVenues.map((venue) => (
        <Card 
          key={venue.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onVenueSelect(venue)}
        >
          <CardContent className="p-6">
            <div className="flex gap-6">
              <div className="relative w-48 h-32 flex-shrink-0">
                <ImageWithFallback
                  src={venue.image}
                  alt={venue.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                {venue.discount > 0 && (
                  <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0 text-xs">
                    {venue.discount}% OFF
                  </Badge>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{venue.name}</h3>
                    <p className="text-muted-foreground">{venue.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="fill-yellow-400 text-yellow-400" size={16} />
                      <span className="font-medium">{venue.rating}</span>
                      <span className="text-sm text-muted-foreground">({venue.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">₹{venue.price}</span>
                      {venue.originalPrice > venue.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{venue.originalPrice}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">per hour</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{venue.description}</p>

                <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{venue.location} • {venue.distance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{venue.openTime}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {venue.amenities.slice(0, 4).map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {venue.amenities.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{venue.amenities.length - 4} more
                      </Badge>
                    )}
                  </div>
                  <Button>Book Now</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className={`w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              
              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Price Range (per hour)</label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={3000}
                  min={0}
                  step={100}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}</span>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium mb-3">Amenities</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allAmenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={selectedAmenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <label htmlFor={amenity} className="text-sm cursor-pointer">
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search venues or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </Button>
            </div>

            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} className="mr-2" />
              Filters
            </Button>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">{category?.name || 'Sports Courts'}</h2>
              <p className="text-muted-foreground">{filteredVenues.length} venues found</p>
            </div>
          </div>

          {/* Venues */}
          {filteredVenues.length > 0 ? (
            viewMode === 'grid' ? <GridView /> : <ListView />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No venues found</h3>
              <p className="text-muted-foreground max-w-sm">
                Try adjusting your search criteria or explore other categories.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}