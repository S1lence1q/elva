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
