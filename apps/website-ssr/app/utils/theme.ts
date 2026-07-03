export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/** localStorage key holding the user's *preference* (may be 'system'). */
export const THEME_STORAGE_KEY = 'uf-theme'
/** Cookie holding the *resolved* theme so the server can paint the right class. */
export const THEME_COOKIE_NAME = 'uf-theme'

/** Read the resolved theme the server should paint, from the request cookie. */
export function getThemeFromCookie(cookieHeader: string | null): ResolvedTheme {
  if (!cookieHeader) return 'light'
  const match = cookieHeader.match(/(?:^|;\s*)uf-theme=(light|dark)/)
  return match ? (match[1] as ResolvedTheme) : 'light'
}

/**
 * Inline script injected as the first thing in <head>. Runs before the first
 * paint (so no flash of the wrong theme): reads the saved preference, resolves
 * 'system' via matchMedia, applies the `.dark` class + `color-scheme`, and
 * syncs the cookie so the *next* SSR paints the right class immediately.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var p=localStorage.getItem(k)||'system';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';document.cookie='${THEME_COOKIE_NAME}='+(d?'dark':'light')+';path=/;max-age=31536000;samesite=lax';}catch(_){}})();`
