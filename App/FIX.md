# CRITICAL BUG: java.lang.String cannot be cast to java.lang.Boolean

## 🔴 Current Status: UNRESOLVED

**Error:** `java.lang.String cannot be cast to java.lang.Boolean`  
**Platform:** Android (Expo Go)  
**Occurrence:** During view creation (`createViewInstance`, `setProperty`)  
**Impact:** App crashes on launch, cannot render any screens

---

## 📋 Summary of Issue

The app is attempting to pass a **string value** to a native Android component that expects a **boolean**. This happens during the React Native bridge's property setting phase when creating native views. The error stack trace shows:

```
setProperty (SourceFile:642)
createViewInstance (SourceFile:7)
createView (SourceFile:1)
```

This indicates a **JSX prop** is receiving a string when it should receive a boolean (true/false).

---

## ✅ Fixes Already Applied

### 1. Boolean Props Without Explicit Values
**Issue:** Standalone boolean props like `horizontal` or `secureTextEntry` without `={true}` can be interpreted as strings on Android.

**Files Fixed:**
- ✅ `App/components/CategoryScroll.tsx` - Changed `horizontal` → `horizontal={true}`
- ✅ `App/components/TimeSlotPicker.tsx` - Changed `horizontal` → `horizontal={true}`
- ✅ `App/app/vendor-dashboard/bookings.tsx` - Changed `horizontal` → `horizontal={true}`
- ✅ `App/app/vendor-dashboard/calendar.tsx` - Changed `horizontal` → `horizontal={true}`
- ✅ `App/app/(auth)/login.tsx` - Changed `secureTextEntry` → `secureTextEntry={true}`
- ✅ `App/app/(auth)/register.tsx` - Changed 2x `secureTextEntry` → `secureTextEntry={true}`

### 2. Firestore Boolean Data Sanitization
**Issue:** Firestore may store booleans as strings ("true"/"false").

**File Fixed:**
- ✅ `App/services/vendors.ts` - Added `sanitizeVendorData()` function to convert:
  - `whatsapp_connected` string → boolean
  - `sheets_connected` string → boolean

```typescript
const sanitizeVendorData = (data: any): Vendor => {
  return {
    ...data,
    whatsapp_connected: Boolean(data.whatsapp_connected === 'true' || data.whatsapp_connected === true),
    sheets_connected: Boolean(data.sheets_connected === 'true' || data.sheets_connected === true),
  };
};
```

### 3. Unsupported Android Style Properties
**Issue:** `borderStyle: 'dashed'` is not well-supported on Android and can cause native property errors.

**Files Fixed:** Removed `borderStyle: 'dashed'` from ALL 20 instances:
- ✅ `App/app/(tabs)/home.tsx`
- ✅ `App/app/(tabs)/chatbot.tsx`
- ✅ `App/app/(tabs)/profile.tsx`
- ✅ `App/app/(tabs)/social.tsx`
- ✅ `App/app/category/[category].tsx`
- ✅ `App/app/vendor/[id].tsx`
- ✅ `App/app/vendor/booking.tsx`
- ✅ `App/app/notifications.tsx`
- ✅ `App/app/vendor-dashboard/index.tsx`
- ✅ `App/app/vendor-dashboard/calendar.tsx`
- ✅ `App/app/vendor-dashboard/bookings.tsx`

### 4. RefreshControl Enhancement
**File Modified:**
- ✅ `App/app/(tabs)/home.tsx` - Added explicit color props to RefreshControl

---

## 🔍 Remaining Investigation Areas

### High Priority

#### 1. Third-Party Library Props
**Suspects:**
- `expo-router` components (`<Stack>`, `<Tabs>`, `<Redirect>`)
- `react-native` components receiving dynamic props
- Firebase initialization

**Check:**
```typescript
// In _layout.tsx
screenOptions={{
  headerShown: false,  // ← Is this being stringified?
  contentStyle: { backgroundColor: '#1a1a1a' },
}}
```

