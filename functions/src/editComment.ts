/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type EditPayload = {
  trapId?: string;
  commentId?: string;
  body?: string;
};

export const editComment = onCall(async (request) => {
  const uid = request.auth?.uid;
  const provider = (request.auth as unknown as {
    token?: {firebase?: {sign_in_provider?: string}};
  })?.token?.firebase?.sign_in_provider;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to edit.");
  }
  if (provider === "anonymous") {
    throw new HttpsError("permission-denied", "Anon not allowed.");
  }

  await enforceRateLimit(uid, "editComment", 20, 60);

  const {trapId, commentId, body} = (request.data ?? {}) as EditPayload;
  if (!trapId || !commentId) {
    throw new HttpsError("invalid-argument", "trapId/commentId req.");
  }
  if (typeof body !== "string") {
    throw new HttpsError("invalid-argument", "body required.");
  }
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new HttpsError("invalid-argument", "Empty body.");
  }
  if (trimmed.length > 2000) {
    throw new HttpsError("invalid-argument", "Body too long.");
  }

  const commentRef = db
    .collection("traps").doc(trapId)
    .collection("comments").doc(commentId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(commentRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Comment missing.");
    }
    const data = snap.data() as {authorId?: string; status?: string};
    if (data.authorId !== uid) {
      throw new HttpsError("permission-denied", "Not owner.");
    }
    tx.update(commentRef, {
      body: trimmed,
      status: "edited",
      lastActivityAt: FieldValue.serverTimestamp(),
    });
  });

  return {ok: true};
});


