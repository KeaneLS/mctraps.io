/* eslint-disable linebreak-style */
import {HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export type RateLimitResult = {
  remaining: number;
  resetAt: string; 
};

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_SECONDS = 60;

export async function enforceRateLimit(
  uid: string,
  backendFunction: string,
  limit: number = DEFAULT_LIMIT,
  windowSeconds: number = DEFAULT_WINDOW_SECONDS
): Promise<RateLimitResult> {
  const nowMs = Date.now();
  const windowMs = Math.max(1, windowSeconds) * 1000;
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const resetMs = windowStartMs + windowMs;
  const windowStartIso = new Date(windowStartMs).toISOString();
  const docId = `${uid}_${backendFunction}_${windowStartIso}`;
  const docRef = db.collection("rateLimits").doc(docId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const currentCount = (snap.data()?.count as number) || 0;
    const nextCount = currentCount + 1;

    if (nextCount > Math.max(1, limit)) {
      throw new HttpsError(
        "resource-exhausted",
        "Rate limit exceeded for this action."
      );
    }

    if (!snap.exists) {
      tx.set(docRef, {
        backendFunction,
        userHash: uid,
        windowStart: new Date(windowStartMs),
        expiresAt: new Date(resetMs),
        count: 1,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.update(docRef, {
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const remaining = Math.max(0, limit - nextCount);
    return {remaining};
  });

  return {
    remaining: result.remaining,
    resetAt: new Date(resetMs).toISOString(),
  };
}

