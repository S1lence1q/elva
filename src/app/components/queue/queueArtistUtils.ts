import { resolveTopicChannelId } from '../../utils/apiUtils';
import type { SearchResult, VerifiedArtist } from './types';

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

/** Load discography via Topic channel, with search fallback when uploads are empty. */
export async function fetchArtistDiscography(
  artist: Pick<VerifiedArtist, 'name' | 'channelId'>,
  onFetchChannelUploads: (channelId: string, limit?: number) => Promise<SearchResult[]>,
  onSearch?: (query: string, limit?: number) => Promise<SearchResult[]>
): Promise<SearchResult[]> {
  let channelId = artist.channelId;
  const resolved = await resolveTopicChannelId(artist.name);
  if (resolved) {
    channelId = resolved.channelId;
  }

  let uploads = await onFetchChannelUploads(channelId || '');

  if (uploads.length === 0 && onSearch) {
    const nameLower = artist.name.trim().toLowerCase();
    const [raw1, raw2] = await Promise.all([
      onSearch(artist.name, 50),
      onSearch(`${artist.name} - Topic`, 10),
    ]);
    const seenIds = new Set<string>();
    for (const track of [...raw1, ...raw2]) {
      if (!track.id || seenIds.has(track.id)) continue;
      seenIds.add(track.id);
      const uploaderLower = (track.artist || '').trim().toLowerCase();
      if (
        uploaderLower === nameLower ||
        uploaderLower === `${nameLower} - topic` ||
        uploaderLower === `${nameLower}vevo`
      ) {
        uploads.push(track);
      }
    }
  }

  return uploads;
}

export function getCachedArtistThumbnail(name: string, fallback: string): string {
  return localStorage.getItem(`elva_artist_img_${name.toLowerCase()}`) || fallback;
}
