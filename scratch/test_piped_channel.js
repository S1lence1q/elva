const testChannelId = 'UCq-Fj5jknLsUf-MWSy4_brA'; // Spinnin' Records

async function test() {
  const instance = 'https://api.piped.private.coffee';
  
  const urls = [
    `${instance}/channel/${testChannelId}`,
    `${instance}/channels/${testChannelId}`
  ];

  for (const url of urls) {
    try {
      console.log(`Fetching: ${url}`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Success! Keys in response:`, Object.keys(data));
        if (data.relatedStreams) {
          console.log(`relatedStreams length:`, data.relatedStreams.length);
        }
      }
    } catch (e) {
      console.error(`Error for ${url}:`, e);
    }
  }
}

test();
