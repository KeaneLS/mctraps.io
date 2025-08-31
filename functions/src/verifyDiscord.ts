/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth as getAdminAuth} from "firebase-admin/auth";

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

  const {
    displayName,
    email,
    photoURL,
    discordUsername: providedUsername,
  } = (request.data ?? {}) as VerifyPayload;

  let discordUsername = providedUsername ?? displayName ?? null;
  if (!discordUsername) {
    try {
      const adminAuth = getAdminAuth();
      const rec = await adminAuth.getUser(uid);
      discordUsername = rec.displayName ?? null;
    } catch {
      // ignore, will remain null
    }
  }

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();

  if (snap.exists) {
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (discordUsername !== null) {
      updates.discordUsername = discordUsername;
    }
    await userRef.set(updates, {merge: true});
    return {status: "updated", uid};
  }

  await userRef.set({
    admin: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    discordUsername: discordUsername ?? null,
    displayName: discordUsername ?? displayName ?? null,
    email: email ?? null,
    photoURL: photoURL ?? null,
  }, {merge: true});

  return {status: "created", uid};
});
