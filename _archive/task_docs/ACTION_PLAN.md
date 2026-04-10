# Paw Friend - Action Plan & Task Breakdown

## 🎯 Overview
This document breaks down all tasks needed to complete the app for launch, organized by priority and category.

---

## 🔴 PRIORITY 1: Critical Blockers (Must Fix Before Launch)

### 1.1 Google OAuth Integration (BLOCKING)

**Current Issue**: Backend rejects Google login with `"Unsupported provider: provider is not enabled"`

#### Tasks:
1. **Enable Google Provider in Supabase**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable "Google" provider
   - Configure OAuth credentials (Client ID, Client Secret)
   - Set authorized redirect URIs:
     - `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
     - `https://9c3ef547-1a05-4427-a6e6-d3f86a6365e3.lovableproject.com/auth/v1/callback` (if using Lovable preview)
   - Verify the provider name matches exactly: `"google"` (lowercase)

2. **Update Capacitor Config Files**
   - File: `capacitor.config.ts`
     - Replace `YOUR_WEB_CLIENT_ID` with actual Web Client ID from Google Cloud Console
   - File: `capacitor.config.production.ts`
     - Replace `YOUR_WEB_CLIENT_ID` with actual Web Client ID
   - File: `android/app/src/main/res/values/strings.xml`
     - Replace `YOUR_WEB_CLIENT_ID` with actual Web Client ID

3. **Get Google Cloud OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID (Web application type)
   - Copy the "Web Client ID" (format: `XXXXX.apps.googleusercontent.com`)
   - Use this same ID in all 3 locations above

4. **Test Google OAuth Flow**
   - Test on web: Should redirect to Google sign-in
   - Test on Android: Should use native Google Sign-In
   - Verify session is created in Supabase
   - Check that user profile is created/updated

**Files to Modify:**
- `capacitor.config.ts` (line 38)
- `capacitor.config.production.ts` (line 46)
- `android/app/src/main/res/values/strings.xml` (line 8)

---

### 1.2 Production Build & Signing

#### Tasks:
1. **Test Production Build Script**
   - Run: `./scripts/prepare-production.sh`
   - Fix any errors that occur
   - Verify build completes successfully

