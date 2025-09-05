/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
// import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();


type VerifyPayload = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  discordUsername?: string | null;
};

export const verifyDiscord = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to verify Discord."
    );
  }
  await enforceRateLimit(uid, "verifyDiscord", 10, 60);

  const {
    displayName,
    email,
    photoURL,
    discordUsername: providedUsername,
  } = (request.data ?? {}) as VerifyPayload;

  const discordUsername = providedUsername ?? null;
  const authToken = (request.auth as unknown as {
    token?: {firebase?: {sign_in_provider?: string}};
  }) || {};
  const signInProvider = authToken?.token?.firebase?.sign_in_provider;
  const isAnonymous = signInProvider === "anonymous";

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();

  if (snap.exists) {
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (discordUsername !== null) {
      updates.discordUsername = discordUsername;
    }
    const cur = (snap.data() as {
      displayName?: string|null;
      email?: string|null;
      photoURL?: string|null;
    }) || {};
    if (!cur.displayName && displayName) updates.displayName = displayName;
    if (!cur.email && email) updates.email = email;
    if (!cur.photoURL && photoURL) updates.photoURL = photoURL;
    await userRef.set(updates, {merge: true});
    return {status: "updated", uid};
  }

  if (
    isAnonymous ||
    (!displayName && !email && !photoURL && !discordUsername)
  ) {
    return {status: "skipped", reason: "no_profile_or_anonymous", uid};
  }

  await userRef.set({
    admin: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    discordUsername: discordUsername ?? null,
    displayName: (() => {
      const name = displayName ?? null;
      return name;
    })(),
    email: email ?? null,
    photoURL: photoURL ?? null,
  }, {merge: true});

  return {status: "created", uid};
});
