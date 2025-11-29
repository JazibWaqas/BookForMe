export const COURT_IMAGES = {
  padel: [
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
    'https://images.unsplash.com/photo-1593766787879-e8c78e09cec5?w=800',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  ],
  futsal: [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800',
  ],
};

export const getCourtImage = (category: string, index: number = 0): string => {
  if (category.toLowerCase().includes('padel')) {
    return COURT_IMAGES.padel[index % COURT_IMAGES.padel.length];
  }
  if (category.toLowerCase().includes('futsal')) {
    return COURT_IMAGES.futsal[index % COURT_IMAGES.futsal.length];
  }
  return COURT_IMAGES.padel[0];
};

