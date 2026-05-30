export function cleanSongTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\([^)]*\)/g, '') // remove anything in parentheses (e.g., "(Official Video)")
    .replace(/\[[^\]]*\]/g, '') // remove anything in brackets (e.g., "[Lyrics]")
    .replace(/ft\..*$/gi, '') // remove "ft." and everything after
    .replace(/feat\..*$/gi, '') // remove "feat." and everything after
    .replace(/\|.*$/g, '') // remove "|" and everything after
    .replace(/"/g, '') // remove quotes
    .trim();
}

export function getPrimaryArtist(artist: string): string {
  if (!artist) return '';
  
  // Clean off standard feature suffixes first
  let cleaned = artist
    .split(/\s+feat\.?\s+/i)[0]
    .split(/\s+ft\.?\s+/i)[0]
    .split(/\s+featuring\s+/i)[0];
    
  // Split on collaborative delimiters and take the first item
  const delimiters = [',', ' & ', ' x ', ' X '];
  for (const delimiter of delimiters) {
    if (cleaned.includes(delimiter)) {
      cleaned = cleaned.split(delimiter)[0];
    }
  }
  
  return cleaned.trim();
}
