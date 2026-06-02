import { fetchArtistDiscography } from './apiUtils';
import { getDiscographyCache, setDiscographyCache } from './discographyCache';
import type { SearchResult } from '../types';

/** Tracks already cached for this artist (sync). */
export const peekCachedDiscography = (artistName: string): SearchResult[] | null => {
  const entry = getDiscographyCache(artistName);
  return entry?.tracks?.length ? entry.tracks : null;
};

/** Returns cached tracks or fetches, writes cache, then returns tracks. */
export const loadArtistDiscographyWithCache = async (
  artistName: string,
  limit = 120,
  channelIdHint?: string
): Promise<SearchResult[]> => {
  const cached = peekCachedDiscography(artistName);
  if (cached) return cached;

  const { tracks, topicResult } = await fetchArtistDiscography(artistName, limit);
  if (tracks.length > 0) {
    const resolvedChannelId = topicResult?.channelId || channelIdHint || '';
    const resolvedType = (topicResult?.type ?? 'provided') as
      | 'topic'
      | 'vevo'
      | 'official'
      | 'provided';
    setDiscographyCache(artistName, tracks, resolvedChannelId, resolvedType);
  }
  return tracks;
};
