# BookForMe - Use Cases & User Flows Documentation

## 1. User Types

### 1.1 Customer/User
- Primary goal: Book sports venues, gaming zones, beach huts
- Features: Browse, search, book, manage bookings, social interactions

### 1.2 Vendor
- Primary goal: Manage business, accept bookings, track revenue
- Features: Dashboard, calendar, booking management, integrations

### 1.3 System Admin (Implicit)
- Primary goal: Platform management, verification, support

---

## 2. Customer Use Cases

### UC-C1: Customer Registration & Onboarding
**Flow:**
1. Landing/Login → Select "Login as USER" → Registration Form
2. Fill personal details (name, email, phone, password)
3. Set preferences (sports, location)
4. Accept terms & privacy
5. Account created → Email verification (optional)
6. Redirect to Customer Home

**Variations:**
- Quick login with Google
- Returning user login

### UC-C2: Browse & Discover Venues
**Flow:**
1. Customer Home → View categories (Sports Courts, Gaming Zones, Beach Huts)
2. Select category → Category Listing page
3. Apply filters (price, amenities, location)
4. View venue cards with ratings, prices
5. Click venue → Vendor Detail page

**Variations:**
- Search by location/name
- View trending venues
- View favorites/saved venues

### UC-C3: Book a Venue
**Flow:**
1. Vendor Detail → Select date from calendar
2. Select available time slot
3. Click "Confirm Booking" → Booking & Payment page
4. Enter customer details (if not saved)
5. Review booking summary
6. Select payment method
7. Confirm & Pay → Booking confirmation
8. Receive notification → View in "My Bookings"

**Variations:**
- Recurring bookings
- Group bookings
- Booking modifications
- Booking cancellations

### UC-C4: AI Assistant Interaction
**Flow:**
1. Customer Home → AI Assistant button
2. AI Chatbot page → Ask Mode
3. Type query: "Find cheapest football turf this weekend in DHA"
4. AI responds with venue recommendations
5. Click "View Slots" → Navigate to Vendor Detail
6. Complete booking flow

**Variations:**
- Agent Mode (AI handles booking automatically)
- FAQ queries
- Booking status checks
- Venue recommendations

### UC-C5: Social Hub Activities
**Flow:**
1. Customer Home → Social Hub
2. **Forum Tab:**
   - View posts → Create post → Get responses
3. **Matches Tab:**
   - View open matches → Join match → Confirm participation
4. **Chats Tab:**
   - View conversations → Send messages → Group chats
5. **Leaderboard Tab:**
   - View rankings → Check own position → View achievements

**Variations:**
- Create match invitation
- Accept/decline match invites
- Forum post interactions (like, comment)

### UC-C6: Manage Profile & Bookings
**Flow:**
1. Customer Home → Profile
2. **Stats Tab:**
   - View booking history, spending, loyalty points
3. **Bookings Tab:**
   - View upcoming bookings → Modify/Cancel
   - View past bookings → Rate/Review
4. **Saved Tab:**
   - View favorite venues → Quick book
5. **Awards Tab:**
   - View badges, achievements, milestones

**Variations:**
- Edit profile information
- Update preferences
- Change password
- Delete account

### UC-C7: Notifications Management
**Flow:**
1. Any page → Notifications icon
2. View notification feed (booking, social, promo)
3. Click notification → Navigate to relevant page
4. Mark as read / Mark all read
5. Take action (Accept match, View booking, etc.)

---

## 3. Vendor Use Cases

### UC-V1: Vendor Registration & Verification
**Flow:**
1. Landing/Login → Select "Login as VENDOR" → Vendor Registration
2. Fill business information (name, category, location)
3. Enter contact details (owner, phone, email)
4. Set operating hours
5. List services offered
6. Upload business documents (verification)
7. Submit application → Await admin approval
8. Approval notification → Account activated

### UC-V2: Vendor Dashboard Overview
**Flow:**
1. Vendor Login → Vendor Dashboard
2. View key metrics:
   - Today's bookings
   - Pending confirmations
   - Monthly revenue
   - Integration status
3. View recent bookings
4. Quick actions (View Calendar, Add Booking, etc.)

**Variations:**
- Switch between customer/vendor role
- Filter by date range
- Export reports

### UC-V3: Calendar Management
**Flow:**
1. Vendor Dashboard → Calendar
2. Select view (Day/Week/Month)
3. View bookings by time slot
4. Filter by source (App/WhatsApp/Manual)
5. Filter by status (Confirmed/Pending/Completed)
6. Click time slot → View booking details
7. Add manual booking → Fill details → Save

**Variations:**
- Block time slots
- Set recurring availability
- Bulk operations

### UC-V4: Booking Management
**Flow:**
1. Vendor Dashboard → Manage Bookings
2. View all bookings in table format
3. Search by customer name/phone
4. Filter by status/source
5. Edit booking → Modify details → Save
6. Delete booking → Confirm → Removed
7. Export to CSV

**Variations:**
- Bulk status updates
- Send reminders
- View booking history

### UC-V5: Business Profile Management
**Flow:**
1. Vendor Dashboard → Business Profile
2. **Info Tab:**
   - Update business name, category, location
   - Edit contact information
   - Update description
   - Save changes
