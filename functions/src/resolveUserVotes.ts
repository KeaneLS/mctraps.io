/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type Payload = {
  trapId?: string;
  commentIds?: string[];
};

export const resolveUserVotes = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Log in required.");

  const {trapId, commentIds} = (request.data ?? {}) as Payload;
  if (!trapId || !Array.isArray(commentIds)) {
    throw new HttpsError("invalid-argument", "trapId/commentIds required");
  }

  await enforceRateLimit(uid, "resolveUserVotes", 300, 60);

  const unique = Array.from(new Set(commentIds)).filter(Boolean);
  if (unique.length === 0) return {};

  const results: Record<string, 1 | -1 | 0> = {};

  await Promise.all(unique.map(async (cid) => {
    try {
      const snap = await db
        .collection("traps").doc(trapId)
        .collection("comments").doc(cid)
        .collection("votes").doc(uid)
        .get();
      const value = snap.exists ? (snap.get("value") as number) : 0;
      const v = value === 1 ? 1 : value === -1 ? -1 : 0;
      results[cid] = v as 1 | -1 | 0;
    } catch (err) {
      results[cid] = 0;
    }
  }));

  return results;
});


