import { db, functions } from "./config";
import { collection, addDoc, getDocs, QueryDocumentSnapshot, DocumentData, query, orderBy, limit, startAfter, doc, getDoc, where, collectionGroup } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ensureAnonymousUser } from "./authentication";

// in-memory caches for traps and search results
type TrapsCacheEntry = { data: any[]; expiry: number };
let trapsCache: TrapsCacheEntry | null = null;
const DEFAULT_TRAPS_TTL_MS = 2 * 60 * 1000; // 2 minutes (i might change idk)

const searchCache: Map<string, TrapsCacheEntry> = new Map();

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
  description?: string,
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
      commentCount: 0,
      ...(description !== undefined ? { description } : {}),
    });

    console.log("Trap written with ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding trap:", e);
    throw e;
  }
}

export async function readTraps(options?: { force?: boolean; ttlMs?: number }) {
  // serve from cache when valid
  const ttlMs = Math.max(0, options?.ttlMs ?? DEFAULT_TRAPS_TTL_MS);
  const now = Date.now();
  if (!options?.force && trapsCache && trapsCache.expiry > now) {
    return trapsCache.data;
  }

  await ensureAnonymousUser();
  const trapsCol = collection(db, 'traps');
  const snap = await getDocs(query(trapsCol, orderBy('dateInvented', 'desc')));
  const traps = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const ccRaw = data?.commentCount as unknown;
    const commentCount = typeof ccRaw === 'number' ? ccRaw : 0;
    return { id: d.id, ...data, commentCount } as any;
  });
  trapsCache = { data: traps, expiry: now + ttlMs };
  try { console.log("Read the following traps:", traps); } catch {}
  return traps;
}

export function invalidateTrapsCache() {
  trapsCache = null;
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

export async function searchTraps(
  payload: FilterPayload,
  options?: { force?: boolean; ttlMs?: number }
) {
  const ttlMs = Math.max(0, options?.ttlMs ?? DEFAULT_TRAPS_TTL_MS);
  const key = JSON.stringify(payload || {});
  const now = Date.now();

  if (!options?.force) {
    const cached = searchCache.get(key);
    if (cached && cached.expiry > now) {
      return cached.data as any[];
    }
  }

  await ensureAnonymousUser();
  const callable = httpsCallable(functions, 'searchTraps');
  const res = await callable(payload);
  const data = (res.data as any[]) || [];
  searchCache.set(key, { data, expiry: now + ttlMs });

  if (key === '{}') {
    trapsCache = { data, expiry: now + ttlMs };
  }

  return data;
}

export function clearSearchCache() {
  searchCache.clear();
}

export function getTrapFromCache(id: string): any | null {
  const findById = (arr: any[] | undefined | null) =>
    Array.isArray(arr) ? arr.find((t) => t && t.id === id) : undefined;

  const fromBase = trapsCache ? findById(trapsCache.data) : undefined;
  if (fromBase) return fromBase;

  let match: any | null = null;
  searchCache.forEach((entry) => {
    if (match) return;
    const found = findById(entry.data);
    if (found) match = found;
  });
  if (match) return match;

  return null;
}

export type CommentEntity = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  parentId?: string | null;
  threadId?: string;
  depth?: number;
  replyCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  score?: number;
  status?: 'visible' | 'deleted' | 'hidden';
};

export type PaginatedComments = {
  byId: Record<string, CommentEntity>;
  ids: string[];
  nextCursor?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
};

