import React, { useState } from 'react';
import './Homepage.css';

// Icons (you can replace with actual icon library like Lucide React or Heroicons)
const HomeIcon = () => <span>🏠</span>;
const ChatIcon = () => <span>💬</span>;
const SocialIcon = () => <span>👥</span>;
const NotificationIcon = () => <span>🔔</span>;
const ProfileIcon = () => <span>👤</span>;
const SearchIcon = () => <span>🔍</span>;
const LocationIcon = () => <span>📍</span>;
const HeartIcon = () => <span>❤️</span>;

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
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
  const [activeTab, setActiveTab] = useState('home');

  // Sample data - replace with actual data from your backend
  const categories: CategoryItem[] = [
    { id: '1', name: 'Paddle', icon: '🏓', color: '#FF6B6B' },
    { id: '2', name: 'Cricket', icon: '🏏', color: '#4ECDC4' },
    { id: '3', name: 'Futsal', icon: '⚽', color: '#45B7D1' },
    { id: '4', name: 'Gaming Zones', icon: '🎮', color: '#96CEB4' },
    { id: '5', name: 'Farmhouses', icon: '🏡', color: '#FFEAA7' },
    { id: '6', name: 'Beach Houses', icon: '🏖️', color: '#DDA0DD' },
    { id: '7', name: 'Pickleball', icon: '🏸', color: '#98D8C8' },
    { id: '8', name: 'Tennis', icon: '🎾', color: '#F7DC6F' },
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
      {/* Header Navigation */}
      <header className="header">
        <div className="header-content">
          <div className="location">
            <LocationIcon />
            <div>
              <h3>Home</h3>
              <p>2 Khayaban-e-Seher</p>
            </div>
          </div>
          <div className="header-actions">
            <HeartIcon />
            <div className="cart-icon">
              <span>📋</span>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search for courts, gaming zones, and venues"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </form>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Happening in Your City */}
        <section className="section">
          <h2 className="section-title">Happening in your city</h2>
          <div className="horizontal-scroll">
            {happeningItems.map((item) => (
              <div key={item.id} className="happening-card">
                <img src={item.image} alt={item.title} />
                <div className="happening-content">
                  <h3>{item.title}</h3>
                  <p>{item.location}</p>
                  {item.discount && (
                    <span className="discount-badge">{item.discount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="section">
          <h2 className="section-title">Categories</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <div
                key={category.id}
                className="category-item"
                onClick={() => handleCategoryClick(category)}
                style={{ backgroundColor: category.color }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Your Favorites */}
        <section className="section">
          <h2 className="section-title">Your favorites</h2>
          <div className="horizontal-scroll">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="listing-card"
                onClick={() => handleItemClick(item)}
              >
                <img src={item.image} alt={item.name} />
                <div className="listing-content">
                  <h3>{item.name}</h3>
                  <div className="rating">
                    <span>⭐ {item.rating}</span>
                    <span>({item.reviews}+)</span>
                  </div>
                  <div className="details">
                    <span>{item.time}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="price">{item.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discounts */}
        <section className="section">
          <h2 className="section-title">Discounts</h2>
          <div className="horizontal-scroll">
            {discounts.map((item) => (
              <div
                key={item.id}
                className="listing-card discount-card"
                onClick={() => handleItemClick(item)}
              >
                <img src={item.image} alt={item.name} />
                {item.discount && (
                  <div className="discount-overlay">
                    <span className="discount-text">{item.discount}</span>
                  </div>
                )}
                <div className="listing-content">
                  <h3>{item.name}</h3>
                  <div className="rating">
                    <span>⭐ {item.rating}</span>
                    <span>({item.reviews}+)</span>
                  </div>
                  <div className="details">
                    <span>{item.time}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="price">{item.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All Listings */}
        <section className="section">
          <h2 className="section-title">All venues</h2>
          <div className="listings-grid">
            {allListings.map((item) => (
              <div
                key={item.id}
                className="listing-card full-width"
                onClick={() => handleItemClick(item)}
              >
                <img src={item.image} alt={item.name} />
                <div className="listing-content">
                  <h3>{item.name}</h3>
                  <div className="rating">
                    <span>⭐ {item.rating}</span>
                    <span>({item.reviews}+)</span>
                  </div>
                  <div className="details">
                    <span>{item.time}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="price">{item.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <HomeIcon />
          <span>Home</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <ChatIcon />
          <span>Chat</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          <SocialIcon />
          <span>Social</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <NotificationIcon />
          <span>Notifications</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <ProfileIcon />
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
};

export default Homepage;
