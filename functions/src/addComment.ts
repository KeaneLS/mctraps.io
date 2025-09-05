/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type AddPayload = {
  trapId?: string;
  body?: string;
  parentId?: string | null;
};

export const addComment = onCall(async (request) => {
  const uid = request.auth?.uid;
  const provider = (request.auth as unknown as {
    token?: {firebase?: {sign_in_provider?: string}};
  })?.token?.firebase?.sign_in_provider;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Log in to comment.");
  }
  if (provider === "anonymous") {
    throw new HttpsError("permission-denied", "Anonymous not allowed.");
  }

  await enforceRateLimit(uid, "addComment", 20, 60);

  const {trapId, body, parentId} = (request.data ?? {}) as AddPayload;
  if (!trapId) throw new HttpsError("invalid-argument", "trapId req.");
  if (!body || typeof body !== "string") {
    throw new HttpsError("invalid-argument", "body required.");
  }
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new HttpsError("invalid-argument", "Empty body.");
  }
  if (trimmed.length > 2000) {
    throw new HttpsError("invalid-argument", "Body too long.");
  }

  const trapRef = db.collection("traps").doc(trapId);
  const commentsRef = trapRef.collection("comments");

  return await db.runTransaction(async (tx) => {
    let depth = 0;
    let threadId: string | null = null;
    let effectiveParentId: string | null = null;
    const now = FieldValue.serverTimestamp();

    if (parentId) {
      const parentRef = commentsRef.doc(parentId);
      const parentSnap = await tx.get(parentRef);
      if (!parentSnap.exists) {
        throw new HttpsError("not-found", "Parent comment missing.");
      }
      const pdata = parentSnap.data() as {
        depth?: number; threadId?: string; status?: string;
      };
      if (pdata?.status === "hidden" || pdata?.status === "deleted") {
        throw new HttpsError("failed-precondition", "Parent not active.");
      }

      const parentDepth = pdata?.depth ?? 0;
      let rootId: string;
      if (parentDepth === 0) {
        rootId = parentSnap.id;
      } else {
        rootId = pdata?.threadId || parentSnap.id;
      }

      depth = 1;
      threadId = rootId;
      effectiveParentId = rootId;

      const rootRef = commentsRef.doc(rootId);
      tx.update(rootRef, {
        replyCount: FieldValue.increment(1),
        lastActivityAt: now,
      });
    }

    const newRef = commentsRef.doc();
    const finalThreadId = threadId || newRef.id;
    const docData = {
      authorId: uid,
      body: trimmed,
      createdAt: now,
      lastActivityAt: now,
      parentId: effectiveParentId,
      threadId: finalThreadId,
      depth,
      replyCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      score: 0,
      status: "visible",
      trapId: trapId,
    };
    tx.set(newRef, docData);

    tx.update(trapRef, {commentCount: FieldValue.increment(1)});

    return {id: newRef.id, threadId: finalThreadId};
  });
});


