# Testing Guide for Priority 1 Features

This guide helps you test the features we've implemented without needing credentials.

---

## 🗺️ Feature 1: Interactive Map Enhancements

### What Was Implemented
- ✅ Rich map popup component (`MapPinPopup.tsx`)
- ✅ Distance calculation utility
- ✅ Quick action buttons (View Details, Book, Contact, Share)
- ✅ Integration with Maps.tsx

### How to Test

#### 1. **Start the Development Server**
```bash
npm install  # If not done already
npm run dev
```

#### 2. **Access the Maps Page**
- Navigate to: `http://localhost:8080/maps`
- Or click "Mapas" in the navigation

#### 3. **Test Map Popups**

**For Lost Pets View:**
- Click on any red/green marker (lost/found pets)
- You should see a rich popup with:
  - Pet photo (if available)
  - Pet name and species
  - Status badge (Perdida/Encontrada)
  - Description (truncated)
  - Location
  - Distance from your location (if location permission granted)
  - Action buttons: Contact, View Details, Share

**For Adoption View:**
- Switch to "Adopción" tab
- Click on orange markers (adoption animals) or purple markers (shelters)
- Popup should show:
  - Photo or placeholder
  - Pet/shelter name
  - Details (species, breed, size)
  - Location and distance
  - Action buttons

**For Services View:**
- Switch to "Servicios" tab
- Click on service provider markers
- Popup should show:
  - Provider avatar
  - Provider name and rating
  - Price information
  - Service types (badges)
  - Distance
  - Action buttons: Book, Contact, View Details

#### 4. **Test Distance Calculation**
- Grant location permission when prompted
- Distance should appear in popups showing "X km de distancia"
- If location not available, distance won't show (graceful degradation)

#### 5. **Test Quick Actions**

**View Details Button:**
- Should navigate to appropriate page:
  - Services → User profile page
  - Lost pets → Lost pets page
  - Adoption → Adoption page

**Book Button (Services only):**
- Should navigate to service booking page based on service type

**Contact Button:**
- Should open messaging (may require authentication)
- Shows loading state while processing

**Share Button:**
- Should use native share API if available
- Falls back to copying URL to clipboard

### Expected Behavior

✅ **What Should Work:**
- Popups display correctly for all marker types
- Distance calculation works when location is available
- Buttons are clickable and navigate correctly
- Popups close when clicking outside or X button
- Responsive design (works on mobile/tablet)

⚠️ **Known Limitations (No Credentials):**
- Maps won't display without Google Maps API key (shows error)
- You can still test popup structure with mock data
- Contact/Messaging requires authentication
- Navigation may redirect to login if not authenticated

### Mock Data Testing

If you want to test without real data, you can:

1. **Create test markers manually:**
   - Add test data to Supabase (if you have access)
   - Or modify the component to show mock data

2. **Test with static coordinates:**
   - Use Santiago coordinates: `-33.4489, -70.6693`
   - Add test markers around this location

### Visual Testing Checklist

- [ ] Popup appears when clicking markers
- [ ] Popup has correct styling (card, shadows, spacing)
- [ ] Photos/avatars display correctly
- [ ] Badges show correct colors
- [ ] Distance displays when location available
- [ ] Buttons are properly styled and aligned
- [ ] Popup closes correctly
- [ ] Works on different screen sizes

---

## 🎮 Feature 2: Paw Game Integration (Next to Implement)

### What Will Be Implemented
- Database schema for points, levels, achievements, missions
- Points calculation utilities
- UI components for displaying progress
- Integration with user actions

### How to Test (After Implementation)

#### 1. **Database Setup**
- Run migration: `supabase migration up`
- Verify tables created: `user_points`, `achievements`, `missions`

#### 2. **Test Points System**
- Complete a booking → Should award points
- Add medical record → Should award points
- Write a review → Should award points
- Check points displayed on Home/Profile

#### 3. **Test Levels**
- Accumulate points
- Verify level increases at thresholds
- Check level display in UI

#### 4. **Test Achievements**
- Complete actions that unlock achievements
- Verify badges appear
- Check achievement list

#### 5. **Test Missions**
- View daily/weekly missions
- Complete mission requirements
- Verify mission completion rewards

---

## 💬 Feature 3: Messaging Safety (Next to Implement)

