# Main Pages for SRS Documentation

This document lists the core/main pages that should be included in the Software Requirements Specification (SRS) document. Minor pages like receipts, booking confirmations, and integration setup pages are excluded.

## Customer/User Pages

1. **01_customer_registration_flow.html** - Login Page
   - **Description:** Unified login screen allowing users to select their role (USER or VENDOR), enter credentials, register new accounts, login via Google, or continue as guest; navigates to user/vendor registration forms, customer homepage, or vendor dashboard based on selection.

2. **02_customer_registration_form.html** - User Registration Form
   - **Description:** Customer account creation form collecting basic details (name, email, phone, password), preferences (sports, location), and terms agreement; navigates back to login or forward to registration success page upon completion.

3. **05_customer_home.html** - Customer Homepage/Dashboard
   - **Description:** Main landing page displaying quick actions (AI Assistant, Find Match, My Bookings), venue categories, trending venues, and upcoming bookings; provides navigation to search, category listings, venue details, chatbot, social hub, profile, and sign out functionality.

4. **04_customer_browse_flow.html** - Browse & Search Flow
   - **Description:** Browse interface with search functionality, category browsing, and trending venue listings; allows navigation to category listings, venue detail pages, AI chatbot, social hub, and user profile.

5. **06_category_listing.html** - Category/Venue Listing
   - **Description:** Filtered venue listing page with price and amenity filters, displaying venues by category with ratings and pricing; enables navigation to individual venue detail pages, back to homepage, or to other main sections via bottom navigation.

6. **07_vendor_detail.html** - Vendor/Venue Detail Page
   - **Description:** Detailed venue information page showing photos, ratings, amenities, availability calendar, and time slot selection; allows users to proceed to booking and payment page, navigate back to category listing, or access other main sections.

7. **08_booking_payment.html** - Booking & Payment
   - **Description:** Booking confirmation and payment page where users review booking details, enter contact information, select payment method (card, wallet, or pay at venue), and complete the booking transaction; navigates to booking confirmation page upon successful payment.

8. **08_ai_chatbot.html** - AI Chatbot
   - **Description:** AI-powered chat interface for customer support, venue recommendations, and booking assistance; accessible from homepage and provides conversational interaction to help users find venues and answer queries.

9. **09_social_hub.html** - Social Hub / Find Match
   - **Description:** Social networking feature allowing users to find playing partners, create or join matches, view social activities, and connect with other users; accessible from homepage navigation and integrates with booking system.

10. **10_notifications.html** - Notifications
    - **Description:** Centralized notification center displaying booking confirmations, reminders, promotional offers, and system alerts; allows users to view, manage, and navigate to related pages from notification items.

11. **11_profile.html** - User Profile
    - **Description:** User account management page showing profile information, loyalty points, booking statistics, sport preferences, and upcoming bookings; enables navigation to modify bookings, view booking history, and access account settings.

## Vendor/Business Pages

12. **11_vendor_registration_flow.html** - Vendor Registration Form
    - **Description:** Business account registration form collecting business information (name, category, location, address), contact details (owner name, phone, email), operational hours, services offered, and verification documents (CNIC upload); navigates to vendor dashboard upon successful submission.

13. **12_vendor_dashboard.html** - Vendor Dashboard
    - **Description:** Main vendor control panel displaying today's bookings, pending confirmations, monthly revenue, active integrations status, recent bookings list, and quick action buttons; provides navigation to calendar, booking management, business profile, integration setup, and role switching.

14. **13_vendor_calendar.html** - Vendor Calendar
    - **Description:** Calendar view displaying all bookings with date and time slots, allowing vendors to visualize their schedule, view booking details, and manage availability; accessible from dashboard and integrates with booking management system.

15. **14_manage_bookings.html** - Manage Bookings
    - **Description:** Comprehensive booking management interface where vendors can view all bookings (confirmed, pending, cancelled), filter by status or date, edit booking details, manually add bookings, and process booking modifications; accessible from dashboard and calendar.

16. **15_business_profile.html** - Business Profile
    - **Description:** Business profile management page allowing vendors to update business information, operating hours, services, pricing, amenities, photos, and business settings; enables navigation back to dashboard and integration with other vendor management features.

---

## Excluded Pages (Minor/Utility/Technical)

The following pages are **NOT** included as they are minor utility pages, confirmation screens, or technical integration pages:

- `03_registration_success.html` - Registration success confirmation (minor)
- `16_whatsapp_integration_setup.html` - WhatsApp integration setup (technical)
- `17_whatsapp_booking_flow.html` - WhatsApp booking flow (feature detail)
- `18_google_sheets_integration_setup.html` - Google Sheets integration setup (technical)
- `19_google_sheets_sync_view.html` - Google Sheets sync view (technical)
- `20_payment_processing.html` - Payment processing (technical detail)
- `21_booking_confirmation.html` - Booking confirmation receipt (minor)

---

## Summary

**Total Main Pages: 16**

- **Customer Pages: 11**
- **Vendor Pages: 5**

These pages represent the core user flows and main features of the BookForMe application and should be documented in the SRS with wireframe screenshots.

