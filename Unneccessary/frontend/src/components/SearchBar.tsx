import React from 'react';
import '../styles/SearchBar.css';

// Icons - Using simple emojis for MVP, replace with proper icon library later
const SearchIcon = () => <span>🔍</span>;
const FilterIcon = () => <span>⚙️</span>;

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) => {
  return (
    <div className="search-bar">
      <div className="search-container">
        <form onSubmit={onSearchSubmit} className="search-form">
          <div className="search-input-container">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search for courts, gaming zones, and venues"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            <FilterIcon />
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchBar;