2. **Create Production Keystore** (One-time setup)
   ```bash
   keytool -genkey -v -keystore pawfriend-release-key.keystore \
     -alias pawfriend -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Store keystore path, alias, and passwords securely
   - **IMPORTANT**: Never commit keystore to git

3. **Generate Signed AAB**
   - Open Android Studio: `npx cap open android`
   - Build → Generate Signed Bundle / APK
   - Select "Android App Bundle"
   - Use the keystore created above
   - Generate release AAB

4. **Test Release Build**
   - Install release AAB on test device
   - Verify Google OAuth works
   - Test payment flow end-to-end
   - Check all core features

**Files to Check:**
- `scripts/prepare-production.sh`
- `android/app/build.gradle` (verify signing config)

---

### 1.3 Google Cloud & Play Store Configuration

#### Tasks:
1. **Configure Google Cloud OAuth**
   - In Google Cloud Console → APIs & Services → Credentials
   - Edit your OAuth 2.0 Client ID
   - **Authorized JavaScript origins**: Add production domain
   - **Authorized redirect URIs**: Add Supabase callback URL

2. **Google Play Console Setup**
   - Create new app in Google Play Console
   - Upload signed AAB to Internal Testing track
   - Complete Store Listing:
     - App name: "Paw Friend"
     - Short description
     - Full description
     - Screenshots (phone, tablet if applicable)
     - Feature graphic
     - App icon
   - Privacy Policy URL (required)
   - Data Safety form (required)

---

## 🟡 PRIORITY 2: Core Features & UX Improvements

### 2.1 Interactive Map Enhancements

**Goal**: Rich popups for all map pins with quick actions

#### Tasks:
1. **Create Rich Map Popup Component**
   - Component: `components/maps/MapPinPopup.tsx`
   - Display: Photo, name, rating/price OR adoption/lost label, distance
   - Actions: "View details", "Book" (for services), "Contact"

2. **Integrate Popup with Existing Maps**
   - Update `LostPetsMap.tsx` to use new popup
   - Update adoption map to use new popup
   - Update services map to use new popup
   - Calculate and display distance from user location

3. **Add Quick Actions**
   - "View details" → Navigate to detail page
   - "Book" → Open booking dialog (for services)
   - "Contact" → Open messaging (if mutual follow)

**Files to Create/Modify:**
- `src/components/maps/MapPinPopup.tsx` (new)
- `src/components/LostPetsMap.tsx`
- `src/pages/Maps.tsx`
- `src/components/maps/ServiceDetailCard.tsx`
- `src/components/maps/AdoptionDetailCard.tsx`
- `src/components/maps/LostPetDetailCard.tsx`

---

### 2.2 Paw Game Integration

**Goal**: Fully integrate gamification with real user actions

#### Tasks:
1. **Create Points System Database**
   - Add `user_points` table or column to profiles
   - Add `user_level` based on points
   - Add `achievements` table
   - Add `missions` table

2. **Award Points for Actions**
   - Booking completed: +50 points
   - Vet visit recorded: +30 points
   - Adoption action: +100 points
   - Lost pet help: +75 points
   - Review written: +25 points
   - Post shared: +10 points

3. **Create Missions System**
   - Daily missions (e.g., "Book a service", "Add medical record")
   - Weekly missions (e.g., "Write 3 reviews")
   - Special missions (e.g., "Help find a lost pet")

4. **Create Achievements System**
   - Badges for milestones (e.g., "First Booking", "Pet Hero", "Review Master")
   - Unlockable rewards

5. **Display Progress on Home & Profile**
   - Add points/level widget to Home page
   - Add achievements section to Profile page
   - Show mission progress
   - Display next level requirements

**Database Changes Needed:**
```sql
-- Add to profiles table or create new table
ALTER TABLE profiles ADD COLUMN points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN total_bookings INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN total_reviews INTEGER DEFAULT 0;
```

**Files to Create/Modify:**
- `src/components/Gamification.tsx` (update)
- `src/pages/Home.tsx` (add points widget)
- `src/pages/Profile.tsx` (add achievements section)
- `src/pages/PawGame.tsx` (enhance)
- Database migration for points/achievements

---

### 2.3 AI Prompts Review & Improvement

**Goal**: Make all AI prompts clear, consistent, and robust

#### Tasks:
1. **Review All AI Edge Functions**
   - `analyze-dog-behavior` - Already documented
   - `breed-tips` - Already documented
   - `medical-suggestions` - Already documented
   - `moderate-service-promotion` - Already documented
   - `generate-shelters` - Already documented
   - `generate-places` - Check and document

2. **Standardize Prompt Structure**
   - System prompt: Clear role definition
   - User prompt: Structured input
   - Expected output: JSON schema or format
   - Error handling: Fallback responses

3. **Add Robustness**
   - Handle missing data gracefully
   - Provide default responses
   - Validate input before sending to AI
   - Add retry logic for failed requests

4. **Update Documentation**
   - Update `docs/AI_PROMPTS_DOCUMENTATION.md` with improvements
   - Add examples of good vs bad prompts

**Files to Review:**
- `supabase/functions/analyze-dog-behavior/index.ts`
- `supabase/functions/breed-tips/index.ts`
- `supabase/functions/medical-suggestions/index.ts`
- `supabase/functions/moderate-service-promotion/index.ts`
- `supabase/functions/generate-shelters/index.ts`
- `supabase/functions/generate-places/index.ts`

---

### 2.4 Messaging Safety & Features

**Goal**: Safe, controlled messaging between users

#### Tasks:
1. **Implement Mutual Follow Requirement**
   - Check if both users follow each other before allowing messages
   - Show clear error if mutual follow not established
   - Add "Follow" button in user profiles

2. **Add Follow System**
   - Create `user_follows` table (if not exists)
   - Add follow/unfollow functionality
   - Display follow status in profiles

3. **Add Safety Features**
   - Block user functionality
   - Report user functionality
   - Hide blocked users from chat list
   - Store block/report records in database

4. **Improve Error Handling**
   - Clear error messages
   - Handle edge cases (user deleted, account suspended)
   - Loading states

**Database Changes Needed:**
```sql
-- Create follows table if not exists
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
```

**Files to Create/Modify:**
- `src/pages/Chat.tsx`
- `src/pages/ChatConversation.tsx`
- `src/hooks/useStartConversation.tsx`
- `src/components/UserProfile.tsx` (add follow button)
- Database migration for follows/blocks

---

## 🟢 PRIORITY 3: Monetization Strategy

### 3.1 Platform Fees (Service Commission)

**Goal**: Earn commission on every completed booking

#### Tasks:
1. **Add Fee Configuration to Database**
   ```sql
   -- Update platform_config table or create if needed
   INSERT INTO platform_config (config_key, config_value) 
   VALUES ('platform_fee', '{"percentage": 5, "min_fee_clp": 500, "max_fee_clp": 5000}');
   ```

2. **Update Booking/Payment Logic**
   - Calculate `platform_fee_amount` = `total_price * platform_fee_percent / 100`
   - Enforce min/max fee limits
   - Calculate `provider_payout_amount` = `total_price - platform_fee_amount`
   - Store all three values in `bookings` table

3. **Update Payment Flow**
   - Charge full `total_price` to customer
   - Store `platform_fee_amount` and `provider_payout_amount` in booking record
   - Update `payments` table with fee breakdown

4. **Create Provider Dashboard**
   - Component: `src/components/provider/ProviderDashboard.tsx`
   - Display:
     - Gross revenue (total bookings)
     - Platform fees (total fees paid)
     - Net payouts (total received)
     - Recent bookings with fee breakdown
   - Add route: `/provider/dashboard`

5. **Make Fee Configurable**
   - Admin setting to adjust `platform_fee_percent`
   - Update fee calculation to use live config
   - Add validation (e.g., 0-20% range)

**Database Changes:**
```sql
-- Add fee columns to bookings table
ALTER TABLE bookings ADD COLUMN platform_fee_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN provider_payout_amount DECIMAL(10,2);
```

**Files to Create/Modify:**
- `src/contexts/CartContext.tsx` (update fee calculation)
- `src/pages/Checkout.tsx` (show fee breakdown)
- `src/components/provider/ProviderDashboard.tsx` (new)
- `src/pages/admin/AdminSettings.tsx` (add fee config)
- Database migration for fee columns

---

### 3.2 Premium Membership

**Goal**: Recurring revenue from power users and providers

#### Tasks:
1. **Create Subscription Plans**
   - Plan 1: "PawFriend Premium - Monthly" (e.g., $4.99/month)
   - Plan 2: "PawFriend Premium - Yearly" (e.g., $49.99/year)
   - Store plans in database or payment provider

2. **Add Membership to User Profile**
   ```sql
   ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
   ALTER TABLE profiles ADD COLUMN premium_start_date TIMESTAMPTZ;
   ALTER TABLE profiles ADD COLUMN premium_end_date TIMESTAMPTZ;
   ALTER TABLE profiles ADD COLUMN premium_plan TEXT; -- 'monthly' or 'yearly'
   ```

3. **Implement Premium Benefits for Pet Owners**
   - 5% discount on service fees (apply in checkout)
   - Bonus Paw Game points (2x multiplier)
   - Exclusive badges/achievements
   - Priority support (optional)

4. **Implement Premium Benefits for Providers**
   - Featured placement in search results
   - Featured placement on map (highlighted pins)
   - Access to analytics dashboard:
     - Repeat client rate
     - Revenue trends
     - Booking patterns
   - Higher ranking in listings

5. **Apply Premium Discounts**
   - Check `is_premium` when calculating service fees
   - Apply 5% discount to platform fee
   - Show discount in checkout UI

6. **Apply Premium Featured Placement**
   - Filter/sort providers by premium status
   - Highlight premium providers in map
   - Add "Premium" badge to provider cards

7. **Subscription Management**
   - Create subscription purchase flow
   - Handle subscription renewal
   - Handle subscription cancellation
   - Update membership status on payment

**Database Changes:**
```sql
-- Add premium columns (see above)
-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL, -- 'monthly' or 'yearly'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  payment_provider_id TEXT, -- ID from payment provider
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Files to Create/Modify:**
- `src/pages/Premium.tsx` (new - subscription page)
- `src/components/PremiumBadge.tsx` (new)
- `src/pages/Checkout.tsx` (apply premium discount)
- `src/hooks/useServiceProviders.tsx` (filter by premium)
- `src/components/ProviderProfileCard.tsx` (show premium badge)
- `src/pages/Profile.tsx` (show premium status)
- Database migration for premium/subscriptions

