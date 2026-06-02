import { SearchResult } from '../types';

export const HAND_PICKED_ARTIST_IMAGES: Record<string, string> = {
  'kesi': 'https://cdn-images.dzcdn.net/images/artist/50656cb54b66a32d095c3e0532c9dc32/250x250-000000-80-0-0.jpg',
  'kundo': 'https://cdn-images.dzcdn.net/images/cover/2bbca104b7dd8d14bed865e4cebf3c79/500x500-000000-80-0-0.jpg',
  'lamin': 'https://cdn-images.dzcdn.net/images/artist/7375da7e864a9cf0bdd6add7578df724/250x250-000000-80-0-0.jpg',
  'artigeardit': 'https://cdn-images.dzcdn.net/images/artist/54920f6d4791b6923f008effd0b3b2ef/250x250-000000-80-0-0.jpg'
};

export const getHandPickedImage = (name: string): string | null => {
  if (!name) return null;
  const nameLower = name.trim().toLowerCase();
  return HAND_PICKED_ARTIST_IMAGES[nameLower] || null;
};

export const decodeHTMLEntities = (text: string): string => {
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  } catch (e) {
    return text;
  }
};


export const getArtistDynamicColors = (name: string) => {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('kundo')) {
    return {
      accent: '#10b981',
      glow: 'rgba(16, 185, 129, 0.15)',
      bgGlow: 'rgba(16, 185, 129, 0.38)',
      solidGlow: 'rgba(16, 185, 129, 0.55)',
      gradient: 'from-emerald-500/30 to-transparent',
      rgbaGlow: 'rgba(16, 185, 129, 0.22)'
    };
  }
  
  if (nameLower.includes('kesi')) {
    return {
      accent: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.15)',
      bgGlow: 'rgba(245, 158, 11, 0.38)',
      solidGlow: 'rgba(245, 158, 11, 0.55)',
      gradient: 'from-amber-500/30 to-transparent',
      rgbaGlow: 'rgba(245, 158, 11, 0.22)'
    };
  }

  if (nameLower.includes('lamin')) {
    return {
      accent: '#c084fc',
      glow: 'rgba(192, 132, 252, 0.15)',
      bgGlow: 'rgba(192, 132, 252, 0.38)',
      solidGlow: 'rgba(192, 132, 252, 0.55)',
      gradient: 'from-purple-500/30 to-transparent',
      rgbaGlow: 'rgba(192, 132, 252, 0.22)'
    };
  }

  // Fallback HSL generator
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  const s = 70 + (Math.abs(hash) % 15);
  const l = 40 + (Math.abs(hash) % 12);
  
  return {
    accent: `hsl(${h}, ${s}%, ${l}%)`,
    glow: `hsla(${h}, ${s}%, ${l}%, 0.15)`,
    bgGlow: `hsla(${h}, ${s}%, ${l}%, 0.32)`,
    solidGlow: `hsla(${h}, ${s}%, ${l}%, 0.5)`,
    gradient: `from-[hsl(${h},${s}%,${l}%)] to-transparent`,
    rgbaGlow: `hsla(${h}, ${s}%, ${l}%, 0.2)`
  };
};

export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 4000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  const signal = options.signal;
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
    if (signal.aborted) controller.abort();
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const robustFetch = async (url: string, signal?: AbortSignal, skipProxies: boolean = false): Promise<Response> => {
  // 1. Try directly
  try {
    const response = await fetchWithTimeout(url, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`Direct fetch failed for ${url}:`, e);
  }

  // 2. Try via CORS proxies when direct fails (required in browser for most Piped/Invidious hosts)

  // Try via allorigins proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`AllOrigins proxy fetch failed for ${url}:`, e);
  }

  // 3. Try via corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`corsproxy.io fetch failed for ${url}:`, e);
  }

  throw new Error(`Failed to fetch ${url} directly or via proxies.`);
};

export const fetchFromFirstSuccessfulInstance = async <T extends unknown>(
  instances: string[],
  fetchFn: (instance: string, signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 3000
): Promise<T> => {
  const globalController = new AbortController();
  
  const promises = instances.map(async (instance) => {
    const instanceController = new AbortController();
    const abortListener = () => instanceController.abort();
    globalController.signal.addEventListener('abort', abortListener);
    
    const timeoutId = setTimeout(() => instanceController.abort(), timeoutMs);
    try {
      const res = await fetchFn(instance, instanceController.signal);
      clearTimeout(timeoutId);
      globalController.abort();
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    } finally {
      globalController.signal.removeEventListener('abort', abortListener);
    }
  });

  return new Promise((resolve, reject) => {
    let rejectedCount = 0;
    if (promises.length === 0) {
      reject(new Error('No instances provided'));
      return;
    }
    promises.forEach((p) => {
      p.then(resolve).catch(() => {
        rejectedCount++;
        if (rejectedCount === promises.length) {
          reject(new Error('All instances failed'));
        }
      });
    });
  });
};

export const extractYouTubeVideoId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  );
  return match ? match[1] : null;
};

