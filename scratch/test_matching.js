async function test() {
  const url = 'https://api.piped.private.coffee/search?q=Kesi%20topic&filter=music_songs';
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log('HTTP error', res.status);
      return;
    }
    const data = await res.json();
    const items = data.items || [];
    const nameLower = 'kesi';
    
    console.log(`\n=== Evaluated Search Results for "Kesi topic" ===`);
    items.forEach((item, index) => {
      const titleLower = (item.title || '').toLowerCase();
      const artistLower = (item.uploaderName || '').toLowerCase();
      
      const artistMatches = artistLower.includes(nameLower) || nameLower.includes(artistLower);
      const titleMatches = titleLower.includes(nameLower);
      
      const isCamilo = artistLower.includes('camilo');
      const smartMatch = artistMatches || (titleMatches && !isCamilo);
      
      console.log(`[${index + 1}] Title: "${item.title}" | Artist: "${item.uploaderName}"`);
      console.log(`    artistMatches: ${artistMatches} | titleMatches: ${titleMatches} | smartMatch: ${smartMatch}`);
    });
  } catch (e) {
    console.error(e);
  }
}
test();
