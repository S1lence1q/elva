import { SearchResult } from '../types';
import { resolveYouTubeForChartTrack, ResolvedYouTubePlayback } from './chartPlaybackUtils';

export type ChartPrefetchResult = ResolvedYouTubePlayback & { trackId: string };

/**
 * Resolve chart tracks in the background (limited concurrency) so queue clicks are instant.
 */
export async function prefetchChartTracks(
  tracks: SearchResult[],
  getCachedVideoId: (trackId: string) => string | undefined,
  onResolved: (result: ChartPrefetchResult) => void,
  options?: { concurrency?: number; signal?: AbortSignal; skipTrackIds?: Set<string> }
): Promise<void> {
  const concurrency = Math.max(1, options?.concurrency ?? 2);
  const skip = options?.skipTrackIds ?? new Set<string>();

  const pending = tracks.filter((t) => {
    if (skip.has(t.id)) return false;
    if (t.audioUrl?.startsWith('blob:') || t.id?.startsWith('local_')) return false;
    if (t.videoId?.length === 11) return false;
    if (getCachedVideoId(t.id)?.length === 11) return false;
    return true;
  });

  let index = 0;

  const worker = async () => {
    while (index < pending.length) {
      if (options?.signal?.aborted) return;
      const track = pending[index++];
      if (!track) continue;

      const cached = getCachedVideoId(track.id);
      if (cached?.length === 11) continue;

      try {
        const resolved = await resolveYouTubeForChartTrack(track);
        if (options?.signal?.aborted || !resolved?.videoId) continue;
        onResolved({ trackId: track.id, ...resolved });
      } catch {
        // skip failed prefetch
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, () => worker()));
}
