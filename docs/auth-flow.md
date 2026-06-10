# Auth Flow

Custom phone-number OTP system built on Firebase. Does not use Firebase Phone Auth — OTP delivery and verification are handled by a Cloud Functions backend using the SMS.md provider. Firebase Authentication is used only for session management, via custom tokens.

---

## Architecture

| Layer | Technology |
|---|---|
| SMS delivery | SMS.md API (`from: viking`) |
| OTP generation & verification | Firebase Cloud Functions (region: `europe-central2`) |
| User storage | Cloud Firestore (`users` collection) |
| Session | Firebase Authentication (custom token) |
| Auth state (client) | `AuthContext` + `onAuthStateChanged` |
| Routing | Expo Router `_layout.tsx` effect |

---

## Data Model

### `users/{userId}`
Created by `sendOtp` on first contact with a phone number. The document ID becomes the Firebase Auth UID.

| Field | Type | Set by |
|---|---|---|
| `phoneNumber` | `string` (E.164) | `sendOtp` |
| `createdAt` | `timestamp` | `sendOtp` |
| `firstName` | `string?` | `profile-edit` (onboarding) |
| `lastName` | `string?` | `profile-edit` (onboarding) |

### `otpVerifications/{verificationId}`
Ephemeral. Deleted after successful verification.

| Field | Type | Notes |
|---|---|---|
| `phoneNumber` | `string` | |
| `userId` | `string` | References `users/{userId}` |
| `otp` | `string` | 6-digit code, server-side only |
| `expiresAt` | `number` | Unix ms, now + 5 minutes |
| `createdAt` | `timestamp` | |

---

## Step-by-step Flow

### 1. Enter phone number — `enter-number.tsx`

User selects a country code (default `+373`) and enters the local number (minimum 8 digits). The app combines them into an E.164 string and calls the `sendOtp` Cloud Function.

### 2. `sendOtp` Cloud Function

1. Validates phone number against E.164 regex (`^\+[1-9]\d{6,14}$`). Throws `invalid-argument` if malformed.
2. Queries `users` collection for an existing document with this `phoneNumber`.
   - **New user**: creates `users/{auto-id}` with `{ phoneNumber, createdAt }`, captures `userId = newDoc.id`.
   - **Returning user**: reads `userId` from the existing document. No document mutation.
3. Generates a random 6-digit OTP and a UUID `verificationId`.
4. Writes `otpVerifications/{verificationId}` with a 5-minute TTL.
5. Delivers the OTP via SMS.md (`GET https://api.sms.md/v1/send`). Throws `internal` if the SMS API returns an error.
6. Returns `{ verificationId, isNewUser }` to the client. The OTP itself is never returned.

After `sendOtp` returns, the client navigates to `/otp` passing `{ phone, verificationId, isNewUser }` as route params.

### 3. OTP screen — `otp.tsx`

Displays a 60-second countdown. The user enters the 6-digit code. If the countdown expires before submission, a resend button appears — it calls `sendOtp` again for a new `verificationId` and restarts the timer.

### 4. `verifyOtp` Cloud Function

1. Fetches `otpVerifications/{verificationId}`. Throws `not-found` if it doesn't exist.
2. Checks `Date.now() > expiresAt`. Deletes the document and throws `deadline-exceeded` if expired.
3. Compares the submitted OTP against the stored one. Throws `invalid-argument` (`"Incorrect OTP"`) on mismatch.
4. Deletes the verification document (single-use; prevents replay).
5. Creates a Firebase custom token: `admin.auth().createCustomToken(userId)`.
6. Returns `{ customToken }`.

### 5. Sign in — `otp.tsx`

```
signInWithCustomToken(getAuth(), customToken)
```

Firebase creates (or updates) an Auth user whose `uid` equals the Firestore `users` document ID. No explicit navigation is performed here — routing is handled entirely by the `_layout.tsx` auth guard.

### 6. Auth state resolution — `AuthContext.tsx`

`onAuthStateChanged` fires after `signInWithCustomToken` settles. The handler distinguishes between two kinds of firing using an `isInitialCheck` flag:

- **Initial check** (`isInitialCheck = true`) — the very first call, where Firebase is restoring a persisted session from storage.
- **Subsequent calls** (`isInitialCheck = false`) — sign-in or sign-out events that happen while the app is already running.

