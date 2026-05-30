export function useBackgroundColors(
  songColors: { primary: string; secondary: string; accent: string } | null,
  appState: 'landing' | 'processing' | 'ready',
  colorsSongData: any,
  scrollProgress: number
) {
  const parseHex = (hex: string) => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  };

  const lerpColor = (c1: string, c2: string, factor: number): string => {
    const rgb1 = parseHex(c1);
    const rgb2 = parseHex(c2);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getWebGLBackgroundColors = () => {
    // If a song is loading, playing, or in exit transition (colorsSongData not null yet), transition directly to the extracted song colors!
    if (songColors && (appState === 'ready' || appState === 'processing' || colorsSongData !== null)) {
      return {
        c1: songColors.primary,
        c2: songColors.secondary,
        c3: songColors.accent
      };
    }

    // 3-way Linear hex interpolation based on vertical scrollProgress
    // Calmed down completely: stunning polished mercury silver main background with mild, clean analogous slate scroll flows
    const searchColors = { c1: '#111216', c2: '#323640', c3: '#040507' }; // Main background: Polished Mercury Silver & Deep Obsidian Slate
    const discoverColors = { c1: '#141720', c2: '#2c3547', c3: '#07090d' }; // Discover: Sophisticated quiet steel slate-blue glow
    const myHubColors = { c1: '#161513', c2: '#35322e', c3: '#060504' }; // My Hub: Sophisticated quiet warm platinum ash-silver glow

    if (scrollProgress <= 0.5) {
      const factor = scrollProgress / 0.5;
      return {
        c1: lerpColor(searchColors.c1, discoverColors.c1, factor),
        c2: lerpColor(searchColors.c2, discoverColors.c2, factor),
        c3: lerpColor(searchColors.c3, discoverColors.c3, factor)
      };
    } else {
      const factor = (scrollProgress - 0.5) / 0.5;
      return {
        c1: lerpColor(discoverColors.c1, myHubColors.c1, factor),
        c2: lerpColor(discoverColors.c2, myHubColors.c2, factor),
        c3: lerpColor(discoverColors.c3, myHubColors.c3, factor)
      };
    }
  };

  return getWebGLBackgroundColors();
}
