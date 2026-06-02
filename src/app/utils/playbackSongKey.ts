import { extractYouTubeVideoId } from './apiUtils';

/** Stable id for matching queue items to the active track (prefer YouTube video id). */
export function getPlaybackSongKey(song: {
  videoId?: string;
  audioUrl?: string;
  id?: string;
}): string | null {
  if (song.videoId?.trim()) return song.videoId.trim();
  if (song.audioUrl?.trim()) {
    const fromUrl = extractYouTubeVideoId(song.audioUrl);
    if (fromUrl) return fromUrl;
    return song.audioUrl.trim();
  }
  return song.id?.trim() || null;
}
