async function test() {
  const apiKey = 'AIzaSyCo_Rk9UBY3C5F1OydWKchuRuTsniS5olA';
  // UUq-Fj5jknLsUf-MWSy4_brA is the uploads playlist for Spinnin' Records
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=5&playlistId=UUq-Fj5jknLsUf-MWSy4_brA&key=${apiKey}`;

  try {
    console.log(`Fetching YouTube API: ${url}`);
    const res = await fetch(url, {
      headers: {
        'Referer': 'https://elva.arkivet.xyz/'
      }
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    if (res.ok) {
      console.log(`Success! First item title:`, data.items?.[0]?.snippet?.title);
    } else {
      console.log(`Error Response:`, JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error(`Fetch error:`, e);
  }
}

test();