const isPlaceholderStreamLabel = (value: string) => {
  const t = value.trim().toLowerCase();
  return (
    t === '' ||
    t === 'youtube stream' ||
    t === 'youtube video' ||
    t === 'streaming song' ||
    t === 'web stream' ||
    t === 'unknown artist'
  );
};

/** Free metadata when Piped/Invidious fail (no Data API key). */
const fetchYouTubeOEmbed = async (
  videoId: string
): Promise<{ title: string; artist: string; artworkUrl: string } | null> => {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoints = [
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await robustFetch(endpoint, undefined, false);
      if (!response.ok) continue;
      const data = await response.json();
      const rawTitle = data.title ?? data.meta?.title;
      if (!rawTitle || isPlaceholderStreamLabel(String(rawTitle))) continue;
      return {
        title: decodeHTMLEntities(String(rawTitle)),
        artist: decodeHTMLEntities(String(data.author_name ?? data.author ?? 'Unknown Artist')),
        artworkUrl:
          data.thumbnail_url ||
          data.thumbnail ||
          `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      };
    } catch {
      // try next endpoint
    }
  }
  return null;
};

export const fetchVideoDetails = async (videoId: string): Promise<{ title: string; artist: string; artworkUrl: string; channelId?: string }> => {
  const mergeWithOEmbedIfNeeded = async (
    partial: { title: string; artist: string; artworkUrl: string; channelId?: string }
  ) => {
    if (!isPlaceholderStreamLabel(partial.title) && !isPlaceholderStreamLabel(partial.artist)) {
      return partial;
    }
    const oembed = await fetchYouTubeOEmbed(videoId);
    if (!oembed) return partial;
    return {
      ...partial,
      title: isPlaceholderStreamLabel(partial.title) ? oembed.title : partial.title,
      artist: isPlaceholderStreamLabel(partial.artist) ? oembed.artist : partial.artist,
      artworkUrl: partial.artworkUrl || oembed.artworkUrl,
    };
  };

  // Piped / Invidious only — no YouTube Data API
  try {
    const details = await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      async (instance, signal) => {
        const response = await robustFetch(`${instance}/streams/${videoId}`, signal, false);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return mergeWithOEmbedIfNeeded({
          title: decodeHTMLEntities(data.title || ''),
          artist: decodeHTMLEntities(data.uploader || ''),
          artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          channelId: data.uploaderId
        });
      },
      1800
    );
    return details;
  } catch (pipedErr) {
    console.warn('All Piped instances failed direct video details, trying Invidious directly:', pipedErr);
  }

  // Try INVIDIOUS details concurrently
  try {
    const details = await fetchFromFirstSuccessfulInstance(
      INVIDIOUS_INSTANCES,
      async (instance, signal) => {
        const response = await robustFetch(`${instance}/api/v1/videos/${videoId}`, signal, false);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return mergeWithOEmbedIfNeeded({
          title: decodeHTMLEntities(data.title || ''),
          artist: decodeHTMLEntities(data.author || ''),
          artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          channelId: data.authorId
        });
      },
      1800
    );
    return details;
  } catch (invidiousErr) {
    console.warn('All Invidious instances failed direct video details, trying single proxy fallback:', invidiousErr);
  }

  // ULTIMATE FALLBACK: Try a single Piped instance with proxies allowed
  try {
    const response = await robustFetch(`${PIPED_INSTANCES[0]}/streams/${videoId}`, undefined, false); // ALLOW PROXIES
    if (response.ok) {
      const data = await response.json();
      return mergeWithOEmbedIfNeeded({
        title: decodeHTMLEntities(data.title || ''),
        artist: decodeHTMLEntities(data.uploader || ''),
        artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        channelId: data.uploaderId
      });
    }
  } catch (proxyErr) {
    console.error('All direct and proxy video details failed:', proxyErr);
  }

  const oembed = await fetchYouTubeOEmbed(videoId);
  if (oembed) {
    return { ...oembed, channelId: undefined };
  }

  return {
    title: `YouTube video`,
    artist: 'Unknown Artist',
    artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  };
};

export const resolveUrlToSearchResult = async (url: string): Promise<SearchResult> => {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    const details = await fetchVideoDetails(videoId);
    return {
      id: videoId,
      title: details.title,
      artist: details.artist,
      thumbnail: details.artworkUrl,
      videoId,
      channelId: details.channelId,
    };
  }

  const title = url.split('/').pop()?.split('?')[0] || 'Streaming Song';
  return {
    id: url,
    title: decodeURIComponent(title),
    artist: 'Unknown Artist',
    thumbnail:
      'https://images.unsplash.com/photo-1676068368612-1c8b3e2afed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJ1bSUyMGNvdmVyJTIwbXVzaWMlMjBhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3ODk2NjA3OHww&ixlib=rb-4.1.0&q=80&w=1080',
    videoId: '',
  };
};

const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.nosebs.ru',
  'https://api.piped.yt',
  'https://pipedapi.darkness.services',
];

const INVIDIOUS_INSTANCES = [
  'https://invidious.fdn.fr',
  'https://inv.nadeko.net',
  'https://invidious.privacyredirect.com',
  'https://yt.artemislena.eu',
  'https://invidious.io.lol',
];

/** music_songs first; videos only as fallback with strict non-music filtering. Never use `all`. */
const PIPED_SEARCH_FILTERS = ['music_songs', 'videos'] as const;

const NON_MUSIC_TITLE_PATTERNS: RegExp[] = [
  /\bvlog\b/i,
  /\b(routine|morning routine|evening routine|night routine)\b/i,
  /\b(cozy days?|days in my life|day in my life|72 hrs|weekend vlog)\b/i,
  /\b(haul|errands|meal plan|wfh|burnout|hot girl walks?)\b/i,
  /\b(home decor|dream apartment|bridal fitting|book shopping|home diy)\b/i,
  /\b(nervous system|red light therapy|gentle movement|analogue hobbi)\b/i,
  /\b(productive vlog|monday scaries|get ready with me|grwm)\b/i,
  /\b(recovering from|our absolute dream|beating the|first few days)\b/i,
  /\b(what i eat|room tour|apartment tour|house tour|unboxing)\b/i,
  /\b(podcast|interview|q&a|trailer|teaser|behind the scenes)\b/i,
  /\b(come with me|come shop|shop with me|pack with me)\b/i,
];

const countTitleEmojis = (title: string): number => {
  try {
    return [...title].filter((char) => /\p{Extended_Pictographic}/u.test(char)).length;
  } catch {
    // Fallback for runtimes without Unicode property escapes
    return (title.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length;
  }
};

/** Returns true when a result is almost certainly not a music track. */
export const isLikelyNonMusicStream = (
  title: string,
  durationSeconds: number | undefined,
  query: string
): boolean => {
  const titleLower = title.toLowerCase();
  const queryLower = query.trim().toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 1);
  const isArtistOnlyQuery =
    queryWords.length <= 2 &&
    !['live', 'cover', 'remix', 'lyric', 'album', 'mix', 'official', 'audio', 'song'].some((k) =>
      queryLower.includes(k)
    );

  if (NON_MUSIC_TITLE_PATTERNS.some((rx) => rx.test(title))) return true;
  if (title.split('|').length >= 3) return true;
  if (countTitleEmojis(title) >= 4) return true;

  const duration = durationSeconds ?? 0;
  const hasMusicTitleSignal =
    /\b(live|concert|performance|session|freestyle|feat\.|ft\.|official audio|music video|lyric)\b/i.test(
      titleLower
    );

  if (isArtistOnlyQuery && duration > 480 && !hasMusicTitleSignal) return true;
  if (duration > 900 && !hasMusicTitleSignal && !queryLower.includes('live')) return true;

  return false;
};

const mapPipedSearchItems = (
  items: unknown[],
  query: string,
  strictMusicFilter: boolean
): SearchResult[] => {
  const validStreams = (items as any[]).filter((item: any) => {
    if (!item.url) return false;
    const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
    const videoId = ytMatch ? ytMatch[1] : null;
    const isPlayable =
      !item.type || item.type === 'stream' || item.type === 'video' || item.type === 'music_song';
    if (!videoId || videoId.length !== 11 || !isPlayable) return false;
    if (strictMusicFilter && isLikelyNonMusicStream(item.title || '', item.duration, query)) {
      return false;
    }
    return true;
  });

  return validStreams.map((item: any) => {
    const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
    const videoId = ytMatch![1];
    let channelId = item.uploaderId;
    if (!channelId && item.uploaderUrl) {
      const chMatch = item.uploaderUrl.match(/\/channel\/([^\/]+)/i);
      if (chMatch) channelId = chMatch[1];
    }
    return {
      id: videoId,
      title: decodeHTMLEntities(item.title),
      artist: decodeHTMLEntities(item.uploaderName || 'Unknown Artist'),
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      videoId: videoId,
      channelId: channelId,
    };
  });
};

/** True when uploader is the artist, their Topic channel, or VEVO. */
export const isOfficialMusicUploader = (uploaderName: string, artistName: string): boolean => {
  const u = uploaderName.trim().toLowerCase();
  const n = artistName.trim().toLowerCase();
  return u === n || u === `${n} - topic` || u === `${n}vevo`;
};

/** Keep official uploads; drop vlogs on the artist's main channel. */
export const isOfficialMusicTrack = (track: SearchResult, artistName: string): boolean => {
  if (!isOfficialMusicUploader(track.artist, artistName)) return false;
  const u = track.artist.trim().toLowerCase();
  const n = artistName.trim().toLowerCase();
  if (u === `${n} - topic` || u === `${n}vevo`) return true;
  return !isLikelyNonMusicStream(track.title, undefined, artistName);
};

const dedupeSearchResults = (tracks: SearchResult[]): SearchResult[] => {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    if (!t.videoId || seen.has(t.videoId)) return false;
    seen.add(t.videoId);
    return true;
  });
};

const fetchPipedSearchOnInstance = async (
  instance: string,
  query: string,
  signal: AbortSignal
): Promise<SearchResult[]> => {
  for (const filter of PIPED_SEARCH_FILTERS) {
    const targetUrl = `${instance}/search?q=${encodeURIComponent(query)}&filter=${filter}`;
    const response = await robustFetch(targetUrl, signal, false);
    if (!response.ok) continue;
    const data = await response.json();
    const items = data?.items && Array.isArray(data.items) ? data.items : [];
    const strictMusicFilter = filter !== 'music_songs';
    const mapped = mapPipedSearchItems(items, query, strictMusicFilter);
    if (mapped.length > 0) return mapped;
  }
  throw new Error('Empty search items');
};

/** Paginated Piped video search — much faster and more complete than broken /channel feeds. */
const fetchPaginatedPipedSearch = async (
  query: string,
  artistName: string,
  maxTracks: number,
  maxPages: number = 5
): Promise<SearchResult[]> => {
  let instance = PIPED_INSTANCES[0];
  try {
    instance = await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      async (inst, signal) => {
        const url = `${inst}/search?q=${encodeURIComponent(query)}&filter=videos`;
        const res = await robustFetch(url, signal, false);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return inst;
      },
      3500
    );
  } catch {
    // use default instance
  }

  const collected: SearchResult[] = [];
  let nextpage: string | null = null;
  let isFirstPage = true;

  for (let page = 0; page < maxPages && collected.length < maxTracks; page++) {
    try {
      const url = isFirstPage
        ? `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`
        : nextpage
          ? `${instance}/nextpage/search?nextpage=${encodeURIComponent(nextpage)}`
          : null;

      if (!url) break;

      const response = await robustFetch(url, undefined, false);
      if (!response.ok) break;

      let data: { items?: unknown[]; nextpage?: string | null };
      try {
        data = await response.json();
      } catch {
        break;
      }

      const items = data?.items && Array.isArray(data.items) ? data.items : [];
      const mapped = mapPipedSearchItems(items, query, true).filter((t) =>
        isOfficialMusicTrack(t, artistName)
      );
      collected.push(...mapped);
      nextpage = data.nextpage || null;
      isFirstPage = false;
    } catch (pageErr) {
      console.warn(`Piped search page ${page + 1} failed for "${query}":`, pageErr);
      break;
    }
  }

  return collected;
};

/**
 * Fast artist discography: parallel paginated Topic/name searches (primary).
 * Optional channel pagination supplement when Topic channel is known.
 */
export const fetchArtistDiscography = async (
  artistName: string,
  limit: number = 120
): Promise<{
  tracks: SearchResult[];
  topicResult: { channelId: string; type: 'topic' | 'vevo' | 'official' } | null;
}> => {
  const name = artistName.trim();
  if (!name) return { tracks: [], topicResult: null };

  const perQueryLimit = Math.ceil(limit / 2);

  const [topicSettled, topicSearchSettled, nameSearchSettled] = await Promise.allSettled([
    resolveTopicChannelId(name),
    fetchPaginatedPipedSearch(`${name} - Topic`, name, perQueryLimit, 4),
    fetchPaginatedPipedSearch(name, name, perQueryLimit, 3),
  ]);

  const topicResult =
    topicSettled.status === 'fulfilled' ? topicSettled.value : null;
  const topicSearchTracks =
    topicSearchSettled.status === 'fulfilled' ? topicSearchSettled.value : [];
  const nameSearchTracks =
    nameSearchSettled.status === 'fulfilled' ? nameSearchSettled.value : [];

  if (topicSettled.status === 'rejected') {
    console.warn('Topic channel resolve failed:', topicSettled.reason);
  }
  if (topicSearchSettled.status === 'rejected') {
    console.warn('Topic search failed:', topicSearchSettled.reason);
  }
  if (nameSearchSettled.status === 'rejected') {
    console.warn('Name search failed:', nameSearchSettled.reason);
  }

  let channelTracks: SearchResult[] = [];
  if (topicResult?.channelId && topicResult.type === 'topic') {
    try {
      channelTracks = await Promise.race([
        fetchAllChannelUploads(topicResult.channelId, limit, {
          channelType: 'topic',
          maxPages: 3,
          timeBudgetMs: 3500,
        }),
        new Promise<SearchResult[]>((resolve) => setTimeout(() => resolve([]), 3600)),
      ]);
    } catch {
      channelTracks = [];
    }
  }

  const tracks = dedupeSearchResults([...topicSearchTracks, ...nameSearchTracks, ...channelTracks]).slice(
    0,
    limit
  );
  return { tracks, topicResult };
};

const executeRawSearchAPI = async (query: string, limit: number = 8): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  // Piped / Invidious only — no YouTube Data API (quota is too limited for search)
  try {
    const results = await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      (instance, signal) => fetchPipedSearchOnInstance(instance, query, signal),
      4000
    );
    return results.slice(0, limit);
  } catch (pipedErr) {
    console.warn('All Piped instances failed search, trying Invidious:', pipedErr);
  }

  // Try INVIDIOUS search concurrently
  try {
    const results = await fetchFromFirstSuccessfulInstance(
      INVIDIOUS_INSTANCES,
      async (instance, signal) => {
        for (const searchType of ['music', 'video'] as const) {
          const targetUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=${searchType}`;
          const response = await robustFetch(targetUrl, signal, false);
          if (!response.ok) continue;
          const data = await response.json();
          if (!Array.isArray(data)) continue;

          const validVideos = data.filter((item: any) => {
            const videoId = item.videoId;
            const isPlayable = !item.type || item.type === 'video' || item.type === 'short';
            if (!videoId || videoId.length !== 11 || !isPlayable) return false;
            if (
              searchType === 'video' &&
              isLikelyNonMusicStream(item.title || '', item.lengthSeconds, query)
            ) {
              return false;
            }
            return true;
          });

          const mapped = validVideos.map((item: any) => ({
            id: item.videoId,
            title: decodeHTMLEntities(item.title),
            artist: decodeHTMLEntities(item.author || 'Unknown Artist'),
            thumbnail: `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`,
            videoId: item.videoId,
            channelId: item.authorId,
          }));

          if (mapped.length > 0) return mapped;
        }
        throw new Error('Empty search items');
      },
      4000
    );
    return results.slice(0, limit);
  } catch (invidiousErr) {
    console.warn('All Invidious instances failed search, trying single Piped fallback:', invidiousErr);
  }

  // ULTIMATE FALLBACK: single Piped instance with full filter chain
  try {
    const mapped = await fetchPipedSearchOnInstance(PIPED_INSTANCES[0], query, new AbortController().signal);
    if (mapped.length > 0) return mapped.slice(0, limit);
  } catch (proxyErr) {
    console.error('All Piped/Invidious searches failed:', proxyErr);
  }

  return [];
};

