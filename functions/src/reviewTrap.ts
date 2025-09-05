/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type Verdict = "accept" | "deny";

type ReviewPayload = {
  trapId?: string;
  verdict?: Verdict;
  reason?: string | null;
};

/**
 * Ensures the given user ID belongs to an admin; throws if not.
 * @param {string} uid User ID to check
 * @return {Promise<void>} Resolves when assertion passes
 */
async function assertAdmin(uid: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const isAdmin = Boolean(snap.exists && snap.get("admin") === true);
  if (!isAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can review traps."
    );
  }
}

/**
 * Queues an email to the Firestore mail collection. Best-effort.
 * @param {(string|null|undefined)} to Recipient email
 * @param {string} subject Email subject
 * @param {string} text Plain-text body
 * @param {string=} html Optional HTML body
 * @return {Promise<void>} Resolves after queuing
 */
async function queueEmail(
  to: string | null | undefined,
  subject: string,
  text: string,
  html?: string
): Promise<void> {
  if (!to) return; // no email on file
  try {
    await db.collection("mail").add({
      to,
      message: {subject, text, html: html || text},
    });
  } catch {
  }
}

export const reviewTrap = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Log in as admin to review.");
  }

  await enforceRateLimit(uid, "reviewTrap", 30, 60);
  await assertAdmin(uid);

  const {trapId, verdict, reason} = (request.data ?? {}) as ReviewPayload;
  if (!trapId) {
    throw new HttpsError("invalid-argument", "trapId required.");
  }
  if (verdict !== "accept" && verdict !== "deny") {
    throw new HttpsError("invalid-argument", "Invalid verdict.");
  }
  const denyReason = (reason ?? "").toString().trim();
  if (verdict === "deny" && denyReason.length === 0) {
    throw new HttpsError("invalid-argument", "Reason required to deny.");
  }

  const inRevRef = db.collection("trapsInReview").doc(trapId);
  const inRevSnap = await inRevRef.get();
  if (!inRevSnap.exists) {
    throw new HttpsError("not-found", "Trap not found in review.");
  }
  const data = inRevSnap.data() as Record<string, unknown>;
  const createdBy = (data?.createdBy as string) || null;
  const trapName = ((data?.name as string) || "the trap").toString();

  // resolve publisher email
  let publisherEmail: string | null = null;
  if (createdBy) {
    try {
      const userSnap = await db.collection("users").doc(createdBy).get();
      publisherEmail = (userSnap.exists ?
        (userSnap.get("email") as string | null) : null);
    } catch {
      publisherEmail = null;
    }
  }

  if (verdict === "accept") {
    const trapsRef = db.collection("traps").doc(trapId);
    const normalized = {
      name: data?.name ?? "",
      creators: Array.isArray(data?.creators) ? data?.creators : [],
      dateInvented: data?.dateInvented ?? "",
      type: Array.isArray(data?.type) ? data?.type[0] : data?.type ?? "",
      video: data?.video ?? null,
      thumbnailUrl: data?.thumbnailUrl ?? null,
      minigame: Array.isArray(data?.minigame) ?
        data?.minigame[0] : data?.minigame ?? "",
      tierlistRating: {average: 0, count: 0},
      commentCount: 0,
      description: (data?.description ?? "").toString(),
      createdBy: createdBy,
      acceptedAt: FieldValue.serverTimestamp(),
      reviewedBy: uid,
    } as Record<string, unknown>;

    await db.runTransaction(async (tx) => {
      tx.set(trapsRef, normalized, {merge: true});
      tx.delete(inRevRef);
    });

    const subject = "Your trap was accepted and is now live";
    const text =
      "Good news! Your trap \"" + trapName +
      "\" was accepted and is now live on the site.\n\n" +
      "Thanks for contributing!";
    await queueEmail(publisherEmail, subject, text);

    return {status: "accepted", trapId};
  }

  // deny
  const deniedRef = db.collection("deniedTraps").doc(trapId);
  const toWrite = {
    ...data,
    deniedAt: FieldValue.serverTimestamp(),
    reviewedBy: uid,
    denyReason,
  } as Record<string, unknown>;

  await db.runTransaction(async (tx) => {
    tx.set(deniedRef, toWrite);
    tx.delete(inRevRef);
  });

  const subject = "Your trap submission was denied";
  const text =
    "Unfortunately, your trap \"" + trapName +
    "\" was denied.\n\n" +
    "Reason: " + denyReason + "\n\n" +
    "You can update and resubmit based on the feedback.";
  await queueEmail(publisherEmail, subject, text);

  return {status: "denied", trapId};
});