3. **Hours Tab:**
   - Set operating hours per day
   - Mark days as open/closed
   - Set special hours
   - Save hours
4. **Services Tab:**
   - Add/Edit services
   - Set pricing per service
   - Set duration and slots per day
   - Add descriptions
   - Save services
5. **Media Tab:**
   - Upload venue photos
   - Manage gallery
   - Set featured image

**Variations:**
- Temporary closure settings
- Holiday hours
- Service availability by day

### UC-V6: WhatsApp Integration
**Flow:**
1. Vendor Dashboard → Integrations section
2. Click "WhatsApp Business" → Setup page
3. Enter WhatsApp Business number
4. Verify number (OTP/SMS)
5. Connect → Integration active
6. **Incoming Booking Flow:**
   - Customer sends WhatsApp message
   - System receives message
   - AI parses booking request
   - Creates booking in system
   - Sends confirmation to customer
   - Booking appears in Calendar/Manage Bookings
7. **Outgoing Notifications:**
   - Booking confirmations
   - Reminders
   - Status updates

**Variations:**
- Auto-reply setup
- Template messages
- Disconnect/reconnect integration

### UC-V7: Google Sheets Integration
**Flow:**
1. Vendor Dashboard → Integrations section
2. Click "Google Sheets" → Setup page
3. Authorize Google account
4. Select/create spreadsheet
5. Map columns (Customer, Date, Time, Status, etc.)
6. Connect → Integration active
7. **Sync Flow:**
   - New booking created → Auto-sync to sheet
   - Booking updated → Sheet updated
   - Manual sheet edit → Sync to system (if enabled)
8. View sync status and last sync time

**Variations:**
- Custom column mapping
- One-way vs two-way sync
- Multiple sheet connections
- Scheduled syncs

### UC-V8: Manual Booking Entry
**Flow:**
1. Vendor Dashboard → "Add Booking" or Calendar → "Add" on time slot
2. Enter customer details (name, phone, email)
3. Select service
4. Select date and time
5. Set status (Pending/Confirmed)
6. Add notes (optional)
7. Save → Booking created
8. Option to send notification to customer

**Variations:**
- Recurring bookings
- Group bookings
- Booking from phone call
- Walk-in customers

---

## 4. Integration Use Cases

### UC-I1: WhatsApp Booking Flow (Customer → Vendor)
**Flow:**
1. Customer opens WhatsApp
2. Messages vendor's WhatsApp Business number
3. Types: "Book futsal court tomorrow 6 PM"
4. AI assistant (or vendor) responds
5. Confirms details
6. Booking created in system
7. Customer receives confirmation
8. Booking appears in vendor's calendar

### UC-I2: Google Sheets Sync Flow
**Flow:**
1. Booking created via any source (App/WhatsApp/Manual)
2. System triggers sync
3. Data formatted according to mapping
4. Row added/updated in Google Sheet
5. Sync status updated
6. Vendor can view in Sheets
7. Optional: Sheet edits sync back (if enabled)

---

## 5. Cross-User Use Cases

### UC-X1: Booking Lifecycle
**Flow:**
1. **Creation:** Customer books → Vendor receives notification
2. **Confirmation:** Vendor confirms → Customer notified
3. **Reminder:** System sends reminder (24h before)
4. **Completion:** Booking time passes → Status auto-updates
5. **Review:** Customer can rate/review → Vendor sees feedback

### UC-X2: Payment Processing
**Flow:**
1. Customer selects payment method
2. **Card/Wallet:** Process payment → Confirm
3. **Pay at Venue:** Mark as pending → Vendor confirms payment
4. Receipt generated
5. Transaction recorded

### UC-X3: Search & Discovery
**Flow:**
1. Customer searches (text/location/filters)
2. Results displayed
3. Customer refines search
4. Selects venue
5. Views details
6. Books or saves for later

---

## 6. User Flow Diagrams Summary

### Customer Primary Flows:
1. **Registration → Browse → Book → Payment → Confirmation**
2. **Login → Home → Search → Venue Detail → Book**
3. **Home → AI Chatbot → Get Recommendation → Book**
4. **Home → Social → Join Match → Confirm**
5. **Profile → View Bookings → Modify/Cancel**

### Vendor Primary Flows:
1. **Registration → Verification → Dashboard**
2. **Dashboard → Calendar → View/Add Bookings**
3. **Dashboard → Manage Bookings → Edit/Delete**
4. **Dashboard → Integrations → Setup WhatsApp/Sheets**
5. **Dashboard → Business Profile → Update Info/Hours/Services**

### Integration Flows:
1. **WhatsApp Message → Parse → Create Booking → Confirm**
2. **Booking Created → Sync to Google Sheets → Update**

---

## 7. Wireframe Requirements

Each wireframe should include:
- Navigation arrows showing flow to next page
- Back button functionality
- Status indicators
- Action buttons
- Form fields
- List/card views
- Tab navigation
- Bottom navigation bar

**Wireframe Categories:**
1. Authentication & Registration (Customer & Vendor)
2. Customer Discovery & Booking Flow
3. Vendor Management Flow
4. AI Chatbot Interactions
5. Social Features
6. Profile & Settings
7. Notifications
8. Integration Setup & Management
9. Payment Flows
10. Error & Empty States

