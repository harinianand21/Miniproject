# Bug Fix Task List
**Project:** Accessibility Navigation Platform  
**Created:** 2026-01-28  
**Status:** Ready for Implementation

---

## 🔴 PRIORITY 1: CRITICAL FIXES (Do Immediately)

### Task 1.1: Remove Duplicate POST /points Route
**File:** `backend/server.js`  
**Lines to Delete:** 245-265  
**Estimated Time:** 2 minutes  
**Impact:** Critical - Prevents confusion and potential bugs  

**Action:**
- Delete the second `app.post("/points", ...)` handler
- Keep only the first handler (lines 172-223) which has full functionality
- Verify no other code depends on the deleted handler

**Verification:**
- Server starts without errors
- POST /points still works correctly
- Test creating a new accessibility point

---

### Task 1.2: Add Missing TypeScript Type Packages
**File:** `frontend/package.json`  
**Estimated Time:** 5 minutes  
**Impact:** High - Prevents TypeScript compilation errors  

**Action:**
Add to `devDependencies` section:
```json
"@types/three": "^0.182.0",
"@types/webxr": "^0.5.24"
```

**Commands:**
```bash
cd frontend
npm install --save-dev @types/three@^0.182.0 @types/webxr@^0.5.24
```

**Verification:**
- No TypeScript errors in IDE
- `npm run build` completes successfully

---

### Task 1.3: Add iOS DeviceOrientation Permission Request
**File:** `frontend/src/app/components/ARCameraScreen.tsx`  
**Lines:** Insert before line 186 (before adding event listeners)  
**Estimated Time:** 15 minutes  
**Impact:** Critical - AR navigation won't work on iOS without this  

**Action:**
Add permission request function and call it before setting up orientation listeners:

```typescript
// Add this helper function near the top of the component
const requestOrientationPermission = async () => {
  if (typeof DeviceOrientationEvent !== 'undefined' && 
      typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      if (permission !== 'granted') {
        setError('Device orientation permission denied. Compass features will not work.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error requesting orientation permission:', err);
      setError('Could not request orientation permission.');
      return false;
    }
  }
  // Not iOS 13+ or permission not required
  return true;
};

// Then modify the useEffect to call it:
useEffect(() => {
  // ... existing geolocation code ...

  // Request permission before adding listeners
  const setupOrientation = async () => {
    const permitted = await requestOrientationPermission();
    if (!permitted) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // ... existing handler code ...
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  };

  setupOrientation();
  
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}, [destination, accPoints]);
```

**Verification:**
- Test on iOS Safari (13+)
- Permission prompt appears
- Compass heading updates correctly after granting permission

---

## ⚠️ PRIORITY 2: HIGH PRIORITY FIXES (Do This Week)

### Task 2.1: Add MongoDB Connection Retry/Fail-Fast Logic
**File:** `backend/server.js`  
**Lines:** 55-61  
**Estimated Time:** 10 minutes  
**Impact:** Medium - Improves reliability and debugging  

**Action:**
Replace current connection code with fail-fast approach:

```javascript
mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    retryWrites: true
})
.then(() => {
    console.log("✅ Connected to MongoDB");
    console.log(`📍 Database: ${MONGO_URI}`);
})
.catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("⚠️ Please ensure MongoDB is running and accessible.");
    console.error(`   Connection string: ${MONGO_URI}`);
    console.error("🛑 Server will exit now.");
    process.exit(1); // Fail-fast: exit if DB unavailable
});
```

**Verification:**
- Stop MongoDB and start server - should exit with clear error
- Start MongoDB and server - should connect successfully
- Check logs are clear and helpful

---

### Task 2.2: Centralize Default Coordinates
**Files:** Create new file + update 3 files  
**Estimated Time:** 15 minutes  
**Impact:** Low - Improves maintainability  

**Action:**

1. Create `frontend/src/config/constants.ts`:
```typescript
export const DEFAULT_LOCATION = {
  lat: 13.0827,
  lng: 80.2707,
  name: "Chennai, India"
} as const;

export const APP_CONFIG = {
  MAP_ZOOM_DEFAULT: 15,
  MAP_ZOOM_DESTINATION: 16,
  PROXIMITY_ALERT_DISTANCE: 20, // meters
  GPS_HIGH_ACCURACY: true,
  GPS_TIMEOUT: 10000,
  GPS_MAX_AGE: 0
} as const;
```

2. Update `frontend/src/app/components/MapsScreen.tsx` line 269:
```typescript
import { DEFAULT_LOCATION } from '../../config/constants';
// ...
const [userLocation, setUserLocation] = useState<[number, number]>([
  DEFAULT_LOCATION.lat, 
  DEFAULT_LOCATION.lng
]);
```

