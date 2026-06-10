# Technical Specification & System Architecture
## Project: Market Discount Card Wallet App

## 1. Executive Overview
This mobile application is a lightweight, secure utility designed specifically for retail market customers (primarily targeting the Republic of Moldova, including expatriates accessing the service globally). The app allows users to authenticate seamlessly via their phone numbers, dynamically requests a new digital discount card from the market’s legacy system if they don't have one, and stores the card data securely.

### Key Goals & Constraints
* **Zero-Cost Infrastructure:** Designed completely around the free tiers of Firebase (Blaze plan scale) and external providers to maintain a $0/month operational cost for up to 20,000 total users.
* **Legacy Integration Bridge:** Acts as a secure, HTTPS-compliant proxy for an unencrypted, internal legacy HTTP API (`http://api.sms.md` / Market API).
* **Global Availability:** Optimized for seamless performance regardless of whether the user is located locally or traveling abroad with international SIM cards/device locales.

---

## 2. High-Level System Architecture

The application implements a **Backend-for-Frontend (BFF) Proxy Pattern** to bridge communication between the modern, secure mobile client and the unencrypted market infrastructure.

[ Mobile App: Expo / RN ]
│  ▲
(HTTPS│  │ (Encrypted Auth & Data)
▼  │
[ Firebase BaaS Ecosystem ]
├─ Auth (Phone / SMS Handler)
├─ Firestore (Secure User-Card Mapping)
└─ Cloud Functions (Secure Serverless Proxy)
│  ▲
(HTTP)│  │ (Private Server-to-Server Communication)
▼  │
[ External Infrastructure ]
├─ SMS Provider (api.sms.md via HTTPS)
└─ Market Legacy API (Card Generator via HTTP)


---

## 3. Component Deep Dive

### 3.1 Mobile Client (Frontend)
* **Framework:** Expo + React Native (Managed Workflow).
* **Target Platforms:** iOS and Android.
* **Core Responsibilities:**
    * Presenting the Phone Number OTP (One-Time Password) UI.
    * Interacting with the native Firebase SDK for authentication.
    * Displaying the generated discount card ID (e.g., via Barcode/QR Code renderers).
    * Managing local state, user session persistence, and logout capabilities.
    * Providing a compliant profile management interface allowing users to trigger a full account and data erasure request.

### 3.2 Firebase Backend (Infrastructure-as-Code)
The backend infrastructure is managed entirely through local configuration files (`firebase.json`, `.firebaserc`) via the Firebase CLI, ensuring reproducible deployments without manual web-console provisioning.

#### A. Firebase Authentication (OTP Engine)
* **Mechanism:** Phone Number Authentication.
* **Integration:** Relies on Firebase's native verification flow. When the user inputs their phone number, the app requests an OTP.
* **SMS Delivery:** Configured to trigger an HTTPS payload using your specific regional provider (`https://api.sms.md/v1/send`) passing standard bearer token authorization headers (`Authorization: Bearer YOUR_API_KEY`).

#### B. Cloud Firestore (NoSQL Database)
A NoSQL database that scales to zero cost. It maintains a strictly minimal, privacy-compliant schema:
* **Collection:** `users`
    * `Document ID`: Unique Firebase UID (`auth.uid`)
    * `phoneNumber`: String (E.164 formatted string, e.g., `+37369XXXXXX`)
    * `marketCardId`: String (Received from legacy system)
    * `createdAt`: Timestamp

#### C. Firebase Cloud Functions (Secure Proxy)
Serverless execution environments written in Node.js/TypeScript. They isolate sensitive operational logic from the client:
* **On-User-Created Trigger:** Automatically fires when a user successfully passes SMS authentication for the first time.
    * Executes an internal server-to-server HTTP call to the market's unencrypted card generation endpoint.
    * Parses the generated card ID and maps it directly to the user’s document in Firestore.
    * **Security Boundary:** Ensures the market's HTTP endpoints and internal APIs are entirely shielded from the open internet and client-side reverse engineering.

---

## 4. Technical Workflows & Data Flows

### 4.1 User Authentication & Card Provisioning Sequence

1. **Initiation:** The user enters their phone number in the Expo app.
2. **OTP Request:** The client calls Firebase Auth $\rightarrow$ triggers a call to `api.sms.md` $\rightarrow$ User receives the SMS.
3. **Verification:** The user submits the code. Firebase verifies the token and creates a unique User Record.
4. **Card Generation (Backend Link):** * Firebase Firestore triggers a Cloud Function upon user creation.
    * The Cloud Function issues a secure request:
      ```bash
      curl http://legacy-market-api/v1/generate-card
      ```
    * The Cloud Function intercepts the response and writes the `marketCardId` to the user's Firestore document.
5. **UI Update:** The mobile app listens to changes in Firestore, detects the new `marketCardId`, and displays it to the user.

### 4.2 Data Erasure & Compliance Workflow (GDPR / Privacy)

To ensure full privacy compliance, a clean state tear-down is initiated when a user requests account deletion from the settings menu:

1. **Client Request:** The user presses "Delete My Data".
2. **Backend Deletion Trigger:** A callable Cloud Function is initiated which executes three operations:
    * **Authentication Deletion:** Purges the user from Firebase Auth records.
    * **Database Erasure:** Drops the respective document under `/users/{uid}` in Firestore.
    * *(Optional)* **Legacy Notification:** Fires a transactional notification to the market's system to flag the `marketCardId` as decommissioned.

---

## 5. Security & Risk Analysis

| Vector | Risk Profile | Mitigation Strategy |
| :--- | :--- | :--- |
| **Cleartext HTTP** | High risk of sniffing/tampering if called from a mobile device over public Wi-Fi. | **Mitigated:** The mobile client *only* talks HTTPS to Firebase. The unencrypted HTTP call is confined entirely to server-to-server traffic inside the cloud platform. |
| **API Secret Leaks** | Compromising the `api.sms.md` bearer token or market API keys. | **Mitigated:** Secrets are stored securely as Firebase Functions Environment Configuration Variables. They are never compiled into the mobile application bundle. |
| **SMS Cost Spamming** | Malicious script spamming the SMS gateway, generating infrastructural costs. | **Mitigated:** Strict implementation of Firebase Auth app check and rate-limiting rules. Access tokens are required to request SMS generation. |
| **Inactivity Dormancy** | Infrastructure turning off or spinning down during low-traffic periods. | **Mitigated:** Handled by selecting the Firebase Blaze (Pay-as-you-go) tier. Unlike alternative BaaS systems, Firebase instances do not enter a hard "paused" state during weeks of zero traffic. |

---

## 6. Configuration & Deployment Commands

The configuration profile is maintained in the project codebase. Deployment is performed via terminal operations:

```bash
# 1. Install project dependencies locally
npm install -g firebase-tools

# 2. Authenticate machine with Google Developer Profile
firebase login

# 3. Initialize services (Select Firestore, Functions)
firebase init

# 4. Deploy all backend database rules and serverless functions 
firebase deploy