async function test() {
  const instances = [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.lunar.icu'
  ];

  for (const instance of instances) {
    console.log(`\n=== Testing Instance: ${instance} ===`);
    for (const q of ['Kesi topic', 'Kesi']) {
      for (const filter of ['music_songs', 'all']) {
        const filterParam = filter === 'all' ? '' : `&filter=${filter}`;
        const url = `${instance}/search?q=${encodeURIComponent(q)}${filterParam}`;
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const count = data.items?.length || 0;
            console.log(`Query "${q}" (filter: ${filter}): Found ${count} items`);
            if (count > 0) {
              const streams = data.items.filter(item => {
                if (!item.url) return false;
                const isPlayable = !item.type || item.type === 'stream' || item.type === 'video';
                return isPlayable;
              });
              console.log(`  -> Playable streams: ${streams.length}`);
              if (streams.length > 0) {
                console.log(`  -> First 3 stream titles:`, streams.slice(0, 3).map(s => s.title));
              }
            }
          } else {
            console.log(`Query "${q}" (filter: ${filter}): HTTP ${res.status}`);
          }
        } catch (e) {
          console.log(`Query "${q}" (filter: ${filter}): Error: ${e.message}`);
        }
      }
    }
  }
}

test();