3. Update `frontend/src/pages/Report.tsx` line 7:
```typescript
import { DEFAULT_LOCATION } from '../config/constants';
// ...
const [userLocation, setUserLocation] = useState<[number, number]>([
  DEFAULT_LOCATION.lat, 
  DEFAULT_LOCATION.lng
]);
```

4. Update `frontend/src/app/components/AddDataScreen.tsx` line 64:
```typescript
import { DEFAULT_LOCATION } from '../../config/constants';
// ...
const lat = Number(reportingLocation?.[0] || DEFAULT_LOCATION.lat);
const lng = Number(reportingLocation?.[1] || DEFAULT_LOCATION.lng);
```

**Verification:**
- All components still work with default location
- Easy to change default location in one place

---

### Task 2.3: Remove Unused Imports
**Files:** `frontend/src/pages/Home.tsx`  
**Estimated Time:** 1 minute  
**Impact:** Low - Code cleanliness  

**Action:**
Delete lines 2-3:
```typescript
import { useEffect } from "react";  // DELETE
import { api } from "../services/api";  // DELETE
```

**Verification:**
- No TypeScript errors
- Component still works

---

## 📝 PRIORITY 3: MEDIUM PRIORITY IMPROVEMENTS (Do Soon)

### Task 3.1: Implement Centralized Error Notification System
**Files:** Create new hook + update multiple components  
**Estimated Time:** 45 minutes  
**Impact:** Medium - Better UX  

**Action:**

1. Install toast library (already in dependencies):
```bash
cd frontend
# sonner is already installed, just import it
```

2. Create `frontend/src/hooks/useNotification.ts`:
```typescript
import { toast } from 'sonner';

export const useNotification = () => {
  const success = (message: string) => {
    toast.success(message);
  };

  const error = (message: string) => {
    toast.error(message);
  };

  const info = (message: string) => {
    toast.info(message);
  };

  const warning = (message: string) => {
    toast.warning(message);
  };

  return { success, error, info, warning };
};
```

3. Add Toaster to `frontend/src/main.tsx`:
```typescript
import { Toaster } from 'sonner';

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <App />
        <Toaster position="top-center" richColors />
    </BrowserRouter>
);
```

4. Replace all `alert()` calls with toast notifications:
- `AddDataScreen.tsx` lines 58, 68, 110
- Other components as needed

**Verification:**
- Toast notifications appear instead of alerts
- Notifications are dismissible
- Multiple notifications stack properly

---

### Task 3.2: Fix announcedIds to Use useRef
**File:** `frontend/src/app/components/ARCameraScreen.tsx`  
**Line:** 26  
**Estimated Time:** 5 minutes  
**Impact:** Low - Performance optimization  

**Action:**
Change from useState to useRef:

```typescript
// OLD (line 26):
const [announcedIds] = useState<Set<string>>(new Set());

// NEW:
const announcedIds = useRef<Set<string>>(new Set());

// Then update all usages (lines 89, 96):
// OLD:
if (announcedIds.has(point._id || point.id)) return;
announcedIds.add(point._id || point.id);

// NEW:
if (announcedIds.current.has(point._id || point.id)) return;
announcedIds.current.add(point._id || point.id);
```

**Verification:**
- Accessibility alerts still work
- No unnecessary re-renders
- Same functionality, better performance

---

### Task 3.3: Add JSDoc Documentation to Key Interfaces
**Files:** Multiple component files  
**Estimated Time:** 30 minutes  
**Impact:** Low - Developer experience  

**Action:**
Add JSDoc comments to all component prop interfaces:

Example for `ARCameraScreen.tsx`:
```typescript
/**
 * Props for the AR Camera Screen component
 */
interface ARCameraScreenProps {
  /** 
   * Callback function invoked when user exits AR mode.
   * Should navigate back to the map screen.
   */
  onExit: () => void;
  
  /** 
   * Destination coordinates and display name for AR navigation.
   * If null, AR will start but won't show navigation arrow.
   */
  destination: { 
    lat: number; 
    lng: number; 
    name: string 
  } | null;
}
```

Apply to:
- `MapsScreen.tsx`
- `AddDataScreen.tsx`
- `ARNavigationScreen.tsx`
- `BottomSheet.tsx`
- `VoiceCommandOverlay.tsx`

**Verification:**
- Hover tooltips show documentation in IDE
- Better developer experience

---

## 🎯 PRIORITY 4: FEATURE ENHANCEMENTS (Future Work)

