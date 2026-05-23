const testChannelId = 'UCPC0L1d253x-KuMNwa05TpA'; // Taylor Swift Topic

async function test() {
  const instance = 'https://api.piped.private.coffee';
  const url = `${instance}/channel/${testChannelId}`;

  try {
    console.log(`Fetching Piped channel: ${url}`);
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      if (data.tabs) {
        console.log(`Tabs found:`, data.tabs.map(t => ({ name: t.name, hasContent: !!t.content })));
        const firstTab = data.tabs[0];
        if (firstTab && firstTab.content) {
          console.log(`First tab content keys:`, Object.keys(firstTab.content));
          if (firstTab.content.relatedStreams) {
            console.log(`First tab relatedStreams length:`, firstTab.content.relatedStreams.length);
          }
        }
      }
    }
  } catch (e) {
    console.error(`Error:`, e);
  }
}

test();
