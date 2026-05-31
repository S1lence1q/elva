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

  if (skipProxies) {
    throw new Error(`Direct fetch failed for ${url} and proxies were skipped.`);
  }

  // 2. Try via allorigins proxy
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

export const fetchVideoDetails = async (videoId: string): Promise<{ title: string; artist: string; artworkUrl: string; channelId?: string }> => {
  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const response = await fetchWithTimeout(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.items && data.items.length > 0) {
          const item = data.items[0];
          return {
            title: decodeHTMLEntities(item.snippet.title),
            artist: decodeHTMLEntities(item.snippet.channelTitle || 'Unknown Artist'),
            artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            channelId: item.snippet.channelId
          };
        }
      }
    } catch (error) {
      console.error('Failed to fetch video details via official API:', error);
    }
  }

  // Fallback: Invidious/Piped
  const PIPED_INSTANCES = [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.lunar.icu',
    'https://pipedapi.colby.host',
    'https://api.piped.yt',
    'https://pipedapi.tokhmi.xyz'
  ];

  const INVIDIOUS_INSTANCES = [
    'https://yewtu.be',
    'https://invidious.io.lol',
    'https://iv.melmac.space'
  ];

  // Try PIPED details concurrently
  try {
    const details = await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      async (instance, signal) => {
        const response = await robustFetch(`${instance}/streams/${videoId}`, signal, true); // SKIP PROXIES
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return {
          title: decodeHTMLEntities(data.title || 'YouTube Stream'),
          artist: decodeHTMLEntities(data.uploader || 'Web Stream'),
          artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          channelId: data.uploaderId
        };
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
        const response = await robustFetch(`${instance}/api/v1/videos/${videoId}`, signal, true); // SKIP PROXIES
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return {
          title: decodeHTMLEntities(data.title || 'YouTube Stream'),
          artist: decodeHTMLEntities(data.author || 'Web Stream'),
          artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          channelId: data.authorId
        };
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
      return {
        title: decodeHTMLEntities(data.title || 'YouTube Stream'),
        artist: decodeHTMLEntities(data.uploader || 'Web Stream'),
        artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        channelId: data.uploaderId
      };
    }
  } catch (proxyErr) {
    console.error('All direct and proxy video details failed:', proxyErr);
  }

  return {
    title: 'YouTube Stream',
    artist: 'Web Stream',
    artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  };
};

