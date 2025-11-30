# BookForMe - Development Guide

## Project Overview

**BookForMe** is a dual-app sports booking platform for Pakistan, consisting of a **Customer App** and a **Vendor App**. The platform enables users to book sports courts (Padel, Tennis, Badminton, Cricket, Football, Squash) with an AI-powered natural language search, screenshot-based payments, and social features.

---

## Core Concept

### Unique Features
1. **Dual Search**: Traditional filters + AI natural language search
2. **Screenshot Payments**: Users upload payment screenshots, AI verifies them, vendors approve
3. **Optimistic Concurrency**: 10-minute slot locks to prevent double bookings
4. **Social Hub**: Match lobbies, team formation, leaderboards, chat
5. **Bilingual**: Urdu + English support

### Technology Stack
- **Frontend**: React Native (Expo)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI**: WhatsApp Business API + GPT-4 for natural language processing
- **Payments**: Screenshot-based (JazzCash, EasyPaisa, Bank Transfer)

---

## Design Philosophy

### UI/UX Principles
1. **Clean & Professional**: No unnecessary emojis in core interfaces
2. **Intuitive Navigation**: Everything accessible within 2-3 taps
3. **Visual Clarity**: Color-coded status (green = available, red = booked, yellow = locked)
4. **Mobile-First**: Optimized for Samsung S22 Ultra and similar devices
5. **Dark Theme**: Primary green (#4ADE80), dark backgrounds, high contrast

### Design Inspiration
- **Booking Flow**: Inspired by Airbnb (visual calendar, clear pricing)
- **AI Chat**: ChatGPT-style interface (clean, alternating backgrounds, no emojis)
- **Social Feed**: Facebook-style forum (posts, likes, comments)
- **Matches**: Tinder-style cards (swipeable, visual)

---

## Current Implementation Status

### ✅ Completed Features

#### 1. Customer App - Core Booking Flow
- **Home Screen**
  - Search bar with filters (sport, location, date, price)
  - Featured courts carousel
  - Quick actions (My Bookings, Notifications)
  - Category chips (Padel, Tennis, etc.)
  
- **Vendor Detail Page**
  - Image slider with pagination dots
  - Rating, distance, operating hours
  - **Horizontal date picker** (scroll through 7 days)
  - **Visual slot grid** (4 columns, green dots for available)
  - Amenities, reviews, location tabs
  - Dynamic pricing display
  
- **Booking Confirmation** (`/vendor/booking`)
  - 3-step flow: Customer Details → Payment Upload → Confirmation
  - 10-minute countdown timer (slot lock)
  - Screenshot upload with AI verification states:
    - Uploading → Analyzing → Verified → Rejected
  - Payment breakdown (total, upfront, remaining)
  
- **My Bookings** (`/bookings`)
  - Status tracking: Locked, Pending, Confirmed, Completed, Cancelled
  - Countdown timers for locked slots
  - Upload payment action
  - Tabbed view (Upcoming / Past)

#### 2. Vendor Dashboard
- **Manage Bookings** (`/vendor-dashboard/bookings`)
  - Search and filter bookings
  - Status badges (confirmed, pending, cancelled)
  - Tappable cards → detailed view
  
- **Booking Detail Screen** (`/vendor-dashboard/booking-detail`)
  - Customer information
  - Payment screenshot viewer (tap to zoom full-screen)
  - AI verification status display
  - Payment breakdown (upfront/remaining)
  - Approve/Reject actions

#### 3. Social Hub (`/social`)
- **Forum Tab**
  - Create post with photo/location options
  - Posts feed (avatar, name, timestamp, content)
  - Like, Comment, Share actions
  - Like counter and comment count
  
- **Matches Tab**
  - Search + "Create Match" button
  - Filters: All, Casual, Ranked, Today, Tomorrow
  - Match cards showing:
    - Sport, type badge (CASUAL/RANKED)
    - Date, time, location
    - Player count (2/4)
    - Host avatar + name
    - "Join Match" button
  
- **Chats Tab**
  - WhatsApp-style chat list
  - Online indicators (green dot)
  - Unread badges
  - Last message preview
  
- **Leaderboard Tab**
  - Top 3 podium (gold/silver/bronze medals)
  - Rank badges, avatars, points
  - Win rate percentage
  - Sport filters

#### 4. AI Search Assistant (`/chatbot`)
- ChatGPT-inspired interface
- Clean empty state with "AI" logo
- Example prompts (tappable):
  - "Find the cheapest court available right now"
  - "Show me the closest padel courts"
  - "Tennis courts open tomorrow evening"
  - "Best rated badminton courts in DHA"
- Alternating message backgrounds (bot = gray, user = white)
- Avatar badges ("AI" / "You")
- Send button inside input field
- Disclaimer: "AI can make mistakes. Verify court details before booking."

#### 5. Components
- **AvailabilityCalendar** (`/components/AvailabilityCalendar.tsx`)
  - Visual grid layout (2 columns)
  - Color-coded slots (green/red/yellow/blue)
  - Peak pricing badges
  - Multi-slot selection
  - Real-time price calculation
  - Legend for slot statuses

---

## Database Schema (Firestore)

### Collections Needed

```typescript
// Users Collection
users/ {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'vendor';
  preferredSports: string[];
  location: { lat: number; lng: number };
  createdAt: Timestamp;
}

// Vendors Collection
vendors/ {
  id: string;
  businessName: string;
  category: string; // 'Padel', 'Tennis', etc.
  location: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  priceRange: string;
  amenities: string[];
  operatingHours: { open: string; close: string };
  images: string[];
  description: string;
  ownerId: string;
}

// Slots Collection
slots/ {
  id: string; // "vendor123_court1_2024-11-30_06:00"
  vendorId: string;
  courtId: string;
  date: string; // "2024-11-30"
  startTime: string; // "06:00"
  endTime: string; // "07:00"
  status: 'available' | 'booked' | 'locked';
  price: number;
  isPeak: boolean;
  
  // If locked
  lockedBy?: string; // userId
  lockedAt?: Timestamp;
  lockedUntil?: Timestamp; // 10 min from lockedAt
  
  // If booked
  bookingId?: string;
  bookedBy?: string;
  bookedAt?: Timestamp;
}

// Bookings Collection
bookings/ {
  id: string;
  userId: string;
  vendorId: string;
  slotIds: string[];
  
  // Customer details
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  
  // Payment
  paymentScreenshot?: string; // Storage URL
  paymentMethod: 'JazzCash' | 'EasyPaisa' | 'Bank Transfer';
  aiVerificationStatus: 'pending' | 'verified' | 'rejected';
  totalAmount: number;
  upfrontAmount: number;
  remainingAmount: number;
  
  // Status
  status: 'locked' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
  
  // Timestamps
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  completedAt?: Timestamp;
}

// Pricing Rules Collection
pricingRules/ {
  vendorId: string;
  basePrice: number;
  peakMultiplier: number; // 1.5
  peakHours: {
    morning: { start: "06:00", end: "09:00" };
    evening: { start: "18:00", end: "22:00" };
  };
}

// Social - Posts
posts/ {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  likes: number;
  comments: number;
  createdAt: Timestamp;
}

// Social - Matches
matches/ {
  id: string;
  sport: string;
  type: 'casual' | 'ranked';
  date: string;
  time: string;
  location: string;
  players: string[]; // userIds
  maxPlayers: number;
  hostId: string;
  status: 'open' | 'full' | 'completed';
}

// Social - Leaderboard
leaderboard/ {
  userId: string;
  name: string;
  avatar: string;
  sport: string;
  points: number;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}
```

---

## What's Left to Build

### Phase 1: Backend Integration (HIGH PRIORITY)
1. **Firebase Setup**
   - Initialize Firestore
   - Set up Authentication (Phone + Email)
   - Configure Storage for payment screenshots
   
2. **Real Data Integration**
   - Replace mock data with Firestore queries
   - Implement real-time listeners for slot updates
   - Add user authentication flow
   
3. **Slot Locking System**
   - Implement 10-minute countdown with Firestore transactions
   - Auto-release expired locks (Cloud Function)
   - Prevent double bookings with optimistic locking

### Phase 2: AI Integration
1. **WhatsApp Business API**
   - Set up webhook for incoming messages
   - Implement GPT-4 integration for NLU
   - Parse user queries → Firestore queries
   
2. **Screenshot Verification**
   - OCR integration (Google Vision API)
   - Extract amount, date, transaction ID
   - Match against booking details
   
3. **AI Chat in App**
   - Connect chatbot to actual search logic
   - Return real court results
   - Enable booking directly from chat

### Phase 3: Notifications
1. **Push Notifications** (Expo Notifications)
   - Booking confirmed
   - Payment pending
   - Slot reminder (2 hours before)
   - Match invites
   
2. **In-App Notifications**
   - Notification center
   - Badge counts
   - Real-time updates

### Phase 4: Social Features (Detailed)
1. **Forum**
   - Comment system (nested replies)
   - Like/unlike functionality
   - Share to WhatsApp
   - Report/block users
   
2. **Matches**
   - Create match flow (sport, date, time, location)
   - Join/leave match
   - Match chat
   - Match completion + rating
   
3. **Chats**
   - Individual chat screens
   - Real-time messaging (Firestore)
   - Group chats
   - Media sharing
   
4. **Leaderboard**
   - Elo rating system
   - Sport-specific rankings
   - Weekly/monthly/all-time views
   - Player profiles

### Phase 5: Vendor App Features
1. **Calendar Management**
   - Visual calendar to block/unblock slots
   - Bulk pricing updates
   - Peak hour configuration
   
2. **Analytics Dashboard**
   - Revenue charts
   - Booking trends
   - Popular time slots
   - Customer insights
   
3. **Court Management**
   - Add/edit courts
   - Upload photos
   - Set amenities
   - Operating hours

### Phase 6: Advanced Features
1. **Team Formation**
   - Create teams
   - Team rankings
   - Team vs team matches
   
2. **Tournaments**
   - Bracket system
   - Registration
   - Live scores
   
3. **Coaching**
   - Coach profiles
   - Booking coaching sessions
   - Video lessons
   
4. **Equipment Rental**
   - Rackets, balls, shoes
   - Add to booking
   - Inventory management

---

## UI/UX Guidelines

### Color Palette
```typescript
COLORS = {
  primary: '#4ADE80',        // Green
  background: '#0A0A0A',     // Dark
  backgroundLight: '#1A1A1A',
  surface: '#2A2A2A',
  text: '#E5E5E5',
  textDark: '#0A0A0A',
  textMuted: '#A3A3A3',
  textSecondary: '#D4D4D4',
  border: '#3A3A3A',
  success: '#4ADE80',
  error: '#EF4444',
  warning: '#F59E0B',
}
```

### Typography
- **Headers**: 18-24px, weight 600-700
- **Body**: 14-15px, weight 400-500
- **Captions**: 11-13px, weight 400-600
- **Line Height**: 1.4-1.5x font size

### Spacing
- **Padding**: 12px, 16px, 20px
- **Gaps**: 8px, 12px, 16px
- **Border Radius**: 8px (cards), 12px (buttons), 20px (pills)

### Components
- **Cards**: `backgroundColor: surface`, `borderRadius: 12`, `padding: 16`
- **Buttons**: `borderRadius: 8`, `paddingVertical: 12`, `paddingHorizontal: 20`
- **Inputs**: `borderWidth: 1`, `borderColor: border`, `borderRadius: 8`

### Avoid
- ❌ Emojis in professional interfaces (AI chat, booking flow)
- ❌ Cluttered layouts
- ❌ Inconsistent spacing
- ❌ Low contrast text
- ❌ Tiny touch targets (<44px)

---

## Development Workflow

### When Adding Features
1. **Design First**: Sketch the UI, consider user flow
2. **Component Reuse**: Use existing Card, Button, Input components
3. **Type Safety**: Define TypeScript interfaces for all data
4. **Mock Data**: Start with hardcoded data, then connect to Firebase
5. **Test on Device**: Always test on actual device (Samsung S22 Ultra)

### File Structure
```
App/
├── app/
│   ├── (tabs)/          # Bottom tab screens
│   ├── vendor/          # Vendor detail, booking
│   ├── vendor-dashboard/  # Vendor app screens
│   ├── bookings/        # My bookings
│   └── payment/         # Payment upload
├── components/
│   ├── ui/              # Reusable UI components
│   └── AvailabilityCalendar.tsx
├── constants/
│   ├── colors.ts
│   └── images.ts
├── services/
│   └── vendors.ts       # API calls (will be Firebase)
└── types/
    └── index.ts         # TypeScript types
```

### Naming Conventions
- **Components**: PascalCase (`AvailabilityCalendar.tsx`)
- **Screens**: PascalCase with "Screen" suffix (`VendorDetailScreen`)
- **Variables**: camelCase (`selectedDate`, `handleBooking`)
- **Constants**: UPPER_SNAKE_CASE (`COLORS`, `API_URL`)

---

## Key User Flows

### 1. Booking a Court
```
Home → Search/Browse → Vendor Detail → Select Date → Select Slot(s) 
→ Confirm Booking → Enter Details → Upload Payment → Wait for Approval 
→ Booking Confirmed
```

### 2. Vendor Approving Booking
```
Dashboard → Manage Bookings → Tap Booking → View Payment Screenshot 
→ Verify Details → Approve/Reject → Customer Notified
```

### 3. AI Search
```
AI Tab → Type Query ("cheapest court near me") → AI Returns Results 
→ Tap Result → Vendor Detail → Book
```

### 4. Joining a Match
```
Social Tab → Matches → Filter (Casual/Ranked) → Tap Match → Join 
→ Match Chat → Play → Rate Players
```

---

## Testing Checklist

### Before Each Release
- [ ] All screens load without errors
- [ ] Navigation works (back buttons, tabs)
- [ ] Forms validate input correctly
- [ ] Images load properly
- [ ] Countdown timers work
- [ ] Slot selection updates price
- [ ] Payment upload shows preview
- [ ] Status badges show correct colors
- [ ] Search filters work
- [ ] AI chat responds
- [ ] Social features (like, comment) work
- [ ] Leaderboard sorts correctly

### Device Testing
- [ ] Samsung S22 Ultra (primary)
- [ ] iPhone 13 Pro
- [ ] Tablet (iPad)
- [ ] Different screen sizes

---

## Common Patterns

### Fetching Data
```typescript
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    const result = await getDataFromFirestore();
    setData(result);
    setLoading(false);
  };
  fetchData();
}, []);
```

### Handling User Actions
```typescript
const handleAction = async () => {
  try {
    setLoading(true);
    await performAction();
    // Show success message
  } catch (error) {
    // Show error message
  } finally {
    setLoading(false);
  }
};
```

### Navigation
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/path/to/screen');
router.back();
```

---

## Performance Optimization

### Best Practices
1. **Lazy Load Images**: Use `resizeMode="cover"` and proper dimensions
2. **Virtualize Lists**: Use `FlatList` for long lists, not `ScrollView`
3. **Memoize Components**: Use `React.memo` for expensive renders
4. **Debounce Search**: Wait 300ms after user stops typing
5. **Cache Data**: Store frequently accessed data in AsyncStorage

### Avoid
- ❌ Rendering 100+ items in ScrollView
- ❌ Heavy computations in render
- ❌ Unnecessary re-renders
- ❌ Large uncompressed images

---

## Deployment

### Customer App
1. Build: `eas build --platform android`
2. Submit to Google Play Store
3. Enable OTA updates via Expo

### Vendor App
1. Separate build with different bundle ID
2. Submit to Google Play Store
3. Restrict access to verified vendors

---

## Support & Maintenance

### Monitoring
- Firebase Analytics for user behavior
- Crashlytics for error tracking
- Performance monitoring

### Updates
- Weekly bug fixes
- Monthly feature releases
- Quarterly major updates

---

## Contact & Resources

- **Project Repository**: GitHub (private)
- **Design Files**: Figma (link TBD)
- **API Documentation**: Firebase docs
- **Team Communication**: Slack/Discord

---

**Last Updated**: November 30, 2024  
**Version**: 1.0.0-beta  
**Status**: Active Development
