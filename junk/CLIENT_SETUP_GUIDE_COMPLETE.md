# Complete Client Setup Guide - Paw Friend App

This guide covers all the new features and changes that need to be configured in Supabase and other services.

---

## 📋 Table of Contents

1. [Database Migrations](#1-database-migrations)
2. [Supabase Storage Setup](#2-supabase-storage-setup)
3. [Edge Functions Deployment](#3-edge-functions-deployment)
4. [Authentication Providers](#4-authentication-providers)
5. [Google Services Configuration](#5-google-services-configuration)
6. [Facebook Login Setup](#6-facebook-login-setup)
7. [Testing Checklist](#7-testing-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Database Migrations

### Step 1.1: Apply Medical Records Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the contents of:
   ```
   supabase/migrations/20251223000000_comprehensive_medical_records.sql
   ```
4. Click **"Run"** to execute the migration
5. Verify success: Check that no errors appear

**What this creates:**
- `medical_documents` table
- `medical_share_tokens` table
- Extends `pets` table with `allergies` and `chronic_conditions`
- Enhances `medical_records` table
- Creates storage bucket policies
- Creates helper functions

### Step 1.2: Verify Tables Created

Go to **Database** → **Tables** and verify these tables exist:
- ✅ `medical_documents`
- ✅ `medical_share_tokens`
- ✅ `pets` (should have new columns: `allergies`, `chronic_conditions`)
- ✅ `medical_records` (should have new columns: `owner_id`, `visit_date`, `clinic_name`, `vet_name`, `reason`, `diagnosis`, `treatment`, `next_checkup_date`)

---

## 2. Supabase Storage Setup

### Step 2.1: Verify Medical Documents Bucket

1. Go to **Storage** → **Buckets**
2. Check if `medical-documents` bucket exists
3. If it doesn't exist, the migration should have created it. If not:

**Manual Creation:**
1. Click **"New bucket"**
2. Name: `medical-documents`
3. Public: **OFF** (Private)
4. File size limit: `10485760` (10MB)
5. Allowed MIME types:
   - `image/jpeg`
   - `image/jpg`
   - `image/png`
   - `image/heic`
   - `application/pdf`
6. Click **"Create bucket"**

### Step 2.2: Verify Storage Policies

Go to **Storage** → **Policies** → `medical-documents` bucket

You should see these policies:
- ✅ "Authenticated users can upload medical documents"
- ✅ "Owners can view their medical documents"
- ✅ "Owners can update their medical documents"
- ✅ "Owners can delete their medical documents"

If policies are missing, the migration should have created them. If not, they will be created automatically when the first document is uploaded.

---

## 3. Edge Functions Deployment

### Step 3.1: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### Step 3.2: Login to Supabase

```bash
supabase login
```

### Step 3.3: Link Your Project

```bash
cd pet-harmony-chile-main
supabase link --project-ref YOUR_PROJECT_REF
```

(Find your project ref in Supabase Dashboard → Settings → General → Reference ID)

### Step 3.4: Deploy Edge Functions

```bash
# Deploy medical summary generator
supabase functions deploy generate-medical-summary

# Deploy medical ZIP generator
supabase functions deploy generate-medical-zip
```

### Step 3.5: Verify Functions

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Verify both functions are listed:
   - ✅ `generate-medical-summary`
   - ✅ `generate-medical-zip`

### Step 3.6: Set Function Secrets (if needed)

If functions need additional API keys, go to:
**Edge Functions** → Select function → **Settings** → **Secrets**

---

## 4. Authentication Providers

### Step 4.1: Google OAuth (Already Configured)

✅ Should already be set up from previous instructions.

**Verify:**
1. Go to **Authentication** → **Providers**
2. Ensure **Google** is enabled
3. Verify Client ID and Client Secret are set

### Step 4.2: Facebook OAuth (NEW - Required)

1. Go to **Authentication** → **Providers**
2. Find **Facebook** and click to enable
3. You'll need to create a Facebook App:

#### Create Facebook App:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Consumer"** or **"Business"** app type
4. Fill in app details:
   - App Name: `Paw Friend`
   - App Contact Email: Your email
5. Click **"Create App"**

#### Get Facebook Credentials:

1. In Facebook App Dashboard, go to **Settings** → **Basic**
2. Note your **App ID** and **App Secret**
3. Add **App Domains**: Your domain (e.g., `pawfriend.cl`)
4. Add **Site URL**: Your app URL

#### Configure OAuth Redirect URIs:

1. In Facebook App Dashboard, go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   https://yourdomain.com/auth/v1/callback
   ```

#### Add to Supabase:

1. Go back to **Supabase Dashboard** → **Authentication** → **Providers** → **Facebook**
2. Enable Facebook provider
3. Enter:
   - **Client ID (App ID)**: From Facebook App
   - **Client Secret (App Secret)**: From Facebook App
4. Click **"Save"**

---

## 5. Google Services Configuration

### Step 5.1: Google Maps API (Already Configured)

✅ Should already be set up.

**Verify:**
- Environment variable `VITE_GOOGLE_MAPS_API_KEY` is set
- API key has these APIs enabled:
  - Maps JavaScript API
  - Places API
  - Geocoding API

### Step 5.2: Google Calendar API (Optional - For Provider Availability Sync)

**Note:** This is optional. The feature will show a message that it's coming soon if not configured.

#### Enable Google Calendar API:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Library**
4. Search for **"Google Calendar API"**
5. Click **"Enable"**

#### Create OAuth 2.0 Credentials (if not already done):

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Application type: **Web application**
4. Add authorized redirect URIs:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
5. Note the **Client ID** and **Client Secret**

#### Add to Supabase (Optional):

The Google Calendar sync uses the same OAuth credentials as Google Sign-In. No additional setup needed in Supabase.

**Note:** Full Google Calendar integration requires additional OAuth scopes. This is a future enhancement.

---

## 6. Facebook Login Setup

### Step 6.1: Verify Facebook Provider

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Ensure **Facebook** is enabled (see Step 4.2 above)
3. Test Facebook login:
   - Go to your app
   - Click "Continuar con Facebook"
   - Should redirect to Facebook login

### Step 6.2: Mobile Configuration (iOS/Android)

For mobile apps, you may need to configure Facebook SDK:

**iOS:**
- Add Facebook App ID to `Info.plist`
- Configure URL schemes

**Android:**
- Add Facebook App ID to `strings.xml`
- Configure OAuth redirect URIs

(These are typically handled by Capacitor plugins if using native Facebook SDK)

---

## 7. Testing Checklist

### Medical Records System

- [ ] **Upload Document**
  1. Go to Medical Records page
  2. Select a pet
  3. Click "Documentos" tab
  4. Click "Subir Documento"
  5. Upload a PDF or image
  6. Verify it appears in the list

- [ ] **View Document**
  1. Click "Ver" on a document
  2. Verify it opens in dialog/viewer

- [ ] **Download Document**
  1. Click "Descargar" on a document
  2. Verify file downloads

- [ ] **Delete Document**
  1. Click "Eliminar" on a document
  2. Confirm deletion
  3. Verify document is removed

- [ ] **Generate Medical Summary PDF**
  1. Click "Descargar Resumen Médico (PDF)"
  2. Wait for generation
  3. Verify PDF opens with all pet information

- [ ] **Share with Vet**
  1. Click "Compartir con Veterinario"
  2. Verify link is copied to clipboard
  3. Verify token is created in database

- [ ] **Download All as ZIP**
  1. Click "Descargar Todo (ZIP)"
  2. Verify download starts (or list of documents is shown)

### Authentication

- [ ] **Facebook Login**
  1. Go to login page
  2. Click "Continuar con Facebook"
  3. Complete Facebook login
  4. Verify redirect to app
  5. Verify user is logged in

- [ ] **Google Login** (Verify still works)
  1. Click "Continuar con Google"
  2. Complete Google login
  3. Verify redirect to app

### Google Places Integration

- [ ] **Places Page**
  1. Go to Places/Map page
  2. Verify places load
  3. Verify Google Places photos appear (if available)
  4. Verify ratings and addresses are from Google Places

### Google Calendar Sync (Optional)

- [ ] **Provider Availability**
  1. Go to provider profile (as a service provider)
  2. Go to availability manager
  3. Click "Sincronizar con Google Calendar"
  4. Verify message appears (feature coming soon if not fully configured)

---

## 8. Troubleshooting

### Medical Documents Not Uploading

**Problem:** "Error al subir documento"

**Solutions:**
1. Check storage bucket exists: `medical-documents`
2. Verify storage policies are set correctly
3. Check file size (max 10MB)
4. Check file type (JPG, PNG, HEIC, PDF only)
5. Verify RLS policies allow INSERT for authenticated users

### Medical Summary PDF Not Generating

**Problem:** "Error al generar resumen médico"

**Solutions:**
1. Verify Edge Function is deployed: `generate-medical-summary`
2. Check Edge Function logs in Supabase Dashboard
3. Verify `get_medical_summary_data` function exists in database
4. Check that pet has medical records

### Facebook Login Not Working

**Problem:** "Error al iniciar sesión con Facebook"

**Solutions:**
1. Verify Facebook provider is enabled in Supabase
2. Check App ID and App Secret are correct
3. Verify OAuth redirect URI is added in Facebook App settings
4. Check Facebook App is in "Live" mode (not Development)
5. Verify app domain is added in Facebook App settings

### Google Places Not Loading

**Problem:** Places show default images, no Google data

**Solutions:**
1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`
2. Check Google Cloud Console - Places API is enabled
3. Verify API key has Places API enabled
4. Check browser console for API errors
5. Verify API key billing is set up (if required)

### Edge Functions Not Deploying

**Problem:** `supabase functions deploy` fails

**Solutions:**
1. Verify Supabase CLI is installed: `supabase --version`
2. Check you're logged in: `supabase projects list`
3. Verify project is linked: `supabase status`
4. Check function code for syntax errors
5. Verify you have deployment permissions

---

## 9. Environment Variables Checklist

Verify these are set in your `.env` file:

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Google
VITE_GOOGLE_CLIENT_ID_WEB=your_google_client_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Facebook (if using native SDK)
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

---

## 10. Post-Setup Verification

### Database Verification

Run this query in Supabase SQL Editor to verify everything is set up:

```sql
-- Check medical_documents table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'medical_documents';

-- Check medical_share_tokens table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'medical_share_tokens';

-- Check pets table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'pets' 
AND column_name IN ('allergies', 'chronic_conditions');

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_medical_summary_data', 'generate_medical_share_token', 'is_valid_share_token');
```

All should return results.

### Storage Verification

1. Go to **Storage** → **Buckets**
2. Verify `medical-documents` bucket exists
3. Click on bucket → **Policies**
4. Verify 4 policies exist (upload, view, update, delete)

### Edge Functions Verification

1. Go to **Edge Functions**
2. Verify both functions are listed and active
3. Click on a function → **Logs** to see recent activity

---

## 11. Important Notes

### Medical Records System

- **File Size Limit**: 10MB per document
- **Storage Path**: Documents are stored in `{owner_id}/{pet_id}/{uuid}.{ext}`
- **Privacy**: All documents are private - only owners can access
- **Share Tokens**: Expire after 30 days by default (configurable)

### Facebook Login

- **Development Mode**: Facebook apps start in Development mode
- **Test Users**: Add test users in Facebook App Dashboard for testing
- **App Review**: For production, submit app for Facebook review
- **Permissions**: Request only necessary permissions (email, profile)

### Google Calendar Sync

- **Current Status**: Basic structure implemented
- **Full Integration**: Requires additional OAuth scopes and setup
- **User Experience**: Shows "coming soon" message if not fully configured

---

## 12. Support & Resources

### Supabase Documentation
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Facebook Developer Resources
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login/web)
- [App Review Process](https://developers.facebook.com/docs/app-review)

### Google Cloud Resources
- [Google Maps API](https://developers.google.com/maps/documentation)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)

---

## ✅ Completion Checklist

Before considering setup complete, verify:

- [ ] Database migration applied successfully
- [ ] All tables created and verified
- [ ] Storage bucket `medical-documents` exists
- [ ] Storage policies are set
- [ ] Edge Functions deployed
- [ ] Facebook OAuth configured
- [ ] Google OAuth still working
- [ ] Google Maps API key configured
- [ ] Environment variables set
- [ ] Test upload of medical document works
- [ ] Test Facebook login works
- [ ] Test medical summary PDF generation works

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Complete Implementation Guide

