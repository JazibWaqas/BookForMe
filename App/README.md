# BookForMe Mobile App (React Native + Expo)

## Overview
This is the React Native mobile application for BookForMe, built with Expo Router and NativeWind (Tailwind CSS).

## Tech Stack
- **React Native** - Mobile framework
- **Expo** - Development platform
- **Expo Router** - File-based navigation
- **NativeWind** - Tailwind CSS for React Native
- **TypeScript** - Type safety
- **Firebase/Firestore** - Real-time database
- **date-fns** - Date utilities

## Project Structure

```
App/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root navigation layout
│   ├── index.tsx                # Entry point (redirects to home)
│   ├── (auth)/                  # Authentication screens
│   │   ├── login.tsx            # Login with role toggle
│   │   └── register.tsx         # Customer registration
│   ├── (tabs)/                  # Main tab navigation
│   │   ├── _layout.tsx          # Bottom tab bar
│   │   ├── home.tsx             # Home screen (Foodpanda-style)
│   │   ├── chatbot.tsx          # AI assistant chat
│   │   ├── social.tsx           # Social hub (forum, matches, leaderboard)
│   │   └── profile.tsx          # User profile & settings
│   ├── vendor/                  # Vendor-related screens
│   │   ├── [id].tsx             # Vendor detail with slot picker
│   │   └── booking.tsx          # Booking & payment flow
│   ├── category/                
│   │   └── [category].tsx       # Category listing with filters
│   ├── vendor-dashboard/        # Vendor management
│   │   ├── index.tsx            # Dashboard overview
│   │   ├── calendar.tsx         # Calendar view of bookings
│   │   └── bookings.tsx         # Manage all bookings
│   └── notifications.tsx        # Notifications screen
│
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   │   ├── Button.tsx           # Styled button with variants
│   │   ├── Card.tsx             # Card container
│   │   ├── Input.tsx            # Form input
│   │   └── Badge.tsx            # Status badges
│   ├── VendorCard.tsx           # Vendor listing card
│   ├── CategoryScroll.tsx       # Horizontal category scroller
│   ├── TimeSlotPicker.tsx       # Date & time slot selector
│   └── QuickActionGrid.tsx      # Quick action buttons
│
├── services/                     # API & Firebase services
│   ├── firebase.ts              # Firestore configuration
│   ├── vendors.ts               # Vendor CRUD operations
│   └── bookings.ts              # Booking operations
│
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All app types
│
├── constants/                    # App constants
│   ├── colors.ts                # Color scheme
│   └── categories.ts            # Category definitions
│
├── utils/                        # Utility functions
├── hooks/                        # Custom React hooks
├── tailwind.config.js           # NativeWind configuration
├── babel.config.js              # Babel with NativeWind plugin
├── global.css                   # Tailwind imports
└── app.json                     # Expo configuration
```

## Key Features

### Customer Flow
1. **Authentication** - Login/Register with role selection
2. **Home Screen** - Foodpanda-style with:
   - Location header
   - Search bar
   - Quick actions (AI Assistant, Find Match, My Bookings)
   - Horizontal category scroll
   - Trending venues with real Firestore data
   - Upcoming bookings
3. **Category Listing** - Filterable venue list with sidebar filters
4. **Vendor Detail** - Full venue info with:
   - Image slider (placeholder)
   - Ratings & reviews
   - Time slot picker with availability
   - Amenities tabs
5. **Booking Flow** - Complete booking with:
   - Customer details form
   - Payment summary
   - Payment method selection
6. **AI Chatbot** - Conversational assistant
7. **Social Hub** - Forum, matches, chats, leaderboard
8. **Profile** - User info, booking history, settings

### Vendor Flow
1. **Dashboard** - Analytics & recent activity
2. **Calendar** - Visual booking calendar
3. **Bookings** - Manage all bookings with filters

## Navigation Structure

```
Index (/) → Redirects to Home
│
├── (auth)/
│   ├── login
│   └── register
│
└── (tabs)/                     # Bottom tabs
    ├── home                    # Main entry
    ├── chatbot
    ├── social
    └── profile
    
    From home →
    ├── /category/[category]    # Sports, gaming, etc.
    │   └── /vendor/[id]        # Vendor detail
    │       └── /vendor/booking # Booking flow
    │
    └── /notifications          # Notifications list
    
    Vendor Dashboard →
    └── /vendor-dashboard/
        ├── index               # Overview
        ├── calendar            # Calendar view
        └── bookings            # Manage bookings
```

## Firestore Integration

### Collections
- **vendors** - Business information, ratings, prices
- **bookings** - Customer bookings with status
- **slots** - Available time slots
- **services** - Service offerings

### Services
- `getVendors()` - Fetch all vendors
- `getSportsVendors()` - Filter sports courts (Paddle, Futsal)
- `getVendorById(id)` - Single vendor details
- `getAvailableSlots(vendorId, date)` - Check availability
- `createBooking(data)` - Create new booking

## Styling with NativeWind

Uses Tailwind utility classes:
```tsx
<View className="flex-1 bg-[#1a1a1a] px-5 py-5">
  <Text className="text-lg font-semibold text-gray-100">Title</Text>
</View>
```

### Design System
- **Background**: `bg-[#1a1a1a]`, `bg-[#1f1f1f]`
- **Borders**: `border-2 border-gray-600 border-dashed`
- **Text**: `text-gray-100`, `text-gray-400`, `text-gray-500`
- **Primary Color**: `text-primary` (#4ade80 - green)
- **Secondary Color**: `text-secondary` (#fbbf24 - yellow)

## Running the App

### Development
```bash
cd App
npm start
```
Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### Build for Production
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Environment Setup

No environment variables needed for basic functionality. Firebase config is in `services/firebase.ts`.

For production:
- Set up Expo EAS
- Configure app signing
- Add proper Firebase credentials

## Current Focus: Sports Courts

The app is currently optimized for Sports Courts (Paddle, Futsal). The home screen filters to show only sports venues using:
```typescript
const vendors = await getSportsVendors(); // Filters by category
```

## Next Steps

1. **Authentication** - Implement real auth (currently placeholder)
2. **Slot Management** - Load real slots from Firestore
3. **Payment Integration** - Add payment gateway
4. **Push Notifications** - Expo notifications
5. **Image Upload** - Vendor images
6. **Reviews** - Rating system
7. **Real-time Updates** - Firestore snapshots
8. **Offline Support** - AsyncStorage caching

## Development Notes

- All screens use dark theme (#1a1a1a)
- Follows wireframe designs from `wireframes/` folder
- Components are modular and reusable
- Uses TypeScript for type safety
- Real Firestore data integration ready
- Placeholder images used (can be replaced)

## Troubleshooting

**Metro bundler errors:**
```bash
npm start -- --reset-cache
```

**NativeWind not working:**
```bash
rm -rf node_modules
npm install
npm start -- --reset-cache
```

**Navigation issues:**
```bash
# Check that Expo Router is properly configured in app.json
```

## Contributing

Follow existing patterns:
- Use NativeWind for styling
- Keep components in `components/`
- Use Expo Router conventions
- Type everything with TypeScript
- Follow the wireframe designs

---

**Built with ❤️ for BookForMe**

