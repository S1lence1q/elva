export interface PlaybackSongData {
  title: string;
  artist: string;
  artworkUrl: string;
  audioUrl: string;
  videoId?: string;
  channelId?: string;
}

export interface PlaybackQueueItem {
  id: string;
  videoId: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
}
