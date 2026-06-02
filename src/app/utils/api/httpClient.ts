export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 4000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal;
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
    if (signal.aborted) controller.abort();
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const robustFetch = async (
  url: string,
  signal?: AbortSignal,
  _skipProxies: boolean = false
): Promise<Response> => {
  try {
    const response = await fetchWithTimeout(url, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`Direct fetch failed for ${url}:`, e);
  }

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`AllOrigins proxy fetch failed for ${url}:`, e);
  }

  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`corsproxy.io fetch failed for ${url}:`, e);
  }

  throw new Error(`Failed to fetch ${url} directly or via proxies.`);
};

export const fetchFromFirstSuccessfulInstance = async <T extends unknown>(
  instances: string[],
  fetchFn: (instance: string, signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 3000
): Promise<T> => {
  const globalController = new AbortController();

  const promises = instances.map(async (instance) => {
    const instanceController = new AbortController();
    const abortListener = () => instanceController.abort();
    globalController.signal.addEventListener('abort', abortListener);

    const timeoutId = setTimeout(() => instanceController.abort(), timeoutMs);
    try {
      const res = await fetchFn(instance, instanceController.signal);
      clearTimeout(timeoutId);
      globalController.abort();
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    } finally {
      globalController.signal.removeEventListener('abort', abortListener);
    }
  });

  return new Promise((resolve, reject) => {
    let rejectedCount = 0;
    if (promises.length === 0) {
      reject(new Error('No instances provided'));
      return;
    }
    promises.forEach((p) => {
      p.then(resolve).catch(() => {
        rejectedCount++;
        if (rejectedCount === promises.length) {
          reject(new Error('All instances failed'));
        }
      });
    });
  });
};