---

### 3.3 In-App Advertising & Strategic Partners

**Goal**: Monetize traffic with non-intrusive, pet-relevant ads

#### Tasks:
1. **Create Partners/Ads Database Model**
   ```sql
   CREATE TABLE partners (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     brand_name TEXT NOT NULL,
     ad_text TEXT NOT NULL,
     ad_image_url TEXT,
     ad_link TEXT,
     placement TEXT NOT NULL, -- 'home', 'services', 'map', 'content'
     category TEXT NOT NULL, -- 'food', 'insurance', 'clinic', 'store', 'adoption'
     is_active BOOLEAN DEFAULT true,
     impressions INTEGER DEFAULT 0,
     clicks INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **Create Ad Component**
   - Component: `src/components/PartnerAd.tsx`
   - Display: Image, text, brand name
   - Click tracking: Increment clicks counter
   - Impression tracking: Increment impressions on view

3. **Add Ad Slots to Home Screen**
   - "Featured Partner" card section
   - Show 1-2 active ads
   - Rotate ads if multiple available

4. **Add Ad Slots to Services/Map Views**
   - "Sponsored" section in service listings
   - Sponsored pins on map (different style)
   - Filter by category (e.g., only show clinic ads in vet section)

5. **Add Ad Slots to Content Sections**
   - "Brought to you by [Brand]" in tips/articles
   - Non-intrusive placement

6. **Implement Ad Filtering**
   - Only show pet-relevant ads
   - Match ad category to page context
   - Respect `is_active` flag

7. **Add Ad Tracking**
   - Track impressions (on component mount/visible)
   - Track clicks (on ad click)
   - Update database counters
   - Create admin view for ad performance

8. **Create Admin Ad Management**
   - Component: `src/components/admin/AdManagement.tsx`
   - CRUD operations for partners
   - View ad performance (impressions, clicks, CTR)
   - Activate/deactivate ads

**Database Changes:**
```sql
-- See partners table above
-- Create index for performance
CREATE INDEX idx_partners_placement_active ON partners(placement, is_active);
```

**Files to Create/Modify:**
- `src/components/PartnerAd.tsx` (new)
- `src/pages/Home.tsx` (add ad slot)
- `src/pages/DogWalkers.tsx` (add sponsored section)
- `src/pages/HomeVets.tsx` (add sponsored section)
- `src/components/maps/ServiceDetailCard.tsx` (add sponsored pins)
- `src/components/admin/AdManagement.tsx` (new)
- `src/pages/Admin.tsx` (add ad management section)
- Database migration for partners table

---

## 📋 Implementation Order Recommendation

### Phase 1: Critical Blockers (Week 1)
1. ✅ Google OAuth integration (all tasks)
2. ✅ Production build & signing
3. ✅ Google Cloud & Play Store setup

### Phase 2: Core UX (Week 2)
4. ✅ Interactive map enhancements
5. ✅ Paw Game integration
6. ✅ AI prompts review
7. ✅ Messaging safety features

### Phase 3: Monetization (Week 3-4)
8. ✅ Platform fees implementation
9. ✅ Premium membership
10. ✅ In-app advertising

---

## 🔧 Technical Notes

### Environment Variables Needed
```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID_WEB=your-web-client-id.apps.googleusercontent.com

# Supabase (already configured)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key

# Payment Provider (if using external)
VITE_PAYMENT_PROVIDER_KEY=...
```

### Database Migration Strategy
- Create new migration files for each feature
- Test migrations on staging first
- Backup production before applying

### Testing Checklist
- [ ] Google OAuth works on web
- [ ] Google OAuth works on Android
- [ ] Payments work in release build
- [ ] Map popups display correctly
- [ ] Paw Game points awarded correctly
- [ ] Messaging requires mutual follow
- [ ] Platform fees calculated correctly
- [ ] Premium discounts apply
- [ ] Ads display and track correctly

---

## 📝 Notes

- All monetization features should be **optional** - core app remains free
- Platform fees should start low (5%) and be adjustable
- Premium membership should provide clear value
- Ads must be non-intrusive and pet-relevant only
- All features should work seamlessly with existing Lovable architecture

---

**Last Updated**: 2024-12-XX
**Status**: Ready for implementation

