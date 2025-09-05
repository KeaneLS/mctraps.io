/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type DeletePayload = {
  trapId?: string;
  commentId?: string;
};

export const softDeleteComment = onCall(async (request) => {
  const uid = request.auth?.uid;
  const provider = (request.auth as unknown as {
    token?: {firebase?: {sign_in_provider?: string}};
  })?.token?.firebase?.sign_in_provider;
  const tokenAdmin = Boolean(
    (request.auth as unknown as {token?: {admin?: boolean}})?.token?.admin
  );

  if (!uid) {
    throw new HttpsError("unauthenticated", "Log in to delete.");
  }
  if (provider === "anonymous") {
    throw new HttpsError("permission-denied", "Anon not allowed.");
  }

  await enforceRateLimit(uid, "softDeleteComment", 20, 60);

  const {trapId, commentId} = (request.data ?? {}) as DeletePayload;
  if (!trapId || !commentId) {
    throw new HttpsError("invalid-argument", "trapId/commentId req.");
  }

  const commentRef = db
    .collection("traps").doc(trapId)
    .collection("comments").doc(commentId);

  let isAdmin = tokenAdmin;
  if (!isAdmin) {
    try {
      const userDoc = await db.collection("users").doc(uid).get();
      isAdmin = userDoc.exists ? Boolean(userDoc.get("admin")) : false;
    } catch {
    }
  }

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(commentRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Comment missing.");
    }
    const data = snap.data() as {
      authorId?: string;
      status?: string;
      depth?: number;
      threadId?: string;
    };
    if (data.authorId !== uid && !isAdmin) {
      throw new HttpsError("permission-denied", "Not owner.");
    }
    // UI filters out on read
    tx.update(commentRef, {
      status: "deleted",
      lastActivityAt: FieldValue.serverTimestamp(),
    });
  });

  return {ok: true};
});


