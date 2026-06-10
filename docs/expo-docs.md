# EAS Build & Submit Reference

Project: **Real Market** (`com.real.market.app`)
EAS project ID: `4bb0386e-5444-42df-91e1-2c9fc7ce00c0`
Owner: `dmitrii.sh`

---

## Build profiles

Defined in `eas.json`:

| Profile | Purpose | Distribution | Auto-increment |
|---|---|---|---|
| `development` | Dev client with JS debugger | Internal (ad-hoc / APK) | no |
| `preview` | Internal QA / stakeholder testing | Internal (ad-hoc / APK) | no |
| `production` | Store release | App Store / Play Store | yes (remote) |

Version is managed remotely (`"appVersionSource": "remote"`). Manual override: `eas build:version:set`.

---

## Prerequisites

```bash
npm install -g eas-cli
eas login          # log in with Expo account (dmitrii.sh)
```

---

## iOS

### Build

```bash
# Development — dev client, Metro debugger attached
eas build --platform ios --profile development

# Preview — internal QA (distributed via link, no TestFlight needed)
eas build --platform ios --profile preview

# Production — App Store ready .ipa, version auto-incremented
eas build --platform ios --profile production
```

### Submit to TestFlight / App Store Connect

```bash
# Submit the latest successful production build
eas submit --platform ios --profile production

# Build + submit in a single command
eas build --platform ios --profile production --auto-submit
```

EAS submits to **TestFlight** automatically. To promote to the live App Store:

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → your app → **App Store** tab
2. Click **+** next to iOS App → select the TestFlight build
3. Fill in release notes / screenshots if needed
4. Submit for Review

### First-time Apple credentials setup (avoids 2FA on every submit)

1. App Store Connect → **Users & Access** → **Integrations** → **App Store Connect API**
2. Create a key with **App Manager** role, download the `.p8` file
3. Run `eas credentials` and register the key
4. Subsequent `eas submit` runs are fully non-interactive

---

## Android

### Build

```bash
# Development — dev client APK
eas build --platform android --profile development

# Preview — installable APK (sideload directly, no Play Store)
eas build --platform android --profile preview

# Production — AAB for Play Store, version auto-incremented
eas build --platform android --profile production
```

### Submit to Google Play

```bash
# Submit to Internal Testing track (default for first submission)
eas submit --platform android --profile production --track internal

# Submit to other tracks
eas submit --platform android --profile production --track alpha
eas submit --platform android --profile production --track beta
eas submit --platform android --profile production --track production
```

Promote between tracks inside **Google Play Console** (Internal → Alpha → Beta → Production) or via CLI as shown above.

### First-time Google Play credentials setup

1. Google Play Console → **Setup** → **API access** → link a Google Cloud project
2. Create a Service Account with **Release Manager** role
3. Download the JSON key
4. Add to `eas.json` under `submit.production`:
   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "./path/to/key.json",
         "track": "internal"
       }
     }
   }
   ```

---

## Both platforms at once

```bash
# Build both
eas build --platform all --profile production

# Build + submit both
eas build --platform all --profile production --auto-submit
```

---

## OTA updates (JS / assets only — no store resubmit)

```bash
# Push to users on the production channel
eas update --channel production --message "Fix: <description>"

# Push to preview channel
eas update --channel preview --message "Fix: <description>"
```

OTA updates only apply to JavaScript and asset changes.
Any native change (new package, permission, config plugin) requires a full build + store submission.

---

## Monitoring & utilities

```bash
# List recent builds
eas build:list

# Open a specific build in the browser
eas build:view

# Manually set build version
eas build:version:set

# Run a dev build locally (no EAS cloud, requires Xcode / Android Studio)
eas build --platform ios --profile development --local
eas build --platform android --profile development --local

# Manage signing credentials (certificates, provisioning profiles, keystore)
eas credentials
```
