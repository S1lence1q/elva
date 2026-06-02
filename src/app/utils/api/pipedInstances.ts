export const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.nosebs.ru',
  'https://api.piped.yt',
  'https://pipedapi.darkness.services',
];

export const INVIDIOUS_INSTANCES = [
  'https://invidious.fdn.fr',
  'https://inv.nadeko.net',
  'https://invidious.privacyredirect.com',
  'https://yt.artemislena.eu',
  'https://invidious.io.lol',
];

/** music_songs first; videos only as fallback with strict non-music filtering. Never use `all`. */
export const PIPED_SEARCH_FILTERS = ['music_songs', 'videos'] as const;

export const TOPIC_INVIDIOUS_INSTANCES = INVIDIOUS_INSTANCES;
