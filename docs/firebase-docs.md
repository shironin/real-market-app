# Firebase CLI Setup & Deployment

## 1. Install Firebase Tools

```bash
npm install -g firebase-tools
```

Verify the installation:

```bash
firebase --version
```

---

## 2. Login

Authenticate your machine with your Google account:

```bash
firebase login
```

This opens a browser window. Sign in with the Google account that owns your Firebase project.

To check who is currently logged in:

```bash
firebase login:list
```

To log out:

```bash
firebase logout
```

---

## 3. Initialize the Project

Run this from the root of the project:

```bash
firebase init
```

When prompted, select the following services using the spacebar:

- **Firestore** — database rules and indexes
- **Functions** — serverless Cloud Functions (Node.js / TypeScript)

Then follow the prompts:

| Prompt | Answer |
| :--- | :--- |
| Use an existing project? | Yes — select your Firebase project |
| Firestore rules file | `firestore.rules` (default) |
| Firestore indexes file | `firestore.indexes.json` (default) |
| Functions language | TypeScript |
| Use ESLint? | Yes |
| Install dependencies now? | Yes |

This generates:
- `firebase.json` — services config
- `.firebaserc` — project alias
- `firestore.rules` — security rules
- `firestore.indexes.json` — composite indexes
- `functions/` — Cloud Functions source directory

---

## 4. Deploy

Deploy everything (rules + functions) in one command:

```bash
firebase deploy
```

Deploy only Firestore rules:

```bash
firebase deploy --only firestore:rules
```

Deploy only Cloud Functions:

```bash
firebase deploy --only functions
```

Deploy a specific function:

```bash
firebase deploy --only functions:onUserCreated
```

---

## 5. Secrets Management

Firebase Functions secrets store sensitive values server-side — they are never exposed in the client bundle or source code.

### Project Secrets

| Secret | Description |
| :--- | :--- |
| `SMS_MD_API_KEY` | Bearer token for `api.sms.md` — used by Cloud Functions to send OTP SMS messages |

### Commands

Set or update a secret (prompts for the value interactively):

```bash
firebase functions:secrets:set SMS_MD_API_KEY
```

View the secret's metadata (not the value):

```bash
firebase functions:secrets:get SMS_MD_API_KEY
```

List all secrets:

```bash
firebase functions:secrets:list
```

Destroy a secret version:

```bash
firebase functions:secrets:destroy SMS_MD_API_KEY
```

### Using a Secret in a Cloud Function

Declare it in the function definition so Firebase injects it at runtime:

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const smsMdApiKey = defineSecret("SMS_MD_API_KEY");

export const sendOtp = onCall({ secrets: [smsMdApiKey] }, async (request) => {
  const apiKey = smsMdApiKey.value();
  // use apiKey to call https://api.sms.md/v1/send
});
```

> The secret value is only accessible inside functions that explicitly declare it in the `secrets` array. It is never logged or bundled.

---

## 6. Useful Commands

| Command | Description |
| :--- | :--- |
| `firebase emulators:start` | Run Firestore + Functions locally without deploying |
| `firebase functions:log` | Stream live logs from deployed functions |
| `firebase projects:list` | List all Firebase projects on your account |
| `firebase use <project-id>` | Switch the active project |
