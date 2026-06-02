import { SearchResult } from '../../types';
import { fetchFromFirstSuccessfulInstance, robustFetch } from './httpClient';
import { INVIDIOUS_INSTANCES, PIPED_INSTANCES } from './pipedInstances';
import { decodeHTMLEntities } from './textHelpers';

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

export const fetchVideoDetails = async (
  videoId: string
): Promise<{ title: string; artist: string; artworkUrl: string; channelId?: string }> => {
  const mergeWithOEmbedIfNeeded = async (partial: {
    title: string;
    artist: string;
    artworkUrl: string;
    channelId?: string;
  }) => {
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
          channelId: data.uploaderId,
        });
      },
      1800
    );
    return details;
  } catch (pipedErr) {
    console.warn('All Piped instances failed direct video details, trying Invidious directly:', pipedErr);
  }

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
          channelId: data.authorId,
        });
      },
      1800
    );
    return details;
  } catch (invidiousErr) {
    console.warn('All Invidious instances failed direct video details, trying single proxy fallback:', invidiousErr);
  }

  try {
    const response = await robustFetch(`${PIPED_INSTANCES[0]}/streams/${videoId}`, undefined, false);
    if (response.ok) {
      const data = await response.json();
      return mergeWithOEmbedIfNeeded({
        title: decodeHTMLEntities(data.title || ''),
        artist: decodeHTMLEntities(data.uploader || ''),
        artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        channelId: data.uploaderId,
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
    artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
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
