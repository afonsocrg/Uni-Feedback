import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  type ResolvedTheme,
  type ThemePreference,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY
} from '~/utils/theme'

interface ThemeContextValue {
  /** What the user chose ('system' follows the OS). */
  preference: ThemePreference
  /** The concrete theme currently applied. */
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  /** Flip between light and dark (sets an explicit preference). */
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference
}

function applyTheme(resolved: ResolvedTheme) {
  const el = document.documentElement
  el.classList.toggle('dark', resolved === 'dark')
  el.style.colorScheme = resolved
  document.cookie = `${THEME_COOKIE_NAME}=${resolved};path=/;max-age=31536000;samesite=lax`
}

export function ThemeProvider({
  children,
  initialResolved
}: {
  children: React.ReactNode
  /** Server-painted theme (from cookie) — keeps first render flash-free. */
  initialResolved: ResolvedTheme
}) {
  // Preference lives in localStorage (client-only). Start from the server's
  // resolved value, then reconcile with the saved preference on mount.
  const [preference, setPreferenceState] =
    useState<ThemePreference>(initialResolved)
  const [resolved, setResolved] = useState<ResolvedTheme>(initialResolved)

  useEffect(() => {
    const saved =
      (localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null) ||
      'system'
    setPreferenceState(saved)
    const next = resolve(saved)
    setResolved(next)
    applyTheme(next)
  }, [])

  // Follow OS changes while the preference is 'system'.
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = systemTheme()
      setResolved(next)
      applyTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, next)
    setPreferenceState(next)
    const nextResolved = resolve(next)
    setResolved(nextResolved)
    applyTheme(nextResolved)
  }, [])

  const toggle = useCallback(() => {
    setPreference(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setPreference])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference, toggle }),
    [preference, resolved, setPreference, toggle]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Access the current theme. Tolerant of a missing provider (returns a static
 * light default) so shared components like the header still render on pages
 * that aren't wrapped — e.g. the error boundary.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  return ctx ?? FALLBACK
}

const FALLBACK: ThemeContextValue = {
  preference: 'system',
  resolved: 'light',
  setPreference: () => {},
  toggle: () => {}
}