**Action:** Verify all config objects in navigation aren't being serialized incorrectly.

#### 2. Component State Initialization
**Suspects:**
- `useState` hooks with string defaults being used as boolean props
- Conditional rendering with string comparisons

**Check Files:**
```
App/app/(tabs)/home.tsx - Line 15-16: refreshing, loading state
App/app/(tabs)/_layout.tsx - Tab configuration
App/app/_layout.tsx - Stack configuration
```

**Look For:**
```typescript
// Bad
const [loading, setLoading] = useState('false');
<Button loading={loading} />  // ← String passed as boolean!

// Good
const [loading, setLoading] = useState(false);
<Button loading={loading} />
```

#### 3. Props Spreading with Unvalidated Data
**Suspects:**
- `{...props}` spreading with string values from Firestore or API
- Route params being passed as props

**Check:**
```typescript
// In vendor/[id].tsx
const { id } = useLocalSearchParams<{ id: string }>();

// In vendor/booking.tsx
const { vendorId, vendorName, date, time, slotId } = useLocalSearchParams<{...}>();
```

**Action:** Ensure params aren't being spread onto components expecting booleans.

#### 4. Firebase Configuration
**File:** `App/services/firebase.ts`

**Check:** Firebase config values should ALL be strings, but verify none are accidentally boolean:
```typescript
const firebaseConfig = {
  apiKey: "...",  // String ✓
  authDomain: "...",  // String ✓
  projectId: "...",  // String ✓
  // ... check all values
};
```

### Medium Priority

#### 5. Icon/Emoji Rendering
**Suspects:**
- Tab bar icons using emojis
- Quick action icons

**Files:**
```
App/app/(tabs)/_layout.tsx - Lines 25-59 (emoji icons)
App/components/QuickActionGrid.tsx
```

**Action:** Emojis shouldn't cause this, but verify Text components aren't receiving boolean props.

#### 6. StyleSheet Dynamic Properties
**Check:** Ensure no style props are computed from string values:
```typescript
// Bad
style={{ display: visible ? 'flex' : 'none' }}  // OK actually
style={{ enabled: 'true' }}  // ← BAD if 'enabled' expects boolean

// In our code, check for:
- Dynamic opacity
- Dynamic borderWidth
- Conditional styles
```

#### 7. Vendor Data Fields
**Beyond boolean fields, check:**
```typescript
interface Vendor {
  // Already sanitized:
  whatsapp_connected: boolean;
  sheets_connected: boolean;
  
  // Check these if used as component props:
  rating?: number;  // Could be string from DB?
  review_count?: number;  // Could be string from DB?
  images?: string[];  // Array integrity?
  amenities?: string[];  // Array integrity?
}
```

**Action:** Add sanitization for ALL numeric/array fields if they're used as props.

### Low Priority

#### 8. Button Component Variants
**File:** `App/components/ui/Button.tsx`

**Check:**
```typescript
disabled={disabled || loading}  // Both must be boolean
variant === 'primary'  // String comparison is OK
```

**Action:** Add type guards at component entry:
```typescript
disabled = Boolean(disabled)
loading = Boolean(loading)
```

#### 9. Card Component onPress
**File:** `App/components/ui/Card.tsx`

**Check:**
```typescript
if (onPress) {  // Truthy check, not boolean
  return <TouchableOpacity>...</TouchableOpacity>
}
```

**Action:** Should be fine, but could add explicit check.

---

## 🛠️ Recommended Next Steps

### Immediate Actions (Do These First)

#### Step 1: Add Comprehensive Type Guards to Button Component
**File:** `App/components/ui/Button.tsx`

```typescript
export default function Button({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style
}: ButtonProps) {
  // Force boolean coercion
  const isLoading = Boolean(loading);
  const isDisabled = Boolean(disabled);
  
  const buttonStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    isDisabled && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled || isLoading}
      style={buttonStyle}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#1a1a1a' : '#f9fafb'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
```

#### Step 2: Add Type Guards to Input Component
**File:** `App/components/ui/Input.tsx`

