import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
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
  const navigate = useNavigate();

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
    { id: '9', name: 'Swimming', icon: '🏊' },
    { id: '10', name: 'Badminton', icon: '🏸' },
    { id: '11', name: 'Basketball', icon: '🏀' },
    { id: '12', name: 'Volleyball', icon: '🏐' },
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
    },
    {
      id: '4',
      title: 'Beach House Grand Opening',
      image: '/api/placeholder/300/150',
      location: 'Hawke\'s Bay',
      discount: '40% OFF'
    },
    {
      id: '5',
      title: 'Tennis Championship',
      image: '/api/placeholder/300/150',
      location: 'Defence'
    },
    {
      id: '6',
      title: 'Swimming Pool Party',
      image: '/api/placeholder/300/150',
      location: 'Karachi Club',
      discount: '20% OFF'
    }
  ];

  const trending: ListingItem[] = [
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
    },
    {
      id: '3',
      name: 'Pro Gaming Arena',
      image: '/api/placeholder/200/120',
      rating: 4.7,
      reviews: 650,
      time: '10-20 min',
      price: 'Rs. 800/hr',
      category: 'Gaming'
    },
    {
      id: '4',
      name: 'Sunset Beach House',
      image: '/api/placeholder/200/120',
      rating: 4.5,
      reviews: 400,
      time: '45-60 min',
      price: 'Rs. 20000/day',
      category: 'Beach House'
    },
    {
      id: '5',
      name: 'Royal Tennis Academy',
      image: '/api/placeholder/200/120',
      rating: 4.9,
      reviews: 1200,
      time: '25-35 min',
      price: 'Rs. 1800/hr',
      category: 'Tennis'
    },
    {
      id: '6',
      name: 'Aqua Sports Complex',
      image: '/api/placeholder/200/120',
      rating: 4.4,
      reviews: 750,
      time: '30-40 min',
      price: 'Rs. 1200/hr',
      category: 'Swimming'
    },
    {
      id: '7',
      name: 'Urban Futsal Arena',
      image: '/api/placeholder/200/120',
      rating: 4.6,
      reviews: 920,
      time: '20-30 min',
      price: 'Rs. 3500/hr',
      category: 'Futsal'
    },
    {
      id: '8',
      name: 'Mountain View Farmhouse',
      image: '/api/placeholder/200/120',
      rating: 4.7,
      reviews: 340,
      time: '60-90 min',
      price: 'Rs. 35000/day',
      category: 'Farmhouse'
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
    },
    {
      id: '3',
      name: 'Premier Paddle Courts',
      image: '/api/placeholder/200/120',
      rating: 4.8,
      reviews: 890,
      time: '20-30 min',
      price: 'Rs. 1800/hr',
      category: 'Paddle',
      discount: '35% OFF'
    },
    {
      id: '4',
      name: 'Victory Cricket Stadium',
      image: '/api/placeholder/200/120',
      rating: 4.6,
      reviews: 670,
      time: '25-35 min',
      price: 'Rs. 4500/match',
      category: 'Cricket',
      discount: '20% OFF'
    },
    {
      id: '5',
      name: 'Luxury Farmhouse Resort',
      image: '/api/placeholder/200/120',
      rating: 4.9,
      reviews: 280,
      time: '70-90 min',
      price: 'Rs. 28000/day',
      category: 'Farmhouse',
      discount: '50% OFF'
    }
  ];

  const allListings: ListingItem[] = [
    // Paddle Courts
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
      name: 'Premier Paddle Courts',
      image: '/api/placeholder/200/120',
      rating: 4.8,
      reviews: 890,
      time: '20-30 min',
      price: 'Rs. 1800/hr',
      category: 'Paddle'
    },
    {
      id: '3',
      name: 'City Paddle Arena',
      image: '/api/placeholder/200/120',
      rating: 4.5,
      reviews: 650,
      time: '18-28 min',
      price: 'Rs. 2200/hr',
      category: 'Paddle'
    },
    {
      id: '4',
      name: 'Sports Valley Paddle',
      image: '/api/placeholder/200/120',
      rating: 4.7,
      reviews: 720,
      time: '22-32 min',
      price: 'Rs. 1900/hr',
      category: 'Paddle'
    },
    {
      id: '5',
      name: 'Metro Paddle Complex',
      image: '/api/placeholder/200/120',
      rating: 4.4,
      reviews: 580,
      time: '25-35 min',
      price: 'Rs. 1700/hr',
      category: 'Paddle'
    },
    // Cricket Grounds
    {
      id: '6',
      name: 'Champions Cricket Ground',
      image: '/api/placeholder/200/120',
      rating: 4.8,
      reviews: 850,
      time: '20-30 min',
      price: 'Rs. 5000/match',
      category: 'Cricket'
    },
    {
      id: '7',
      name: 'Victory Cricket Stadium',
      image: '/api/placeholder/200/120',
      rating: 4.6,
      reviews: 670,
      time: '25-35 min',
      price: 'Rs. 4500/match',
      category: 'Cricket'
    },
    {
      id: '8',
      name: 'Green Field Cricket Club',
      image: '/api/placeholder/200/120',
      rating: 4.7,
      reviews: 920,
      time: '30-40 min',
      price: 'Rs. 5500/match',
      category: 'Cricket'
    },
    {
      id: '9',
      name: 'Royal Cricket Academy',
      image: '/api/placeholder/200/120',
      rating: 4.9,
      reviews: 1100,
      time: '35-45 min',
      price: 'Rs. 6000/match',
      category: 'Cricket'
    },
    {
      id: '10',
      name: 'City Cricket Arena',
      image: '/api/placeholder/200/120',
      rating: 4.5,
      reviews: 540,
      time: '28-38 min',
      price: 'Rs. 4800/match',
      category: 'Cricket'
    },
    // Gaming Zones
    {
      id: '11',
      name: 'Pro Gaming Arena',
      image: '/api/placeholder/200/120',
      rating: 4.7,
      reviews: 650,
      time: '10-20 min',
      price: 'Rs. 800/hr',
      category: 'Gaming'
    },
    {
      id: '12',
      name: 'Pro Gaming Lounge',
      image: '/api/placeholder/200/120',
      rating: 4.7,
      reviews: 1200,
      time: '10-15 min',
      price: 'Rs. 500/hr',
      category: 'Gaming'
    },
    {
      id: '13',
      name: 'Cyber Gaming Hub',
      image: '/api/placeholder/200/120',
      rating: 4.6,
      reviews: 890,
      time: '12-18 min',
      price: 'Rs. 600/hr',
      category: 'Gaming'
    },
    {
      id: '14',
      name: 'Elite Gaming Center',
      image: '/api/placeholder/200/120',
      rating: 4.8,
      reviews: 1050,
      time: '8-15 min',
      price: 'Rs. 750/hr',
      category: 'Gaming'
    },
    {
      id: '15',
      name: 'Digital Gaming Zone',
      image: '/api/placeholder/200/120',
      rating: 4.5,
      reviews: 720,
      time: '15-22 min',
      price: 'Rs. 650/hr',
      category: 'Gaming'
    },
    // Futsal Courts
    {
      id: '16',
      name: 'Urban Futsal Arena',
      image: '/api/placeholder/200/120',
      rating: 4.6,
      reviews: 920,
      time: '20-30 min',
      price: 'Rs. 3500/hr',
      category: 'Futsal'
    },
    {
      id: '17',
      name: 'Royal Futsal Arena',
      image: '/api/placeholder/200/120',
      rating: 4.4,
      reviews: 750,
      time: '20-30 min',
      price: 'Rs. 3000/hr',
      category: 'Futsal'
    },
    {
      id: '18',
      name: 'City Futsal Complex',
      image: '/api/placeholder/200/120',
      rating: 4.7,
      reviews: 680,
      time: '25-35 min',
      price: 'Rs. 3200/hr',
      category: 'Futsal'
    },
    {
      id: '19',
      name: 'Premier Futsal Club',
      image: '/api/placeholder/200/120',
      rating: 4.8,
      reviews: 850,
      time: '18-28 min',
      price: 'Rs. 3800/hr',
      category: 'Futsal'
    },
    {
      id: '20',
      name: 'Sports City Futsal',
      image: '/api/placeholder/200/120',
      rating: 4.5,
      reviews: 590,
      time: '22-32 min',
      price: 'Rs. 3300/hr',
      category: 'Futsal'
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
    // Navigate to vendor page with item ID
    navigate(`/vendor/${item.id}`);
  };

  return (
    <>
      {/* Header Component - Outside container for full width */}
      <Header />
      
      {/* SearchBar Component - Below header */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearch}
      />
      
      <div className="homepage">

      {/* Main Content */}
      <main className="main-content">
        <div className="home-container">
          {/* 1. Happening in Your City - Horizontal Scroll */}
          <section className="section">
            <h2 className="section-title">Happening in your city</h2>
            <div className="horizontal-scroll">
              {happeningItems.map((item) => (
                <div key={item.id} className="card happening-card">
                  <img src={item.image} alt={item.title} className="card-img-top" />
                  <div className="card-body">
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-location">{item.location}</p>
                    {item.discount && (
                      <span className="discount-badge">{item.discount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Categories - Horizontal Scroll */}
          <section className="section">
            <h2 className="section-title">Categories</h2>
            <div className="horizontal-scroll">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(category)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Trending Now - Horizontal Scroll */}
          <section className="section">
            <h2 className="section-title">Trending now</h2>
            <div className="horizontal-scroll">
              {trending.map((item) => (
                <div
                  key={item.id}
                  className="card listing-card"
                  onClick={() => handleItemClick(item)}
                >
                  <img src={item.image} alt={item.name} className="card-img-top" />
                    <div className="card-body">
                    <h3 className="card-title">{item.name}</h3>
                    <div className="card-rating">
                      <span className="rating-star">⭐ {item.rating}</span>
                      <span className="rating-count">({item.reviews}+)</span>
                    </div>
                    <div className="card-details">
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="card-price">{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Discounts - Horizontal Scroll */}
          <section className="section">
            <h2 className="section-title">Discounts</h2>
            <div className="horizontal-scroll">
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
                    <div className="card-body">
                    <h3 className="card-title">{item.name}</h3>
                    <div className="card-rating">
                      <span className="rating-star">⭐ {item.rating}</span>
                      <span className="rating-count">({item.reviews}+)</span>
                    </div>
                    <div className="card-details">
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="card-price">{item.price}</div>
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
                    <div className="card-body">
                    <h3 className="card-title">{item.name}</h3>
                    <div className="card-rating">
                      <span className="rating-star">⭐ {item.rating}</span>
                      <span className="rating-count">({item.reviews}+)</span>
                    </div>
                    <div className="card-details">
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="card-price">{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      </div>
    </>
  );
};

export default Homepage;
