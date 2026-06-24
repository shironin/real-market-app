# Test Account (App Store / Play Market Review)

A dedicated test account bypasses SMS delivery and the external discount card API so reviewers can sign in without a real phone.

## Credentials

| Field | Value |
|---|---|
| Phone number | `+37360111222` |
| OTP code | `000000` |
| First name | User |
| Last name | Test |
| Discount card number | `1234567891011` |
| Discount | 5% |

## Sign-in steps

1. Open the app and tap **Continue with phone**.
2. Enter `+37360111222` and submit.
3. On the OTP screen enter `000000` and tap **Verify**.
4. The app lands directly on the dashboard — no profile setup needed.

## How it works

The bypass lives entirely in the Cloud Functions (`functions/index.js`):

- **`sendOtp`** — detects the test phone number, skips SMS, stores `000000` as the OTP, and pre-seeds the Firestore user document with the name and card number.
- **`verifyOtp`** — unchanged; validates the stored OTP normally.
- **`getDiscountCard`** — returns mock card data for card number `1234567891011` without calling the external API.
- **`createDiscountCard`** — returns the same mock card data for the test phone number.

Real users are unaffected.
