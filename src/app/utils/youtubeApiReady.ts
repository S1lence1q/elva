/** Eager-load YouTube IFrame API so first play from recents does not race the script. */
export function waitForYouTubeApi(timeoutMs = 12_000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (window.YT && typeof window.YT.Player === 'function') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const started = Date.now();

    const finish = (ok: boolean) => resolve(ok);

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      finish(true);
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const poll = () => {
      if (window.YT && typeof window.YT.Player === 'function') {
        finish(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        finish(false);
        return;
      }
      window.setTimeout(poll, 100);
    };

    poll();
  });
}
