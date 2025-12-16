# BookForMe Mobile App - React Native + Expo

**Last Updated**: January 15, 2025  
**Status**: Core Features Complete, Social Features In Progress  
**Progress**: ~70% Complete

---

## 🎯 Core Vision

The mobile app provides a **centralized marketplace** for users to browse, search, and book sports courts and services in Karachi. It shares the same Firestore database as the WhatsApp AI agent, ensuring real-time availability synchronization.

**Key Features**:
- Browse vendors by category (Padel, Futsal, Cricket, Pickleball)
- Real-time slot availability
- Booking flow with payment upload
- AI-powered search assistant
- Social hub (forum, matches, leaderboard)

---

## ✅ What's Done (As of January 15, 2025)

### Core Booking Flow ✅
- ✅ Vendor browsing with React Query caching
- ✅ Category-based filtering
- ✅ Search functionality (name, area, address)
- ✅ Vendor detail pages
- ✅ Slot selection with availability display
- ✅ Booking confirmation flow
- ✅ Payment screenshot upload
- ✅ Booking history (My Bookings page)
- ✅ Profile page with stats

### Performance Optimizations ✅
- ✅ In-memory token caching (5 min TTL)
- ✅ React Query for data caching
- ✅ Background refetching (45s interval for slots)
- ✅ Optimistic updates
- ✅ Request deduplication

### UI/UX ✅
- ✅ Dark theme design
- ✅ Safe area handling
- ✅ Keyboard avoidance
- ✅ Loading states and skeletons
- ✅ Error handling

---

## 🚧 What Needs to Be Done

### High Priority
1. **Social Features Backend Integration** (Target: January 25, 2025)
   - Connect forum posts to backend API
   - Implement match creation/joining
   - Connect leaderboard to backend
   - Real-time chat messaging

2. **Push Notifications** (Target: January 30, 2025)
   - Expo Notifications setup
   - Booking reminders
   - Payment status updates
   - Match invitations

### Medium Priority
1. **Image Upload** - Vendor photos and payment screenshots
2. **Offline Support** - AsyncStorage caching
3. **Analytics** - User behavior tracking

---

## 🏗️ Project Structure

```
App/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login, Register
│   ├── (tabs)/            # Home, Chatbot, Social, Profile
│   ├── vendor/             # Vendor detail, Booking flow
│   ├── bookings/           # My Bookings
│   └── vendor-dashboard/   # Vendor management
│
├── components/             # Reusable components
│   ├── ui/                # Base UI (Button, Card, Input, Badge)
│   ├── VendorCard.tsx
│   ├── CategoryScroll.tsx
│   └── TimeSlotPicker.tsx
│
├── services/               # API clients
│   ├── auth.ts            # Authentication
│   ├── vendors.ts         # Vendor queries
│   ├── bookings.ts         # Booking operations
│   └── api.ts             # Axios configuration
│
├── hooks/                  # Custom React hooks
│   └── useQueries.ts      # React Query hooks
│
├── types/                  # TypeScript definitions
│   ├── index.ts
│   └── booking.ts
│
└── constants/              # App constants
    ├── colors.ts
    ├── categories.ts
    └── images.ts
```

---

## 🛠️ Technology Stack

- **Framework**: React Native (Expo)
- **Navigation**: Expo Router (file-based)
- **State Management**: TanStack React Query v5
- **Styling**: StyleSheet (no NativeWind currently)
- **TypeScript**: Full type safety
- **API Client**: Axios with interceptors

---

## 🚀 Development

### Setup
```bash
cd App
npm install
npm start
```

### Run on Device
- **iOS**: Press `i` in terminal or scan QR with Expo Go
- **Android**: Press `a` in terminal or scan QR with Expo Go

### Environment
- **API Base URL**: Configured in `config/api.ts`
- **Backend**: `https://jhat-production.up.railway.app` (production)
- **Local**: `http://localhost:8000` (development)

---

## 📱 Key Screens

### Home (`app/(tabs)/home.tsx`)
- Search bar with real-time filtering
- Category scroll (Browse by Sport)
- Featured vendors by sport
- Quick actions (AI Assistant, My Bookings)

### Vendor Detail (`app/vendor/[id].tsx`)
- Vendor information
- Resource selection (courts)
- Date picker
- Slot grid with availability
- Booking button

### Booking Flow (`app/vendor/booking.tsx`)
- Booking summary
- Payment instructions
- Screenshot upload
- Confirmation

### My Bookings (`app/bookings/index.tsx`)
- Upcoming bookings tab
- Past bookings tab
- Status badges (Pending, Confirmed, Completed)
- Payment upload action

### Profile (`app/(tabs)/profile.tsx`)
- User information
- Booking stats (Upcoming, Completed, Total)
- Recent bookings
- Settings and sign out

---

## 🔑 Key Implementation Details

### React Query Hooks (`hooks/useQueries.ts`)

**Vendor Queries**:
```typescript
const { data: vendors } = useVendors();
const { data: padelVendors } = useVendorsBySport('padel');
const { data: vendor } = useVendor(vendorId);
```

**Slot Queries**:
```typescript
const { data: slots, refetch } = useAvailableSlotsOptimized(vendorId, date);
// Auto-refetches every 45s when no slot is locked
```

**Booking Queries**:
```typescript
const { data: bookings } = useUserBookings();
// Refetches on window focus, 2 min stale time
```

### Token Caching (`config/api.ts`)

In-memory cache reduces AsyncStorage reads:
```typescript
const tokenCache = {
  token: string | null,
  expiresAt: number
};
// Cache TTL: 5 minutes
```

### Performance Optimizations

1. **Token Caching**: In-memory cache (5 min TTL)
2. **React Query**: Automatic caching and deduplication
3. **Smart Polling**: Slots refetch every 45s only when needed
4. **Background Refetch**: Fresh data loads while showing cached data
5. **Optimistic Updates**: UI updates immediately, syncs in background

---

## 🐛 Known Issues

1. **Profile Page**: Slow on first load (partially fixed with async loading)
2. **Bookings Page**: Takes 5-10 seconds to update after payment upload
3. **Slot Selection**: UI state sometimes out of sync with backend

---

## 📚 Additional Documentation

- **Development Guide**: `DEVELOPMENT_GUIDE.md` - Detailed development instructions
- **Backend API**: See `backend/README.md` for API documentation

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Vendor browsing loads correctly
- [ ] Search filters vendors properly
- [ ] Slot selection works
- [ ] Booking flow completes
- [ ] Payment upload succeeds
- [ ] Bookings page shows latest bookings
- [ ] Profile page loads user data

### Performance Testing
- [ ] Home page loads in < 2 seconds
- [ ] Vendor detail loads in < 1 second
- [ ] Slot selection is instant
- [ ] Booking confirmation is fast

---

**Last Updated**: January 15, 2025  
**Maintained By**: Mobile App Team
