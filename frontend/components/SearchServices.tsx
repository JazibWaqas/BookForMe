import React, { useState } from 'react';
import { 
  Navigation, 
  Utensils, 
  Coffee, 
  ShoppingBag, 
  Car, 
  MapPin, 
  Phone,
  Clock,
  Star,
  ChevronRight,
  Zap,
  Wrench,
  Home,
  Scissors,
  Stethoscope,
  GraduationCap,
  Building,
  Truck,
  Shield,
  Camera
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

type Category = 'food' | 'activities' | 'shopping' | 'services';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  rating: number;
  distance: string;
  price?: string;
  availability?: string;
}

export function SearchServices() {
  const [activeCategory, setActiveCategory] = useState<Category>('food');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const categories = [
    { id: 'food' as Category, label: 'Food & Drink', icon: Utensils },
    { id: 'activities' as Category, label: 'Things to do', icon: MapPin },
    { id: 'shopping' as Category, label: 'Shopping', icon: ShoppingBag },
    { id: 'services' as Category, label: 'Services', icon: Wrench },
  ];

  const subcategories = {
    food: [
      { id: 'restaurants', name: 'Restaurants', icon: Utensils },
      { id: 'coffee', name: 'Coffee', icon: Coffee },
      { id: 'takeout', name: 'Takeout', icon: ShoppingBag },
      { id: 'delivery', name: 'Delivery', icon: Truck },
    ],
    activities: [
      { id: 'parks', name: 'Parks', icon: MapPin },
      { id: 'gyms', name: 'Gyms', icon: Building },
      { id: 'art', name: 'Art', icon: Camera },
      { id: 'attractions', name: 'Attractions', icon: Star },
      { id: 'nightlife', name: 'Nightlife', icon: Clock },
      { id: 'music', name: 'Live music', icon: Utensils },
    ],
    shopping: [
      { id: 'groceries', name: 'Groceries', icon: ShoppingBag },
      { id: 'beauty', name: 'Beauty supplies', icon: Scissors },
      { id: 'electronics', name: 'Electronics', icon: Zap },
      { id: 'home-garden', name: 'Home & garden', icon: Home },
      { id: 'apparel', name: 'Apparel', icon: ShoppingBag },
      { id: 'centers', name: 'Shopping centers', icon: Building },
    ],
    services: [
      { id: 'plumber', name: 'Plumber', icon: Wrench },
      { id: 'electrician', name: 'Electrician', icon: Zap },
      { id: 'gas', name: 'Gas', icon: Truck },
      { id: 'hospitals', name: 'Hospitals & clinics', icon: Stethoscope },
      { id: 'beauty-salons', name: 'Beauty salons', icon: Scissors },
      { id: 'car-rental', name: 'Car rental', icon: Car },
      { id: 'security', name: 'Security', icon: Shield },
      { id: 'education', name: 'Tutoring', icon: GraduationCap },
    ],
  };

  const sampleServices: ServiceItem[] = [
    {
      id: '1',
      name: 'Ali Plumbing Services',
      description: 'Professional plumbing repairs and installations',
      icon: Wrench,
      category: 'plumber',
      rating: 4.5,
      distance: '0.8 km',
      price: 'Rs. 1,500',
      availability: 'Available now'
    },
    {
      id: '2',
      name: 'Khan Electrical Works',
      description: 'Licensed electrician for home and office',
      icon: Zap,
      category: 'electrician',
      rating: 4.8,
      distance: '1.2 km',
      price: 'Rs. 2,000',
      availability: 'Available in 30 min'
    },
    {
      id: '3',
      name: 'Bismillah Restaurant',
      description: 'Traditional Pakistani cuisine',
      icon: Utensils,
      category: 'restaurants',
      rating: 4.3,
      distance: '0.5 km',
      price: 'Rs. 800',
      availability: 'Open until 11 PM'
    },
    {
      id: '4',
      name: 'Metro Cash & Carry',
      description: 'Wholesale grocery shopping',
      icon: ShoppingBag,
      category: 'groceries',
      rating: 4.1,
      distance: '2.1 km',
      availability: 'Open until 10 PM'
    },
    {
      id: '5',
      name: 'Clifton Beach',
      description: 'Popular seaside attraction',
      icon: MapPin,
      category: 'attractions',
      rating: 4.0,
      distance: '3.5 km',
      availability: 'Open 24/7'
    },
    {
      id: '6',
      name: 'Agha Khan Hospital',
      description: 'Multi-specialty healthcare facility',
      icon: Stethoscope,
      category: 'hospitals',
      rating: 4.7,
      distance: '1.8 km',
      availability: '24/7 Emergency'
    }
  ];

  const getFilteredServices = () => {
    if (!selectedSubcategory) return [];
    return sampleServices.filter(service => service.category === selectedSubcategory);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Navigation className="text-green-600 dark:text-green-400" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Near Me</h2>
            <p className="text-sm text-muted-foreground">Find local services and places around you</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Card className="p-1">
        <div className="flex gap-1 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setSelectedSubcategory(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-0 ${
                activeCategory === category.id
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <category.icon size={16} />
              {category.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Location Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <MapPin className="text-blue-600 dark:text-blue-400" size={16} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-blue-900 dark:text-blue-100">DHA Phase 5, Karachi</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Searching within 5 km radius</p>
          </div>
          <Button size="sm" variant="outline" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
            Change
          </Button>
        </div>
      </Card>

      {/* Subcategories Grid */}
      <div className="space-y-4">
        <h3 className="font-semibold text-card-foreground capitalize">{activeCategory.replace('-', ' & ')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {subcategories[activeCategory]?.map((subcategory) => (
            <Card
              key={subcategory.id}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                selectedSubcategory === subcategory.id
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950'
                  : 'border-border hover:border-blue-300 dark:hover:border-blue-600'
              }`}
              onClick={() => setSelectedSubcategory(subcategory.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedSubcategory === subcategory.id
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'bg-muted'
                }`}>
                  <subcategory.icon 
                    size={20} 
                    className={selectedSubcategory === subcategory.id 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-muted-foreground'
                    } 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm ${
                    selectedSubcategory === subcategory.id
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-card-foreground'
                  }`}>
                    {subcategory.name}
                  </h4>
                </div>
                <ChevronRight 
                  size={16} 
                  className={selectedSubcategory === subcategory.id 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-muted-foreground'
                  } 
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Service Results */}
      {selectedSubcategory && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-card-foreground">
              {subcategories[activeCategory]?.find(s => s.id === selectedSubcategory)?.name} Near You
            </h3>
            <Badge variant="secondary">
              {getFilteredServices().length} found
            </Badge>
          </div>

          <div className="space-y-3">
            {getFilteredServices().map((service) => (
              <Card key={service.id} className="p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <service.icon className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-card-foreground">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      {service.price && (
                        <div className="text-right">
                          <p className="font-semibold text-green-600 dark:text-green-400">{service.price}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="fill-yellow-400 text-yellow-400" size={14} />
                        <span>{service.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{service.distance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{service.availability}</span>
                      </div>
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
        </div>
      )}

      {/* Quick Actions */}
      {!selectedSubcategory && (
        <Card className="p-4">
          <h3 className="font-semibold text-card-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => {
                setActiveCategory('services');
                setSelectedSubcategory('plumber');
              }}
            >
              <Wrench className="text-blue-600 dark:text-blue-400" size={24} />
              <span className="text-sm">Emergency Plumber</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => {
                setActiveCategory('services');
                setSelectedSubcategory('electrician');
              }}
            >
              <Zap className="text-yellow-600 dark:text-yellow-400" size={24} />
              <span className="text-sm">Electrician</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => {
                setActiveCategory('food');
                setSelectedSubcategory('delivery');
              }}
            >
              <Truck className="text-green-600 dark:text-green-400" size={24} />
              <span className="text-sm">Food Delivery</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => {
                setActiveCategory('services');
                setSelectedSubcategory('hospitals');
              }}
            >
              <Stethoscope className="text-red-600 dark:text-red-400" size={24} />
              <span className="text-sm">Medical Help</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}