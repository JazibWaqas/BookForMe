import React, { useState, useEffect } from 'react';
import { MapPin, Home, Zap, Search, Plus, Minus, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'property' | 'service' | 'safety' | 'listing';
  price?: string;
  details?: string;
  verified?: boolean;
}

interface InteractiveMapProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showControls?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
}

export function InteractiveMap({
  markers = [],
  center = { lat: 24.8607, lng: 67.0011 }, // Karachi coordinates
  zoom = 12,
  height = "400px",
  showControls = true,
  onMarkerClick
}: InteractiveMapProps) {
  const [currentCenter, setCurrentCenter] = useState(center);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sample markers for Karachi areas
  const defaultMarkers: MapMarker[] = [
    {
      id: '1',
      lat: 24.8615,
      lng: 67.0099,
      title: 'Clifton Block 2 Apartment',
      type: 'listing',
      price: 'PKR 2.5M',
      details: '3 bed, 2 bath',
      verified: true
    },
    {
      id: '2',
      lat: 24.8580,
      lng: 67.0020,
      title: 'DHA Phase 6 House',
      type: 'listing',
      price: 'PKR 4.2M',
      details: '4 bed, 3 bath',
      verified: true
    },
    {
      id: '3',
      lat: 24.8650,
      lng: 67.0150,
      title: 'Gulshan-e-Iqbal Block 13',
      type: 'property',
      price: 'PKR 1.8M',
      details: '2 bed, 1 bath'
    },
    {
      id: '4',
      lat: 24.8700,
      lng: 67.0080,
      title: 'North Nazimabad Block H',
      type: 'property',
      price: 'PKR 3.1M',
      details: '3 bed, 2 bath'
    },
    {
      id: '5',
      lat: 24.8550,
      lng: 67.0180,
      title: 'Police Station',
      type: 'safety',
      details: 'Emergency Services'
    },
    {
      id: '6',
      lat: 24.8620,
      lng: 67.0050,
      title: 'Hospital',
      type: 'service',
      details: 'Medical Center'
    }
  ];

  const displayMarkers = markers.length > 0 ? markers : defaultMarkers;

  const getMarkerColor = (type: string, verified?: boolean) => {
    switch (type) {
      case 'listing':
        return verified ? 'bg-green-500 border-green-600' : 'bg-blue-500 border-blue-600';
      case 'property':
        return 'bg-purple-500 border-purple-600';
      case 'safety':
        return 'bg-red-500 border-red-600';
      case 'service':
        return 'bg-orange-500 border-orange-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'listing':
      case 'property':
        return <Home size={12} className="text-white" />;
      case 'safety':
        return <Zap size={12} className="text-white" />;
      case 'service':
        return <Search size={12} className="text-white" />;
      default:
        return <MapPin size={12} className="text-white" />;
    }
  };

  const handleZoomIn = () => {
    setCurrentZoom(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setCurrentZoom(prev => Math.max(prev - 1, 8));
  };

  const handleReset = () => {
    setCurrentCenter(center);
    setCurrentZoom(zoom);
    setSelectedMarker(null);
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    onMarkerClick?.(marker);
  };

  // Convert coordinates to pixel positions (simplified for demo)
  const coordToPixel = (lat: number, lng: number) => {
    const mapWidth = 100;
    const mapHeight = 100;
    
    // Simple linear mapping for demo purposes
    const x = ((lng - (currentCenter.lng - 0.02)) / 0.04) * mapWidth;
    const y = ((currentCenter.lat + 0.02 - lat) / 0.04) * mapHeight;
    
    return { x: Math.max(0, Math.min(x, mapWidth)), y: Math.max(0, Math.min(y, mapHeight)) };
  };

  return (
    <div className="relative">
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 border-2" style={{ height }}>
        {/* Map Background with Grid */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400 dark:text-gray-600"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Area Labels */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">
            Clifton
          </div>
          <div className="absolute top-1/3 right-8 text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">
            DHA
          </div>
          <div className="absolute bottom-1/3 left-8 text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">
            Gulshan
          </div>
          <div className="absolute top-8 right-1/3 text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">
            North Nazimabad
          </div>
        </div>

        {/* Markers */}
        {displayMarkers.map((marker) => {
          const position = coordToPixel(marker.lat, marker.lng);
          return (
            <button
              key={marker.id}
              onClick={() => handleMarkerClick(marker)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg z-10 ${getMarkerColor(marker.type, marker.verified)}`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`
              }}
            >
              {getMarkerIcon(marker.type)}
              {marker.verified && marker.type === 'listing' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}

        {/* Controls */}
        {showControls && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomIn}
              className="w-8 h-8 p-0 bg-background/90 hover:bg-background"
            >
              <Plus size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomOut}
              className="w-8 h-8 p-0 bg-background/90 hover:bg-background"
            >
              <Minus size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReset}
              className="w-8 h-8 p-0 bg-background/90 hover:bg-background"
            >
              <RotateCcw size={16} />
            </Button>
          </div>
        )}

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded z-20">
          Zoom: {currentZoom}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-background/90 rounded-lg p-2 text-xs z-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full border border-green-600"></div>
              <span className="text-muted-foreground">Verified Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full border border-blue-600"></div>
              <span className="text-muted-foreground">Properties</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full border border-red-600"></div>
              <span className="text-muted-foreground">Safety Points</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Selected Marker Info */}
      {selectedMarker && (
        <Card className="mt-4 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 rounded-full ${getMarkerColor(selectedMarker.type, selectedMarker.verified)}`}></div>
                <h4 className="font-semibold text-foreground">{selectedMarker.title}</h4>
                {selectedMarker.verified && (
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Verified
                  </span>
                )}
              </div>
              {selectedMarker.price && (
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  {selectedMarker.price}
                </p>
              )}
              {selectedMarker.details && (
                <p className="text-muted-foreground">{selectedMarker.details}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMarker(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}