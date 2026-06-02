import {
  loadArtistDiscographyWithCache,
  peekCachedDiscography,
} from '../../utils/artistDiscographyLoader';
import type { SearchResult, VerifiedArtist } from './types';

export { peekCachedDiscography };

export function shouldShowArtistCard(query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
  const words = trimmed.split(/\s+/);
  if (words.length > 3) return false;
  const blocklist = ['lyrics', 'remix', 'karaoke', 'live', 'cover', 'instrumental', 'acoustic', 'version'];
  return !blocklist.some((word) => trimmed.includes(word));
}

export function getArtistMatchFromResults(
  query: string,
  results: SearchResult[]
): { name: string; thumbnail: string; channelId?: string } | null {
  if (!shouldShowArtistCard(query) || results.length === 0) return null;
  const queryLower = query.trim().toLowerCase();
  if (queryLower.length < 2) return null;

  const match = results.find((r) => {
    const artistLower = r.artist.trim().toLowerCase();
    return (
      artistLower === queryLower ||
      artistLower === `${queryLower} - topic` ||
      artistLower === `${queryLower}vevo` ||
      artistLower.includes(queryLower)
    );
  });

  if (!match) return null;

  const cleanedName = match.artist
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\s*VEVO$/i, '')
    .replace(/\s*Official\s*$/i, '')
    .trim();

  return {
    name: cleanedName,
    thumbnail: match.thumbnail,
    channelId: match.channelId,
  };
}

/** Shared discography loader (reads/writes elva_discography_v2_* cache). */
export async function loadArtistDiscographyTracks(
  artist: Pick<VerifiedArtist, 'name' | 'channelId'>
): Promise<SearchResult[]> {
  return loadArtistDiscographyWithCache(artist.name, 120, artist.channelId);
}

export function getCachedArtistThumbnail(name: string, fallback: string): string {
  return localStorage.getItem(`elva_artist_img_${name.toLowerCase()}`) || fallback;
}
