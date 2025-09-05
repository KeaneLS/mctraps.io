/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type SubmitPayload = {
  name?: string;
  creators?: string[];
  minigame?: string[];
  type?: string[];
  dateInvented?: string; // yyyy-mm-dd
  description?: string | null;
  youtubeUrl?: string;
  thumbnailUrl?: string | null;
};

/**
 * Extract the YouTube id from a URL and build embed/watch URLs.
 *
 * @param {string} url A YouTube or youtu.be URL.
 * @return {{youtubeId:string, embedUrl:string, watchUrl:string} | null}
 * Returns the parsed video information, or null if not a valid link.
 */
function parseYouTube(url: string) {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace(/^\//, "");
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v") || "";
    }
    if (!id) return null;
    return {
      youtubeId: id,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  } catch {
    return null;
  }
}

/**
 * Format the timezone offset like "UTC-4" or "UTC+1:30".
 *
 * @param {Date} d The date whose timezone offset will be formatted.
 * @return {string} A formatted UTC offset string.
 */
function formatOffset(d: Date): string {
  const offMin = d.getTimezoneOffset();
  const offH = -Math.trunc(offMin / 60);
  const offM = Math.abs(offMin % 60);
  const sign = offH >= 0 ? "+" : "-";
  const h = Math.abs(offH);
  const mm = offM ? `:${offM.toString().padStart(2, "0")}` : "";
  return `UTC${sign}${h}${mm}`;
}

/**
 * Format a Date like:
 *   "September 2, 2025 at 8:23:31 PM UTC-4".
 *
 * @param {Date} now The date to format.
 * @return {string} The formatted string.
 */
function formatLastActivity(now: Date): string {
  const date = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const tz = formatOffset(now);
  return `${date} at ${time} ${tz}`;
}

export const submitTrapForReview = onCall(async (request) => {
  const uid = request.auth?.uid;
  const provider = (request.auth as unknown as {
    token?: {firebase?: {sign_in_provider?: string}};
  })?.token?.firebase?.sign_in_provider;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Log in to submit traps.");
  }
  if (provider === "anonymous") {
    throw new HttpsError("permission-denied", "Anonymous not allowed.");
  }

  await enforceRateLimit(uid, "submitTrapForReview", 10, 60);

  const {
    name,
    creators,
    minigame,
    type,
    dateInvented,
    description,
    youtubeUrl,
    thumbnailUrl,
  } = (request.data ?? {}) as SubmitPayload;

  const missing: string[] = [];
  if (!name || !name.trim()) missing.push("Trap Name");
  if (!creators || creators.length === 0) missing.push("Creators");
  if (!minigame || minigame.length === 0) missing.push("Minigame");
  if (!type || type.length === 0) missing.push("Trap Type");
  if (!dateInvented || !/^\d{4}-\d{2}-\d{2}$/.test(dateInvented)) {
    missing.push("Date Invented");
  }
  if (!youtubeUrl) missing.push("YouTube Tutorial Link");

  if (missing.length > 0) {
    throw new HttpsError(
      "invalid-argument",
      `Missing required fields: ${missing.join(", ")}.`
    );
  }

  const video = parseYouTube(youtubeUrl || "");
  if (!video) {
    throw new HttpsError("invalid-argument", "Invalid YouTube link.");
  }

  const now = new Date();
  const docRef = db.collection("trapsInReview").doc();

  const finalThumb = (thumbnailUrl && thumbnailUrl.trim()) ?
    thumbnailUrl :
    `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;

  const data = {
    name: (name || "").trim(),
    creators: creators || [],
    minigame: minigame || [],
    type: type || [],
    dateInvented: dateInvented || "",
    description: (description ?? "").toString(),
    video: {
      embedUrl: video.embedUrl,
      watchUrl: video.watchUrl,
      youtubeId: video.youtubeId,
    },
    thumbnailUrl: finalThumb,
    commentCount: 0,
    tierlistRating: {average: null, count: 0},
    lastActivityAt: formatLastActivity(now),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  } as const;

  await docRef.set(data);
  return {id: docRef.id};
});


