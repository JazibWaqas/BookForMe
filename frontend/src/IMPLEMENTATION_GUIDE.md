# BookForMe - Implementation Guide for Recommended Features

This guide provides step-by-step instructions for implementing the suggested features from ENHANCEMENTS.md.

---

## 1. Create Post Modal

### What to Build
A modal dialog that allows users to create new posts in the community feed with images, text, and tags.

### Implementation Steps

**Step 1: Create the Component**
```tsx
// /components/CreatePostModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImagePlus, X } from 'lucide-react';

export function CreatePostModal({ open, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('experience');
  const [image, setImage] = useState(null);

  const handleSubmit = () => {
    onSubmit({ content, postType, image });
    setContent('');
    setPostType('experience');
    setImage(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <Select value={postType} onValueChange={setPostType}>
            <SelectTrigger>
              <SelectValue placeholder="Post Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Match Invitation</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
              <SelectItem value="promo">Promotion</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Image Upload */}
          <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="image-upload"
              onChange={(e) => setImage(e.target.files[0])}
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <ImagePlus className="mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload image
              </p>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!content}>Post</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Add to SocialScreen**
```tsx
// In SocialScreen.tsx
import { CreatePostModal } from './CreatePostModal';

const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

const handleCreatePost = (postData) => {
  // Send to API
  // api.createPost(postData);
  console.log('Creating post:', postData);
};

// Replace the Create Post button
<Button onClick={() => setIsCreateModalOpen(true)}>
  <Plus size={18} />
  Create Post
</Button>

// Add modal
<CreatePostModal
  open={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onSubmit={handleCreatePost}
/>
```

---

## 2. Real-Time Messaging System

### What to Build
Live chat functionality using Supabase Realtime for instant messaging between users.

### Implementation Steps

**Step 1: Set up Supabase Realtime**
```tsx
// /hooks/useRealtimeMessages.ts
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase'; // You'll need to set this up

export function useRealtimeMessages(chatId: string) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId]);

  const sendMessage = async (content: string) => {
    await supabase.from('messages').insert({
      chat_id: chatId,
      content,
      user_id: 'current-user-id', // Get from auth
      created_at: new Date().toISOString()
    });
  };

  return { messages, sendMessage };
}
```

**Step 2: Create Chat Interface**
```tsx
// /components/ChatScreen.tsx
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';

export function ChatScreen({ chatId, onBack }) {
  const { messages, sendMessage } = useRealtimeMessages(chatId);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.user_id === 'current-user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`max-w-[70%] rounded-lg p-3 ${
              msg.user_id === 'current-user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <Button onClick={handleSend} size="icon">
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Push Notifications

### What to Build
Browser notifications for important events like bookings, messages, and match invites.

### Implementation Steps

**Step 1: Request Permission**
```tsx
// /utils/notifications.ts
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/badge.png',
      ...options
    });
  }
};
```

**Step 2: Integrate with App**
```tsx
// In App.tsx or a notifications hook
useEffect(() => {
  requestNotificationPermission();
}, []);

// When receiving a new message/booking
showNotification('New Booking Confirmed', {
  body: 'Your booking at Elite Sports Complex is confirmed',
  tag: 'booking-123',
  requireInteraction: true
});
```

---

## 4. Advanced Search & Filters

### What to Build
Comprehensive search with multiple filters for finding the perfect venue.

### Implementation Steps

**Step 1: Create Filter Component**
```tsx
// /components/VenueFilters.tsx
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

export function VenueFilters({ filters, onChange }) {
  return (
    <Card className="dark:bg-gray-800">
      <CardContent className="p-6 space-y-6">
        {/* Price Range */}
        <div>
          <Label>Price Range (PKR/hour)</Label>
          <Slider
            min={0}
            max={10000}
            step={100}
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={([min, max]) => 
              onChange({ ...filters, minPrice: min, maxPrice: max })
            }
          />
          <div className="flex justify-between text-sm mt-2">
            <span>Rs. {filters.minPrice}</span>
            <span>Rs. {filters.maxPrice}</span>
          </div>
        </div>

        {/* Location */}
        <div>
          <Label>Location</Label>
          <Select 
            value={filters.location} 
            onValueChange={(loc) => onChange({ ...filters, location: loc })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clifton">Clifton</SelectItem>
              <SelectItem value="dha">DHA</SelectItem>
              <SelectItem value="gulshan">Gulshan</SelectItem>
              <SelectItem value="north">North Karachi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amenities */}
        <div>
          <Label>Amenities</Label>
          <div className="space-y-2 mt-2">
            {['Parking', 'WiFi', 'AC', 'Changing Rooms'].map((amenity) => (
              <div key={amenity} className="flex items-center">
                <Checkbox
                  id={amenity}
                  checked={filters.amenities.includes(amenity)}
                  onCheckedChange={(checked) => {
                    const newAmenities = checked
                      ? [...filters.amenities, amenity]
                      : filters.amenities.filter(a => a !== amenity);
                    onChange({ ...filters, amenities: newAmenities });
                  }}
                />
                <Label htmlFor={amenity} className="ml-2">{amenity}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <Label>Minimum Rating</Label>
          <div className="flex gap-2 mt-2">
            {[3, 4, 4.5, 5].map((rating) => (
              <Button
                key={rating}
                variant={filters.minRating === rating ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ ...filters, minRating: rating })}
              >
                {rating}+ ⭐
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Integrate with Venues Screen**
```tsx
// In DesktopVenuesScreen.tsx
const [filters, setFilters] = useState({
  minPrice: 0,
  maxPrice: 10000,
  location: null,
  amenities: [],
  minRating: 0
});

// Filter venues based on criteria
const filteredVenues = venues.filter(venue => {
  return (
    venue.price >= filters.minPrice &&
    venue.price <= filters.maxPrice &&
    (!filters.location || venue.location === filters.location) &&
    venue.rating >= filters.minRating &&
    (filters.amenities.length === 0 || 
     filters.amenities.every(a => venue.amenities.includes(a)))
  );
});
```

---

## 5. Profile Photo Upload

### What to Build
Allow users to upload and crop profile pictures.

### Implementation Steps

**Step 1: Add Image Upload Component**
```tsx
// /components/ProfilePhotoUpload.tsx
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Camera } from 'lucide-react';