const executeRawSearchAPI = async (query: string, limit: number = 8): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const response = await fetchWithTimeout(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${limit}&q=${encodeURIComponent(
          query
        )}&type=video&key=${apiKey}`
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && data.items) {
        const validItems = data.items.filter((item: any) => item.id && item.id.videoId && item.id.videoId.length === 11);
        return validItems.map((item: any) => {
          const videoId = item.id.videoId;
          return {
            id: videoId,
            title: decodeHTMLEntities(item.snippet.title),
            artist: decodeHTMLEntities(item.snippet.channelTitle || 'Unknown Artist'),
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            videoId: videoId,
            channelId: item.snippet.channelId
          };
        });
      }
    } catch (error: any) {
      console.error('Official YouTube search failed:', error);
    }
  }

  // FALLBACK: Robust Piped/Invidious loop
  const PIPED_INSTANCES = [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.lunar.icu',
    'https://pipedapi.colby.host',
    'https://api.piped.yt',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me'
  ];

  const INVIDIOUS_INSTANCES = [
    'https://yewtu.be',
    'https://invidious.io.lol',
    'https://invidious.flokinet.to',
    'https://iv.melmac.space',
    'https://invidious.snopyta.org'
  ];

  // Try PIPED search concurrently
  try {
    const results = await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      async (instance, signal) => {
        let targetUrl = `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
        let response = await robustFetch(targetUrl, signal, true); // SKIP PROXIES
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        let data = await response.json();
        let items = data && data.items && Array.isArray(data.items) ? data.items : [];

        if (items.length === 0) {
          const fallbackUrl = `${instance}/search?q=${encodeURIComponent(query)}`;
          const fallbackRes = await robustFetch(fallbackUrl, signal, true);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData && fallbackData.items && Array.isArray(fallbackData.items)) {
              items = fallbackData.items;
            }
          }
        }

        if (items.length > 0) {
          const validStreams = items.filter((item: any) => {
            if (!item.url) return false;
            const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
            const videoId = ytMatch ? ytMatch[1] : null;
            const isPlayable = !item.type || item.type === 'stream' || item.type === 'video' || item.type === 'music_song';
            return videoId && videoId.length === 11 && isPlayable;
          });

          const mapped = validStreams.map((item: any) => {
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
              channelId: channelId
            };
          });

          if (mapped.length > 0) return mapped;
        }
        throw new Error('Empty search items');
      },
      1800
    );
    return results.slice(0, limit);
  } catch (pipedErr) {
    console.warn('All Piped instances failed direct search, trying Invidious directly:', pipedErr);
  }

  // Try INVIDIOUS search concurrently
  try {
    const results = await fetchFromFirstSuccessfulInstance(
      INVIDIOUS_INSTANCES,
      async (instance, signal) => {
        const targetUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        const response = await robustFetch(targetUrl, signal, true); // SKIP PROXIES
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          const validVideos = data.filter((item: any) => {
            const videoId = item.videoId;
            const isPlayable = !item.type || item.type === 'video' || item.type === 'short';
            return videoId && videoId.length === 11 && isPlayable;
          });

          const mapped = validVideos.map((item: any) => {
            const videoId = item.videoId;
            return {
              id: videoId,
              title: decodeHTMLEntities(item.title),
              artist: decodeHTMLEntities(item.author || 'Unknown Artist'),
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              videoId: videoId,
              channelId: item.authorId
            };
          });

          if (mapped.length > 0) return mapped;
        }
        throw new Error('Empty search items');
      },
      1800
    );
    return results.slice(0, limit);
  } catch (invidiousErr) {
    console.warn('All Invidious instances failed direct search, trying single proxy fallback:', invidiousErr);
  }

  // ULTIMATE FALLBACK: Hit a single instance WITH proxy allowed
  try {
    let targetUrl = `${PIPED_INSTANCES[0]}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
    let response = await robustFetch(targetUrl, undefined, false); // ALLOW PROXIES
    if (response.ok) {
      let data = await response.json();
      let items = data && data.items && Array.isArray(data.items) ? data.items : [];

      if (items.length === 0) {
        targetUrl = `${PIPED_INSTANCES[0]}/search?q=${encodeURIComponent(query)}`;
        response = await robustFetch(targetUrl, undefined, false);
        if (response.ok) {
          const fallbackData = await response.json();
          if (fallbackData && fallbackData.items && Array.isArray(fallbackData.items)) {
            items = fallbackData.items;
          }
        }
      }

      if (items.length > 0) {
        const validStreams = items.filter((item: any) => {
          if (!item.url) return false;
          const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
          const videoId = ytMatch ? ytMatch[1] : null;
          return videoId && videoId.length === 11;
        });
        const mapped = validStreams.map((item: any) => {
          const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
          const videoId = ytMatch![1];
          return {
            id: videoId,
            title: decodeHTMLEntities(item.title),
            artist: decodeHTMLEntities(item.uploaderName || 'Unknown Artist'),
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            videoId: videoId
          };
        });
        if (mapped.length > 0) return mapped.slice(0, limit);
      }
    }
  } catch (proxyErr) {
    console.error('All direct and proxy searches failed:', proxyErr);
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

    return { result: r, score };
  })
  .sort((a, b) => b.score - a.score)
  .map(x => x.result);
};

export const executeSearchAPI = async (query: string, limit: number = 8): Promise<SearchResult[]> => {
  // Fetch up to double the limit to allow high-quality matches to float into visibility
  const rawResults = await executeRawSearchAPI(query, limit * 2);
  return rankAndSortSearchResults(rawResults, query).slice(0, limit);
};

export const executeChannelUploadsAPI = async (channelId: string, limit: number = 50): Promise<SearchResult[]> => {
  if (!channelId) return [];

  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const uploadsPlaylistId = channelId.startsWith('UC') ? channelId.replace(/^UC/, 'UU') : channelId;
      const response = await fetchWithTimeout(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${uploadsPlaylistId}&key=${apiKey}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && data.items) {
        return data.items.map((item: any) => {
          const videoId = item.snippet.resourceId?.videoId || '';
          return {
            id: videoId,
            title: decodeHTMLEntities(item.snippet.title),
            artist: decodeHTMLEntities(item.snippet.channelTitle || 'Unknown Artist'),
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            videoId: videoId,
            channelId: channelId
          };
        }).filter((item: any) => item.id.length === 11);
      }
    } catch (error) {
      console.error('Official YouTube playlistItems fetch failed:', error);
    }
  }

  const PIPED_INSTANCES = [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.lunar.icu',
    'https://pipedapi.colby.host',
    'https://api.piped.yt',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me'
  ];

  const INVIDIOUS_INSTANCES = [
    'https://yewtu.be',
    'https://invidious.io.lol',
    'https://invidious.flokinet.to',
    'https://iv.melmac.space',
    'https://invidious.snopyta.org'
  ];

  // Try PIPED instances concurrently
  try {
    const results = await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      async (instance, signal) => {
        const targetUrl = `${instance}/channel/${channelId}`;
        const response = await robustFetch(targetUrl, signal, true); // SKIP PROXIES
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
        const response = await robustFetch(targetUrl, signal, true); // SKIP PROXIES
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

const TOPIC_PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.lunar.icu',
  'https://pipedapi.colby.host',
  'https://api.piped.yt',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me'
];

const TOPIC_INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://invidious.io.lol',
  'https://invidious.flokinet.to',
  'https://iv.melmac.space'
];

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
  // Piped: /search?q={query}&filter=channels
  for (const instance of TOPIC_PIPED_INSTANCES) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=channels`;
      const res = await robustFetch(url, undefined, true);
      if (!res.ok) continue;
      const data = await res.json();
      const items: any[] = data?.items || [];
      const channels = items
        .filter((item: any) => item.url && item.name)
        .map((item: any) => {
          const match = (item.url as string).match(/\/channel\/([^\/\?]+)/i);
          return match ? { id: match[1], name: decodeHTMLEntities(item.name) } : null;
        })
        .filter(Boolean) as Array<{ id: string; name: string }>;
      if (channels.length > 0) return channels;
    } catch {
      // try next
    }
  }

  // Invidious fallback: /api/v1/search?q={query}&type=channel
  for (const instance of TOPIC_INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=channel`;
      const res = await robustFetch(url, undefined, true);
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
  limit: number = 150
): Promise<SearchResult[]> => {
  if (!channelId) return [];

  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  // Official API path: use uploads playlist (UC → UU prefix)
  if (apiKey) {
    try {
      const uploadsPlaylistId = channelId.startsWith('UC')
        ? channelId.replace(/^UC/, 'UU')
        : channelId;
      const allItems: SearchResult[] = [];
      let pageToken: string | undefined;

      do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const response = await fetchWithTimeout(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data?.items) {
          for (const item of data.items) {
            const videoId = item.snippet.resourceId?.videoId || '';
            if (videoId.length !== 11) continue;
            allItems.push({
              id: videoId,
              title: cleanTrackTitle(decodeHTMLEntities(item.snippet.title)),
              artist: cleanArtistName(decodeHTMLEntities(item.snippet.channelTitle || '')),
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              videoId,
              channelId
            });
          }
        }
        pageToken = data?.nextPageToken;
      } while (pageToken && allItems.length < limit);

      if (allItems.length > 0) return allItems.slice(0, limit);
    } catch (err) {
      console.warn('Official API channel uploads failed, trying Piped:', err);
    }
  }

  // Piped path: paginate via nextpage tokens
  const mapPipedItem = (item: any): SearchResult | null => {
    const ytMatch = (item.url || '').match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
    const videoId = ytMatch ? ytMatch[1] : item.videoId || '';
    if (!videoId || videoId.length !== 11) return null;
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

  for (const instance of TOPIC_PIPED_INSTANCES) {
    try {
      const allItems: SearchResult[] = [];
      let nextpage: string | null = null;
      let firstPage = true;

      do {
        let url: string;
        if (firstPage) {
          url = `${instance}/channel/${channelId}`;
        } else {
          url = `${instance}/nextpage/channel/${channelId}?nextpage=${encodeURIComponent(nextpage!)}`;
        }

        const response = await robustFetch(url, undefined, true);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const streams: any[] = firstPage
          ? (data.relatedStreams || [])
          : (data.relatedStreams || []);

        for (const item of streams) {
          const mapped = mapPipedItem(item);
          if (mapped) allItems.push(mapped);
        }

        nextpage = data.nextpage || null;
        firstPage = false;
      } while (nextpage && allItems.length < limit);

      if (allItems.length > 0) return allItems.slice(0, limit);
    } catch (err) {
      // try next instance
    }
  }

  // Invidious fallback (no pagination support, but gets latest uploads)
  for (const instance of TOPIC_INVIDIOUS_INSTANCES) {
    try {
      const response = await robustFetch(`${instance}/api/v1/channels/${channelId}/videos?sort_by=newest`, undefined, true);
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
