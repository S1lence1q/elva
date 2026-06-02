import { SearchResult } from '../../types';
import { isLikelyNonMusicStream } from './musicStreamFilters';

export const rankAndSortSearchResults = (results: SearchResult[], query: string): SearchResult[] => {
  const queryLower = query.trim().toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  return results
    .map((r) => {
      let score = 0;
      const titleLower = r.title.toLowerCase();
      const artistLower = r.artist.toLowerCase();

      if (artistLower.includes('topic')) score += 220;
      if (artistLower.includes('vevo') && !queryLower.includes('video')) score -= 60;
      if (artistLower.includes('official')) score += 80;
      if (artistLower.includes('records') || artistLower.includes('music') || artistLower.includes('band')) {
        score += 40;
      }

      queryWords.forEach((word) => {
        if (artistLower.includes(word)) score += 35;
        if (titleLower.includes(word)) score += 20;
      });

      if (titleLower.includes('official audio') || titleLower.includes('original mix')) {
        score += 90;
      } else if (titleLower.includes('audio') && !titleLower.includes('lyric')) {
        score += 45;
      }

      if (titleLower.includes('official music video') || titleLower.includes('music video')) {
        score -= 200;
      } else if (titleLower.includes('official video') && !titleLower.includes('audio')) {
        score -= 140;
      }

      const isExplicitLive = queryLower.includes('live');
      const isExplicitCover = queryLower.includes('cover');
      const isExplicitRemix = queryLower.includes('remix');
      const isExplicitLyrics = queryLower.includes('lyric');

      if (
        !isExplicitLive &&
        (titleLower.includes('live') ||
          titleLower.includes('concert') ||
          titleLower.includes('performance') ||
          artistLower.includes('live') ||
          artistLower.includes('concert'))
      ) {
        score -= 200;
      }
      if (
        !isExplicitCover &&
        (titleLower.includes('cover') ||
          titleLower.includes('tribute') ||
          titleLower.includes('acoustic cover') ||
          artistLower.includes('cover') ||
          artistLower.includes('tribute'))
      ) {
        score -= 250;
      }
      if (
        !isExplicitRemix &&
        (titleLower.includes('remix') ||
          titleLower.includes('bootleg') ||
          titleLower.includes('edit') ||
          artistLower.includes('remix') ||
          artistLower.includes('bootleg'))
      ) {
        score -= 150;
      }
      if (
        !isExplicitLyrics &&
        (titleLower.includes('lyrics') ||
          titleLower.includes('lyric video') ||
          artistLower.includes('lyrics') ||
          artistLower.includes('lyric'))
      ) {
        score -= 200;
      }

      if (
        titleLower.includes('10 hours') ||
        titleLower.includes('10h') ||
        titleLower.includes('loop') ||
        titleLower.includes('hour loop') ||
        titleLower.includes('hours loop') ||
        artistLower.includes('loop')
      ) {
        score -= 500;
      }
      if (
        titleLower.includes('reaction') ||
        titleLower.includes('review') ||
        titleLower.includes('vlog') ||
        titleLower.includes('bts') ||
        titleLower.includes('behind the scenes') ||
        artistLower.includes('reaction') ||
        artistLower.includes('vlog')
      ) {
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
