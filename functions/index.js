const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
setGlobalOptions({maxInstances: 10, region: "europe-central2"});

const smsMdApiKey = defineSecret("SMS_MD_API_KEY");
const discountApiUrl = defineSecret("DISCOUNT_CARDS_API_URL");
const discountApiLogin = defineSecret("DISCOUNT_CARDS_API_LOGIN");
const discountApiPassword = defineSecret("DISCOUNT_CARDS_API_PASSWORD");

const DISCOUNT_SECRETS = [
  discountApiUrl, discountApiLogin, discountApiPassword,
];

/**
 * Returns the Basic auth header value for the discount cards API.
 * @return {string} The Authorization header value.
 */
function discountAuthHeader() {
  const credentials = Buffer.from(
      `${discountApiLogin.value()}:${discountApiPassword.value()}`,
  ).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Fetches from the discount cards API with authentication.
 * @param {string} path - API path.
 * @param {object} options - Fetch options.
 * @return {Promise<object>} Response data.
 */
async function discountFetch(path, options = {}) {
  const url = `${discountApiUrl.value()}/hs/discount_cards_api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": discountAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    const fetchError = new Error(body.error || "Unknown error");
    fetchError.status = res.status;
    fetchError.error = body.error;
    throw fetchError;
  }
  return body.data;
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const OTP_MESSAGES = {
  ro: (otp) => `Codul tău de verificare: ${otp}. Valabil 5 minute.`,
  ru: (otp) => `Ваш код подтверждения: ${otp}. Действителен 5 минут.`,
};

exports.sendOtp = onCall(
    {secrets: [smsMdApiKey], region: "europe-central2"},
    async (request) => {
      const {phoneNumber, language = "ro"} = request.data;

      if (
        !phoneNumber ||
            typeof phoneNumber !== "string" ||
            !/^\+[1-9]\d{6,14}$/.test(phoneNumber)
      ) {
        throw new HttpsError(
            "invalid-argument",
            "A valid E.164 phone number is required.",
        );
      }

      const db = admin.firestore();

      const phoneHash = crypto
          .createHash("sha256").update(phoneNumber).digest("hex");
      const rateLimitRef = db.collection("otpRateLimits").doc(phoneHash);
      await db.runTransaction(async (tx) => {
        const rlSnap = await tx.get(rateLimitRef);
        const now = Date.now();
        const elapsed = rlSnap.exists ?
          now - rlSnap.data().windowStart : Infinity;
        if (!rlSnap.exists || elapsed >= RATE_LIMIT_WINDOW_MS) {
          tx.set(rateLimitRef, {count: 1, windowStart: now});
        } else if (rlSnap.data().count >= RATE_LIMIT_MAX) {
          throw new HttpsError(
              "resource-exhausted",
              "Too many OTP requests. Try again later.",
          );
        } else {
          tx.update(rateLimitRef, {count: rlSnap.data().count + 1});
        }
      });

      // Find or create user document keyed by phone number
      const usersRef = db.collection("users");
      const snap = await usersRef
          .where("phoneNumber", "==", phoneNumber)
          .limit(1)
          .get();

      let userId;
      const isNewUser = snap.empty;
      if (isNewUser) {
        const newUser = usersRef.doc();
        await newUser.set({
          phoneNumber,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userId = newUser.id;
      } else {
        userId = snap.docs[0].id;
      }

      // Generate a 6-digit OTP and a UUID verification handle
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const verificationId = crypto.randomUUID();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      await db.collection("otpVerifications").doc(verificationId).set({
        phoneNumber,
        userId,
        otp,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Deliver OTP via SMS.md
      const messageFn = OTP_MESSAGES[language] || OTP_MESSAGES["ro"];
      const message = messageFn(otp);
      const smsUrl = new URL("https://api.sms.md/v1/send");
      smsUrl.searchParams.set("from", "viking");
      smsUrl.searchParams.set("to", phoneNumber);
      smsUrl.searchParams.set("message", message);
      smsUrl.searchParams.set("token", smsMdApiKey.value());

      const smsRes = await fetch(smsUrl.toString());
      if (!smsRes.ok) {
        const body = await smsRes.text();
        logger.error("SMS API error", {status: smsRes.status, body});
        throw new HttpsError("internal", "Failed to send OTP SMS.");
      }

      return {verificationId, isNewUser};
    },
);

exports.verifyOtp = onCall(async (request) => {
  const {verificationId, otp} = request.data;

  if (!verificationId || !otp) {
    throw new HttpsError(
        "invalid-argument",
        "verificationId and otp are required.",
    );
  }

  const db = admin.firestore();
  const verifRef = db.collection("otpVerifications").doc(verificationId);
  const verifSnap = await verifRef.get();

  if (!verifSnap.exists) {
    throw new HttpsError("not-found", "Verification session not found.");
  }

  const {otp: storedOtp, expiresAt, userId, phoneNumber} = verifSnap.data();

  if (Date.now() > expiresAt) {
    await verifRef.delete();
    throw new HttpsError("deadline-exceeded", "OTP has expired.");
  }

  if (otp !== storedOtp) {
    throw new HttpsError("invalid-argument", "Incorrect OTP.");
  }

  const phoneHash = crypto
      .createHash("sha256").update(phoneNumber).digest("hex");
  await Promise.all([
    verifRef.delete(),
    admin.firestore().collection("otpRateLimits").doc(phoneHash).delete(),
  ]);

  const customToken = await admin.auth().createCustomToken(userId);
  return {customToken};
});

exports.updateProfile = onCall(
    {region: "europe-central2"},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
      }

      const {firstName, lastName} = request.data;

      if (
        !firstName || typeof firstName !== "string" || !firstName.trim() ||
        firstName.trim().length > 100
      ) {
        throw new HttpsError(
            "invalid-argument", "A valid firstName is required.",
        );
      }
      if (
        !lastName || typeof lastName !== "string" || !lastName.trim() ||
        lastName.trim().length > 100
      ) {
        throw new HttpsError(
            "invalid-argument", "A valid lastName is required.",
        );
      }

      await admin.firestore().collection("users").doc(request.auth.uid).update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      return {success: true};
    },
);

exports.createDiscountCard = onCall(
    {secrets: DISCOUNT_SECRETS, region: "europe-central2"},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
      }

      const {clientName, phoneNumber} = request.data;
      if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
        throw new HttpsError("invalid-argument", "clientName is required.");
      }
      if (
        !phoneNumber ||
        typeof phoneNumber !== "string" ||
        !/^\+[1-9]\d{6,14}$/.test(phoneNumber)
      ) {
        throw new HttpsError(
            "invalid-argument",
            "A valid E.164 phone number is required.",
        );
      }

      try {
        const data = await discountFetch("/card", {
          method: "POST",
          body: JSON.stringify({
            client_name: clientName.trim(),
            phone_number: phoneNumber,
          }),
        });
        return data;
      } catch (err) {
        logger.error("createDiscountCard error", err);
        const msg = err.error || "Failed to create discount card.";
        throw new HttpsError("internal", msg);
      }
    },
);

exports.getDiscountCard = onCall(
    {secrets: DISCOUNT_SECRETS, region: "europe-central2"},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
      }

      const {cardNumber} = request.data;
      if (!cardNumber || typeof cardNumber !== "string") {
        throw new HttpsError("invalid-argument", "cardNumber is required.");
      }

      try {
        const encoded = encodeURIComponent(cardNumber);
        const data = await discountFetch(`/card/${encoded}`);
        return data;
      } catch (err) {
        logger.error("getDiscountCard error", err);
        if (err.status === 404) {
          throw new HttpsError("not-found", "Discount card not found.");
        }
        const msg = err.error || "Failed to get discount card.";
        throw new HttpsError("internal", msg);
      }
    },
);

exports.deleteAccount = onCall(
    {region: "europe-central2"},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
      }

      const uid = request.auth.uid;
      const db = admin.firestore();

      await db.collection("users").doc(uid).delete();
      await admin.auth().deleteUser(uid);

      return {success: true};
    },
);

exports.deleteDiscountCard = onCall(
    {secrets: DISCOUNT_SECRETS, region: "europe-central2"},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
      }

      const {cardNumber} = request.data;
      if (!cardNumber || typeof cardNumber !== "string") {
        throw new HttpsError("invalid-argument", "cardNumber is required.");
      }

      try {
        await discountFetch(`/card/${encodeURIComponent(cardNumber)}`, {
          method: "DELETE",
        });
        return {success: true};
      } catch (err) {
        logger.error("deleteDiscountCard error", err);
        if (err.status === 404) {
          throw new HttpsError("not-found", "Discount card not found.");
        }
        const msg = err.error || "Failed to delete discount card.";
        throw new HttpsError("internal", msg);
      }
    },
);
