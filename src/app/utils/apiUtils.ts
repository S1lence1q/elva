/**
 * Barrel re-exports for the Elva API layer.
 * Implementation lives in `./api/*` modules split by responsibility.
 */
export {
  HAND_PICKED_ARTIST_IMAGES,
  getHandPickedImage,
  getArtistDynamicColors,
  shouldShowArtistCard,
  getArtistName,
  pickArtistCardFromSearchResults,
  artistIdentityMatchesSearchQuery,
} from './api/artistHelpers';

export { decodeHTMLEntities } from './api/textHelpers';

export { fetchWithTimeout, robustFetch, fetchFromFirstSuccessfulInstance } from './api/httpClient';

export {
  isLikelyNonMusicStream,
  isOfficialMusicUploader,
  isOfficialMusicTrack,
  isLikelyMusicVideoStream,
} from './api/musicStreamFilters';

export { rankAndSortSearchResults } from './api/searchRanking';

export { extractYouTubeVideoId, fetchVideoDetails, resolveUrlToSearchResult } from './api/videoMetadata';

export { executeSearchAPI } from './api/pipedSearch';

export {
  executeChannelUploadsAPI,
  resolveTopicChannelId,
  fetchAllChannelUploads,
  fetchArtistDiscography,
} from './api/channelApi';
