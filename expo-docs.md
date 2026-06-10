# Expo / EAS Build & Deploy Reference

All commands run from the `/app` directory.

---

## Build profiles (eas.json)

| Profile | Purpose | Distribution |
|---|---|---|
| `development` | Dev client with debugger | Internal (ad-hoc / APK) |
| `preview` | QA / internal testing | Internal (ad-hoc / APK) |
| `production` | Store release | App Store / Play Store |

---

## iOS

### Build

```bash
# Development build (dev client, debugger attached)
eas build --platform ios --profile development

# Preview / internal QA build
eas build --platform ios --profile preview

# Production build (App Store ready .ipa)
eas build --platform ios --profile production
```

### Submit to TestFlight

```bash
# Submit latest successful production build
eas submit --platform ios --profile production

# Submit a specific build (prompts to pick from list)
eas submit --platform ios --profile production --latest
```

### Build + submit in one step

```bash
eas build --platform ios --profile production --auto-submit
```

### Promote from TestFlight → App Store (production release)

This is done in **App Store Connect** — there is no EAS CLI command for promoting a TestFlight build to production. Steps:

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Select the app → **App Store** tab
3. Click **+** next to iOS App, choose the TestFlight build
4. Fill in release notes, screenshots if needed
5. Submit for Review

---

## Android

### Build

```bash
# Development build (dev client)
eas build --platform android --profile development

# Preview build (.apk for direct install)
eas build --platform android --profile preview

# Production build (.aab for Play Store)
eas build --platform android --profile production
```

### Submit to Play Store (Internal track)

The `serviceAccountKeyPath` in `app.json` points to the Google service account key.
The default track is `internal` (set in `app.json → android.track`).

```bash
# Submit latest production build to Internal track
eas submit --platform android --profile production

# Submit to a specific track explicitly
eas submit --platform android --profile production --track internal
eas submit --platform android --profile production --track alpha
eas submit --platform android --profile production --track beta
eas submit --platform android --profile production --track production
```

### Promote to production on Play Store

```bash
eas submit --platform android --profile production --track production
```

Or promote inside Google Play Console: Internal → Alpha → Beta → Production.

---

## Both platforms at once

### Build both

```bash
eas build --platform all --profile production
```

### Build + submit both in one step

```bash
eas build --platform all --profile production --auto-submit
```

---

## Useful extras

### Check build status

```bash
eas build:list
```

### View build logs / open in browser

```bash
eas build:view
```

### Bump version (auto-increment is on for production)

Version is managed remotely (`"appVersionSource": "remote"` in `eas.json`).
To manually set:

```bash
eas build:version:set
```

### Run dev build locally on simulator (no EAS cloud)

```bash
# iOS simulator
eas build --platform ios --profile development --local

# Android emulator
eas build --platform android --profile development --local
```

### Update (OTA — JS/assets only, no store resubmit)

```bash
# Push an OTA update to all users on the production channel
eas update --channel production --message "Fix: ..."

# Push to preview channel
eas update --channel preview --message "Fix: ..."
```

OTA updates only work for JS and asset changes. Any native code change (new package, permission, plugin) requires a full build + store submission.

---

## First-time setup (Apple API key — avoids 2FA prompts)

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users & Access** → **Integrations** → **App Store Connect API**
2. Create a key with **App Manager** role
3. Download the `.p8` file
4. Run:
   ```bash
   eas credentials
   ```
   and follow the prompts to register the API key.

After that, `eas submit` for iOS runs non-interactively.
