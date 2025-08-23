export const RATING_MIN = 0;
export const RATING_MAX = 6;

export interface TrapComment {
  user: string;
  text: string;
  date: string; // ISO date string
}

export interface TrapRating {
  average: number; // 0-6
  count: number;   // number of ratings
}

// YouTube video data
export interface TrapVideo {
  youtubeId: string;
  embedUrl: string;
  watchUrl: string;
}

export interface Trap {
  id: string; // slug identifier
  name: string;
  creators: string[];
  dateInvented: string; // ISO date string
  type: 'main' | 'backup' | 'hybrid' | string;
  video: TrapVideo;
  thumbnailPath: string;
  minigame: string;
  rating: TrapRating;
  comments: TrapComment[];
}

export const traps: Trap[] = [
  {
    id: 'afk-player-farm',
    name: 'AFK Player Farm',
    creators: ['Shadow', 'Doomedcow'],
    dateInvented: '2025-04-15',
    type: 'main',
    video: {
      youtubeId: 'QPzOv35nrpc',
      embedUrl: 'https://www.youtube.com/embed/QPzOv35nrpc',
      watchUrl: 'https://www.youtube.com/watch?v=QPzOv35nrpc'
    },
    thumbnailPath: '/public/dummy-thumbnails/afk-player-farm.jpg',
    minigame: 'Hoplite',
    rating: { average: 5.16, count: 128 },
    comments: [
      {
        user: 'Steve',
        text: 'Got my friend with this during a UHC round, works great!',
        date: '2025-04-15'
      },
      {
        user: 'Alex',
        text: 'This is a great trap for AFK players.',
        date: '2025-04-15'
      }
    ]
  },
  {
    id: 'reverse-sand-fall-trap',
    name: 'Reverse Sand Fall Trap',
    creators: ['Doomedcow', 'AbsolutelyAlpha', 'ParkerGameBrain', 'iVeggie', 'Shadow'],
    dateInvented: '2025-02-16',
    type: 'main',
    video: {
      youtubeId: 'DO_FTXfUgjY',
      embedUrl: 'https://www.youtube.com/embed/DO_FTXfUgjY',
      watchUrl: 'https://www.youtube.com/watch?v=DO_FTXfUgjY'
    },
    thumbnailPath: '/public/dummy-thumbnails/reverse-sand-fall-trap.jpg',
    minigame: 'Hoplite',
    rating: { average: 4.68, count: 64 },
    comments: [
      {
        user: 'GrieferHunter',
        text: 'Great deterrent for spawn campers on our server.',
        date: '2025-02-16'
      }
    ]
  },
];

export default traps;
