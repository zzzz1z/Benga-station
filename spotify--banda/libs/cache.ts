import redis from './redis';

const TTL = {
  songs: 60,       // global — 60s
  playlists: 30,   // per user — 30s
  liked: 30,       // per user — 30s
};

// Keys
export const keys = {
  songs: (search: string, page: number) => `benga:songs:${search}:${page}`,
  playlists: (userId: string) => `benga:playlists:${userId}`,
  liked: (userId: string) => `benga:liked:${userId}`,
  likedPlaylists: (userId: string) => `benga:liked-playlists:${userId}`,
};

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get<T>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl });
  } catch {}
}

export async function invalidate(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await redis.del(...keys);
  } catch {}
}

export { TTL };