# Mobile Setup - Credentials Only (No Console Access Needed)

Yes! You can complete the mobile setup with just keys, IDs, and secrets. No console access required.

---

## ✅ Already Have (From .env)

- [x] **Supabase URL** - `VITE_SUPABASE_URL`
- [x] **Supabase Publishable Key** - `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 🔑 Required Credentials (Just Strings/IDs)

### 1. Google OAuth Web Client ID ⚠️ CRITICAL

**What you need:**
- **Google OAuth 2.0 Web Client ID**
  - Format: `XXXXX-XXXXX.apps.googleusercontent.com`
  - This is a string, just copy/paste it

**Where to get it:**
- Client should provide this from Google Cloud Console
- Path: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs → Web Application

**Where to use it:**
1. `capacitor.config.ts` - Replace `YOUR_WEB_CLIENT_ID` in `serverClientId`
2. `capacitor.config.production.ts` - Replace `YOUR_WEB_CLIENT_ID` in `serverClientId`
3. `android/app/src/main/res/values/strings.xml` - Replace `YOUR_WEB_CLIENT_ID` in `server_client_id`
4. `.env` file - Add `VITE_GOOGLE_CLIENT_ID_WEB=XXXXX-XXXXX.apps.googleusercontent.com` (if not already there)

**Example:**
```typescript
// capacitor.config.ts
GoogleAuth: {
  serverClientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
}
```

```xml
<!-- android/app/src/main/res/values/strings.xml -->
<string name="server_client_id">123456789-abcdefghijklmnop.apps.googleusercontent.com</string>
```

---

### 2. Google Maps API Key (Optional but Recommended)

**What you need:**
- **Google Maps API Key** (for Android)
  - Format: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
  - This is a string, just copy/paste it

**Where to get it:**
- Client should provide this from Google Cloud Console
- Path: Google Cloud Console → APIs & Services → Credentials → API Keys

**Where to use it:**
- Can be added to Android manifest OR
- Already handled via edge function `get-google-maps-key` (if Supabase has it configured)

**Note:** If maps are working via the edge function, you might not need this separately.

---

### 3. Android Keystore (For Release Builds)

**Option A: Client provides existing keystore**
- [ ] **Keystore file**: `pawfriend-release-key.keystore`
- [ ] **Keystore password**: (string)
- [ ] **Key alias**: `pawfriend` (usually)
- [ ] **Key password**: (string)

**Option B: Create new keystore (you can do this)**
```bash
keytool -genkey -v -keystore pawfriend-release-key.keystore -alias pawfriend -keyalg RSA -keysize 2048 -validity 10000
```
- You'll be prompted for passwords
- Store credentials securely

**Where to use:**
- Already configured in `capacitor.config.ts`:
  ```typescript
  android: {
    buildOptions: {
      keystorePath: 'pawfriend-release-key.keystore',
      keystoreAlias: 'pawfriend',
    },
  }
  ```

---

## 📝 Files to Update (Once You Have Credentials)

### File 1: `capacitor.config.ts`
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // ← Replace this
  forceCodeForRefreshToken: true,
},
```

### File 2: `capacitor.config.production.ts`
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // ← Replace this
  forceCodeForRefreshToken: true,
},
```

### File 3: `android/app/src/main/res/values/strings.xml`
```xml
<string name="server_client_id">YOUR_WEB_CLIENT_ID.apps.googleusercontent.com</string>
<!-- ← Replace YOUR_WEB_CLIENT_ID with actual Client ID -->
```

### File 4: `.env` (if not already there)
```bash
VITE_GOOGLE_CLIENT_ID_WEB=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

---

## ✅ What You Can Do WITHOUT Console Access

### Build & Test Locally:
- [x] Update config files with credentials
- [x] Build web app: `npm run build`
- [x] Sync Capacitor: `npx cap sync android`
- [x] Test on Android device/emulator: `npx cap run android`
- [x] Test Google Sign-In flow
- [x] Generate signed AAB in Android Studio
- [x] Test all app features

### What You CANNOT Do Without Console Access:
- [ ] Upload to Google Play Console (needs console access)
- [ ] Create OAuth credentials (needs Google Cloud Console)
- [ ] Enable Google provider in Supabase (needs Supabase dashboard)
- [ ] Configure OAuth redirect URIs (needs Google Cloud Console)

---

## 🎯 Minimal Credentials Checklist

Ask client for these **3 things**:

1. **Google OAuth Web Client ID** (string)
   - Format: `XXXXX-XXXXX.apps.googleusercontent.com`
   - **This is the most critical one!**

2. **Android Keystore** (file + passwords) OR permission to create new
   - File: `pawfriend-release-key.keystore`
   - Keystore password
   - Key alias: `pawfriend`
   - Key password

3. **Google Maps API Key** (optional, string)
   - Format: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - Only if maps don't work via edge function

---

## 🚀 Quick Setup Steps (Once You Have Credentials)

1. **Update Google OAuth Client ID:**
   ```bash
   # Edit these 3 files and replace YOUR_WEB_CLIENT_ID:
   # - capacitor.config.ts
   # - capacitor.config.production.ts
   # - android/app/src/main/res/values/strings.xml
   ```

2. **Add to .env (if not there):**
   ```bash
   VITE_GOOGLE_CLIENT_ID_WEB=your-actual-client-id.apps.googleusercontent.com
   ```

3. **Place keystore file:**
   ```bash
   # Put pawfriend-release-key.keystore in project root
   # (same level as package.json)
   ```

4. **Build and test:**
   ```bash
   npm run build
   npx cap sync android
   npx cap run android
   ```

---

## 📋 Verification Checklist

After updating credentials:

- [ ] Google Sign-In works on Android device
- [ ] App builds without errors
- [ ] Signed AAB can be generated
- [ ] Maps work (if API key provided)
- [ ] All features work on mobile

---

## 💡 Important Notes

1. **Supabase is already configured** - You have the credentials in .env
2. **Google OAuth is the main blocker** - Just need the Web Client ID string
3. **Keystore can be created locally** - Don't need client's existing one
4. **No console access needed** - Just need the credential strings/files

---

## 🔍 How to Verify Credentials Work

1. Update all 3 files with Google Client ID
2. Build: `npm run build`
3. Sync: `npx cap sync android`
4. Run on device: `npx cap run android`
5. Try Google Sign-In - if it works, credentials are correct!

---

**Summary**: You only need **1 critical credential** (Google OAuth Web Client ID) and optionally a keystore. Everything else is already set up!

