# Neighborhood-Aware Backend

A comprehensive Firebase-based backend for the Neighborhood-Aware AI App, providing authentication, complaint management, and real-time notifications.

### 🚀 Features

- **Firebase Authentication**: Email/password and anonymous sign-in
- **Firestore Database**: Real-time complaint and alert storage
- **Cloud Functions**: Automated complaint routing and AI classification
- **REST API**: Express.js server with comprehensive endpoints
- **Security**: Firestore security rules and authentication middleware
- **Real-time Updates**: Live complaint status tracking

## 📋 Prerequisites

- Node.js (v18 or later)
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Firestore and Functions enabled

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

The Firebase configuration is already set up in `src/firebaseConfig.js` with your project credentials.

### 3. Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:8081
JWT_SECRET=your-jwt-secret-key-here
CORS_ORIGIN=http://localhost:8081
LOG_LEVEL=debug
```

### 4. Deploy Firebase Functions

```bash
# Deploy functions and security rules
npm run deploy

# Or deploy separately
npm run deploy:functions
npm run deploy:rules
```

### 5. Start the Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "uid": "user123",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}
```

#### POST `/auth/signin`
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST `/auth/anonymous`
Sign in anonymously.

#### POST `/auth/signout`
Sign out (requires authentication).

#### POST `/auth/reset-password`
Send password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Complaints Endpoints

#### POST `/complaints`
Create a new complaint (requires authentication).

**Request Body:**
```json
{
  "text": "Broken streetlight on Main Street",
  "category": "streetlight",
  "location": {
    "lat": 24.8607,
    "lng": 67.0011
  },
  "images": ["image1.jpg", "image2.jpg"]
}
```

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

#### GET `/complaints`
Get all complaints (requires authentication).

**Query Parameters:**
- `category`: Filter by category
- `status`: Filter by status
- `limit`: Limit number of results (default: 50)

#### GET `/complaints/user`
Get complaints by current user (requires authentication).

#### GET `/complaints/:id`
Get specific complaint by ID (requires authentication).

#### PUT `/complaints/:id`
Update complaint status (requires authentication).

**Request Body:**
```json
{
  "status": "resolved",
  "notes": "Issue has been fixed"
}
```

#### DELETE `/complaints/:id`
Delete complaint (requires authentication).

### Alerts Endpoints

#### POST `/alerts`
Create a new alert (requires authentication).

**Request Body:**
```json
{
  "type": "area_notification",
  "title": "Water Supply Issue",
  "message": "Water supply will be interrupted tomorrow",
  "location": {
    "lat": 24.8607,
    "lng": 67.0011
  },
  "radius": 1000
}
```

#### GET `/alerts`
Get all alerts (requires authentication).

### User Profile Endpoints

#### GET `/user/profile`
Get current user profile (requires authentication).

## 🔧 Firebase Functions

### `routeComplaint`
Automatically triggered when a new complaint is created. Routes complaints to appropriate departments based on category.

**Categories and Departments:**
- `streetlight` → KMC (Karachi Metropolitan Corporation)
- `water` → KW&SB (Karachi Water & Sewerage Board)
- `garbage` → KMC (Karachi Metropolitan Corporation)
- `road` → KMC (Karachi Metropolitan Corporation)
- `sewage` → KW&SB (Karachi Water & Sewerage Board)
- `noise` → Police Department
- `security` → Police Department

### `classifyComplaint`
Classifies complaint text using keyword matching.

**Request:**
```json
{
  "text": "There's a broken streetlight on my street"
}
```

**Response:**
```json
{
  "category": "streetlight",
  "confidence": 0.8
}
```

### `getComplaintStats`
Returns complaint statistics.

### `sendAreaNotification`
Sends notifications to users in a specific area.

### `updateComplaintStatus`
Updates complaint status with notes.

## 🔒 Security Rules

Firestore security rules are configured in `firestore.rules`:

- Users can only read/write their own complaints
- Alerts are readable by all authenticated users
- Admin users have additional privileges
- Input validation for all data

## 📊 Database Schema

### Complaints Collection
```javascript
{
  id: "complaint123",
  text: "Broken streetlight",
  category: "streetlight",
  location: { lat: 24.8607, lng: 67.0011 },
  userId: "user123",
  status: "pending", // pending, processing, routed, resolved, error
  department: "KMC",
  priority: "high",
  images: ["image1.jpg"],
  timestamp: "2025-08-05T17:00:00Z",
  createdAt: "2025-08-05T17:00:00Z",
  updatedAt: "2025-08-05T17:00:00Z"
}
```

### Alerts Collection
```javascript
{
  id: "alert123",
  type: "new_complaint", // new_complaint, area_notification, status_update
  title: "New streetlight complaint",
  message: "A streetlight issue has been reported",
  location: { lat: 24.8607, lng: 67.0011 },
  radius: 1000,
  complaintId: "complaint123",
  category: "streetlight",
  priority: "high",
  createdAt: "2025-08-05T17:00:00Z"
}
```

## 🚀 Deployment

### Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only security rules
firebase deploy --only firestore:rules
```

### Deploy Backend Server

The Express.js server can be deployed to:
- Heroku
- Google Cloud Run
- AWS Lambda
- Vercel

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## 📝 Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run tests
- `npm run lint`: Run ESLint
- `npm run deploy`: Deploy to Firebase
- `npm run deploy:functions`: Deploy only functions
- `npm run deploy:rules`: Deploy only security rules

## 🔗 Integration with Frontend

The backend is designed to work seamlessly with the React Native/Expo frontend. The frontend should:

1. Use Firebase Authentication for user management
2. Call the REST API endpoints for complaint operations
3. Listen to Firestore real-time updates for live data
4. Use Firebase Functions for AI classification

## 🆘 Troubleshooting

### Common Issues

1. **Firebase Functions not deploying**: Ensure you're logged in with `firebase login`
2. **Authentication errors**: Check Firebase project configuration
3. **CORS errors**: Verify `FRONTEND_URL` in environment variables
4. **Permission denied**: Check Firestore security rules

### Logs

```bash
# View Firebase Functions logs
firebase functions:log

# View real-time logs
firebase functions:log --only routeComplaint
```

## 📞 Support

For issues and questions:
1. Check the Firebase console for function logs
2. Verify environment variables
3. Test API endpoints with Postman
4. Check Firestore security rules

## 🎯 Next Steps

1. **AI Integration**: Add Gemini API for advanced complaint classification
2. **WhatsApp Integration**: Add Twilio for automated notifications
3. **Analytics**: Implement complaint analytics and reporting
4. **Mobile Push Notifications**: Add FCM for real-time alerts
5. **Image Processing**: Add image analysis for complaint validation 