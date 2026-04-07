# Mobile/Capacitor Tasks Checklist

This document focuses specifically on mobile app development tasks using Capacitor.

---

## 📱 Current Mobile Setup

### ✅ Already Configured
- [x] Capacitor installed (`@capacitor/core`, `@capacitor/cli`)
- [x] Android platform added (`@capacitor/android`)
- [x] iOS platform added (`@capacitor/ios`)
- [x] Google Auth plugin (`@codetrix-studio/capacitor-google-auth`)
- [x] Basic Capacitor config (`capacitor.config.ts`)
- [x] Production config (`capacitor.config.production.ts`)
- [x] Android project structure
- [x] iOS project structure (requires Mac/Xcode)

### 📦 Capacitor Plugins Used
- `@capacitor/splash-screen` - Splash screen
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/keyboard` - Keyboard handling
- `@codetrix-studio/capacitor-google-auth` - Google Sign-In

---

## 🔧 Mobile-Specific Tasks

### 1. Google OAuth Configuration (CRITICAL)

#### Files to Update:
- [ ] `capacitor.config.ts` - Replace `YOUR_WEB_CLIENT_ID` with real Web Client ID
- [ ] `capacitor.config.production.ts` - Replace `YOUR_WEB_CLIENT_ID` with real Web Client ID
- [ ] `android/app/src/main/res/values/strings.xml` - Add `server_client_id` string resource

#### What You Need from Client:
- [ ] **Google Cloud Console OAuth 2.0 Client ID (Web Application)**
  - Format: `XXXXX.apps.googleusercontent.com`
  - This is the `serverClientId` for Capacitor Google Auth plugin

#### Steps:
1. Get Web Client ID from client
2. Update both config files
3. Update Android strings.xml
4. Test Google Sign-In on Android device/emulator

---

### 2. Android Build & Signing

#### Keystore Creation (If Not Exists)
- [ ] Generate production keystore:
  ```bash
  keytool -genkey -v -keystore pawfriend-release-key.keystore -alias pawfriend -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Store keystore credentials securely:
  - Keystore password
  - Key alias: `pawfriend`
  - Key password

#### Build Configuration
- [ ] Verify `android/app/build.gradle` has signing config
- [ ] Verify `android/variables.gradle` has keystore path
- [ ] Test debug build: `npx cap run android`
- [ ] Test release build: Generate signed AAB in Android Studio

---

### 3. Production Build Process

#### Scripts Available:
- [x] `scripts/prepare-production.sh` - Prepares production build
- [x] `scripts/restore-development.sh` - Restores dev config

#### Steps for Production Build:
1. [ ] Run `./scripts/prepare-production.sh`
2. [ ] Verify `capacitor.config.ts` has no `server.url` (uses local files)
3. [ ] Build web: `npm run build`
4. [ ] Sync Capacitor: `npx cap sync android`
5. [ ] Open Android Studio: `npx cap open android`
6. [ ] Generate signed AAB: Build > Generate Signed Bundle / APK

---

### 4. Android App Configuration

#### Files to Check/Update:
- [ ] `android/app/src/main/AndroidManifest.xml`
  - Package name: `cl.pawfriend.app`
  - Permissions (camera, location, internet, etc.)
  - Deep links configuration
  
- [ ] `android/app/src/main/res/values/strings.xml`
  - App name
  - Google OAuth `server_client_id`
  
- [ ] `android/app/build.gradle`
  - Version code and version name
  - Target SDK (currently 35)
  - Min SDK (currently 24)
  - Dependencies

- [ ] `android/app/src/main/res/mipmap-*/ic_launcher.png`
  - App icon (various densities)
  - Adaptive icon (if using)

---

### 5. iOS App Configuration (If Working on iOS)

#### Requirements:
- [ ] Mac with Xcode installed
- [ ] Apple Developer account
- [ ] iOS provisioning profiles

#### Files to Check:
- [ ] `ios/App/App.xcodeproj` - Project settings
- [ ] `ios/App/Info.plist` - App configuration
- [ ] `ios/App/AppDelegate.swift` - App delegate
- [ ] Google OAuth configuration for iOS

---

### 6. Testing on Devices

#### Android Testing:
- [ ] Test on physical Android device
- [ ] Test on Android emulator
- [ ] Test Google Sign-In flow
- [ ] Test deep links (if implemented)
- [ ] Test push notifications (if implemented)
- [ ] Test camera access (for pet photos)
- [ ] Test location access (for maps)
- [ ] Test payment flow (Webpay)

#### iOS Testing (If Applicable):
- [ ] Test on physical iOS device
- [ ] Test on iOS simulator
- [ ] Test Google Sign-In flow
- [ ] Test all features

---

### 7. Google Play Store Preparation

#### Required from Client:
- [ ] Google Play Console developer account access
- [ ] App signing key (or create new)
- [ ] Store listing information:
  - App name: "Paw Friend"
  - Short description (50 chars)
  - Full description (4000 chars)
  - Screenshots (2-8 images)
  - Feature graphic (1024x500)
  - App icon (512x512)
  - Privacy Policy URL
  - Terms of Service URL

