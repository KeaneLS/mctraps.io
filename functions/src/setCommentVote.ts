/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type VotePayload = {
  trapId?: string;
  commentId?: string;
  value?: 1 | -1 | 0; // 0 clears
};

export const setCommentVote = onCall(async (request) => {
  const uid = request.auth?.uid;
  const provider = (request.auth as unknown as {
    token?: {firebase?: {sign_in_provider?: string}};
  })?.token?.firebase?.sign_in_provider;

  if (!uid) throw new HttpsError("unauthenticated", "Log in to vote.");
  if (provider === "anonymous") {
    throw new HttpsError("permission-denied", "Anonymous not allowed.");
  }

  await enforceRateLimit(uid, "setCommentVote", 30, 60);

  const {trapId, commentId, value} = (request.data ?? {}) as VotePayload;
  if (!trapId || !commentId) {
    throw new HttpsError("invalid-argument", "trapId/commentId required.");
  }
  if (value !== 1 && value !== -1 && value !== 0) {
    throw new HttpsError("invalid-argument", "value must be 1, -1, or 0.");
  }

  const commentRef = db
    .collection("traps")
    .doc(trapId)
    .collection("comments")
    .doc(commentId);
  const voteRef = commentRef.collection("votes").doc(uid);

  await db.runTransaction(async (tx) => {
    const commentSnap = await tx.get(commentRef);
    if (!commentSnap.exists) {
      throw new HttpsError("not-found", "Comment not found.");
    }

    const prevSnap = await tx.get(voteRef);
    const prevValue = prevSnap.exists ?
      (prevSnap.get("value") as number) :
      0;
    const prev = prevValue as 1 | 0 | -1;

    let likeDelta = 0;
    let dislikeDelta = 0;

    if (prev === value) {
      return; // no-op
    }

    if (prev === 1) likeDelta -= 1;
    if (prev === -1) dislikeDelta -= 1;

    if (value === 1) likeDelta += 1;
    if (value === -1) dislikeDelta += 1;

    if (value === 0) {
      if (prevSnap.exists) {
        tx.delete(voteRef);
      }
    } else {
      tx.set(voteRef, {value, updatedAt: FieldValue.serverTimestamp()});
    }

    tx.update(commentRef, {
      likeCount: FieldValue.increment(likeDelta),
      dislikeCount: FieldValue.increment(dislikeDelta),
      score: FieldValue.increment(likeDelta - dislikeDelta),
      lastActivityAt: FieldValue.serverTimestamp(),
    });
  });

  return {ok: true};
});


