async function test() {
  const query = 'taylor swift';
  const instance = 'https://api.piped.private.coffee';
  const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`;

  try {
    console.log(`Searching Piped: ${url}`);
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      const firstItem = data.items?.[0];
      console.log(`First item keys:`, Object.keys(firstItem || {}));
      console.log(`First item values:`, JSON.stringify(firstItem, null, 2));
    }
  } catch (e) {
    console.error(`Search error:`, e);
  }
}

test();
