# Client Credentials & Information Checklist

This document lists all credentials, access, and information needed from the client to complete the project.

---

## 🔐 CRITICAL: Required for Launch

### 1. Supabase Project Access
**Why**: Backend database, auth, and edge functions
- [ ] **Supabase Project URL** (format: `https://xxxxx.supabase.co`)
- [ ] **Supabase Anon/Public Key** (for frontend)
- [ ] **Supabase Service Role Key** (for admin operations - keep secret!)
- [ ] **Supabase Dashboard Access** (login credentials or invite to project)
- [ ] **Database Access** (to run migrations and verify data)

**Where to find**: Supabase Dashboard → Settings → API

**Action needed**: 
- Enable Google provider in Authentication → Providers
- Verify callback URLs are configured

---

### 2. Google Cloud Console Access
**Why**: OAuth credentials for Google Sign-In
- [ ] **Google Cloud Project** (existing project or create new)
- [ ] **Google Cloud Console Access** (login or invite)
- [ ] **OAuth 2.0 Client ID (Web Application)**
  - Client ID (format: `XXXXX.apps.googleusercontent.com`)
  - Client Secret
- [ ] **Authorized JavaScript Origins** (list of domains to allow)
- [ ] **Authorized Redirect URIs** (Supabase callback URLs)

**Where to find**: Google Cloud Console → APIs & Services → Credentials

**Action needed**:
- Create OAuth 2.0 Client ID if not exists
- Configure authorized origins and redirects

---

### 3. Google Play Console Access
**Why**: Publish Android app to Play Store
- [ ] **Google Play Console Account** (developer account access)
- [ ] **App Package Name Confirmation** (currently: `cl.pawfriend.app`)
- [ ] **App Signing Key** (if they have existing keystore, or we create new)
- [ ] **Store Listing Information**:
  - App name: "Paw Friend" (confirm)
  - Short description (50 chars)
  - Full description (4000 chars)
  - Screenshots (phone, tablet if applicable)
  - Feature graphic (1024x500)
  - App icon (512x512)
  - Promotional video (optional)
  - Category: Social / Lifestyle
  - Content rating questionnaire

