import React, { useState } from 'react';
import Header from '../components/Header';
import '../styles/Homepage.css';

// Types
interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

interface HappeningItem {
  id: string;
  title: string;
  image: string;
  location: string;
  discount?: string;
}

interface ListingItem {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  time: string;
  price: string;
  category: string;
  discount?: string;
}

const Homepage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data - replace with actual data from your backend
  const categories: CategoryItem[] = [
    { id: '1', name: 'Paddle', icon: '🏓' },
    { id: '2', name: 'Cricket', icon: '🏏' },
    { id: '3', name: 'Futsal', icon: '⚽' },
    { id: '4', name: 'Gaming Zones', icon: '🎮' },
    { id: '5', name: 'Farmhouses', icon: '🏡' },
    { id: '6', name: 'Beach Houses', icon: '🏖️' },
    { id: '7', name: 'Pickleball', icon: '🏸' },
    { id: '8', name: 'Tennis', icon: '🎾' },
  ];

  const happeningItems: HappeningItem[] = [
    {
      id: '1',
      title: 'New Paddle Court Opens!',
      image: '/api/placeholder/300/150',
      location: 'DHA Phase 5',
      discount: '30% OFF'
    },
    {
      id: '2',
      title: 'Weekend Cricket Tournament',
      image: '/api/placeholder/300/150',
      location: 'Gulshan-e-Iqbal'
    },
    {
      id: '3',
      title: 'Gaming Zone Special',
      image: '/api/placeholder/300/150',
      location: 'Clifton',
      discount: '25% OFF'
    }
  ];

  const favorites: ListingItem[] = [
    {
      id: '1',
      name: 'Elite Paddle Club',
      image: '/api/placeholder/200/120',
      rating: 4.6,
      reviews: 1000,
      time: '15-25 min',
      price: 'Rs. 2000/hr',
      category: 'Paddle'
    },
    {
      id: '2',
      name: 'Champions Cricket Ground',
      image: '/api/placeholder/200/120',
      rating: 4.8,
      reviews: 850,
      time: '20-30 min',
      price: 'Rs. 5000/match',
      category: 'Cricket'
    }
  ];

  const discounts: ListingItem[] = [
    {
      id: '1',
      name: 'Ocean View Beach House',
      image: '/api/placeholder/200/120',
      rating: 4.5,
      reviews: 500,
      time: '45-60 min',
      price: 'Rs. 15000/day',
      category: 'Beach House',
      discount: '40% OFF'
    },
    {
      id: '2',
      name: 'Pro Gaming Lounge',
      image: '/api/placeholder/200/120',
      rating: 4.7,
      reviews: 1200,
      time: '10-15 min',
      price: 'Rs. 500/hr',
      category: 'Gaming',
      discount: '25% OFF'
    }
  ];

  const allListings: ListingItem[] = [
    {
      id: '1',
      name: 'Royal Futsal Arena',
      image: '/api/placeholder/200/120',
      rating: 4.4,
      reviews: 750,
      time: '20-30 min',
      price: 'Rs. 3000/hr',
      category: 'Futsal'
    },
    {
      id: '2',
      name: 'Green Valley Farmhouse',
      image: '/api/placeholder/200/120',
      rating: 4.6,
      reviews: 300,
      time: '60-90 min',
      price: 'Rs. 25000/day',
      category: 'Farmhouse'
    },
    {
      id: '3',
      name: 'Tennis Club Premium',
      image: '/api/placeholder/200/120',
      rating: 4.8,
      reviews: 650,
      time: '25-35 min',
      price: 'Rs. 1500/hr',
      category: 'Tennis'
    },
    {
      id: '4',
      name: 'Pickleball Paradise',
      image: '/api/placeholder/200/120',
      rating: 4.3,
      reviews: 400,
      time: '15-25 min',
      price: 'Rs. 1200/hr',
      category: 'Pickleball'
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleAgentModeClick = () => {
    // Implement agent mode functionality
    console.log('Agent mode activated');
  };

  const handleCategoryClick = (category: CategoryItem) => {
    // Navigate to category page or filter listings
    console.log('Category clicked:', category.name);
  };

  const handleItemClick = (item: ListingItem) => {
    // Navigate to item details page
    console.log('Item clicked:', item.name);
  };

  return (
    <div className="homepage">
      {/* Header Component */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearch}
        onAgentModeClick={handleAgentModeClick}
      />

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Happening in Your City */}
          <section className="mb-4">
            <h2 className="text-lg font-semibold text-primary mb-3">Happening in your city</h2>
            <div className="horizontal-scroll d-flex gap-3">
              {happeningItems.map((item) => (
                <div key={item.id} className="card happening-card">
                  <img src={item.image} alt={item.title} className="card-img-top" />
                  <div className="card-body p-2">
                    <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-secondary mb-0">{item.location}</p>
                    {item.discount && (
                      <span className="discount-badge">{item.discount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section className="mb-4">
            <h2 className="text-lg font-semibold text-primary mb-3">Categories</h2>
            <div className="categories-grid grid-cols-4 gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="category-item card p-2 text-center"
                  onClick={() => handleCategoryClick(category)}
                >
                  <span className="category-icon text-lg mb-1">{category.icon}</span>
                  <span className="category-name text-xs font-semibold">{category.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Your Favorites */}
          <section className="mb-4">
            <h2 className="text-lg font-semibold text-primary mb-3">Your favorites</h2>
            <div className="horizontal-scroll d-flex gap-3">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="card listing-card"
                  onClick={() => handleItemClick(item)}
                >
                  <img src={item.image} alt={item.name} className="card-img-top" />
                    <div className="card-body p-2">
                    <h3 className="text-sm font-semibold mb-1">{item.name}</h3>
                    <div className="rating d-flex align-items-center gap-1 mb-1">
                      <span className="text-xs font-semibold">⭐ {item.rating}</span>
                      <span className="text-xs text-muted">({item.reviews}+)</span>
                    </div>
                    <div className="details d-flex align-items-center gap-1 mb-1 text-xs text-secondary">
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="price text-xs font-semibold">{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Discounts */}
          <section className="mb-4">
            <h2 className="text-lg font-semibold text-primary mb-3">Discounts</h2>
            <div className="horizontal-scroll d-flex gap-3">
              {discounts.map((item) => (
                <div
                  key={item.id}
                  className="card listing-card discount-card"
                  onClick={() => handleItemClick(item)}
                >
                  <img src={item.image} alt={item.name} className="card-img-top" />
                  {item.discount && (
                    <div className="discount-overlay">
                      <span className="discount-text">{item.discount}</span>
                    </div>
                  )}
                    <div className="card-body p-2">
                    <h3 className="text-sm font-semibold mb-1">{item.name}</h3>
                    <div className="rating d-flex align-items-center gap-1 mb-1">
                      <span className="text-xs font-semibold">⭐ {item.rating}</span>
                      <span className="text-xs text-muted">({item.reviews}+)</span>
                    </div>
                    <div className="details d-flex align-items-center gap-1 mb-1 text-xs text-secondary">
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="price text-xs font-semibold">{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* All Listings */}
          <section className="mb-4">
            <h2 className="text-lg font-semibold text-primary mb-3">All venues</h2>
            <div className="listings-grid d-grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-4">
              {allListings.map((item) => (
                <div
                  key={item.id}
                  className="card listing-card full-width"
                  onClick={() => handleItemClick(item)}
                >
                  <img src={item.image} alt={item.name} className="card-img-top" />
                    <div className="card-body p-2">
                    <h3 className="text-sm font-semibold mb-1">{item.name}</h3>
                    <div className="rating d-flex align-items-center gap-1 mb-1">
                      <span className="text-xs font-semibold">⭐ {item.rating}</span>
                      <span className="text-xs text-muted">({item.reviews}+)</span>
                    </div>
                    <div className="details d-flex align-items-center gap-1 mb-1 text-xs text-secondary">
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="price text-xs font-semibold">{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
