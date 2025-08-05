import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FavoriteItem {
  id: string;
  type: 'service' | 'location' | 'listing' | 'post';
  title: string;
  subtitle?: string;
  location?: string;
  addedAt: Date;
  data?: any; // Additional data specific to the item type
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addToFavorites: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  getFavoritesByType: (type: FavoriteItem['type']) => FavoriteItem[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('khi-safe-favorites');
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        // Convert date strings back to Date objects
        const favoritesWithDates = parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
        setFavorites(favoritesWithDates);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save favorites to localStorage
    localStorage.setItem('khi-safe-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (item: Omit<FavoriteItem, 'addedAt'>) => {
    const newItem: FavoriteItem = {
      ...item,
      addedAt: new Date()
    };
    setFavorites(prev => [newItem, ...prev.filter(fav => fav.id !== item.id)]);
  };

  const removeFromFavorites = (id: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  const isFavorite = (id: string) => {
    return favorites.some(fav => fav.id === id);
  };

  const getFavoritesByType = (type: FavoriteItem['type']) => {
    return favorites.filter(fav => fav.type === type);
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoritesByType,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};