export const rankAndSortSearchResults = (results: SearchResult[], query: string): SearchResult[] => {
  const queryLower = query.trim().toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  return results.map(r => {
    let score = 0;
    const titleLower = r.title.toLowerCase();
    const artistLower = r.artist.toLowerCase(); // channel title

    // 1. Topic channel boost (highest quality official audio)
    if (artistLower.includes('topic')) {
      score += 150;
    }
    
    // 2. VEVO / Official boost
    if (artistLower.includes('vevo')) {
      score += 100;
    }
    if (artistLower.includes('official')) {
      score += 80;
    }
    if (artistLower.includes('records') || artistLower.includes('music') || artistLower.includes('band')) {
      score += 40;
    }

    // 3. Exact channel title match with query words (e.g. searching artist name)
    queryWords.forEach(word => {
      if (artistLower.includes(word)) {
        score += 35;
      }
      if (titleLower.includes(word)) {
        score += 20;
      }
    });

    // 4. Boost official audio / video titles
    if (titleLower.includes('official audio') || titleLower.includes('original mix')) {
      score += 45;
    } else if (titleLower.includes('audio') && !titleLower.includes('lyric')) {
      score += 25;
    }
    
    if (titleLower.includes('official music video') || titleLower.includes('official video')) {
      score += 30;
    }

    // 5. Penalize unofficial / cover / live versions if not explicitly searched for
    const isExplicitLive = queryLower.includes('live');
    const isExplicitCover = queryLower.includes('cover');
    const isExplicitRemix = queryLower.includes('remix');
    const isExplicitLyrics = queryLower.includes('lyric');

    if (!isExplicitLive && (titleLower.includes('live') || titleLower.includes('concert') || titleLower.includes('performance') || artistLower.includes('live') || artistLower.includes('concert'))) {
      score -= 200;
    }
    if (!isExplicitCover && (titleLower.includes('cover') || titleLower.includes('tribute') || titleLower.includes('acoustic cover') || artistLower.includes('cover') || artistLower.includes('tribute'))) {
      score -= 250;
    }
    if (!isExplicitRemix && (titleLower.includes('remix') || titleLower.includes('bootleg') || titleLower.includes('edit') || artistLower.includes('remix') || artistLower.includes('bootleg'))) {
      score -= 150;
    }
    if (!isExplicitLyrics && (titleLower.includes('lyrics') || titleLower.includes('lyric video') || artistLower.includes('lyrics') || artistLower.includes('lyric'))) {
      score -= 200;
    }
    
    // Hard penalty for junk content
    if (titleLower.includes('10 hours') || titleLower.includes('10h') || titleLower.includes('loop') || titleLower.includes('hour loop') || titleLower.includes('hours loop') || artistLower.includes('loop')) {
      score -= 500;
    }
    if (titleLower.includes('reaction') || titleLower.includes('review') || titleLower.includes('vlog') || titleLower.includes('bts') || titleLower.includes('behind the scenes') || artistLower.includes('reaction') || artistLower.includes('vlog')) {
      score -= 500;
    }

    if (isLikelyNonMusicStream(r.title, undefined, query)) {
      score -= 800;
    }

    return { result: r, score };
  })
  .filter((x) => x.score > -200)
  .sort((a, b) => b.score - a.score)
  .map((x) => x.result);
};

