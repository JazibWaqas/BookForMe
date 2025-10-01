import React from 'react';
import './Header.css';

// Icons - Using simple emojis for MVP, replace with proper icon library later
const LocationIcon = () => <span>📍</span>;
const HeartIcon = () => <span>❤️</span>;
const SearchIcon = () => <span>🔍</span>;
const FilterIcon = () => <span>⚙️</span>;

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onAgentModeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onAgentModeClick
}) => {
  return (
    <header className="header">
      <div className="container">
        {/* Top Bar */}
        <div className="header-top d-flex justify-content-between align-items-center">
          <div className="location-section d-flex align-items-center">
            <LocationIcon />
            <div className="location-text ml-2">
              <h3 className="text-lg font-semibold mb-0">Home</h3>
              <p className="text-sm text-secondary mb-0">2 Khayaban-e-Seher</p>
            </div>
          </div>
          <div className="header-actions d-flex align-items-center">
            <HeartIcon />
            <div className="cart-icon ml-3">
              <span>📋</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Desktop Only */}
        <div className="navigation-tabs d-none d-md-flex">
          <div className="nav-tab active">
            <span>🚚</span>
            <span>Booking</span>
          </div>
          <div className="nav-tab">
            <span>🏃</span>
            <span>Pickup</span>
          </div>
          <div className="nav-tab">
            <span>🏪</span>
            <span>Venues</span>
          </div>
          <div className="nav-tab">
            <span>🎉</span>
            <span>Events</span>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <form onSubmit={onSearchSubmit} className="search-form mb-3">
            <div className="search-input-container d-flex align-items-center">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search for courts, gaming zones, and venues"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="form-control search-input flex-1 ml-2 mr-2"
              />
              <FilterIcon />
            </div>
          </form>
          
          {/* Agent Mode Button */}
          <button 
            className="btn btn-secondary agent-mode-btn d-flex align-items-center w-100"
            onClick={onAgentModeClick}
          >
            <span className="agent-icon text-xl mr-3">🤖</span>
            <div className="agent-text d-flex flex-column align-items-start">
              <span className="agent-title font-semibold">Try Agent Mode</span>
              <span className="agent-subtitle text-sm text-muted">Let AI find and book for you!</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