**Where to find**: [Google Play Console](https://play.google.com/console)

**Action needed**:
- Create app listing
- Complete store listing
- Upload signed AAB

---

### 4. Payment Provider Credentials (Webpay Plus - Transbank)
**Why**: Process payments for service bookings
- [ ] **Transbank Commerce Code** (Código de Comercio)
- [ ] **Transbank API Key** (API Key)
- [ ] **Environment**: Production or Integration (testing)
- [ ] **Webhook/Callback URL** (for payment confirmations)
- [ ] **Return URLs** (success/failure pages)

**Where to find**: Transbank Webpay Plus dashboard

**Note**: If not set up yet, they need to:
- Register with Transbank
- Complete merchant verification
- Get commerce code and API key

---

### 5. Google Maps API
**Why**: Maps, places, geocoding
- [ ] **Google Maps API Key** (for web)
- [ ] **Google Maps API Key** (for Android - separate key recommended)
- [ ] **API Restrictions** (which APIs are enabled):
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Directions API (if needed)

**Where to find**: Google Cloud Console → APIs & Services → Credentials

**Action needed**:
- Enable required APIs
- Set API key restrictions (HTTP referrers for web, package name for Android)

---

## 📋 BUSINESS INFORMATION

### 6. Legal & Compliance
**Why**: Required for app store and legal compliance
- [ ] **Privacy Policy URL** (must be publicly accessible)
- [ ] **Terms of Service URL** (must be publicly accessible)
- [ ] **Company/Business Name** (for Play Store)
- [ ] **Business Address** (for Play Store)
- [ ] **Contact Email** (for support - currently: `soporte@pawfriend.cl`)
- [ ] **Data Safety Information**:
  - What data is collected
  - How data is used
  - Data sharing practices
  - Security measures

**Action needed**:
- Create/update privacy policy
- Create/update terms of service
- Host on public URL

---

### 7. Branding & Assets
**Why**: App store listing and app branding
- [ ] **App Icon** (512x512 PNG, no transparency)
- [ ] **Feature Graphic** (1024x500 PNG)
- [ ] **Screenshots**:
  - Phone screenshots (at least 2, up to 8)
  - Tablet screenshots (optional)
  - Minimum resolution: 320px, maximum: 3840px
- [ ] **Logo** (for app, various sizes if available)
- [ ] **Brand Colors** (primary, secondary - if specific brand guidelines)
- [ ] **App Name Confirmation**: "Paw Friend" ✓

---

### 8. Domain & Hosting
**Why**: Production URLs, OAuth callbacks, privacy policy hosting
- [ ] **Production Domain** (if different from Lovable preview)
- [ ] **Hosting Provider** (where production app will be hosted)
- [ ] **SSL Certificate** (for HTTPS - required for OAuth)
- [ ] **CDN/Static Hosting** (for privacy policy, terms if not on main domain)

**Current Preview URL**: `https://9c3ef547-1a05-4427-a6e6-d3f86a6365e3.lovableproject.com`

**Question**: Will they use Lovable hosting or their own domain?

---

## 🛠️ DEVELOPMENT ACCESS

### 9. Version Control & Deployment
**Why**: Code management and deployment
- [ ] **Git Repository Access** (if they have existing repo)
- [ ] **Deployment Pipeline Access** (CI/CD if they have it)
- [ ] **Environment Variables Management** (where to store secrets)
- [ ] **Staging Environment** (for testing before production)

---

### 10. Monitoring & Analytics
**Why**: Track app performance and errors
- [ ] **Analytics Service** (Google Analytics, Firebase Analytics, etc.)
  - Tracking ID if exists
- [ ] **Error Monitoring** (Sentry, Bugsnag, etc.)
  - API key if exists
- [ ] **Performance Monitoring** (optional)

**Note**: Can set up new services if they don't have any

---

## 💰 MONETIZATION SETUP

### 11. Payment Processing (Additional)
**Why**: For premium subscriptions and payouts
- [ ] **Subscription Payment Provider** (if different from Webpay):
  - Stripe account?
  - PayPal account?
  - Other?
- [ ] **Provider Payout Method** (how to pay service providers):
  - Bank account details?
  - Payment processor?
  - Manual process?

**Note**: Platform fees and premium subscriptions need payment infrastructure

---

### 12. Business Model Configuration
**Why**: Set up monetization parameters
- [ ] **Platform Fee Percentage** (recommended: 5-10%, default: 5%)
- [ ] **Platform Fee Min/Max** (in CLP):
  - Minimum fee: 500 CLP?
  - Maximum fee: 5000 CLP?
- [ ] **Premium Membership Pricing**:
  - Monthly price: ? CLP
  - Yearly price: ? CLP
- [ ] **Ad/Partner Program** (if they have existing partners):
  - Partner list
  - Ad creative assets
  - Landing page URLs

---

## 📱 MOBILE APP SPECIFICS

### 13. Android App Signing
**Why**: Required for Google Play Store
- [ ] **Existing Keystore** (if they have one from previous builds)
  - Keystore file path
  - Keystore password
  - Key alias
  - Key password
- [ ] **OR**: Create new keystore (we can do this, but need to securely store credentials)

**Important**: Keystore is critical - losing it means can't update app!

---

### 14. App Store Metadata
**Why**: Google Play Store listing
- [ ] **App Description (Short)**: 50 characters max
- [ ] **App Description (Full)**: Up to 4000 characters
- [ ] **What's New** (for first release): Brief description
- [ ] **Keywords/Tags** (for discoverability)
- [ ] **Support URL**: Website or email
- [ ] **Marketing URL** (optional): Landing page

---

## 🔍 ADDITIONAL QUESTIONS

### 15. Existing Infrastructure
- [ ] **Do they have existing user accounts?** (migration needed?)
- [ ] **Do they have existing data?** (pets, bookings, etc.)
- [ ] **Do they have existing integrations?** (third-party services)
- [ ] **Do they have existing analytics?** (user tracking setup)

### 16. Launch Timeline
- [ ] **Target Launch Date**: ?
- [ ] **Soft Launch Date** (internal testing): ?
- [ ] **Public Launch Date**: ?
- [ ] **Marketing Campaign Start**: ?

### 17. Testing & QA
- [ ] **Test Users**: Do they have test accounts?
- [ ] **Test Payment Cards**: For Webpay testing
- [ ] **Beta Testers**: List of users for closed testing
- [ ] **Test Devices**: Android devices for testing

---

## 📝 PRIORITY ORDER

### **IMMEDIATE (Blocking Development)**
1. ✅ Supabase access & credentials
2. ✅ Google Cloud Console access (for OAuth)
3. ✅ Google Maps API key

### **HIGH PRIORITY (Needed Soon)**
4. ✅ Transbank/Webpay credentials
5. ✅ Production domain information
6. ✅ Privacy Policy & Terms URLs

### **MEDIUM PRIORITY (Before Launch)**
7. ✅ Google Play Console access
8. ✅ App store assets (screenshots, icons)
9. ✅ Business information for store listing

### **LOW PRIORITY (Can Add Later)**
10. ✅ Analytics setup
11. ✅ Monitoring tools
12. ✅ Premium pricing decisions

---

## 📧 EMAIL TEMPLATE FOR CLIENT

You can copy/paste this to send to your client:

```
Subject: Credentials & Access Needed for Paw Friend App

Hi [Client Name],

To complete the Paw Friend app development and prepare for launch, I need the following credentials and access. I've organized them by priority:

CRITICAL (Needed Immediately):
1. Supabase Project Access
   - Project URL
   - API keys (anon/public and service role)
   - Dashboard access or invite to project

2. Google Cloud Console Access
   - OAuth 2.0 Client ID for Google Sign-In
   - Or invite me to Google Cloud project

3. Google Maps API Key
   - For maps and location features

HIGH PRIORITY (Needed This Week):
4. Transbank/Webpay Credentials
   - Commerce code and API key
   - Or confirmation if you need to set this up

5. Production Domain Information
   - Will you use Lovable hosting or your own domain?

6. Privacy Policy & Terms of Service
   - URLs where these are hosted (required for app stores)

MEDIUM PRIORITY (Before Launch):
7. Google Play Console Access
   - Developer account access or invite

8. App Store Assets
   - App icon (512x512)
   - Screenshots
   - Feature graphic

9. Business Information
   - Company name, address, contact email
   - App descriptions for store listing

I've attached a detailed checklist (CLIENT_CREDENTIALS_CHECKLIST.md) with all items and explanations.

Please let me know:
- What you can provide immediately
- What needs to be set up (I can help with setup)
- Any questions about what's needed

Thanks!
[Your Name]
```

---

## ✅ TRACKING TEMPLATE

Use this to track what you've received:

| Item | Status | Received Date | Notes |
|------|--------|----------------|-------|
| Supabase Access | ⬜ Pending | | |
| Google Cloud Access | ⬜ Pending | | |
| Google Maps API Key | ⬜ Pending | | |
| Webpay Credentials | ⬜ Pending | | |
| Play Console Access | ⬜ Pending | | |
| Privacy Policy URL | ⬜ Pending | | |
| App Assets | ⬜ Pending | | |
| ... | | | |

**Status Legend**:
- ⬜ Pending
- 🟡 In Progress
- ✅ Received
- ❌ Not Needed

---

**Last Updated**: 2024-12-XX
**For**: Paw Friend App Development

