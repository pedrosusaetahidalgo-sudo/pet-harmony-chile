# Client Requirements - Final Summary

## ✅ What I Understand from Client Discussion

### 1. Admin Panel - Service Review System

**Client's Request:**
> "Its important somehow that we have an admin panel for us, to review the services forms or maybe with ia? Maybe the only one more important to review are the vets, maybe with the degree? the others with People feedback and review sistem it will auto regulate."

**Translation:**
- Admin panel needed to review service provider applications
- **VETS are CRITICAL** - must be manually reviewed with degree verification
- Other services (walkers, sitters, trainers) can auto-approve and regulate via user reviews
- AI can assist but vets need human verification

**What This Means:**
- ✅ Admin panel exists - just needs enhancements
- ⚠️ Vets currently auto-approve → Need to make them 'pending'
- ⚠️ No degree viewing in admin → Need to add this
- ✅ Other services can stay auto-approved

---

### 2. Two Entity Types - Users vs Places

**Client's Clarification:**
> "Also, there are users and there are places (parks, vets, routes, restaurants, adoption places all pet friendly things) for planes ther has to be something to input manually. ( a pre made form that we can upload with information) And for users they registro themselves."

**Translation:**

#### **Users** (Service Providers - PEOPLE)
- Register themselves
- Types: Dog Walkers, Dog Sitters, Trainers, Vets
- These are individuals offering services
- ✅ Already works - users can register

#### **Places** (Physical Locations)
- Parks, Vet Clinics, Routes, Restaurants, Adoption Places
- All pet-friendly physical locations
- **Need manual admin input** via form
- **Need bulk upload** (CSV/Excel) capability
- ⚠️ Currently only AI-generated, no manual form

**What Needs to Be Built:**
1. Admin form to manually add places
2. Bulk upload functionality (CSV/Excel)
3. Support for new place types: parks, routes, restaurants

---

### 3. Supabase Credentials

**Client Provided:**
- **URL**: `https://gwailbjlvevkhwcrovfd.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YWlsYmpsdmV2a2h3Y3JvdmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjMzNTQsImV4cCI6MjA4MDUzOTM1NH0.nOWuV57bCDnA5e8SgrxVA3obCUkCf1EGwrjgmR6lJ7E`

**Client's Question:**
> "I selected supabase free, then to upgrade to the paid one do the code need modificacitions?"

**Answer: NO** ✅
- Supabase free and paid use identical APIs
- Code is fully compatible
- Only billing/limits change
- No code modifications needed

**Status:** ✅ Updated `.env` file with new credentials

---

### 4. Payment Integration - Floow (NOT Transbank!)

**IMPORTANT:** The code currently references "Transbank" but client uses **Floow**!

**Client Provided:**
- **API Key**: `385F03FE-E4C7-4E6F-AF79-5B6B6L86BDCC`
- **Secret**: `ffea655c55e75f4d0aa75b6a3e44b23e3f62311f`
- **Provider**: Floow (Webpay integration via Floow)

**What This Means:**
- Floow is a payment gateway that provides Webpay integration
- Need to replace Transbank references with Floow
- Need Floow API documentation to integrate properly
- Current payment functions are simulated - need real Floow integration

---

## 📋 Action Items

### ✅ Completed
- [x] Updated `.env` with new Supabase credentials
- [x] Updated Capacitor configs with Google OAuth Client ID
- [x] Updated Android strings.xml with Google OAuth Client ID
- [x] Created comprehensive documentation

### 🔨 Need to Build

#### 1. Vet Verification System
- [ ] Change vet default status to 'pending' (database migration)
- [ ] Add degree document upload field to vet registration
- [ ] Add degree viewing in admin panel
- [ ] Prioritize pending vets in admin UI
- [ ] Add AI-assisted review (optional enhancement)

#### 2. Admin Place Management
- [ ] Create admin form for manual place entry
- [ ] Add bulk upload (CSV/Excel import)
- [ ] Add place types: parks, routes, restaurants
- [ ] Add to admin panel tabs

#### 3. Floow Payment Integration
- [ ] Get Floow API documentation (ask client)
- [ ] Update `webpay-init` function
- [ ] Update `webpay-confirm` function
- [ ] Add Floow credentials to Supabase secrets
- [ ] Test payment flow

---

## 🔧 Technical Details

### Database Changes Needed

```sql
-- Make vets require approval
ALTER TABLE vet_profiles 
ALTER COLUMN is_verified SET DEFAULT false;

-- Add degree documents storage
ALTER TABLE vet_profiles 
ADD COLUMN IF NOT EXISTS degree_documents TEXT[] DEFAULT '{}';

-- Update service_providers status for vets
-- (Check if vets use service_providers table)
```

### Files to Create
- `src/components/admin/AdminPlacesManagement.tsx`
- `src/components/admin/PlaceUploadForm.tsx`
- `src/components/admin/PlaceBulkUpload.tsx`

### Files to Modify
- `supabase/functions/webpay-init/index.ts` (Floow integration)
- `supabase/functions/webpay-confirm/index.ts` (Floow integration)
- `src/components/admin/AdminServiceProviders.tsx` (vet degree viewing)
- Database migration for vet status

### Supabase Secrets to Add
- `FLOOW_API_KEY`: `385F03FE-E4C7-4E6F-AF79-5B6B6L86BDCC`
- `FLOOW_API_SECRET`: `ffea655c55e75f4d0aa75b6a3e44b23e3f62311f`
- `GOOGLE_MAPS_API_KEY`: `AIzaSyC38TZuq_ecRV44OLgSn21ET-pjDVCu6ek`

---

## ❓ Questions for Client

1. **Floow API Documentation**: Do you have Floow API documentation or endpoint URLs?
2. **Place Routes**: What exactly are "routes"? Walking routes? How should they be stored?
3. **Vet Degrees**: What format for degree documents? (PDF, images, etc.)
4. **Bulk Upload Format**: What CSV structure do you prefer for places?

---

## ✅ Summary

**What Client Wants:**
1. ✅ Admin reviews vets manually (degree verification critical)
2. ✅ Other services auto-regulate (via user reviews)
3. ✅ Places need manual admin input (form + bulk upload)
4. ✅ Payment uses Floow (not Transbank)

**What We Have:**
- ✅ Admin panel (needs vet enhancements)
- ✅ Places table (needs admin UI)
- ✅ Payment structure (needs Floow integration)
- ✅ Supabase credentials updated

**What to Build:**
1. Vet degree verification system
2. Admin place management UI
3. Floow payment integration

---

**Status**: Requirements fully understood. Credentials updated. Ready to implement features.