#### Build Steps:
1. [ ] Generate signed AAB
2. [ ] Upload to Google Play Console (internal/closed testing)
3. [ ] Complete store listing
4. [ ] Submit for review

---

### 8. Mobile-Specific Features to Verify

#### Native Features:
- [ ] Splash screen displays correctly
- [ ] Status bar styling matches app theme
- [ ] Keyboard behavior (resize, dismiss)
- [ ] Back button handling (Android)
- [ ] Swipe gestures (iOS)
- [ ] Deep linking (if implemented)
- [ ] Push notifications (if implemented)

#### Capacitor Plugins:
- [ ] Google Auth works on mobile
- [ ] Camera access (for pet photos)
- [ ] Location access (for maps)
- [ ] File system access (if needed)
- [ ] Network status (if needed)

---

### 9. Performance Optimization

#### Mobile-Specific:
- [ ] Bundle size optimization
- [ ] Image optimization (compression, lazy loading)
- [ ] Code splitting for mobile
- [ ] Remove unused dependencies
- [ ] Test on low-end devices
- [ ] Memory usage monitoring
- [ ] Battery usage optimization

---

### 10. Mobile UI/UX Adjustments

#### Responsive Design:
- [ ] All pages work on mobile screens (320px - 768px)
- [ ] Touch targets are adequate (min 44x44px)
- [ ] Forms are mobile-friendly
- [ ] Navigation works on mobile
- [ ] Modals/dialogs fit mobile screens
- [ ] Maps are touch-friendly
- [ ] Tables are scrollable on mobile

#### Mobile-Specific UI:
- [ ] Bottom navigation (if using)
- [ ] Pull-to-refresh (if implemented)
- [ ] Swipe actions (if implemented)
- [ ] Haptic feedback (if implemented)

---

## 📋 Quick Reference Commands

### Development
```bash
# Install dependencies
npm install

# Build web app
npm run build

# Sync with Capacitor
npx cap sync android
npx cap sync ios

# Open in native IDE
npx cap open android
npx cap open ios

# Run on device/emulator
npx cap run android
npx cap run ios
```

### Production Build
```bash
# Prepare production
./scripts/prepare-production.sh

# Or manually:
cp capacitor.config.production.ts capacitor.config.ts
npm run build
npx cap sync android

# Open Android Studio to generate AAB
npx cap open android
```

### Restore Development
```bash
./scripts/restore-development.sh
```

---

## 🚨 Critical Mobile-Specific Credentials Needed

### From Client (Priority Order):

1. **Google OAuth Web Client ID** ⚠️ CRITICAL
   - Needed for: Google Sign-In on mobile
   - Where: Google Cloud Console → OAuth 2.0 Client IDs
   - Update in: `capacitor.config.ts`, `capacitor.config.production.ts`, `android/app/src/main/res/values/strings.xml`

2. **Google Maps API Key (Android)**
   - Needed for: Maps functionality
   - Where: Google Cloud Console → Credentials
   - Update in: Android manifest or via edge function

3. **Android Keystore** (or create new)
   - Needed for: Signing release builds
   - Location: `pawfriend-release-key.keystore`
   - Credentials: Must be stored securely

4. **Google Play Console Access**
   - Needed for: Publishing app
   - Access: Developer account or invite

---

## 📝 Mobile Testing Checklist

### Functionality Testing:
- [ ] App launches without errors
- [ ] All navigation works
- [ ] Google Sign-In works
- [ ] Forms submit correctly
- [ ] Images load and display
- [ ] Maps load and display
- [ ] Payments work (Webpay)
- [ ] Camera access works
- [ ] Location access works
- [ ] Notifications work (if implemented)

### Performance Testing:
- [ ] App loads quickly (< 3 seconds)
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Battery usage acceptable
- [ ] Works on slow network

### Device Testing:
- [ ] Android 7.0+ (API 24+)
- [ ] Different screen sizes
- [ ] Different Android versions
- [ ] Physical devices
- [ ] Emulators

---

## 📚 Documentation References

- **Google Play Guide**: `GOOGLE_PLAY_README.md`
- **Google Auth Setup**: `docs/GOOGLE_AUTH_SETUP.md`
- **Capacitor Migration**: `docs/CAPACITOR_MIGRATION_CHECKLIST.md`
- **General README**: `README.md`

---

## 🎯 Current Status

### ✅ Completed:
- Capacitor setup and configuration
- Android project structure
- iOS project structure
- Basic plugin configuration
- Production build scripts

### ⏳ Pending (Requires Client Credentials):
- Google OAuth configuration
- Production keystore (or confirmation)
- Google Play Console setup
- Final testing on devices

---

**Last Updated**: 2024-12-04
**Focus**: Mobile/Capacitor Development