export const executeSearchAPI = async (query: string, limit: number = 8): Promise<SearchResult[]> => {
  const rawResults = await executeRawSearchAPI(query, limit * 4);
  const ranked = rankAndSortSearchResults(rawResults, query);
  return ranked
    .filter((r) => !isLikelyNonMusicStream(r.title, undefined, query))
    .slice(0, limit);
};

export const executeChannelUploadsAPI = async (channelId: string, limit: number = 50): Promise<SearchResult[]> => {
  if (!channelId) return [];

  // Try PIPED instances concurrently
  try {
    const results = await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      async (instance, signal) => {
        const targetUrl = `${instance}/channel/${channelId}`;
        const response = await robustFetch(targetUrl, signal, false);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data && data.relatedStreams && Array.isArray(data.relatedStreams)) {
          const mapped = data.relatedStreams.map((item: any) => {
            const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
            const videoId = ytMatch ? ytMatch[1] : '';
            return {
              id: videoId,
              title: decodeHTMLEntities(item.title),
              artist: decodeHTMLEntities(item.uploaderName || 'Unknown Artist'),
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              videoId: videoId,
              channelId: channelId
            };
          }).filter((item: any) => item.id.length === 11);

          if (mapped.length > 0) return mapped;
        }
        throw new Error('Empty relatedStreams');
      },
      1800
    );
    return results.slice(0, limit);
  } catch (pipedErr) {
    console.warn('All Piped instances failed direct channel uploads, trying Invidious directly:', pipedErr);
  }

  // Try INVIDIOUS instances concurrently
  try {
    const results = await fetchFromFirstSuccessfulInstance(
      INVIDIOUS_INSTANCES,
      async (instance, signal) => {
        const targetUrl = `${instance}/api/v1/channels/${channelId}`;
        const response = await robustFetch(targetUrl, signal, false);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const videos = Array.isArray(data) ? data : (data.videos || data.relatedStreams || []);
        
        const mapped = videos.map((item: any) => {
          const videoId = item.videoId;
          return {
            id: videoId,
            title: decodeHTMLEntities(item.title),
            artist: decodeHTMLEntities(item.author || 'Unknown Artist'),
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            videoId: videoId,
            channelId: channelId
          };
        }).filter((item: any) => item.id && item.id.length === 11);

        if (mapped.length > 0) return mapped;
        throw new Error('Empty videos');
      },
      1800
    );
    return results.slice(0, limit);
  } catch (invidiousErr) {
    console.warn('All Invidious instances failed direct channel uploads, trying single proxy fallback:', invidiousErr);
  }

  // ULTIMATE FALLBACK: Try a single Piped instance with proxies
  try {
    const targetUrl = `${PIPED_INSTANCES[0]}/channel/${channelId}`;
    const response = await robustFetch(targetUrl, undefined, false); // ALLOW PROXIES
    if (response.ok) {
      const data = await response.json();
      if (data && data.relatedStreams && Array.isArray(data.relatedStreams)) {
        const mapped = data.relatedStreams.map((item: any) => {
          const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
          const videoId = ytMatch ? ytMatch[1] : '';
          return {
            id: videoId,
            title: decodeHTMLEntities(item.title),
            artist: decodeHTMLEntities(item.uploaderName || 'Unknown Artist'),
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            videoId: videoId,
            channelId: channelId
          };
        }).filter((item: any) => item.id.length === 11);
        if (mapped.length > 0) return mapped.slice(0, limit);
      }
    }
  } catch (proxyErr) {
    console.error('All direct and proxy channel fetches failed:', proxyErr);
  }

  return [];
};