```
onAuthStateChanged fires
  wasInitialCheck = isInitialCheck   // capture before flipping
  isInitialCheck = false

  if firebaseUser:
    fetchProfile(uid)                // reads users/{uid}, sets profile state, returns data
    if wasInitialCheck && !profileData.firstName:
      setUser(null) / setProfile(null) / setLoading(false)
      firebaseSignOut()              // clears persisted token; triggers onAuthStateChanged(null)
      return                         // ← incomplete onboarding: reset to welcome screen
    setUser(firebaseUser)
  else:
    setUser(null) / setProfile(null)
  setLoading(false)
```

`loading` only becomes `false` after the profile fetch completes, so the routing effect always sees a consistent `{ user, profile }` pair.

### 7. Routing — `_layout.tsx`

`RootNavigation` renders `null` while `loading` is `true`. This prevents Expo Router from attempting to restore a stale navigation state before auth resolves (fixes the "Unmatched route" bug on dev-server restart).

Once `loading` is `false` the Stack mounts and the following effect fires on `[user, profile, loading]`:

| Condition | Action |
|---|---|
| `user` is `null` | Stay on welcome/index |
| `user` set, `!profile?.firstName` | `router.replace('/profile-edit?onboarding=true')` |
| `user` set, `profile.firstName` set | `router.replace('/(tabs)/dashboard')` |

The middle row is only reachable during the **same app session** (e.g. OTP just succeeded). On a fresh launch, `AuthContext` has already signed the user out before `loading` becomes `false` if onboarding was incomplete (see step 6).

### 8. Onboarding — `profile-edit.tsx`

Reached via `router.replace`, so there is no previous screen in the navigation stack on a fresh launch.

Back navigation is blocked on all platforms:
- **UI**: back button element is not rendered when `isOnboarding=true`
- **iOS**: `gestureEnabled: false` via `<Stack.Screen options={{ gestureEnabled: !isOnboarding }} />`
- **Android**: `BackHandler` intercepts the hardware back key and returns `true` (consumed)

On same-session OTP success the stack may contain `[index, enter-number, profile-edit]` (router.replace swapped out the otp screen). The `BackHandler` prevents the user from navigating back into the auth screens in that case.

On save:
1. `updateDoc(users/{uid}, { firstName, lastName })` — document always exists (created in step 2)
2. `refreshProfile()` — refetches and updates `profile` in context
3. `router.replace('/(tabs)/dashboard')`

### 9. Returning user (subsequent launches)

Firebase SDK restores the session automatically. `AuthContext` fetches the profile — `firstName` is now set — and the routing effect sends the user directly to `/(tabs)/dashboard` without ever showing the welcome screen.

### 10. Sign out — `settings.tsx`

```
signOut()                        // Firebase firebaseSignOut
router.replace('/')             // navigate to welcome/index
```

`onAuthStateChanged` then fires with `null`, clearing `user` and `profile` in context.

---

## Edge Cases

**OTP expired** — `verifyOtp` returns `deadline-exceeded`. The client shows an error; the resend button lets the user request a fresh code.

**Resend OTP** — Calls `sendOtp` again. A new `verificationId` is issued and the in-app countdown resets. The old verification document remains in Firestore but is orphaned — the user will only ever submit the new `verificationId`.

**App killed after `sendOtp` but before `verifyOtp`** — The Firebase Auth user has not been created yet. The Firestore `users` document exists. On next open the user is unauthenticated and sees the welcome screen. Re-entering the same number finds the existing document (`isNewUser: false`) and sends a new OTP.

**App killed after `signInWithCustomToken` but before profile is saved** — Firebase Auth user exists; Firestore document has `phoneNumber` but no `firstName`. On next open: `AuthContext` detects `wasInitialCheck && !firstName` during session restoration, signs the user out, and resets to the welcome screen. The user re-enters their number; `sendOtp` finds the existing document (`isNewUser: false`) and issues a new OTP.

**Profile fetch failure** — `fetchProfile` returns `null` on error. `wasInitialCheck && !null?.firstName` is true, so the user is signed out and lands on the welcome screen. This is a conservative choice: a network error on launch is treated the same as an incomplete profile.

---

## Security Notes

- The OTP value is generated and stored server-side; it is never sent to the client.
- `verificationId` is a UUID, unguessable by brute force.
- The verification document is deleted on first successful use (replay protection).
- The Firebase custom token uses the Firestore document ID as the Auth UID, giving a single consistent identity across Auth and Firestore.
- Firestore rules should restrict `users/{uid}` to reads/writes by the authenticated user whose UID matches the document ID. The `otpVerifications` collection should have no client read/write access.
