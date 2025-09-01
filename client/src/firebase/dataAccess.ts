import { db, functions } from "./config";
import { collection, addDoc, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ensureAnonymousUser } from "./authentication";

function getYouTubeThumbnail(youtubeUrl: string): string {
  let videoId: string;

  try {
    const urlObj = new URL(youtubeUrl);

    if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1); // short URL: youtu.be/VIDEO_ID
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    } else {
      throw new Error('Invalid YouTube URL');
    }

    if (!videoId) throw new Error('Could not extract video ID');

    // Return the thumbnail URL
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  } catch (error) {
    console.error('Error getting thumbnail:', error);
    return '';
  }
}

function getYouTubeInfo(url: string) {
  const urlObj = new URL(url);
  let youtubeId: string | null = null;

  // Check if URL has 'v' param (standard YouTube watch URL)
  if (urlObj.hostname.includes('youtube.com')) {
    youtubeId = urlObj.searchParams.get('v');
  }

  // Check for short YouTube URLs like youtu.be
  if (!youtubeId && urlObj.hostname.includes('youtu.be')) {
    youtubeId = urlObj.pathname.slice(1); // remove leading '/'
  }

  if (!youtubeId) {
    throw new Error('Invalid YouTube URL');
  }

  return {
    youtubeId,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
  };
}

interface TrapComment {
  user: string;
  text: string;
  date: string; // year-month-day
}

interface TrapRating {
  average: number; // 0-6
  count: number;   // number of ratings
}

export async function writeTrap(
  name: string,
  creators: string[],
  dateInvented: string,
  type: string,
  videoUrl: string,
  thumbnailUrl: string,
  minigame: string,
  tierlistRating: TrapRating,
  comments: TrapComment[]
) {
  try {
    const video = getYouTubeInfo(videoUrl);

    // If a thumbnail url is not entered, use the youtube video's url
    if (thumbnailUrl === ""){
      thumbnailUrl = getYouTubeThumbnail(videoUrl)
    }

    const docRef = await addDoc(collection(db, "traps"), {
      name,
      creators,
      dateInvented,
      type,
      video,
      thumbnailUrl,
      minigame,
      tierlistRating,
      comments,
    });

    console.log("Trap written with ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding trap:", e);
    throw e;
  }
}

export async function readTraps() {
  // Is now just searchTraps but with an empty payload (so we can apply the rate limit)
  await ensureAnonymousUser();
  const callable = httpsCallable(functions, 'searchTraps');
  const res = await callable({});
  const traps = (res.data as any[]) || [];
  try { console.log("Read the following traps:", traps); } catch {}
  return traps;
}

export type TierLetter = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type MinigameOption = 'UHC' | 'SMP' | 'HCF' | 'Hoplite' | 'Skywars' | 'Walls' | 'Speed UHC';
export type TypeOption = 'Main' | 'Backup' | 'Hybrid';

export type FilterPayload = {
  dateInvented?: { from?: string; to?: string; direction?: 'asc' | 'desc' };
  tierlistRating?: { ratings: TierLetter[]; direction?: 'asc' | 'desc' };
  minigames?: MinigameOption[];
  types?: TypeOption[];
  search?: string;
};

export async function searchTraps(payload: FilterPayload) {
  await ensureAnonymousUser();
  const callable = httpsCallable(functions, 'searchTraps');
  const res = await callable(payload);
  return res.data as any[];
}