const TOPIC_INVIDIOUS_INSTANCES = INVIDIOUS_INSTANCES;

const cleanTrackTitle = (title: string): string =>
  title
    .replace(/\s*\((Official Audio|Official Music Video|Official Video|Official Lyric Video|Audio|Video|Lyrics|Lyric Video|Music Video|HD|HQ|4K|Visualizer|Animated Video|Full Video)\)\s*/gi, '')
    .replace(/\s*\[(Official Audio|Official Music Video|Official Video|Official Lyric Video|Audio|Video|Lyrics|Lyric Video|Music Video|HD|HQ|4K|Visualizer|Animated Video|Full Video)\]\s*/gi, '')
    .trim();

const cleanArtistName = (name: string): string =>
  name
    .replace(/\s*-\s*Topic\s*$/i, '')
    .replace(/\s*VEVO\s*$/i, '')
    .replace(/\s*Official\s*$/i, '')
    .trim();

/**
 * Searches Piped/Invidious for channels matching artistName using the dedicated
 * channel search endpoint (not video search). Returns actual channel entities
 * so we can match on name directly — no guessing from video uploader fields.
 */
const searchForChannels = async (
  query: string
): Promise<Array<{ id: string; name: string }>> => {
  try {
    return await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      async (instance, signal) => {
        const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=channels`;
        const res = await robustFetch(url, signal, false);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const channels = (data?.items || [])
          .filter((item: any) => item.url && item.name)
          .map((item: any) => {
            const match = (item.url as string).match(/\/channel\/([^\/\?]+)/i);
            return match ? { id: match[1], name: decodeHTMLEntities(item.name) } : null;
          })
          .filter(Boolean) as Array<{ id: string; name: string }>;
        if (channels.length === 0) throw new Error('No channels');
        return channels;
      },
      3000
    );
  } catch {
    // Invidious fallback
  }

  for (const instance of TOPIC_INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=channel`;
      const res = await robustFetch(url, undefined, false);
      if (!res.ok) continue;
      const data = await res.json();
      const items: any[] = Array.isArray(data) ? data : [];
      const channels = items
        .filter((item: any) => item.authorId && item.author)
        .map((item: any) => ({ id: item.authorId, name: decodeHTMLEntities(item.author) }));
      if (channels.length > 0) return channels;
    } catch {
      // try next
    }
  }

  return [];
};

