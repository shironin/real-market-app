const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
setGlobalOptions({maxInstances: 10, region: "europe-central2"});

const smsMdApiKey = defineSecret("SMS_MD_API_KEY");

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

  const {otp: storedOtp, expiresAt, userId} = verifSnap.data();

  if (Date.now() > expiresAt) {
    await verifRef.delete();
    throw new HttpsError("deadline-exceeded", "OTP has expired.");
  }

  if (otp !== storedOtp) {
    throw new HttpsError("invalid-argument", "Incorrect OTP.");
  }

  await verifRef.delete();

  const customToken = await admin.auth().createCustomToken(userId);
  return {customToken};
});
