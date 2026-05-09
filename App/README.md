# BookForMe Mobile App - React Native + Expo

**Last Updated**: May 9, 2026  
**Status**: Final App Polish on Expo Go; Stable Android Demo Build Next  
**Progress**: Launch QA phase

---

## 🎯 Core Vision

The mobile app provides a **centralized marketplace** for users to browse, search, and book sports courts and services in Karachi. It shares the same Firestore database as the completed WhatsApp/Web Chat AI agent, ensuring real-time availability synchronization.

**Key Features**:
- Browse vendors by category (Padel, Futsal, Cricket, Pickleball)
- Real-time slot availability
- Booking flow with payment upload
- AI-powered search assistant
- Social hub (forum, matches, leaderboard)

---

## ✅ What's Done

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

### AI Agent Integration ✅
- ✅ Booking agent regression/manual testing is passing
- ✅ App/backend share the deployed Render API
- ✅ Agent work is no longer the active focus for this launch session
- ⚠️ OCR amount extraction has a provider/model accuracy caveat; Gemini may be tested as an alternate OCR model

---

## 🚧 Current Launch Focus

### High Priority
1. **Customer App QA**
   - Home/search/category browsing
   - Vendor detail and slot selection
   - Booking lock and payment upload
   - My Bookings and Profile

2. **Vendor Dashboard QA**
   - Dashboard today metrics
   - Booking list and booking detail
   - Calendar/grid operations
   - Approve/reject payment flows
   - Resource, service, and payment account edits

3. **Admin Side QA**
   - Overview
   - Vendor approval/moderation
   - Slot generation
   - Pending payment oversight

4. **Stable Android Demo Build**
   - Keep Expo Go for fast iteration
   - Build an installable Android APK/internal build before the university demo
   - Point the build at `https://bookforme-ie34.onrender.com` so it does not depend on a laptop IP or local Wi-Fi

### Medium Priority
1. **Push Notifications** - booking reminders and payment status updates
2. **Offline/poor-network resilience** - clearer retry states and cached read-only screens
3. **OCR Provider Comparison** - Groq vision vs Gemini on real JazzCash/EasyPaisa/bank screenshots

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
- **API Base URL**: Configured by `EXPO_PUBLIC_API_URL` in `.env`, with fallback logic in `config/api.ts`
- **Current deployed backend**: `https://bookforme-ie34.onrender.com`
- **Local**: `http://localhost:8000` or your computer's LAN IP for physical-device testing
- **Demo recommendation**: use the deployed backend for APK/internal builds to avoid local network surprises

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

1. **Payment OCR**: amount extraction can fail depending on model/screenshot quality; consider Gemini comparison.
2. **Bookings Page**: may take several seconds to reflect payment/upload changes depending on refetch timing.
3. **Slot Selection**: verify UI state stays aligned with backend after lock/payment/cancel paths during final QA.

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

**Last Updated**: May 9, 2026  
**Maintained By**: Mobile App Team