/**
 * Resolves the official YouTube Music Topic/VEVO channel for an artist.
 * Uses Piped's channel-search endpoint (filter=channels) for precise matching —
 * we get actual channel names back, not video uploader fields.
 *
 * Priority: Topic channel → VEVO → exact name match → null
 */
export const resolveTopicChannelId = async (
  artistName: string
): Promise<{ channelId: string; type: 'topic' | 'vevo' | 'official' } | null> => {
  const nameLower = artistName.trim().toLowerCase();

  // Search for "{artist}" and "{artist} topic" in parallel via channel endpoint
  const [generalResults, topicResults] = await Promise.allSettled([
    searchForChannels(artistName.trim()),
    searchForChannels(`${artistName.trim()} topic`)
  ]);

  const general = generalResults.status === 'fulfilled' ? generalResults.value : [];
  const topicSearch = topicResults.status === 'fulfilled' ? topicResults.value : [];
  const all = [...general, ...topicSearch];

  // Deduplicate by channel ID
  const seen = new Set<string>();
  const channels = all.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  // 1. Exact Topic channel: name === "{artist} - Topic"
  for (const ch of channels) {
    if (ch.name.toLowerCase() === `${nameLower} - topic`) {
      return { channelId: ch.id, type: 'topic' };
    }
  }

  // 2. VEVO channel: name === "{artist}VEVO"
  for (const ch of channels) {
    if (ch.name.toLowerCase() === `${nameLower}vevo`) {
      return { channelId: ch.id, type: 'vevo' };
    }
  }

  // 3. Official channel: name === exact artist name
  for (const ch of channels) {
    if (ch.name.toLowerCase() === nameLower) {
      return { channelId: ch.id, type: 'official' };
    }
  }

  return null;
};