export function ProfilePhotoUpload({ currentPhoto, onUpload }) {
  const [preview, setPreview] = useState(currentPhoto);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className="w-24 h-24">
        {preview ? (
          <AvatarImage src={preview} />
        ) : (
          <AvatarFallback>JD</AvatarFallback>
        )}
      </Avatar>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="profile-photo"
      />
      <label
        htmlFor="profile-photo"
        className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90"
      >
        <Camera size={16} />
      </label>
    </div>
  );
}
```

---

## 6. Achievement System

### What to Build
Gamification with badges, XP, and levels to encourage engagement.

### Implementation Steps

**Step 1: Define Achievement Schema**
```tsx
// /types/achievements.ts
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  requirement: {
    type: 'bookings' | 'matches' | 'posts' | 'streak';
    count: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-booking',
    title: 'First Timer',
    description: 'Complete your first booking',
    icon: '🎯',
    xp: 100,
    requirement: { type: 'bookings', count: 1 },
    rarity: 'common'
  },
  {
    id: 'sports-enthusiast',
    title: 'Sports Enthusiast',
    description: 'Book 10 sports venues',
    icon: '⚽',
    xp: 500,
    requirement: { type: 'bookings', count: 10 },
    rarity: 'rare'
  },
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Create 25 community posts',
    icon: '🦋',
    xp: 750,
    requirement: { type: 'posts', count: 25 },
    rarity: 'epic'
  }
];
```

**Step 2: Create Achievement Display**
```tsx
// /components/AchievementsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy } from 'lucide-react';
import { Progress } from './ui/progress';

export function AchievementsCard({ userAchievements, userStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ACHIEVEMENTS.map((achievement) => {
          const earned = userAchievements.includes(achievement.id);
          const progress = (userStats[achievement.requirement.type] / 
                           achievement.requirement.count) * 100;

          return (
            <div key={achievement.id} className="flex items-center gap-3">
              <div className={`text-3xl ${!earned && 'grayscale opacity-50'}`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{achievement.title}</h4>
                  <Badge variant={earned ? 'default' : 'secondary'}>
                    {achievement.xp} XP
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {achievement.description}
                </p>
                {!earned && (
                  <Progress value={progress} className="mt-2 h-1" />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

---

## 7. Multi-Language Support

### What to Build
Support for English and Urdu languages with easy switching.

### Implementation Steps

**Step 1: Create Translation Context**
```tsx
// /contexts/LanguageContext.tsx
import { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    home: 'Home',
    community: 'Community',
    profile: 'Profile',
    search: 'Search venues...',
    // ... more translations
  },
  ur: {
    home: 'ہوم',
    community: 'کمیونٹی',
    profile: 'پروفائل',
    search: 'تلاش کریں...',
    // ... more translations
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
```

**Step 2: Use in Components**
```tsx
// In any component
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t, setLanguage } = useLanguage();

  return (
    <div>
      <h1>{t('home')}</h1>
      <button onClick={() => setLanguage('ur')}>اردو</button>
    </div>
  );
}
```

---

## Testing Checklist

For each new feature, ensure:

- [ ] Works in light and dark mode
- [ ] Responsive on mobile (< 640px)
- [ ] Responsive on tablet (640-1023px)
- [ ] Responsive on desktop (≥ 1024px)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Optimistic UI updates where applicable
- [ ] TypeScript types defined
- [ ] API integration ready (even if mocked)

---

## Quick Tips

1. **Always use the theme system:**
   ```tsx
   className="bg-white dark:bg-gray-800"
   ```

2. **Always be responsive:**
   ```tsx
   className="p-4 lg:p-8 grid-cols-1 lg:grid-cols-3"
   ```

3. **Use existing components:**
   - Check `/components/ui/` first
   - Reuse patterns from existing screens
   - Follow the established design system

4. **Keep it accessible:**
   - Add `aria-label` to icon buttons
   - Use semantic HTML
   - Test with keyboard only

5. **Optimize images:**
   - Always use `ImageWithFallback`
   - Use appropriate sizes
   - Lazy load when possible

---

## Need Help?

- **Shadcn UI docs**: https://ui.shadcn.com
- **Tailwind docs**: https://tailwindcss.com/docs
- **Supabase docs**: https://supabase.com/docs
- **React docs**: https://react.dev

Refer to existing components for patterns and best practices!
