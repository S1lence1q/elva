import type { SearchResult, VerifiedArtist } from '../../types';

export type { SearchResult, VerifiedArtist };

export interface QueueItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

export type { Playlist } from '../PlaylistDetailsView';
