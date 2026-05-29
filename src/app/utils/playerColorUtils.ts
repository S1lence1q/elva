// Helper to convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Helper to convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s, l };
}

// Generate beautiful, dynamic, vibrant HSL theme palettes by hashing the song title/artist
export function getDynamicFallbackColors(title: string, artist: string) {
  const str = `${title} ${artist}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  const primaryRgb = hslToRgb(hue, 0.6, 0.28);
  const secondaryRgb = hslToRgb((hue + 120) % 360, 0.45, 0.15);
  const accentRgb = hslToRgb((hue + 240) % 360, 0.65, 0.35);

  return {
    primary: `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, 0.6)`,
    secondary: `rgba(${secondaryRgb[0]}, ${secondaryRgb[1]}, ${secondaryRgb[2]}, 0.5)`,
    accent: `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, 0.4)`
  };
}
