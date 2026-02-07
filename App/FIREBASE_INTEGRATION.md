# Firebase Integration Guide

## Overview
The frontend (Expo app) is now fully connected to Firebase Firestore and Firebase Authentication. All user data, login information, vendors, bookings, and slots are stored in Firebase and synchronized with the backend.

## Firebase Configuration

### Project Details
- **Project ID**: `bookforme-c93a6`
- **Auth Domain**: `bookforme-c93a6.firebaseapp.com`
- **Storage Bucket**: `bookforme-c93a6.appspot.com`

### Configuration File
The Firebase configuration is located in `App/services/firebase.ts`

## Authentication

### How It Works
1. **Registration**: Users can register with email/password
   - Creates Firebase Auth user
   - Registers with backend API (if available)
   - Creates user document in Firestore `users` collection
   - For vendors: Creates vendor document in Firestore `vendors` collection

2. **Login**: Users can login with email/password
   - Authenticates with backend API (preferred)
   - Falls back to Firebase Auth if backend unavailable
   - Retrieves user data from Firestore

3. **Token Management**: JWT tokens are stored in AsyncStorage for backend API calls

### Auth Service
Location: `App/services/auth.ts`

Key methods:
- `register()` - Register new user
- `login()` - Login with email/password
- `loginWithPhone()` - Login with phone number
- `logout()` - Sign out user
- `getCurrentUser()` - Get current authenticated user
- `createVendorProfile()` - Create vendor profile in Firestore

## Data Collections

### Users Collection (`users`)
Stores user account information:
```typescript
{
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'vendor';
  vendor_id?: string;
  created_at: string;
}
```

### Vendors Collection (`vendors`)
Stores vendor/business information:
```typescript
{
  id: string;
  business_name: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  whatsapp_connected: boolean;
  sheets_connected: boolean;
  // ... other fields
}
```

### Bookings Collection (`bookings`)
Stores booking information:
```typescript
{
  id: string;
  slot_id: string;
  vendor_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  // ... other fields
}
```

### Slots Collection (`slots`)
Stores available time slots:
```typescript
{
  id: string;
  vendor_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
}
```

## Backend API Integration

### API Base URL
The backend API URL is configured in `App/services/auth.ts`:
- Development: `http://localhost:8000`
- Production: Update to your production URL

**Important**: For testing on a physical device, change `localhost` to your computer's IP address (e.g., `http://192.168.1.100:8000`)

### API Endpoints Used
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/login/phone` - Phone login
- `GET /api/auth/me` - Get current user (requires token)

## Data Flow

### Registration Flow
1. User fills registration form
2. Frontend calls `authService.register()`
3. Creates Firebase Auth user
4. Calls backend API `/api/auth/register`
5. Backend creates user in Firestore `users` collection
6. If vendor: Creates vendor document in Firestore `vendors` collection
7. Stores token and user data in AsyncStorage
8. Navigates to appropriate screen

### Login Flow
1. User enters email/password
2. Frontend calls `authService.login()`
3. Calls backend API `/api/auth/login`
4. Backend verifies credentials and returns JWT token
5. Stores token and user data in AsyncStorage
6. Navigates to home or vendor dashboard

### Data Fetching
- **Vendors**: Fetched directly from Firestore `vendors` collection
- **Bookings**: Fetched from Firestore `bookings` collection
- **Slots**: Fetched from Firestore `slots` collection

All data operations use the Firebase SDK directly, ensuring real-time synchronization.

## Security Rules

Make sure your Firestore security rules allow:
- Users can read their own user document
- Users can read vendors and slots
- Users can create bookings
- Vendors can read/write their own vendor document
- Vendors can read/write their own bookings

Example rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /vendors/{vendorId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.user_id == request.auth.uid || 
         !exists(/databases/$(database)/documents/vendors/$(vendorId)));
    }
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.customer_phone == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.phone ||
         resource.data.vendor_id == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.vendor_id);
    }
    match /slots/{slotId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Testing

1. **Test Registration**:
   - Open the app
   - Navigate to Register
   - Fill in all fields
   - Submit and verify user is created in Firestore

2. **Test Login**:
   - Use registered credentials
   - Verify token is stored
   - Verify user data is retrieved

3. **Test Data Fetching**:
   - Check vendors are loaded from Firestore
   - Verify bookings are synced
   - Test slot availability

## Troubleshooting

### Backend API Not Available
The app will fall back to Firebase Auth only if the backend API is unavailable. User data will still be stored in Firestore.

### Token Issues
- Check AsyncStorage for `authToken`
- Verify token is sent in API requests
- Check backend logs for authentication errors

### Firestore Connection Issues
- Verify Firebase project ID matches in both frontend and backend
- Check Firestore security rules
- Verify network connectivity

## Next Steps

1. Update backend API URL for production
2. Configure Firestore security rules
3. Set up Firebase Cloud Messaging for notifications
4. Add offline persistence for better UX
5. Implement real-time listeners for live data updates

