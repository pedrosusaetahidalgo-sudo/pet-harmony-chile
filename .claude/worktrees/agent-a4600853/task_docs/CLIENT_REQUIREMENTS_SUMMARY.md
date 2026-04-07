# Client Requirements Summary

## 🎯 Key Points from Client Discussion

### 1. Admin Panel for Service Review

**Critical Requirement:**
- **Vets MUST be manually reviewed** - Degree verification is essential
- Other services (walkers, sitters, trainers) can auto-regulate via user reviews
- AI can assist with review but vets need human verification

**Current Status:**
- ✅ Admin panel exists
- ⚠️ Vets currently auto-approve (needs to change to 'pending')
- ⚠️ No degree document viewing in admin panel

---

### 2. Two Entity Types

#### A) **Users** (Service Providers - PEOPLE)
- Register themselves
- Types: Dog Walkers, Dog Sitters, Trainers, **Vets**
- These are individuals offering services

#### B) **Places** (Physical Locations)
- Parks, Vet Clinics, Routes, Restaurants, Adoption Places
- All pet-friendly physical locations
- **Require manual admin input** via form
- Need bulk upload capability (CSV/Excel)

**Current Status:**
- ✅ `places` table exists
- ✅ `adoption_shelters` table exists
- ⚠️ No admin form for manual place entry
- ⚠️ No bulk upload functionality

---

### 3. Supabase Credentials

**Received:**
- **URL**: `https://gwailbjlvevkhwcrovfd.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YWlsYmpsdmV2a2h3Y3JvdmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjMzNTQsImV4cCI6MjA4MDUzOTM1NH0.nOWuV57bCDnA5e8SgrxVA3obCUkCf1EGwrjgmR6lJ7E`

**Question Answered:**
> "If upgrading from free to paid, does code need modifications?"

**Answer: NO** - Supabase code is fully compatible. Only billing/limits change, not the API.

**Action:**
- Update `.env` file with these credentials

---

### 4. Payment Integration - Floow (NOT Transbank!)

**IMPORTANT:** Payment provider is **Floow**, not Transbank!

**Credentials:**
- **API Key**: `385F03FE-E4C7-4E6F-AF79-5B6B6L86BDCC`
- **Secret**: `ffea655c55e75f4d0aa75b6a3e44b23e3f62311f`
- **Integration**: Webpay via Floow

**Current Status:**
- ⚠️ Code currently references "Transbank Webpay Plus"
- ⚠️ Payment functions are simulated
- ⚠️ Need to integrate with Floow API

**Action Needed:**
- Research Floow API documentation
- Update payment functions to use Floow
- Add credentials to Supabase secrets

---

## 📋 Tasks Breakdown

### CRITICAL (Do First)

1. **Update Supabase Credentials**
   - [ ] Update `.env` with new URL and key
   - [ ] Test connection
   - [ ] Verify all features work

2. **Fix Vet Approval Flow**
   - [ ] Change vet default status to 'pending' (not 'approved')
   - [ ] Add degree document upload field
   - [ ] Add degree viewing in admin panel
   - [ ] Make admin panel show pending vets prominently

3. **Floow Payment Integration**
   - [ ] Get Floow API documentation
   - [ ] Update `webpay-init` function
   - [ ] Update `webpay-confirm` function
   - [ ] Add Floow credentials to Supabase secrets
   - [ ] Test payment flow

### HIGH PRIORITY

4. **Admin Place Management**
   - [ ] Create admin form for manual place entry
   - [ ] Add place types: parks, routes, restaurants
   - [ ] Add bulk upload (CSV/Excel) functionality
   - [ ] Add place validation

5. **Service Provider Auto-Regulation**
   - [ ] Keep auto-approve for non-vets
   - [ ] Add review-based suspension mechanism
   - [ ] Add quality monitoring

---

## 🔧 Technical Implementation

### Database Changes Needed

```sql
-- Make vets require approval
ALTER TABLE vet_profiles 
ALTER COLUMN is_verified SET DEFAULT false;

-- Add degree documents storage
ALTER TABLE vet_profiles 
ADD COLUMN IF NOT EXISTS degree_documents TEXT[] DEFAULT '{}';

-- Update service_providers to make vets pending
-- (Need to check if vets use service_providers or vet_profiles)
```

### Code Changes Needed

**Files to Create:**
- `src/components/admin/AdminPlacesManagement.tsx` - Place management UI
- `src/components/admin/PlaceUploadForm.tsx` - Manual place entry form
- `src/components/admin/PlaceBulkUpload.tsx` - CSV/Excel upload

**Files to Modify:**
- `supabase/functions/webpay-init/index.ts` - Floow integration
- `supabase/functions/webpay-confirm/index.ts` - Floow integration
- `src/components/admin/AdminServiceProviders.tsx` - Add vet degree viewing
- Migration to change vet default status

### Environment Variables

**Supabase Secrets (add via dashboard):**
- `FLOOW_API_KEY`: `385F03FE-E4C7-4E6F-AF79-5B6B6L86BDCC`
- `FLOOW_API_SECRET`: `ffea655c55e75f4d0aa75b6a3e44b23e3f62311f`
- `GOOGLE_MAPS_API_KEY`: `AIzaSyC38TZuq_ecRV44OLgSn21ET-pjDVCu6ek`

**Local `.env` file:**
```bash
VITE_SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YWlsYmpsdmV2a2h3Y3JvdmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjMzNTQsImV4cCI6MjA4MDUzOTM1NH0.nOWuV57bCDnA5e8SgrxVA3obCUkCf1EGwrjgmR6lJ7E
VITE_GOOGLE_CLIENT_ID_WEB=707954104528-87df2bmt6jeaqe9s6h3tjpdrqth3v03r.apps.googleusercontent.com
```

---

## ❓ Questions for Client

1. **Floow API Documentation**: Do you have Floow API documentation or endpoint URLs?
2. **Place Types**: For "routes" - are these walking routes? How should they be stored?
3. **Vet Degrees**: What format for degree documents? (PDF, images, etc.)
4. **Bulk Upload**: Preferred format for place bulk upload? (CSV structure?)

---

## ✅ Summary

**What Client Wants:**
1. ✅ Admin reviews vets manually (degree verification)
2. ✅ Other services auto-regulate (via reviews)
3. ✅ Places need manual admin input (form + bulk upload)
4. ✅ Users vs Places distinction clear

**What We Have:**
- ✅ Admin panel exists
- ✅ Verification system exists
- ✅ Places table exists
- ⚠️ Payment wrong provider (Transbank → Floow)
- ⚠️ Vets auto-approve (should be pending)
- ⚠️ No place management UI

**What Needs Doing:**
1. Update Supabase credentials ✅ (can do now)
2. Fix vet approval flow
3. Integrate Floow payment
4. Build place management UI

---

**Status**: Requirements understood. Ready to implement.

