# Client Requirements - Explained

## 🎯 What the Client Wants - Simple Breakdown

### 1. Admin Panel for Service Review

**The Issue:**
- Service providers (walkers, sitters, trainers, vets) register themselves
- Client wants to review them before they go live
- **ESPECIALLY VETS** - need to verify their degrees/licenses

**Current System:**
- ✅ Admin panel exists (`/admin`)
- ✅ Can review service providers
- ⚠️ **Problem**: Vets are currently auto-approved (status = 'approved' by default)
- ⚠️ **Problem**: No way to view/verify vet degrees in admin panel

**What Needs to Change:**
1. **Vets**: When a vet registers, status should be 'pending' (not 'approved')
2. **Vets**: Admin should be able to see and verify their degree documents
3. **Other Services**: Can stay auto-approved, quality controlled by user reviews
4. **AI Help**: Could use AI to help review, but vets need human verification

---

### 2. Two Types of Things in the App

**The Confusion:**
Client clarified there are TWO different types of entities:

#### A) **Users** (People - Service Providers)
- These are PEOPLE who offer services
- Types: Dog Walkers, Dog Sitters, Trainers, Vets
- They register themselves
- They have profiles, ratings, reviews

#### B) **Places** (Physical Locations)
- These are PHYSICAL PLACES/LOCATIONS
- Types: Parks, Vet Clinics, Routes, Restaurants, Adoption Places
- All pet-friendly physical locations
- **These need to be added by ADMIN manually**
- Need a form to input them
- Need bulk upload (CSV/Excel) to add many at once

**Current System:**
- ✅ `places` table exists
- ✅ Places can be generated via AI
- ⚠️ **Problem**: No admin form to manually add places
- ⚠️ **Problem**: No bulk upload functionality

**What Needs to Be Built:**
1. Admin form to manually add places
2. Bulk upload (CSV/Excel import)
3. Support for new place types: parks, routes, restaurants

---

### 3. Supabase Credentials

**Client Provided:**
- **URL**: `https://gwailbjlvevkhwcrovfd.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YWlsYmpsdmV2a2h3Y3JvdmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjMzNTQsImV4cCI6MjA4MDUzOTM1NH0.nOWuV57bCDnA5e8SgrxVA3obCUkCf1EGwrjgmR6lJ7E`

**Client's Question:**
> "I selected supabase free, then to upgrade to the paid one do the code need modificacitions?"

**Answer: NO** ✅
- Supabase free and paid use the same API
- Code doesn't need changes
- Only billing/limits change
- Your code will work the same

**Action:**
- Update `.env` file with new credentials
- Test that everything still works

---

### 4. Payment - Floow (NOT Transbank!)

**IMPORTANT DISCOVERY:**
- Code currently says "Transbank Webpay Plus"
- But client uses **Floow** for payments
- Floow is a payment gateway that provides Webpay integration

**Client Provided:**
- **API Key**: `385F03FE-E4C7-4E6F-AF79-5B6B6L86BDCC`
- **Secret**: `ffea655c55e75f4d0aa75b6a3e44b23e3f62311f`
- **Provider**: Floow (Webpay via Floow)

**What This Means:**
- Need to replace Transbank code with Floow
- Need Floow API documentation
- Payment functions need to be updated

---

## 📋 What Needs to Be Done

### Priority 1: Update Credentials
- [ ] Update `.env` with new Supabase URL and key
- [ ] Test connection works
- [ ] Verify app still functions

### Priority 2: Vet Verification
- [ ] Make vets start as 'pending' (not 'approved')
- [ ] Add degree document upload for vets
- [ ] Add degree viewing in admin panel
- [ ] Make admin panel show pending vets first

### Priority 3: Place Management
- [ ] Create admin form to add places manually
- [ ] Add bulk upload (CSV/Excel)
- [ ] Add new place types: parks, routes, restaurants

### Priority 4: Floow Payment
- [ ] Get Floow API documentation (ask client)
- [ ] Update payment functions
- [ ] Test payment flow

---

## 🔍 Current vs Needed

### Admin Panel
**Current:**
- ✅ Can review service providers
- ✅ Can approve/reject
- ⚠️ Vets auto-approve (should be pending)
- ⚠️ Can't see vet degrees

**Needed:**
- ✅ Vets start as pending
- ✅ Can view vet degrees
- ✅ Can verify degrees
- ✅ Prioritize pending vets in UI

### Places
**Current:**
- ✅ Places table exists
- ✅ Can generate via AI
- ⚠️ No manual admin form
- ⚠️ No bulk upload

**Needed:**
- ✅ Admin form to add places
- ✅ Bulk upload (CSV/Excel)
- ✅ Support parks, routes, restaurants

### Payment
**Current:**
- ⚠️ References Transbank (wrong provider)
- ⚠️ Payment functions are simulated

**Needed:**
- ✅ Integrate Floow API
- ✅ Real payment processing
- ✅ Test payment flow

---

## ✅ Summary

**Client's Main Points:**
1. **Vets need manual review** (degree verification)
2. **Other services can auto-approve** (regulated by reviews)
3. **Places need admin input** (form + bulk upload)
4. **Payment uses Floow** (not Transbank)

**What We Have:**
- ✅ Admin panel (needs vet enhancements)
- ✅ Places table (needs admin UI)
- ✅ Payment structure (needs Floow integration)

**What to Build:**
1. Vet degree verification system
2. Admin place management UI
3. Floow payment integration

---

**Status**: Requirements understood. Ready to implement changes.