export async function readTrapComments(
  trapId: string,
  options?: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData>;
  }
): Promise<PaginatedComments> {
  const pageSize = options?.pageSize ?? 20;
  const commentsRef = collectionGroup(db, 'comments');

  let topQuery = query(
    commentsRef,
    where('trapId', '==', trapId),
    where('depth', '==', 0),
    orderBy('score', 'desc'),
    orderBy('createdAt', 'asc'),
    limit(pageSize)
  );

  if (options?.cursor) {
    topQuery = query(
      commentsRef,
      where('trapId', '==', trapId),
      where('depth', '==', 0),
      orderBy('score', 'desc'),
      orderBy('createdAt', 'asc'),
      startAfter(options.cursor),
      limit(pageSize)
    );
  }

  const topSnap = await getDocs(topQuery);

  const byId: Record<string, CommentEntity> = {};
  const ids: string[] = [];

  const topIds: string[] = [];
  for (const d of topSnap.docs) {
    const data = d.data() as Record<string, any>;
    const createdAt = data.createdAt;
    const createdAtStr = createdAt?.toDate
      ? createdAt.toDate().toISOString()
      : typeof createdAt === 'string'
        ? createdAt
        : '';
    const rawStatus = data.status;
    const normalizedStatus: 'visible' | 'deleted' | 'hidden' | undefined =
      rawStatus === 'visible' || rawStatus === 'deleted' || rawStatus === 'hidden'
        ? rawStatus
        : undefined;
    const entity: CommentEntity = {
      id: d.id,
      authorId: data.authorId ?? '',
      body: data.body ?? '',
      createdAt: createdAtStr,
      parentId: (typeof data.parentId === 'string' || data.parentId === null)
        ? data.parentId
        : undefined,
      threadId: typeof data.threadId === 'string' ? data.threadId : undefined,
      depth: typeof data.depth === 'number' ? data.depth : undefined,
      replyCount: typeof data.replyCount === 'number' ? data.replyCount : undefined,
      likeCount: typeof data.likeCount === 'number' ? data.likeCount : undefined,
      dislikeCount: typeof data.dislikeCount === 'number' ? data.dislikeCount : undefined,
      score: typeof data.score === 'number' ? data.score : undefined,
      status: normalizedStatus,
    };
    byId[entity.id] = entity;
    ids.push(entity.id);
    topIds.push(entity.id);
  }

  const replyQueries = topIds.map((tid) => (
    getDocs(
      query(
        commentsRef,
        where('trapId', '==', trapId),
        where('parentId', '==', tid),
        orderBy('createdAt', 'asc')
      )
    )
  ));
  const replySnaps = await Promise.all(replyQueries);

  for (const rs of replySnaps) {
    for (const d of rs.docs) {
      const data = d.data() as Record<string, any>;
      const createdAt = data.createdAt;
      const createdAtStr = createdAt?.toDate
        ? createdAt.toDate().toISOString()
        : typeof createdAt === 'string'
          ? createdAt
          : '';
      const rawStatus = data.status;
      const normalizedStatus:
        'visible' | 'deleted' | 'hidden' | undefined =
          rawStatus === 'visible' || rawStatus === 'deleted' ||
          rawStatus === 'hidden'
            ? rawStatus
            : undefined;
      const entity: CommentEntity = {
        id: d.id,
        authorId: data.authorId ?? '',
        body: data.body ?? '',
        createdAt: createdAtStr,
        parentId: (typeof data.parentId === 'string' || data.parentId === null)
          ? data.parentId
          : undefined,
        threadId: typeof data.threadId === 'string' ? data.threadId : undefined,
        depth: typeof data.depth === 'number' ? data.depth : undefined,
        replyCount: typeof data.replyCount === 'number' ? data.replyCount : undefined,
        likeCount: typeof data.likeCount === 'number' ? data.likeCount : undefined,
        dislikeCount: typeof data.dislikeCount === 'number' ? data.dislikeCount : undefined,
        score: typeof data.score === 'number' ? data.score : undefined,
        status: normalizedStatus,
      };
      if (!byId[entity.id]) {
        byId[entity.id] = entity;
        ids.push(entity.id);
      }
    }
  }

  const lastDoc = topSnap.docs[topSnap.docs.length - 1];

  return {
    byId,
    ids,
    nextCursor: lastDoc,
    hasMore: topSnap.size === pageSize,
  };
}

export async function readTrapById(trapId: string) {
  await ensureAnonymousUser();
  const ref = doc(db, 'traps', trapId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Trap not found');
  }
  return { id: snap.id, ...(snap.data() as Record<string, unknown>) } as any;
}

export type UserProfile = {
  displayName: string | null;
  photoURL: string | null;
  discordUsername: string | null;
};

export async function resolveUserProfiles(
  uids: string[]
): Promise<Record<string, UserProfile>> {
  await ensureAnonymousUser();
  const unique = Array.from(new Set(uids)).filter(Boolean);
  if (unique.length === 0) return {};

  const results: Record<string, UserProfile> = {};
  const tasks = unique.map(async (uid) => {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as {
      displayName?: string | null;
      photoURL?: string | null;
      discordUsername?: string | null;
    };
    results[uid] = {
      displayName: data.displayName ?? null,
      photoURL: data.photoURL ?? null,
      discordUsername: data.discordUsername ?? null,
    };
  });
  await Promise.all(tasks);
  return results;
}

export type NewCommentInput = {
  trapId: string;
  body: string;
  parentId?: string | null;
};

export async function addComment(input: NewCommentInput): Promise<{ id: string; threadId: string }>{
  const callable = httpsCallable(functions, 'addComment');
  const res = await callable({
    trapId: input.trapId,
    body: input.body,
    parentId: input.parentId ?? null,
  });
  return res.data as { id: string; threadId: string };
}

export async function setCommentVote(
  trapId: string,
  commentId: string,
  value: 1 | -1 | 0
): Promise<void> {
  const callable = httpsCallable(functions, 'setCommentVote');
  await callable({ trapId, commentId, value });
}

export async function readUserCommentVotes(
  trapId: string,
  commentIds: string[],
  uid: string
): Promise<Record<string, 1 | -1 | 0>> {
  const results: Record<string, 1 | -1 | 0> = {};
  if (!trapId || !uid || commentIds.length === 0) return results;
  const tasks = commentIds.map(async (cid) => {
    try {
      const ref = doc(db, 'traps', trapId, 'comments', cid, 'votes', uid);
      const snap = await getDoc(ref);
      const value = snap.exists() ? (snap.get('value') as number) : 0;
      const v = value === 1 ? 1 : value === -1 ? -1 : 0;
      results[cid] = v as 1 | -1 | 0;
    } catch {}
  });
  await Promise.all(tasks);
  return results;
}