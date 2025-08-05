import React, { useState } from 'react';
import { Map, Shield, Droplets, Volume2, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const neighborhoodData = [
  {
    id: 1,
    name: 'DHA Phase 5',
    security: 9.2,
    water: 8.5,
    noise: 7.8,
    overall: 8.5,
    reviews: 245,
    trend: 'up',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 2,
    name: 'Clifton Block 4',
    security: 8.8,
    water: 7.9,
    noise: 6.5,
    overall: 7.7,
    reviews: 189,
    trend: 'up',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 3,
    name: 'Gulshan-e-Iqbal',
    security: 7.5,
    water: 6.8,
    noise: 7.2,
    overall: 7.2,
    reviews: 156,
    trend: 'down',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 4,
    name: 'Nazimabad',
    security: 6.9,
    water: 6.2,
    noise: 5.8,
    overall: 6.3,
    reviews: 134,
    trend: 'stable',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    id: 5,
    name: 'North Karachi',
    security: 6.5,
    water: 5.9,
    noise: 6.1,
    overall: 6.2,
    reviews: 98,
    trend: 'up',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
];

const recentReviews = [
  {
    id: 1,
    neighborhood: 'DHA Phase 5',
    author: 'Ayesha Khan',
    rating: 9,
    comment: 'Excellent security arrangements and well-maintained infrastructure.',
    category: 'security',
    time: '2 days ago'
  },
  {
    id: 2,
    neighborhood: 'Clifton Block 4',
    author: 'Muhammad Ali',
    rating: 8,
    comment: 'Good area but traffic noise can be an issue during peak hours.',
    category: 'noise',
    time: '3 days ago'
  },
  {
    id: 3,
    neighborhood: 'Gulshan-e-Iqbal',
    author: 'Fatima Sheikh',
    rating: 7,
    comment: 'Water supply has improved but still occasional shortages.',
    category: 'water',
    time: '5 days ago'
  }
];

export function NeighborhoodRankings() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'security' | 'water' | 'noise'>('all');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'water': return Droplets;
      case 'noise': return Volume2;
      default: return Star;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 7) return 'text-blue-600';
    if (rating >= 6) return 'text-orange-600';
    return 'text-red-600';
  };

  const sortedNeighborhoods = [...neighborhoodData].sort((a, b) => {
    if (activeCategory === 'all') return b.overall - a.overall;
    if (activeCategory === 'security') return b.security - a.security;
    if (activeCategory === 'water') return b.water - a.water;
    if (activeCategory === 'noise') return b.noise - a.noise;
    return 0;
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Map className="text-green-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Neighborhood Rankings</h2>
            <p className="text-sm text-gray-600">Compare areas by safety, utilities & quality</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeCategory === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Overall
          </button>
          <button
            onClick={() => setActiveCategory('security')}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeCategory === 'security' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Shield size={16} />
            Security
          </button>
          <button
            onClick={() => setActiveCategory('water')}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeCategory === 'water' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Droplets size={16} />
            Water
          </button>
          <button
            onClick={() => setActiveCategory('noise')}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeCategory === 'noise' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Volume2 size={16} />
            Noise
          </button>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-3">
        {sortedNeighborhoods.map((neighborhood, index) => {
          const TrendIcon = getTrendIcon(neighborhood.trend);
          const currentRating = activeCategory === 'all' ? neighborhood.overall :
                               activeCategory === 'security' ? neighborhood.security :
                               activeCategory === 'water' ? neighborhood.water :
                               neighborhood.noise;
          
          return (
            <Card 
              key={neighborhood.id} 
              className={`p-4 cursor-pointer transition-all ${
                selectedNeighborhood === neighborhood.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedNeighborhood(
                selectedNeighborhood === neighborhood.id ? null : neighborhood.id
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${neighborhood.bgColor} flex items-center justify-center font-bold ${neighborhood.color}`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{neighborhood.name}</h4>
                    <p className="text-sm text-gray-500">{neighborhood.reviews} reviews</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getRatingColor(currentRating)}`}>
                      {currentRating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendIcon 
                        size={12} 
                        className={neighborhood.trend === 'up' ? 'text-green-500' : 
                                 neighborhood.trend === 'down' ? 'text-red-500' : 'text-gray-400'}
                      />
                      <span className="text-xs text-gray-500">
                        {neighborhood.trend === 'up' ? '+0.2' : 
                         neighborhood.trend === 'down' ? '-0.1' : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedNeighborhood === neighborhood.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Shield className="text-blue-600" size={16} />
                        <span className="text-sm font-medium">Security</span>
                      </div>
                      <div className={`text-lg font-bold ${getRatingColor(neighborhood.security)}`}>
                        {neighborhood.security.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Droplets className="text-cyan-600" size={16} />
                        <span className="text-sm font-medium">Water</span>
                      </div>
                      <div className={`text-lg font-bold ${getRatingColor(neighborhood.water)}`}>
                        {neighborhood.water.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Volume2 className="text-purple-600" size={16} />
                        <span className="text-sm font-medium">Noise</span>
                      </div>
                      <div className={`text-lg font-bold ${getRatingColor(neighborhood.noise)}`}>
                        {neighborhood.noise.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Detailed Reviews
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recent Reviews */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Recent Reviews</h3>
        <div className="space-y-3">
          {recentReviews.map((review) => {
            const CategoryIcon = getCategoryIcon(review.category);
            return (
              <Card key={review.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CategoryIcon className="text-blue-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-medium text-gray-900">{review.neighborhood}</h5>
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-500 fill-current" size={14} />
                        <span className="text-sm font-medium">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>By {review.author}</span>
                      <span>{review.time}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}