### What Will Be Implemented
- Follow system (mutual follow requirement)
- Block/report functionality
- Safety UI components

### How to Test (After Implementation)

#### 1. **Test Follow System**
- Try to message user without following → Should show error
- Follow user → Should allow messaging
- Unfollow user → Should block messaging

#### 2. **Test Block Functionality**
- Block a user
- Verify blocked user hidden from chat list
- Verify can't receive messages from blocked user

#### 3. **Test Report Functionality**
- Report a user
- Verify report submitted
- Check admin can see reports

---

## 🧪 Testing Without Credentials

### Mock Data Setup

Create a file `src/lib/mockData.ts`:

```typescript
export const mockLostPets = [
  {
    id: "1",
    pet_name: "Max",
    species: "perro",
    breed: "Labrador",
    report_type: "lost",
    latitude: -33.4489,
    longitude: -70.6693,
    photo_url: "/placeholder.svg",
    description: "Perro perdido en el centro",
    last_seen_location: "Santiago Centro",
    last_seen_date: new Date().toISOString(),
  },
  // Add more mock data...
];

export const mockServiceProviders = [
  {
    id: "1",
    user_id: "user-1",
    display_name: "Juan Pérez",
    avatar_url: "/placeholder.svg",
    rating: 4.8,
    total_reviews: 25,
    latitude: -33.4489,
    longitude: -70.6693,
    services: [
      {
        id: "1",
        service_type: "dog_walker",
        price_base: 15000,
        price_unit: "hora",
      },
    ],
  },
  // Add more mock data...
];
```

### Environment Variables for Testing

Create `.env.local`:

```bash
# These can be placeholder values for UI testing
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=test-key
VITE_GOOGLE_MAPS_API_KEY=test-key
VITE_GOOGLE_CLIENT_ID_WEB=test-client-id
```

**Note**: Maps won't work, but you can test popup structure and navigation.

---

## 🐛 Common Issues & Solutions

### Issue: Maps not displaying
**Solution**: This is expected without Google Maps API key. Popups can still be tested with mock data.

### Issue: "Cannot read property of undefined"
**Solution**: Check that data structure matches expected format. Add null checks.

### Issue: Distance not showing
**Solution**: 
- Grant location permission
- Check browser console for geolocation errors
- Verify coordinates are valid numbers

### Issue: Navigation not working
**Solution**: 
- Check if user is authenticated
- Verify routes exist in App.tsx
- Check browser console for errors

### Issue: Buttons not responding
**Solution**:
- Check event handlers are properly bound
- Verify no JavaScript errors in console
- Check if component is properly mounted

---

## 📊 Testing Checklist

### Interactive Maps
- [ ] Popup displays for lost pets
- [ ] Popup displays for adoption
- [ ] Popup displays for services
- [ ] Popup displays for shelters
- [ ] Distance calculation works
- [ ] View Details button navigates
- [ ] Book button navigates (services)
- [ ] Contact button works
- [ ] Share button works
- [ ] Popup closes correctly
- [ ] Responsive on mobile
- [ ] Responsive on tablet

### Paw Game (After Implementation)
- [ ] Points awarded for bookings
- [ ] Points awarded for vet visits
- [ ] Points awarded for reviews
- [ ] Points displayed on Home
- [ ] Points displayed on Profile
- [ ] Levels increase correctly
- [ ] Achievements unlock
- [ ] Missions display
- [ ] Mission completion works

### Messaging Safety (After Implementation)
- [ ] Mutual follow check works
- [ ] Block functionality works
- [ ] Report functionality works
- [ ] Error messages display
- [ ] Blocked users hidden

---

## 🚀 Quick Start Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Go to `http://localhost:8080`
   - Navigate to Maps page

3. **Test popups:**
   - Click any marker
   - Verify popup appears
   - Test all buttons
   - Check distance (if location granted)

4. **Check console:**
   - Look for errors
   - Verify no warnings

5. **Test responsive:**
   - Resize browser window
   - Test on mobile device (if available)
   - Check touch interactions

---

## 📝 Notes

- **Without credentials**: You can test UI/UX, component structure, navigation, and logic
- **With credentials**: You can test full integration, real data, and end-to-end flows
- **Mock data**: Use for rapid UI testing without backend
- **Real data**: Use for integration testing once credentials are available

---

**Last Updated**: 2024-12-XX
**Status**: Ready for testing

