/** Resolves when a scroll container has stopped moving (snap scroll included). */
export function waitForScrollEnd(container: HTMLElement, maxMs = 1000): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('scrollend', onScrollEnd);
      window.clearTimeout(debounceId);
      window.clearTimeout(maxId);
      resolve();
    };

    const onScrollEnd = () => finish();

    let debounceId = 0;
    const onScroll = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(finish, 140);
    };

    const maxId = window.setTimeout(finish, maxMs);

    container.addEventListener('scroll', onScroll, { passive: true });
    if ('onscrollend' in window) {
      container.addEventListener('scrollend', onScrollEnd, { once: true });
    }
  });
}
