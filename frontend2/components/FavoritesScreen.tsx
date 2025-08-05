import React, { useState } from 'react';
import { Heart, Search, MapPin, Building, MessageSquare, Trash2, ExternalLink, Clock, Filter } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useFavorites, FavoriteItem } from './FavoritesProvider';

const typeFilters = [
  { id: 'all', label: 'All', icon: Heart },
  { id: 'service', label: 'Services', icon: Search },
  { id: 'location', label: 'Locations', icon: MapPin },
  { id: 'listing', label: 'Listings', icon: Building },
  { id: 'post', label: 'Posts', icon: MessageSquare },
];

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
}

export function FavoritesScreen() {
  const { favorites, removeFromFavorites, getFavoritesByType } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredFavorites = favorites.filter(fav => {
    const matchesSearch = fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (fav.subtitle && fav.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === 'all' || fav.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: FavoriteItem['type']) => {
    switch (type) {
      case 'service':
        return Search;
      case 'location':
        return MapPin;
      case 'listing':
        return Building;
      case 'post':
        return MessageSquare;
      default:
        return Heart;
    }
  };

  const getTypeColor = (type: FavoriteItem['type']) => {
    switch (type) {
      case 'service':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'location':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      case 'listing':
        return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/20';
      case 'post':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Heart className="text-red-500" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Your Favorites</h2>
            <p className="text-sm text-muted-foreground">
              {favorites.length} saved {favorites.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl p-4 shadow-sm border space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search your favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {typeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedFilter === filter.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <filter.icon size={16} />
              {filter.label}
              {filter.id !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {getFavoritesByType(filter.id as FavoriteItem['type']).length}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-primary">{favorites.length}</div>
          <div className="text-xs text-muted-foreground">Total Favorites</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {getFavoritesByType('service').length}
          </div>
          <div className="text-xs text-muted-foreground">Saved Services</div>
        </Card>
      </div>

      {/* Favorites List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-card-foreground">
            {selectedFilter === 'all' ? 'All Favorites' : `${typeFilters.find(f => f.id === selectedFilter)?.label}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {filteredFavorites.length} {filteredFavorites.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {filteredFavorites.length > 0 ? (
          <div className="space-y-3">
            {filteredFavorites.map((favorite) => {
              const TypeIcon = getTypeIcon(favorite.type);
              const typeColor = getTypeColor(favorite.type);
              
              return (
                <Card key={favorite.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeColor}`}>
                      <TypeIcon size={18} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-card-foreground truncate">{favorite.title}</h4>
                          {favorite.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">{favorite.subtitle}</p>
                          )}
                          {favorite.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{favorite.location}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {favorite.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>Added {getTimeAgo(favorite.addedAt)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <ExternalLink size={14} className="mr-1" />
                            Open
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromFavorites(favorite.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-card-foreground mb-2">No favorites found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery 
                ? `No favorites match "${searchQuery}"`
                : selectedFilter === 'all'
                  ? 'Start exploring and save your favorite places, services, and more!'
                  : `No ${typeFilters.find(f => f.id === selectedFilter)?.label.toLowerCase()} saved yet.`
              }
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}