### Task 4.1: Implement AR Waypoint Visualization
**File:** `frontend/src/app/components/ARCameraScreen.tsx`  
**Estimated Time:** 2-3 hours  
**Impact:** High - Major feature improvement  

**Action:**
1. Pass `routeCoordinates` from map to AR screen via navigation state
2. Create 3D waypoint markers in Three.js scene
3. Show turn-by-turn indicators
4. Add proximity detection for each waypoint
5. Update UI to show "next turn" information

**Dependencies:**
- Requires route data from `useMapRouting`
- Needs 3D model/geometry for waypoint markers

**Verification:**
- Waypoints appear along route in AR
- Proximity alerts trigger at correct distances
- Turn indicators update as user moves

---

### Task 4.2: Add Offline Support with Service Worker
**Files:** Create new service worker + manifest  
**Estimated Time:** 4-6 hours  
**Impact:** Medium - Better UX in poor connectivity  

**Action:**
1. Create `frontend/public/sw.js` service worker
2. Cache map tiles for offline use
3. Store accessibility points in IndexedDB
4. Add offline indicator UI
5. Queue submissions when offline, sync when online

**Dependencies:**
- Workbox or similar service worker library
- IndexedDB wrapper (Dexie.js recommended)

**Verification:**
- App loads when offline
- Previously viewed areas show cached maps
- Submissions queue and sync when back online

---

### Task 4.3: Implement User Authentication System
**Files:** Backend + Frontend auth flow  
**Estimated Time:** 8-12 hours  
**Impact:** Medium - Enables accountability  

**Action:**
1. Add JWT authentication to backend
2. Create user registration/login endpoints
3. Add protected routes
4. Link submissions to user accounts
5. Add user profile page
6. Implement report moderation

**Dependencies:**
- `jsonwebtoken` package
- `bcrypt` for password hashing
- Frontend auth context/state management

**Verification:**
- Users can register and login
- Submissions are linked to accounts
- Protected routes require authentication

---

### Task 4.4: Add Rate Limiting to API
**File:** `backend/server.js`  
**Estimated Time:** 30 minutes  
**Impact:** Medium - Prevents abuse  

**Action:**
1. Install `express-rate-limit`
2. Configure rate limiters for different endpoints
3. Add appropriate headers

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit submissions to 10 per hour
  message: 'Too many submissions, please try again later.'
});

app.use('/api/', apiLimiter);
app.post('/points', submitLimiter, checkDB, async (req, res, next) => {
  // ... existing code
});
```

**Verification:**
- Rate limits enforce correctly
- Appropriate error messages shown
- Legitimate users not affected

---

## 📊 TASK SUMMARY

### By Priority:
- **Priority 1 (Critical):** 3 tasks, ~22 minutes
- **Priority 2 (High):** 3 tasks, ~26 minutes
- **Priority 3 (Medium):** 3 tasks, ~80 minutes
- **Priority 4 (Future):** 4 tasks, ~15-22 hours

### By Estimated Time:
- **Quick Wins (<5 min):** Tasks 1.1, 2.3
- **Short Tasks (5-20 min):** Tasks 1.2, 1.3, 2.1, 2.2, 3.2
- **Medium Tasks (30-90 min):** Tasks 3.1, 3.3
- **Large Tasks (2+ hours):** Tasks 4.1, 4.2, 4.3, 4.4

### Recommended Execution Order:
1. **Day 1 Morning:** Complete all Priority 1 tasks (22 min)
2. **Day 1 Afternoon:** Complete all Priority 2 tasks (26 min)
3. **Day 2:** Complete Priority 3 tasks (80 min)
4. **Week 2+:** Plan and execute Priority 4 features

---

## ✅ COMPLETION CHECKLIST

### Priority 1 (Must Do):
- [ ] Task 1.1: Remove duplicate POST route
- [ ] Task 1.2: Add TypeScript types
- [ ] Task 1.3: Add iOS orientation permission

### Priority 2 (Should Do):
- [ ] Task 2.1: MongoDB fail-fast logic
- [ ] Task 2.2: Centralize default coordinates
- [ ] Task 2.3: Remove unused imports

### Priority 3 (Nice to Have):
- [ ] Task 3.1: Centralized error notifications
- [ ] Task 3.2: Fix announcedIds ref
- [ ] Task 3.3: Add JSDoc documentation

### Priority 4 (Future):
- [ ] Task 4.1: AR waypoint visualization
- [ ] Task 4.2: Offline support
- [ ] Task 4.3: User authentication
- [ ] Task 4.4: API rate limiting

---

**Total Estimated Time for P1-P3:** ~2 hours  
**Deployment Ready After:** Priority 1 + Priority 2 completed  
**Production Ready After:** All Priority 3 completed
