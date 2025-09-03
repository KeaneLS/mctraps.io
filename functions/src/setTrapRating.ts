/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type Payload = {
  trapId?: string;
  value?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export const setTrapRating = onCall(async (request) => {
  const uid = request.auth?.uid;
  const provider = (request.auth as unknown as {
    token?: {firebase?: {sign_in_provider?: string}};
  })?.token?.firebase?.sign_in_provider;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to rate traps.");
  }
  if (provider === "anonymous") {
    throw new HttpsError("permission-denied", "Anonymous not allowed.");
  }

  await enforceRateLimit(uid, "setTrapRating", 20, 60);

  const {trapId, value} = (request.data ?? {}) as Payload;
  if (!trapId) {
    throw new HttpsError("invalid-argument", "trapId required.");
  }
  if (value !== 0 && value !== 1 && value !== 2 && value !== 3 &&
    value !== 4 && value !== 5 && value !== 6) {
    throw new HttpsError("invalid-argument", "value must be 0-6.");
  }

  const trapRef = db.collection("traps").doc(trapId);
  const ratingRef = trapRef.collection("ratings").doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const trapSnap = await tx.get(trapRef);
    if (!trapSnap.exists) {
      throw new HttpsError("not-found", "Trap not found.");
    }

    const t = trapSnap.data() as {
      tierlistRating?: {average?: number; count?: number};
    };
    const currentAvg = Number(t?.tierlistRating?.average ?? 0);
    const currentCount = Number(t?.tierlistRating?.count ?? 0);

    const prevSnap = await tx.get(ratingRef);
    const prevVal = prevSnap.exists ? (prevSnap.get("value") as number) :
      null;

    let nextCount = currentCount;
    let nextAvg = currentAvg;

    if (prevVal === null) {
      // new rating
      const total = currentAvg * currentCount + value;
      nextCount = currentCount + 1;
      nextAvg = nextCount > 0 ? total / nextCount : 0;
    } else if (prevVal !== value) {
      // update rating
      if (currentCount <= 0) {
        nextCount = 1;
        nextAvg = value;
      } else {
        const total = currentAvg * currentCount - prevVal + value;
        nextAvg = total / currentCount;
      }
    } // else same value -> no change

    const now = FieldValue.serverTimestamp();
    tx.set(ratingRef, {value, updatedAt: now});
    tx.update(trapRef, {
      tierlistRating: {average: nextAvg, count: nextCount},
      lastActivityAt: now,
    });

    return {average: nextAvg, count: nextCount};
  });

  return result;
});