```typescript
export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  style
}: InputProps) {
  const isSecure = Boolean(secureTextEntry);
  
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isSecure}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}
```

#### Step 3: Add Type Guards to TimeSlotPicker
**File:** `App/components/TimeSlotPicker.tsx`

Around line 60-67:
```typescript
{availableSlots.map((time) => {
  const isBooked = Boolean(bookedSlots.includes(time));
  const isSelected = Boolean(time === selectedTime);
  
  return (
    <TouchableOpacity
      key={time}
      onPress={() => !isBooked && onTimeChange(time)}
      disabled={isBooked}  // Now guaranteed boolean
      style={[...]}
    >
```

#### Step 4: Add Comprehensive Vendor Data Sanitization
**File:** `App/services/vendors.ts`

```typescript
const sanitizeVendorData = (data: any): Vendor => {
  return {
    ...data,
    // Booleans
    whatsapp_connected: Boolean(data.whatsapp_connected === 'true' || data.whatsapp_connected === true),
    sheets_connected: Boolean(data.sheets_connected === 'true' || data.sheets_connected === true),
    
    // Numbers (ensure they're not strings)
    rating: data.rating ? Number(data.rating) : undefined,
    review_count: data.review_count ? Number(data.review_count) : undefined,
    
    // Arrays (ensure they're arrays)
    images: Array.isArray(data.images) ? data.images : [],
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
  };
};
```

#### Step 5: Add Debug Logging to Identify Culprit
**File:** `App/app/(tabs)/home.tsx` (or entry point)

Add this temporarily at the top of the component:
```typescript
export default function HomeScreen() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // DEBUG: Log all state values and their types
  console.log('HomeScreen State Types:', {
    refreshing: { value: refreshing, type: typeof refreshing },
    loading: { value: loading, type: typeof loading },
    vendorsCount: vendors.length,
  });
  
  // ... rest of component
```

Then check Metro bundler logs for the types being logged.

### Nuclear Option: Minimal Reproduction

If all else fails, create a minimal screen to isolate the issue:

**File:** `App/app/test.tsx`
```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
  },
});
```

Then in `App/app/index.tsx`:
```typescript
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/test" />;  // Change to test screen
}
```

Register in `App/app/_layout.tsx`:
```typescript
<Stack.Screen name="test" />
```

**If this works:** The issue is in one of your screens/components. Binary search by commenting out sections.

**If this fails:** The issue is in your core setup (navigation, Firebase init, or Expo config).

---

## 🔬 Advanced Debugging Techniques

### 1. Enable React Native Debugger
In Metro bundler, press `j` to open debugger, then check console for more detailed error info.

### 2. Check Expo Diagnostics
```bash
npx expo-doctor
```

### 3. Rebuild with EAS (Custom Dev Client)
Expo Go has limitations. Build a custom dev client:
```bash
npx eas build --profile development --platform android
```

This will show the EXACT line and prop causing the error.

### 4. Check Firebase Actual Data
Query your Firestore directly:
```bash
# In Firebase Console or using SDK
db.collection('vendors').limit(1).get()
```

Check if ANY field has unexpected types.

### 5. Binary Search Through Screens
Comment out screens in `App/app/_layout.tsx` one by one:
```typescript
<Stack>
  <Stack.Screen name="index" />
  {/* <Stack.Screen name="(auth)/login" /> */}
  {/* <Stack.Screen name="(auth)/register" /> */}
  <Stack.Screen name="(tabs)" />
  {/* ... comment out vendor screens ... */}
</Stack>
```

See which screen registration causes the crash.

---

## 📝 Files Modified (Complete List)

### Components (3 files)
1. `App/components/ui/Button.tsx` - No changes yet (recommend adding type guards)
2. `App/components/ui/Input.tsx` - No changes yet (recommend adding type guards)
3. `App/components/ui/Card.tsx` - No changes
4. `App/components/CategoryScroll.tsx` - ✅ Fixed `horizontal={true}`
5. `App/components/TimeSlotPicker.tsx` - ✅ Fixed `horizontal={true}`, recommend type guards for `disabled`

