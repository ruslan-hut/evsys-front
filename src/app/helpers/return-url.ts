const RETURN_URL_KEY = 'returnUrl';

// Long enough to sign in, short enough that an abandoned attempt does not
// redirect an unrelated sign-in days later.
const RETURN_URL_TTL_MS = 15 * 60 * 1000;

/**
 * Remembers where to come back to after signing in. Kept in localStorage
 * rather than sessionStorage because the e-mail sign-in link opens in a new tab.
 */
export function rememberReturnUrl(url: string): void {
  localStorage.setItem(RETURN_URL_KEY, JSON.stringify({url, at: Date.now()}));
}

/**
 * Returns the remembered URL once, or '/' when there is none or it is stale.
 * Only app-relative paths are honoured, so a planted value cannot send the
 * user to another site.
 */
export function takeReturnUrl(): string {
  const raw = localStorage.getItem(RETURN_URL_KEY);
  localStorage.removeItem(RETURN_URL_KEY);
  if (!raw) {
    return '/';
  }
  try {
    const {url, at} = JSON.parse(raw) as {url?: unknown; at?: unknown};
    const fresh = typeof at === 'number' && Date.now() - at < RETURN_URL_TTL_MS;
    if (fresh && typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) {
      return url;
    }
  } catch {
    // not ours, or written by an older version: ignore
  }
  return '/';
}
