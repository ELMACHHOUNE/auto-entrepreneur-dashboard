// Ensures History API receives absolute URLs to avoid tools that call new URL(url)
// without a base. Safe to call multiple times; it's idempotent.

declare global {
  interface Window {
    __ABS_URL_HISTORY_PATCHED__?: boolean;
  }
}

export function installAbsoluteUrlHistoryPatch(): void {
  if (typeof window === 'undefined') return;
  if (window.__ABS_URL_HISTORY_PATCHED__) return;

  try {
    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    const toAbsolute = (url: string | URL | undefined) => {
      if (typeof url !== 'string') return url;
      // Already absolute
      if (/^https?:\/\//i.test(url)) return url;
      const base = window.location.origin.replace(/\/$/, '');
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    };

    window.history.pushState = ((data: unknown, title: string, url?: string | URL) => {
      return origPush(data, title, typeof url === 'string' ? toAbsolute(url) : url);
    }) as typeof window.history.pushState;

    window.history.replaceState = ((data: unknown, title: string, url?: string | URL) => {
      return origReplace(data, title, typeof url === 'string' ? toAbsolute(url) : url);
    }) as typeof window.history.replaceState;

    window.__ABS_URL_HISTORY_PATCHED__ = true;
  } catch {
    // noop
  }
}
