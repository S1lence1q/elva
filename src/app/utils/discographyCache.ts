import { SearchResult } from '../types';

const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const MAX_CACHED_ARTISTS = 200;
const CACHE_KEY_PREFIX = 'elva_discography_v2_';
const CACHE_INDEX_KEY = 'elva_discography_index_v2';

interface DiscographyEntry {
  tracks: SearchResult[];
  channelId: string;
  channelType: 'topic' | 'vevo' | 'official' | 'provided';
  cachedAt: number;
}

// Maintains an ordered list of cached artist keys for LRU eviction
const getIndex = (): string[] => {
  try {
    const raw = localStorage.getItem(CACHE_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveIndex = (index: string[]) => {
  try {
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch {}
};

const cacheKey = (artistName: string) =>
  CACHE_KEY_PREFIX + artistName.trim().toLowerCase();

export const getDiscographyCache = (artistName: string): DiscographyEntry | null => {
  try {
    const key = cacheKey(artistName);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: DiscographyEntry = JSON.parse(raw);

    // Expired?
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      const idx = getIndex().filter(k => k !== key);
      saveIndex(idx);
      return null;
    }

    return entry;
  } catch {
    return null;
  }
};

export const setDiscographyCache = (
  artistName: string,
  tracks: SearchResult[],
  channelId: string,
  channelType: 'topic' | 'vevo' | 'official' | 'provided'
) => {
  try {
    const key = cacheKey(artistName);
    const entry: DiscographyEntry = { tracks, channelId, channelType, cachedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));

    // Update LRU index
    let idx = getIndex().filter(k => k !== key);
    idx.unshift(key); // most recent first

    // Evict oldest entries if over limit
    while (idx.length > MAX_CACHED_ARTISTS) {
      const evicted = idx.pop()!;
      localStorage.removeItem(evicted);
    }

    saveIndex(idx);
  } catch (e) {
    // localStorage full — silently skip caching
    console.warn('Discography cache write failed (storage full?):', e);
  }
};

export const invalidateDiscographyCache = (artistName: string) => {
  try {
    const key = cacheKey(artistName);
    localStorage.removeItem(key);
    saveIndex(getIndex().filter(k => k !== key));
  } catch {}
};

export const clearAllDiscographyCache = () => {
  try {
    const idx = getIndex();
    idx.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(CACHE_INDEX_KEY);
  } catch {}
};
