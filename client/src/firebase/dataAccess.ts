import { db } from "./config";
import { collection, addDoc, getDocs } from "firebase/firestore";

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

// Example usage
const input = 'https://www.youtube.com/watch?v=QPzOv35nrpc';
const result = getYouTubeInfo(input);
console.log(result);

interface TrapComment {
  user: string;
  text: string;
  date: string; // ISO date string
}

interface TrapRating {
  average: number; // 0-6
  count: number;   // number of ratings
}

export async function writeTrap(
  name: string,
  creators: string[],
  dateInvented: string,
  type: "main" | "backup",
  videoUrl: string,
  thumbnailId: string,
  minigame: string,
  tierlistRating: TrapRating,
  comments: TrapComment[]
) {
  try {
    const video = getYouTubeInfo(videoUrl);

    const docRef = await addDoc(collection(db, "traps"), {
      name,
      creators,
      dateInvented,
      type,
      video,
      thumbnailId,
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
  const querySnapshot = await getDocs(collection(db, "traps"));
  const traps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(traps);
  return traps;
}