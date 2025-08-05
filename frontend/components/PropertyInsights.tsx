import React, { useState } from 'react';
import { TrendingUp, Search, MapPin, Home, Building, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const priceData = [
  {
    id: 1,
    neighborhood: 'DHA Phase 5',
    avgPrice: 'Rs. 45,000',
    priceRange: 'Rs. 35K - 65K',
    trend: '+12%',
    trendDirection: 'up',
    propertyType: 'per sq ft',
    recentSales: 23,
    description: 'Premium residential area with excellent amenities'
  },
  {
    id: 2,
    neighborhood: 'Clifton Block 4',
    avgPrice: 'Rs. 38,000',
    priceRange: 'Rs. 28K - 55K',
    trend: '+8%',
    trendDirection: 'up',
    propertyType: 'per sq ft',
    recentSales: 18,
    description: 'Upscale beachfront location with commercial access'
  },
  {
    id: 3,
    neighborhood: 'Gulshan-e-Iqbal',
    avgPrice: 'Rs. 22,000',
    priceRange: 'Rs. 15K - 32K',
    trend: '+5%',
    trendDirection: 'up',
    propertyType: 'per sq ft',
    recentSales: 31,
    description: 'Established middle-class area with good connectivity'
  },
  {
    id: 4,
    neighborhood: 'North Karachi',
    avgPrice: 'Rs. 18,000',
    priceRange: 'Rs. 12K - 25K',
    trend: '-2%',
    trendDirection: 'down',
    propertyType: 'per sq ft',
    recentSales: 15,
    description: 'Developing area with affordable housing options'
  }
];

const recentListings = [
  {
    id: 1,
    title: '3 Bed Apartment - DHA Phase 5',
    price: 'Rs. 2.8 Cr',
    size: '1,800 sq ft',
    type: 'Apartment',
    neighborhood: 'DHA Phase 5',
    posted: '2 days ago',
    pricePerSqFt: 'Rs. 45,556',
    features: ['Parking', 'Gym', 'Security']
  },
  {
    id: 2,
    title: '4 Bed House - Clifton',
    price: 'Rs. 4.2 Cr',
    size: '2,500 sq ft',
    type: 'House',
    neighborhood: 'Clifton Block 4',
    posted: '5 days ago',
    pricePerSqFt: 'Rs. 42,000',
    features: ['Garden', 'Parking', 'Sea View']
  },
  {
    id: 3,
    title: '2 Bed Flat - Gulshan',
    price: 'Rs. 1.1 Cr',
    size: '1,200 sq ft',
    type: 'Flat',
    neighborhood: 'Gulshan-e-Iqbal',
    posted: '1 week ago',
    pricePerSqFt: 'Rs. 23,333',
    features: ['Parking', 'Lift', 'Generator']
  }
];

export function PropertyInsights() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'trends' | 'listings'>('trends');

  const filteredData = priceData.filter(item => 
    item.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListings = recentListings.filter(item => 
    item.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Property Insights</h2>
            <p className="text-sm text-gray-600">Real estate trends & market data</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search neighborhoods (DHA, Clifton, Gulshan...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('trends')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              selectedView === 'trends' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BarChart3 size={16} />
            Price Trends
          </button>
          <button
            onClick={() => setSelectedView('listings')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              selectedView === 'listings' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Home size={16} />
            Recent Listings
          </button>
        </div>
      </div>

      {/* Price Trends View */}
      {selectedView === 'trends' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Price Trends by Area</h3>
            <Badge variant="outline" className="text-xs">
              Last 30 days
            </Badge>
          </div>

          {filteredData.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.neighborhood}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <Badge 
                  className={`${
                    item.trendDirection === 'up' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.trend}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Average Price</p>
                  <p className="text-xl font-bold text-gray-900">{item.avgPrice}</p>
                  <p className="text-xs text-gray-500">{item.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Price Range</p>
                  <p className="text-lg font-semibold text-gray-700">{item.priceRange}</p>
                  <p className="text-xs text-gray-500">{item.propertyType}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Building size={14} />
                  <span>{item.recentSales} recent sales</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Updated today</span>
                </div>
              </div>
            </Card>
          ))}

          {/* Market Summary */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">Market Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Hottest Area</p>
                <p className="font-semibold text-blue-700">DHA Phase 5</p>
              </div>
              <div>
                <p className="text-gray-600">Average Growth</p>
                <p className="font-semibold text-green-600">+8.2%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Listings View */}
      {selectedView === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Listings</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          {filteredListings.map((listing) => (
            <Card key={listing.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{listing.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MapPin size={14} />
                    <span>{listing.neighborhood}</span>
                    <span>•</span>
                    <span>{listing.posted}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {listing.type}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Price</p>
                  <p className="text-xl font-bold text-green-600">{listing.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Size</p>
                  <p className="text-lg font-semibold text-gray-700">{listing.size}</p>
                  <p className="text-xs text-gray-500">{listing.pricePerSqFt}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {listing.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Contact Agent
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}