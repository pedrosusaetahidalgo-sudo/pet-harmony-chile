# Client Requirements Analysis

## 📋 Understanding Client's Requirements

### 1. Admin Panel for Service Review

**Client's Request:**
- Admin panel to review service provider forms
- **Vets are CRITICAL** - need manual review with degree verification
- Other services (walkers, sitters, trainers) can auto-regulate via user feedback/reviews
- Maybe use AI for review assistance

**Current State:**
- ✅ Admin panel exists (`AdminServiceProviders.tsx`)
- ✅ Verification system exists (`AdminVerificationRequests.tsx`)
- ✅ Vets have `license_number` field in `vet_profiles` table
- ✅ Service providers have `status` field (pending, approved, rejected)
- ⚠️ Currently all providers auto-approve (status defaults to 'approved')

**What Needs to Change:**
1. **Vets**: Change default status to 'pending', require manual admin approval
2. **Other Services**: Can auto-approve but need review system for quality
3. **AI Review**: Could enhance existing `moderate-service-promotion` function for vets
4. **Degree Verification**: Need UI to upload/view vet degrees in admin panel

---

### 2. Two Types of Entities

**Client's Clarification:**

#### A) **Users** (Service Providers)
- Register themselves
- Types: Dog Walkers, Dog Sitters, Trainers, Vets
- These are PEOPLE who offer services

#### B) **Places** (Physical Locations)
- Parks, Vets (clinics), Routes, Restaurants, Adoption Places
- All pet-friendly physical locations
- **Need manual input** via pre-made form that can be uploaded
- These are PLACES/LOCATIONS, not users

**Current State:**
- ✅ `places` table exists
- ✅ `adoption_shelters` table exists (for adoption places)
- ✅ Places can be generated via AI (`generate-places` function)
- ⚠️ No admin form for manual place upload yet
- ⚠️ No bulk upload/CSV import functionality

**What Needs to Be Built:**
1. **Admin Place Management Form**:
   - Form to manually add places
   - Fields: name, type, address, coordinates, phone, website, etc.
   - Upload photos
   - Bulk upload via CSV/Excel

2. **Place Categories**:
   - Parks
   - Vet Clinics (physical locations)
   - Routes (walking routes?)
   - Restaurants (pet-friendly)
   - Adoption Places (shelters)

---

### 3. Supabase Credentials

**Received:**
- **URL**: `https://gwailbjlvevkhwcrovfd.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YWlsYmpsdmV2a2h3Y3JvdmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjMzNTQsImV4cCI6MjA4MDUzOTM1NH0.nOWuV57bCDnA5e8SgrxVA3obCUkCf1EGwrjgmR6lJ7E`

**Question**: "If upgrading from free to paid, does code need modifications?"

**Answer**: **NO** - Supabase code is compatible. The API and structure remain the same. Only billing/limits change.

**Action Needed:**
- Update `.env` file with these credentials
- Test connection

---

### 4. Payment Integration - Floow (NOT Transbank!)

**Client Provided:**
- **API Key**: `385F03FE-E4C7-4E6F-AF79-5B6B6L86BDCC`
- **Secret**: `ffea655c55e75f4d0aa75b6a3e44b23e3f62311f`
- **Provider**: Floow (Webpay integration via Floow)
- **URL**: Not provided, need to check Floow documentation

**Current State:**
- ⚠️ Code currently references "Transbank Webpay Plus"
- ⚠️ `webpay-init` and `webpay-confirm` functions are simulated
- ⚠️ Need to integrate with Floow API instead

**What Needs to Change:**
1. Replace Transbank references with Floow
2. Update `webpay-init` function to use Floow API
3. Update `webpay-confirm` function to use Floow API
4. Add Floow API credentials to Supabase secrets

---

## 🎯 Priority Tasks Breakdown

### HIGH PRIORITY (Critical for Launch)

1. **Update Supabase Credentials**
   - [ ] Update `.env` with new Supabase URL and key
   - [ ] Test connection
   - [ ] Verify all features work

2. **Vet Verification System**
   - [ ] Change vet default status to 'pending'
   - [ ] Add degree upload/view in admin panel
   - [ ] Enhance admin panel to show vet degrees
   - [ ] Add AI-assisted review for vets (optional)

