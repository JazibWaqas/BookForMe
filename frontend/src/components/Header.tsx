import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Header.css';

// Icons - Using simple emojis for MVP, replace with proper icon library later
const LocationIcon = () => <span>📍</span>;
const ProfileIcon = () => <span>👤</span>;

interface HeaderProps {
  // Header is now just the navigation bar - no search props needed
}

const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();

  return (
    <header className="header">
      {/* Top Bar */}
      <div className="header-top">
        {/* Location Section - Left */}
        <div className="location-section">
          <LocationIcon />
          <div className="location-text">
            <p>2 Khayaban-e-Seher</p>
          </div>
        </div>
        
        {/* Brand Section - Center */}
        <div className="brand-section">
          <h1 className="brand-name">BookForMe</h1>
        </div>
        
        {/* Profile Section - Right */}
        <div className="profile-section">
          <ProfileIcon />
          <span className="profile-text">Profile</span>
        </div>
      </div>

      {/* Navigation Tabs - Desktop Only */}
      <div className="navigation-tabs">
        <Link to="/" className={`nav-tab ${location.pathname === '/' ? 'active' : ''}`}>
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/chat" className={`nav-tab ${location.pathname === '/chat' ? 'active' : ''}`}>
          <span>💬</span>
          <span>Chat</span>
        </Link>
        <Link to="/notifications" className={`nav-tab ${location.pathname === '/notifications' ? 'active' : ''}`}>
          <span>🔔</span>
          <span>Notifications</span>
        </Link>
        <Link to="/social" className={`nav-tab ${location.pathname === '/social' ? 'active' : ''}`}>
          <span>👥</span>
          <span>Social</span>
        </Link>
        <Link to="/profile" className={`nav-tab ${location.pathname === '/profile' ? 'active' : ''}`}>
          <span>👤</span>
          <span>Profile</span>
        </Link>
      </div>

    </header>
  );
};

export default Header;
