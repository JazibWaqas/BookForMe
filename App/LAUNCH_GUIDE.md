# BookForMe App Launch Guide

Last updated: May 9, 2026

## Current Launch Posture

The app is currently working in Expo Go. The backend is deployed at:

```text
https://bookforme-ie34.onrender.com
```

For the university demo, prefer an installable Android build over Expo Go. Expo
Go is excellent for fast iteration, but it adds avoidable variables: Expo session
state, laptop/network dependency when using local APIs, QR scanning, and dev
server surprises.

## Recommended Path

1. Keep using Expo Go while fixing final customer, vendor, and admin app issues.
2. Keep `EXPO_PUBLIC_API_URL` pointed at `https://bookforme-ie34.onrender.com`.
3. Make an installable Android preview APK with EAS once the core flows pass.
4. Install that APK on the demo phone and test it on mobile data and venue Wi-Fi.
5. Keep Expo Go as the emergency fallback, not the primary demo path.

## Environment

Current `.env` should include:

```bash
EXPO_PUBLIC_API_URL=https://bookforme-ie34.onrender.com
EXPO_PUBLIC_RENDER_URL=https://bookforme-ie34.onrender.com
```

Before a stable build, consider setting:

```bash
EXPO_PUBLIC_ENV=production
```

Only use local IP URLs during active development. Do not ship or demo an APK that
points at a laptop IP.

## Build Option: EAS Preview APK

If EAS is not configured yet:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

Use a preview Android build that produces an APK. Add or update `eas.json` at the
app root:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bookforme-ie34.onrender.com",
        "EXPO_PUBLIC_RENDER_URL": "https://bookforme-ie34.onrender.com",
        "EXPO_PUBLIC_ENV": "production"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bookforme-ie34.onrender.com",
        "EXPO_PUBLIC_RENDER_URL": "https://bookforme-ie34.onrender.com",
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  }
}
```

Then build:

```bash
npx eas-cli@latest build --platform android --profile preview
```

## Demo QA Checklist

- Login/register works for customer, vendor, and admin roles.
- Customer home loads vendors from Render.
- Search/category filters work.
- Vendor detail loads slots for today/tomorrow.
- Slot lock works and shows correct hold state.
- Payment upload reaches backend.
- My Bookings reflects the latest booking/payment state.
- Vendor dashboard loads today analytics.
- Vendor calendar/grid shows correct slot statuses.
- Vendor can approve/reject pending payments.
- Admin dashboard loads overview, vendors, slot tools, and pending payments.
- App works after force close/reopen.
- App works on mobile data.
- App works on the university Wi-Fi.

## OCR Note

The agent and booking state machine are complete. The remaining OCR concern is
model/provider extraction accuracy. If Groq vision struggles on local wallet or
bank screenshots, test Gemini with the same screenshot set and keep the provider
that extracts amount/date/reference most consistently.
