import React, { useState } from 'react';
import { CheckCircle, MapPin, Bed, Bath, Car, Wifi, Shield, Phone, Heart, Filter, Map, List } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { InteractiveMap } from './InteractiveMap';

const verifiedListings = [
  {
    id: 1,
    title: 'Luxury 3 Bedroom Apartment',
    type: 'rent',
    price: 'Rs. 85,000',
    period: '/month',
    location: 'DHA Phase 5, Block L',
    size: '1,800 sq ft',
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    features: ['Furnished', 'Gym', 'Pool', 'Security', 'Generator'],
    verified: true,
    verificationLevel: 'Premium',
    agent: 'Ahmed Properties',
    phone: '+92 300 1234567',
    images: 4,
    posted: '2 days ago',
    description: 'Fully furnished apartment with modern amenities in prime DHA location.',
    documents: ['Title Deed', 'NOC', 'Utility Bills', 'Agent License'],
    lat: 24.8615,
    lng: 67.0099
  },
  {
    id: 2,
    title: '4 Bedroom House for Sale',
    type: 'sale',
    price: 'Rs. 4.2 Cr',
    period: '',
    location: 'Clifton Block 4',
    size: '2,500 sq ft',
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    features: ['Garden', 'Terrace', 'Sea View', 'Servant Quarter'],
    verified: true,
    verificationLevel: 'Gold',
    agent: 'Elite Realty',
    phone: '+92 21 9876543',
    images: 8,
    posted: '5 days ago',
    description: 'Spacious house with sea view and private garden.',
    documents: ['Title Deed', 'Survey Report', 'NOC', 'Tax Documents'],
    lat: 24.8580,
    lng: 67.0020
  },
  {
    id: 3,
    title: '2 Bedroom Flat - Rent',
    type: 'rent',
    price: 'Rs. 45,000',
    period: '/month',
    location: 'Gulshan-e-Iqbal Block 7',
    size: '1,200 sq ft',
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    features: ['Semi-Furnished', 'Lift', 'Generator', 'Gas'],
    verified: true,
    verificationLevel: 'Standard',
    agent: 'Metro Housing',
    phone: '+92 333 5555555',
    images: 6,
    posted: '1 week ago',
    description: 'Well-maintained flat in family-friendly neighborhood.',
    documents: ['Rent Agreement', 'NOC', 'Utility Bills'],
    lat: 24.8650,
    lng: 67.0150
  },
  {
    id: 4,
    title: 'Commercial Plot for Sale',
    type: 'sale',
    price: 'Rs. 1.8 Cr',
    period: '',
    location: 'Shahrah-e-Faisal',
    size: '500 sq yards',
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    features: ['Commercial', 'Main Road', 'Corner Plot', 'High Traffic'],
    verified: true,
    verificationLevel: 'Premium',
    agent: 'Commercial Experts',
    phone: '+92 21 7777777',
    images: 3,
    posted: '3 days ago',
    description: 'Prime commercial plot on main Shahrah-e-Faisal.',
    documents: ['Title Deed', 'Survey Report', 'Commercial NOC', 'Master Plan'],
    lat: 24.8700,
    lng: 67.0080
  }
];

export function VerifiedListings() {
  const [filter, setFilter] = useState<'all' | 'rent' | 'sale'>('all');
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const filteredListings = verifiedListings.filter(listing => 
    filter === 'all' || listing.type === filter
  );

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'Premium': return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'Gold': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      case 'Standard': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const mapMarkers = filteredListings.map(listing => ({
    id: listing.id.toString(),
    lat: listing.lat,
    lng: listing.lng,
    title: listing.title,
    type: 'listing' as const,
    price: listing.price + listing.period,
    details: `${listing.bedrooms} bed, ${listing.bathrooms} bath`,
    verified: listing.verified
  }));

  const handleMarkerClick = (marker: any) => {
    const listing = filteredListings.find(l => l.id.toString() === marker.id);
    if (listing) {
      setSelectedListing(listing.id);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Verified Listings</h2>
            <p className="text-sm text-muted-foreground">Authenticated properties with proof docs</p>
          </div>
        </div>
      </div>

      {/* Filter and View Toggle */}
      <div className="bg-card rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Properties
            </button>
            <button
              onClick={() => setFilter('rent')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === 'rent' 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              For Rent
            </button>
            <button
              onClick={() => setFilter('sale')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === 'sale' 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              For Sale
            </button>
          </div>
          
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded text-sm transition-colors ${
                  viewMode === 'map'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Map size={16} />
              </button>
            </div>
            
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{filteredListings.length}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Available</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-lg font-semibold text-green-700 dark:text-green-300">100%</div>
            <div className="text-xs text-green-600 dark:text-green-400">Verified</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">24h</div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Avg Response</div>
          </div>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          <InteractiveMap
            markers={mapMarkers}
            onMarkerClick={handleMarkerClick}
            height="500px"
          />
          
          {/* Selected Listing from Map */}
          {selectedListing && (
            <Card className="p-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">Selected Property</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedListing(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
              {(() => {
                const listing = filteredListings.find(l => l.id === selectedListing);
                return listing ? (
                  <div className="space-y-2">
                    <h5 className="font-medium text-foreground">{listing.title}</h5>
                    <p className="text-sm text-muted-foreground">{listing.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {listing.price}{listing.period}
                      </span>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                        View Details
                      </Button>
                    </div>
                  </div>
                ) : null;
              })()}
            </Card>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              {/* Property Image Placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏠</div>
                    <div className="text-sm">{listing.images} Photos Available</div>
                  </div>
                </div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className={`${getVerificationColor(listing.verificationLevel)} flex items-center gap-1`}>
                    <CheckCircle size={12} />
                    {listing.verificationLevel} Verified
                  </Badge>
                  <Badge className={listing.type === 'rent' 
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}>
                    For {listing.type === 'rent' ? 'Rent' : 'Sale'}
                  </Badge>
                </div>

                {/* Heart Icon */}
                <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 dark:bg-black/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-black transition-colors">
                  <Heart size={16} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-4">
                {/* Title and Price */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-1">{listing.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin size={14} />
                      {listing.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                      {listing.price}
                      <span className="text-sm text-muted-foreground">{listing.period}</span>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{listing.size}</span>
                  </div>
                  {listing.bedrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed size={14} />
                      <span>{listing.bedrooms}</span>
                    </div>
                  )}
                  {listing.bathrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath size={14} />
                      <span>{listing.bathrooms}</span>
                    </div>
                  )}
                  {listing.parking > 0 && (
                    <div className="flex items-center gap-1">
                      <Car size={14} />
                      <span>{listing.parking}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.features.slice(0, 4).map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {listing.features.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{listing.features.length - 4} more
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">{listing.description}</p>

                {/* Verification Details */}
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-green-600 dark:text-green-400" size={16} />
                    <span className="font-medium text-green-800 dark:text-green-200">Verification Documents</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {listing.documents.map((doc, index) => (
                      <Badge key={index} className="bg-white dark:bg-green-900 text-green-700 dark:text-green-300 text-xs">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Agent Info and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-sm">
                    <p className="font-medium text-card-foreground">{listing.agent}</p>
                    <p className="text-muted-foreground">Posted {listing.posted}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Phone size={16} className="mr-2" />
                      Call
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Trust Badge */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="text-blue-600 dark:text-blue-400" size={20} />
          <span className="font-semibold text-blue-800 dark:text-blue-200">100% Verified Properties</span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          All listings are verified with authentic documents and agent credentials
        </p>
      </Card>
    </div>
  );
}