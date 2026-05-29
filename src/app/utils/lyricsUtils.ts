import { LyricLine } from '../types';

export function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;
  
  for (const line of lines) {
    const match = timeRegExp.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3] ? parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1) : 0;
      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegExp, '').trim();
      
      if (text || line.includes('♪')) {
        result.push({ time: timeInSeconds, text: text || '♪' });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export function generateFallbackLyrics(title: string, duration: number): LyricLine[] {
  const totalDuration = duration > 0 ? duration : 240;
  const lines = [
    "♪ (Instrumental Intro) ♪",
    `We begin in the quiet echoes of ${title}...`,
    "Dancing through the shadows...",
    "Sensing every beat, every word you said...",
    "A lingering feeling in the crisp night air...",
    "Now we rise, matching the rhythm of our hearts...",
    "♪ (Ambient Break) ♪",
    "And as the melody guides us home...",
    "We remember the moments we shared...",
    "Fading slowly into the twilight glow...",
    "♪ (Instrumental Outro) ♪"
  ];

  const result: LyricLine[] = [];
  const interval = totalDuration / (lines.length + 1);
  
  for (let i = 0; i < lines.length; i++) {
    result.push({
      time: Math.round((i * interval + interval * 0.5) * 10) / 10,
      text: lines[i]
    });
  }
  return result;
}
