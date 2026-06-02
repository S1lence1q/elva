import { SearchResult } from '../types';
import { robustFetch } from './apiUtils';

const APPLE_CHART_BASE = 'https://rss.marketingtools.apple.com';
const CHART_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const CACHE_KEYS = {
  dk: 'elva_apple_chart_dk_v2',
  us: 'elva_apple_chart_us_v2',
} as const;

type ChartStorefront = keyof typeof CACHE_KEYS;

type ChartCacheEntry = {
  tracks: SearchResult[];
  fetchedAt: number;
};

function chartPath(storefront: ChartStorefront) {
  return `/api/v2/${storefront}/music/most-played/20/songs.json`;
}

function resolveChartUrl(storefront: ChartStorefront): string {
  const path = chartPath(storefront);
  if (import.meta.env.DEV) {
    return `/api-apple${path}`;
  }
  return `${APPLE_CHART_BASE}${path}`;
}

function readChartCache(storefront: ChartStorefront, allowStale = false): SearchResult[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEYS[storefront]);
    if (!raw) return null;
    const entry: ChartCacheEntry = JSON.parse(raw);
    if (!entry?.tracks?.length) return null;
    if (!allowStale && Date.now() - entry.fetchedAt > CHART_CACHE_TTL_MS) {
      return null;
    }
    return entry.tracks;
  } catch {
    return null;
  }
}

function writeChartCache(storefront: ChartStorefront, tracks: SearchResult[]) {
  try {
    const entry: ChartCacheEntry = { tracks, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEYS[storefront], JSON.stringify(entry));
  } catch (e) {
    console.warn('Chart cache write failed:', e);
  }
}

function mapAppleFeedToTracks(data: unknown, idPrefix: string): SearchResult[] {
  const results = (data as { feed?: { results?: unknown[] } })?.feed?.results;
  if (!Array.isArray(results) || results.length === 0) return [];

  return results
    .map((entry: any) => {
      const id = entry?.id;
      const title = String(entry?.name || '').trim();
      const artist = String(entry?.artistName || '').trim();
      const artworkUrl = String(entry?.artworkUrl100 || '');
      if (!id || !title || !artist) return null;

      const thumbnail = artworkUrl
        ? artworkUrl.replace('100x100bb', '600x600bb')
        : '';

      return {
        id: `${idPrefix}_${id}`,
        title,
        artist,
        thumbnail,
        videoId: '',
      };
    })
    .filter((t): t is SearchResult => t !== null);
}

/**
 * Loads Apple Music most-played chart (DK or US).
 * Dev: Vite proxy. Production: direct Apple URL via CORS-safe fetch.
 * Caches successful responses in localStorage; may return stale cache offline.
 */
export async function fetchAppleMusicChart(
  storefront: ChartStorefront
): Promise<{ tracks: SearchResult[]; fromCache: boolean; error?: string }> {
  const idPrefix = storefront === 'dk' ? 'apple_dk' : 'apple_global';

  const fetchOnce = async (): Promise<SearchResult[]> => {
    const url = resolveChartUrl(storefront);
    const response = import.meta.env.DEV
      ? await fetch(url)
      : await robustFetch(url, undefined, false);

    if (!response.ok) {
      throw new Error(`Chart feed HTTP ${response.status}`);
    }

    const data = await response.json();
    const tracks = mapAppleFeedToTracks(data, idPrefix);
    if (tracks.length === 0) {
      throw new Error('Chart feed returned no tracks');
    }
    return tracks;
  };

  try {
    const tracks = await fetchOnce();
    writeChartCache(storefront, tracks);
    return { tracks, fromCache: false };
  } catch (err) {
    console.warn(`Apple chart (${storefront}) fetch failed:`, err);

    const stale = readChartCache(storefront, true);
    if (stale?.length) {
      return { tracks: stale, fromCache: true, error: 'Showing cached chart — live feed unavailable' };
    }

    return {
      tracks: [],
      fromCache: false,
      error:
        storefront === 'dk'
          ? 'Could not load Top Hits Denmark from Apple Music.'
          : 'Could not load Global Top Hits from Apple Music.',
    };
  }
}

export function prefetchAppleCharts() {
  void fetchAppleMusicChart('dk');
  void fetchAppleMusicChart('us');
}
