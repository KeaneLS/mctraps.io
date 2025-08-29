/* eslint-disable linebreak-style */
import {onCall} from "firebase-functions/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

interface TrapRating {
  average?: number;
  count?: number;
}

interface Trap {
  id: string;
  name?: string;
  creators?: string[];
  dateInvented?: string;
  type?: string;
  minigame?: string;
  rating?: TrapRating;
  tierlistRating?: TrapRating;
}

type TierLetter = "S" | "A" | "B" | "C" | "D" | "E" | "F";
type MinigameOption =
  | "UHC"
  | "SMP"
  | "HCF"
  | "Hoplite"
  | "Skywars"
  | "Walls"
  | "Speed UHC";
type TypeOption = "Main" | "Backup" | "Hybrid";

type FilterPayload = {
  dateInvented?: {
    from?: string;
    to?: string;
    direction?: "asc" | "desc";
  };
  tierlistRating?: {
    ratings: TierLetter[];
    direction?: "asc" | "desc";
  };
  minigames?: MinigameOption[];
  types?: TypeOption[];
  search?: string;
};

/**
 * Maps a rounded average score (0–6) to a tier letter.
 * @param {number} avg Number to map to a tier.
 * @return {TierLetter} Tier letter between "S" and "F".
 */
function getTierLetterFromAverage(avg: number): TierLetter {
  const rounded = Math.max(0, Math.min(6, Math.round(avg)));
  switch (rounded) {
  case 6: return "S";
  case 5: return "A";
  case 4: return "B";
  case 3: return "C";
  case 2: return "D";
  case 1: return "E";
  default: return "F";
  }
}

export const searchTraps = onCall(async (request) => {
  const payload = (request.data ?? {}) as FilterPayload;

  const trapsRef = db.collection("traps");
  let query: FirebaseFirestore.Query = trapsRef;

  if (payload.dateInvented) {
    const {from, to, direction} = payload.dateInvented;
    if (from) {
      query = query.where("dateInvented", ">=", from);
    }
    if (to) {
      query = query.where("dateInvented", "<=", to);
    }
    if (direction) {
      query = query.orderBy("dateInvented", direction);
    }
  }

  const minigames = Array.isArray(payload.minigames) ? payload.minigames : [];
  const types = Array.isArray(payload.types) ? payload.types : [];

  const snapshot = await query.get();
  let result: Trap[] = snapshot.docs.map((d) => (
    {
      id: d.id,
      ...d.data(),
    }
  )) as Trap[];

  if (
    payload.search &&
    typeof payload.search === "string" &&
    payload.search.trim() !== ""
  ) {
    const q = payload.search.toLowerCase();
    result = result.filter((t: Trap) => {
      const name = String(t.name ?? "").toLowerCase();
      const creators = Array.isArray(t.creators) ? t.creators : [];
      const type = String(t.type ?? "").toLowerCase();
      const minigame = String(t.minigame ?? "").toLowerCase();
      return (
        name.includes(q) ||
        creators.some((c) => String(c).toLowerCase().includes(q)) ||
        type.includes(q) ||
        minigame.includes(q)
      );
    });
  }

  const toKey = (v?: string) => String(v ?? "").trim().toLowerCase();
  if (minigames.length) {
    const allowed = new Set(minigames.map((m) => toKey(m)));
    result = result.filter((t: Trap) => allowed.has(toKey(t.minigame)));
  }
  if (types.length) {
    const allowed = new Set(types.map((t) => toKey(t)));
    result = result.filter((t: Trap) => allowed.has(toKey(t.type)));
  }

  if (payload.tierlistRating) {
    const {ratings, direction} = payload.tierlistRating;
    if (ratings && Array.isArray(ratings) && ratings.length > 0) {
      const allowed = new Set(ratings);
      result = result.filter((t: Trap) => {
        const avg = (typeof t?.tierlistRating?.average === "number") ?
          (t.tierlistRating?.average as number) :
          0;
        const letter = getTierLetterFromAverage(avg);
        return allowed.has(letter as TierLetter);
      });
    }
    if (direction) {
      result.sort((a: Trap, b: Trap) => {
        const ra = (typeof a?.tierlistRating?.average === "number") ?
          (a.tierlistRating?.average as number) :
          0;
        const rb = (typeof b?.tierlistRating?.average === "number") ?
          (b.tierlistRating?.average as number) :
          0;
        return direction === "asc" ? ra - rb : rb - ra;
      });
    }
  }

  return result;
});


