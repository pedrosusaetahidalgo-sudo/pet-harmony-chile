# Quick Start Guide - Client Setup

**Time Required**: 15-20 minutes

---

## 🚀 Step-by-Step Setup

### 1. Database Migration (5 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Open file: `supabase/migrations/20251223000000_comprehensive_medical_records.sql`
4. Copy **ALL** contents and paste into SQL Editor
5. Click **"Run"**
6. ✅ Should see "Success" message

**What this does:**
- Creates medical documents system
- Sets up storage bucket
- Creates sharing functionality

---

### 2. Deploy Edge Functions (5 minutes)

Open terminal in project folder and run:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link project (get project ref from Supabase Dashboard → Settings)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy generate-medical-summary
supabase functions deploy generate-medical-zip
```

✅ Both functions should deploy successfully

---

### 3. Facebook Login Setup (10 minutes)

#### A. Create Facebook App

1. Go to: https://developers.facebook.com/
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Consumer"** app type
4. App Name: `Paw Friend`
5. Click **"Create App"**

#### B. Get Credentials

1. In Facebook App Dashboard → **Settings** → **Basic**
2. Copy **App ID** and **App Secret**

#### C. Configure Redirect URI

1. Go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (Replace YOUR_PROJECT_REF with your actual Supabase project ref)

#### D. Enable in Supabase

1. **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Facebook** → Click to enable
3. Enter:
   - **Client ID (App ID)**: From step B
   - **Client Secret (App Secret)**: From step B
4. Click **"Save"**

✅ Facebook login is now enabled!

---

### 4. Verify Storage Bucket (2 minutes)

1. **Supabase Dashboard** → **Storage** → **Buckets**
2. Verify `medical-documents` bucket exists
3. If missing, the migration should have created it automatically

✅ Storage is ready!

---

## ✅ Quick Verification

Test these features:

1. **Medical Documents**
   - Go to Medical Records page
   - Select a pet → "Documentos" tab
   - Try uploading a document

2. **Facebook Login**
   - Go to login page
   - Click "Continuar con Facebook"
   - Should redirect to Facebook

3. **Medical Summary**
   - In Documents tab, click "Descargar Resumen Médico (PDF)"
   - Should generate and download PDF

---

## 🆘 If Something Doesn't Work

### Medical Documents Not Working?
- Check: Storage bucket `medical-documents` exists
- Check: Migration was applied successfully
- Check: Edge Functions are deployed

### Facebook Login Not Working?
- Check: Facebook App is in "Live" mode (not Development)
- Check: Redirect URI matches exactly
- Check: App ID and Secret are correct in Supabase

### Edge Functions Not Deploying?
- Check: Supabase CLI is installed: `supabase --version`
- Check: You're logged in: `supabase projects list`
- Check: Project is linked: `supabase status`

---

## 📞 Need Help?

Refer to the detailed guide: `CLIENT_SETUP_GUIDE_COMPLETE.md`

---

**That's it!** Your app now has:
- ✅ Medical records system
- ✅ Facebook login
- ✅ PDF medical summaries
- ✅ Document sharing with vets