/**
 * Fetches ALL uploads from a channel by paginating through Piped's nextpage tokens.
 * This gives a complete discography rather than just the latest 15-30 videos.
 * Falls back to Invidious if all Piped instances fail.
 */
export const fetchAllChannelUploads = async (
  channelId: string,
  limit: number = 150,
  options?: {
    channelType?: 'topic' | 'vevo' | 'official';
    maxPages?: number;
    timeBudgetMs?: number;
  }
): Promise<SearchResult[]> => {
  if (!channelId) return [];

  const maxPages = options?.maxPages ?? 12;
  const timeBudgetMs = options?.timeBudgetMs ?? 20000;
  const skipVlogFilter = options?.channelType === 'topic' || options?.channelType === 'vevo';
  const startedAt = Date.now();

  // Piped path: paginate via nextpage tokens
  const mapPipedItem = (item: any): SearchResult | null => {
    const ytMatch = (item.url || '').match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
    const videoId = ytMatch ? ytMatch[1] : item.videoId || '';
    if (!videoId || videoId.length !== 11) return null;
    const title = item.title || '';
    if (!skipVlogFilter && isLikelyNonMusicStream(title, item.duration, '')) return null;
    let cId = item.uploaderId;
    if (!cId && item.uploaderUrl) {
      const m = item.uploaderUrl.match(/\/channel\/([^\/]+)/i);
      if (m) cId = m[1];
    }
    return {
      id: videoId,
      title: cleanTrackTitle(decodeHTMLEntities(item.title || '')),
      artist: cleanArtistName(decodeHTMLEntities(item.uploaderName || '')),
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      videoId,
      channelId: cId || channelId
    };
  };

  try {
    const allItems: SearchResult[] = [];
    let nextpage: string | null = null;
    let firstPage = true;
    let pagesFetched = 0;
    const instance = PIPED_INSTANCES[0];

    do {
      if (pagesFetched >= maxPages || Date.now() - startedAt > timeBudgetMs) break;

      const url = firstPage
        ? `${instance}/channel/${channelId}`
        : `${instance}/nextpage/channel/${channelId}?nextpage=${encodeURIComponent(nextpage!)}`;

      const response = await robustFetch(url, undefined, false);
      if (!response.ok) break;
      const data = await response.json();

      for (const item of data.relatedStreams || []) {
        const mapped = mapPipedItem(item);
        if (mapped) allItems.push(mapped);
      }

      nextpage = data.nextpage || null;
      firstPage = false;
      pagesFetched++;
    } while (nextpage && allItems.length < limit);

    if (allItems.length > 0) return allItems.slice(0, limit);
  } catch {
    // fall through to Invidious
  }

  // Invidious fallback (no pagination support, but gets latest uploads)
  for (const instance of TOPIC_INVIDIOUS_INSTANCES) {
    try {
      const response = await robustFetch(`${instance}/api/v1/channels/${channelId}/videos?sort_by=newest`, undefined, false);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const videos: any[] = Array.isArray(data) ? data : (data.videos || []);
      const mapped = videos
        .filter((v: any) => v.videoId?.length === 11)
        .map((v: any) => ({
          id: v.videoId,
          title: cleanTrackTitle(decodeHTMLEntities(v.title || '')),
          artist: cleanArtistName(decodeHTMLEntities(v.author || '')),
          thumbnail: `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`,
          videoId: v.videoId,
          channelId
        }));
      if (mapped.length > 0) return mapped.slice(0, limit);
    } catch (err) {
      // try next instance
    }
  }

  return [];
};

