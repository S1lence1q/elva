const testChannelId = 'UCq-Fj5jknLsUf-MWSy4_brA'; // Spinnin' Records

async function test() {
  const instance = 'https://yewtu.be';
  
  const urls = [
    `${instance}/api/v1/channel/${testChannelId}`,
    `${instance}/api/v1/channels/${testChannelId}`
  ];

  for (const url of urls) {
    try {
      console.log(`Fetching: ${url}`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Success! Keys/Props in response:`, Object.keys(data));
        const videos = Array.isArray(data) ? data : (data.videos || data.relatedStreams || []);
        console.log(`videos/streams length:`, videos.length);
      }
    } catch (e) {
      console.error(`Error for ${url}:`, e);
    }
  }
}

test();