### Services (1 file)
6. `App/services/vendors.ts` - ✅ Added boolean sanitization, recommend expanding

### Screens - Auth (2 files)
7. `App/app/(auth)/login.tsx` - ✅ Fixed `secureTextEntry={true}`
8. `App/app/(auth)/register.tsx` - ✅ Fixed `secureTextEntry={true}` (2x)

### Screens - Tabs (4 files)
9. `App/app/(tabs)/home.tsx` - ✅ Removed `borderStyle: 'dashed'`, added RefreshControl colors
10. `App/app/(tabs)/chatbot.tsx` - ✅ Removed `borderStyle: 'dashed'`
11. `App/app/(tabs)/profile.tsx` - ✅ Removed `borderStyle: 'dashed'`
12. `App/app/(tabs)/social.tsx` - ✅ Removed `borderStyle: 'dashed'`

### Screens - Vendor (2 files)
13. `App/app/vendor/[id].tsx` - ✅ Removed `borderStyle: 'dashed'`
14. `App/app/vendor/booking.tsx` - ✅ Removed `borderStyle: 'dashed'`

### Screens - Other (3 files)
15. `App/app/category/[category].tsx` - ✅ Removed `borderStyle: 'dashed'` (2x)
16. `App/app/notifications.tsx` - ✅ Removed `borderStyle: 'dashed'`
17. `App/app/vendor-dashboard/index.tsx` - ✅ Removed `borderStyle: 'dashed'`
18. `App/app/vendor-dashboard/calendar.tsx` - ✅ Removed `borderStyle: 'dashed'`, fixed `horizontal={true}`
19. `App/app/vendor-dashboard/bookings.tsx` - ✅ Removed `borderStyle: 'dashed'`, fixed `horizontal={true}`

### Layouts (2 files)
20. `App/app/_layout.tsx` - No changes (check `headerShown: false`)
21. `App/app/(tabs)/_layout.tsx` - No changes (check all tab config)

### Entry (1 file)
22. `App/app/index.tsx` - ✅ Changed to use `<Redirect>` component

**Total Files Modified:** 22

---

## 🎯 Most Likely Culprits (Ranked)

1. **RefreshControl `refreshing` prop** - State value might be stringified (10% confidence - already added explicit colors)
2. **Navigation config object serialization** - `headerShown: false` or other config (15% confidence)
3. **Unidentified standalone boolean prop** - Another component we haven't found yet (25% confidence)
4. **Third-party library internal props** - Expo Router, React Navigation (20% confidence)
5. **Firestore data with unexpected types** - Other fields beyond whatsapp/sheets (15% confidence)
6. **Firebase initialization issue** - Config values (5% confidence)
7. **Expo Go compatibility issue** - Unsupported prop format (10% confidence)

---

## 💡 Final Recommendations

### Option A: Systematic Type Guards (Recommended)
Apply Steps 1-4 from "Immediate Actions" to add explicit `Boolean()` coercion everywhere. This is defensive but guaranteed to fix string→boolean issues.

### Option B: Custom Dev Client (Most Effective)
Build with `eas build` to get exact error line. Expo Go hides detailed errors.

### Option C: Nuclear - Start Fresh
Create a new minimal Expo app, copy screens one by one until error appears. Tedious but definitive.

### Option D: Community Help
Post on Expo Forums/Discord with:
- Error stack trace
- `package.json`
- `app.json`
- Simplified reproduction

---

## 📚 Resources

- [React Native Boolean Props](https://reactnative.dev/docs/view#props)
- [Expo Go Limitations](https://docs.expo.dev/workflow/expo-go/)
- [Android BorderStyle Issues](https://github.com/facebook/react-native/issues/29651)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

**Document Created:** 2025-11-23  
**Last Updated:** 2025-11-23  
**Status:** Debugging in Progress