export const shouldShowArtistCard = (query: string) => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return false;
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
  
  const words = trimmed.split(/\s+/);
  if (words.length > 3) return false;

  const blocklist = [
    'lyrics', 'remix', 'karaoke', 'live', 'cover', 'instrumental', 'acoustic', 
    'version', 'song', 'sang', 'video', '24 timer', 'vlog', 'hvad', 'hvornår', 
    'hvorfor', 'hvem', 'hvordan', 'mp3', 'wav', 'flac', 'prod', 'feat', 'ft.'
  ];
  
  return !blocklist.some(word => trimmed.includes(word));
};

export const getArtistName = (query: string, results: SearchResult[]): { name: string; thumbnail: string; channelId?: string; isTopic?: boolean } | null => {
  if (!shouldShowArtistCard(query) || results.length === 0) return null;
  
  const queryLower = query.trim().toLowerCase();
  if (queryLower.length < 2) return null;
  
  const match = results.find(r => {
    const artistLower = r.artist.trim().toLowerCase();
    
    const isExactOrOfficialMatch = 
      artistLower === queryLower ||
      artistLower === `${queryLower} - topic` ||
      artistLower === `${queryLower}vevo` ||
      artistLower === `${queryLower} official` ||
      artistLower === `${queryLower} music` ||
      artistLower === `${queryLower} band`;
    
    if (isExactOrOfficialMatch) return true;
    
    const containsQuery = artistLower.includes(queryLower);
    const isOfficialEntity = 
      artistLower.includes('topic') || 
      artistLower.includes('vevo') || 
      artistLower.includes('official') || 
      artistLower.includes('music') ||
      artistLower.includes('band') ||
      artistLower.includes('records');
      
    if (containsQuery && isOfficialEntity) return true;
    
    return false;
  });

  if (match) {
    const cleanedName = match.artist
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/\s*VEVO$/i, '')
      .replace(/\s*Official\s*$/i, '')
      .trim();
    const isTopic = match.artist.toLowerCase().includes('topic');
    return {
      name: cleanedName,
      thumbnail: match.thumbnail,
      channelId: match.channelId,
      isTopic: isTopic
    };
  }
  return null;
};