3. **Payment Integration - Floow**
   - [ ] Research Floow API documentation
   - [ ] Update `webpay-init` function
   - [ ] Update `webpay-confirm` function
   - [ ] Add Floow credentials to Supabase secrets
   - [ ] Test payment flow

### MEDIUM PRIORITY

4. **Admin Place Management**
   - [ ] Create admin form for manual place entry
   - [ ] Add bulk upload (CSV/Excel) functionality
   - [ ] Add place categories (parks, routes, restaurants)
   - [ ] Update places table if needed

5. **Service Provider Auto-Regulation**
   - [ ] Keep auto-approve for non-vets
   - [ ] Add review/rating system for quality control
   - [ ] Add suspension mechanism for low-rated providers

---

## 📝 Detailed Requirements

### Vet Verification Flow

**Current:**
```sql
-- vet_profiles table has:
license_number TEXT NOT NULL,
is_verified BOOLEAN NOT NULL DEFAULT false,
```

**Needed:**
1. When vet registers, status should be 'pending' (not 'approved')
2. Admin panel should show:
   - Vet name, license number
   - Uploaded degree/certificate documents
   - Ability to verify degree authenticity
   - Approve/Reject with notes
3. AI could help by:
   - Extracting info from degree images
   - Verifying license number format
   - Flagging suspicious documents

### Places Management

**Current:**
- Places table exists with all needed fields
- AI can generate places
- No manual admin interface

**Needed:**
1. Admin form with fields:
   - Name, Type, Address, Coordinates
   - Phone, Website, Hours
   - Photos, Amenities
   - Description
2. Bulk upload:
   - CSV format with columns matching place fields
   - Excel import
   - Validation and preview before import
3. Place types to support:
   - `parque` (park)
   - `veterinaria` (vet clinic - physical location)
   - `ruta` (route) - NEW
   - `restaurante` (restaurant) - NEW
   - `adopcion` (adoption place)
   - Existing: `peluqueria`, `tienda`, `hotel`, `guarderia`

---

## 🔧 Technical Changes Needed

### 1. Database Changes

```sql
-- Make vets require approval
ALTER TABLE vet_profiles 
ALTER COLUMN is_verified SET DEFAULT false;

-- Add degree document storage
ALTER TABLE vet_profiles 
ADD COLUMN IF NOT EXISTS degree_documents TEXT[] DEFAULT '{}';

-- Update places table to support new types
-- (Already supports TEXT type, so just need to add new values)
```

### 2. Code Changes

**Files to Modify:**
- `supabase/functions/webpay-init/index.ts` - Floow integration
- `supabase/functions/webpay-confirm/index.ts` - Floow integration
- `src/components/admin/AdminServiceProviders.tsx` - Vet degree viewing
- `src/components/admin/AdminVerificationRequests.tsx` - Vet-specific review
- New: `src/components/admin/AdminPlacesManagement.tsx` - Place management
- New: `src/components/admin/PlaceUploadForm.tsx` - Manual place entry
- New: `src/components/admin/PlaceBulkUpload.tsx` - CSV/Excel upload

### 3. Environment Variables

**Add to Supabase Secrets:**
- `FLOOW_API_KEY`: `385F03FE-E4C7-4E6F-AF79-5B6B6L86BDCC`
- `FLOOW_API_SECRET`: `ffea655c55e75f4d0aa75b6a3e44b23e3f62311f`

**Update `.env`:**
- `VITE_SUPABASE_URL`: `https://gwailbjlvevkhwcrovfd.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## ✅ Summary

### What Client Wants:
1. **Admin reviews vets manually** (degree verification critical)
2. **Other services auto-regulate** (via reviews)
3. **Places need manual admin input** (form + bulk upload)
4. **Users vs Places distinction** (people vs locations)

### What We Have:
- ✅ Admin panel exists
- ✅ Verification system exists
- ✅ Places table exists
- ⚠️ Payment uses wrong provider (Transbank vs Floow)
- ⚠️ Vets auto-approve (should be pending)
- ⚠️ No place management UI

### What Needs to Be Done:
1. Update Supabase credentials
2. Fix vet approval flow (make pending by default)
3. Add vet degree viewing in admin
4. Integrate Floow payment API
5. Build admin place management UI
6. Add bulk place upload

---

**Next Steps**: Prioritize these tasks and implement them.

