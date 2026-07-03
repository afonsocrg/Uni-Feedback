import '~/i18n/types'
import './app.css'

import Clarity from '@microsoft/clarity'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import posthog from 'posthog-js'
import React, { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteLoaderData
} from 'react-router'
import { Toaster } from 'sonner'
import { NotFound } from '~/components'
import type { Lang } from '~/i18n/config'
import { defaultLang, i18n } from '~/i18n/config'
import { AuthProvider } from '~/providers/AuthProvider'
import { AuthRefreshProvider } from '~/providers/AuthRefreshProvider'
import { ThemeProvider } from '~/providers/ThemeProvider'
import { userPreferences } from '~/utils'
import {
  getThemeFromCookie,
  type ResolvedTheme,
  THEME_INIT_SCRIPT
} from '~/utils/theme'

import { detectLang, getEquivalentPath } from '~/utils/i18n-routes'
import { getRequestOrigin } from '~/utils/request'
import type { Route } from './+types/root'
import { LandingLayout } from './components/landing'

// Module-level lang used for SSR: set by loader before renderToString runs.
// Safe for Node.js single-threaded synchronous rendering.
let _ssrLang: Lang = defaultLang
// Same pattern for the theme — used as a fallback when loader data is
// unavailable (e.g. during error rendering).
let _ssrTheme: ResolvedTheme = 'light'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
  }
]

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const lang = detectLang(url.pathname)
  _ssrLang = lang
  i18n.changeLanguage(lang)
  const theme = getThemeFromCookie(request.headers.get('cookie'))
  _ssrTheme = theme
  return { lang, theme, origin: getRequestOrigin(request) }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      gcTime: 1000 * 60 * 60 * 24
    }
  }
})

const persister =
  typeof window !== 'undefined'
    ? createAsyncStoragePersister({
        storage: window.localStorage
      })
    : undefined

function HreflangLinks() {
  const { origin } = useLoaderData<typeof loader>()
  const { pathname } = useLocation()
  const lang = detectLang(pathname)
  const ptPath = lang === 'pt' ? pathname : getEquivalentPath(pathname, 'en')
  const enPath = lang === 'en' ? pathname : getEquivalentPath(pathname, 'pt')
  return (
    <>
      <link rel="alternate" hrefLang="pt" href={`${origin}${ptPath}`} />
      <link rel="alternate" hrefLang="en" href={`${origin}${enPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${origin}${ptPath}`} />
    </>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Root loader data is available on both server and client navigations, so the
  // <html> class stays consistent across renders (no strip-on-navigate). Falls
  // back to the module var when loader data is absent (error rendering).
  const rootData = useRouteLoaderData('root') as
    | { theme?: ResolvedTheme }
    | undefined
  const theme = rootData?.theme ?? _ssrTheme

  const envScript =
    typeof process !== 'undefined'
      ? `window.ENV = ${JSON.stringify({
          API_BASE_URL:
            process.env.VITE_API_BASE_URL || 'http://localhost:3001',
          POSTHOG_KEY: process.env.VITE_PUBLIC_POSTHOG_KEY || '',
          POSTHOG_HOST: process.env.VITE_PUBLIC_POSTHOG_HOST || '',
          CLARITY_PROJECT_ID: process.env.VITE_PUBLIC_CLARITY_PROJECT_ID || ''
        })};`
      : ''

  return (
    <html
      lang={_ssrLang}
      className={theme === 'dark' ? 'scroll-smooth dark' : 'scroll-smooth'}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved theme before first paint — must stay first. */}
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
          suppressHydrationWarning
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <HreflangLinks />
        {envScript && (
          <script
            dangerouslySetInnerHTML={{ __html: envScript }}
            suppressHydrationWarning
          />
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const { lang, theme } = useLoaderData<typeof loader>()

  useEffect(() => {
    userPreferences.initialize()

    // Sync lang attribute and i18n on client-side navigation
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (typeof window !== 'undefined' && !import.meta.env.DEV) {
      const windowEnv = (
        window as typeof window & { ENV?: Record<string, string> }
      ).ENV
      const posthogKey =
        windowEnv?.POSTHOG_KEY || import.meta.env.VITE_PUBLIC_POSTHOG_KEY
      const posthogHost =
        windowEnv?.POSTHOG_HOST || import.meta.env.VITE_PUBLIC_POSTHOG_HOST

      if (!posthogKey || posthogKey === 'your_posthog_api_key_here') {
        console.warn(
          '[PostHog] PostHog API key is not configured. Analytics will not be tracked. ' +
            'Set VITE_PUBLIC_POSTHOG_KEY in your .env file.'
        )
        return
      }

      if (!posthogHost) {
        console.warn(
          '[PostHog] PostHog host is not configured. Analytics will not be tracked. ' +
            'Set VITE_PUBLIC_POSTHOG_HOST in your .env file.'
        )
        return
      }

      try {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          defaults: '2025-05-24'
        })
        console.log('[PostHog] Successfully initialized')
      } catch (error) {
        console.error('[PostHog] Failed to initialize:', error)
      }
    } else if (import.meta.env.DEV) {
      console.log('[PostHog] Disabled in development mode')
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && !import.meta.env.DEV) {
      const windowEnv = (
        window as typeof window & { ENV?: Record<string, string> }
      ).ENV
      const clarityProjectId =
        windowEnv?.CLARITY_PROJECT_ID ||
        import.meta.env.VITE_PUBLIC_CLARITY_PROJECT_ID

      if (
        !clarityProjectId ||
        clarityProjectId === 'your_clarity_project_id_here'
      ) {
        console.warn(
          '[Clarity] Clarity Project ID is not configured. Session recording will not be tracked. ' +
            'Set VITE_PUBLIC_CLARITY_PROJECT_ID in your .env file.'
        )
        return
      }

      try {
        Clarity.init(clarityProjectId)
        console.log('[Clarity] Successfully initialized')
      } catch (error) {
        console.error('[Clarity] Failed to initialize:', error)
      }
    } else if (import.meta.env.DEV) {
      console.log('[Clarity] Disabled in development mode')
    }
  }, [])

  return (
    <ThemeProvider initialResolved={theme}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <AuthRefreshProvider>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{ persister: persister! }}
            >
              <Toaster position="top-right" richColors />
              <Outlet />
              {import.meta.env.DEV && (
                <React.Suspense fallback={null}>
                  <ReactQueryDevtools initialIsOpen={false} />
                </React.Suspense>
              )}
            </PersistQueryClientProvider>
          </AuthRefreshProvider>
        </AuthProvider>
      </I18nextProvider>
    </ThemeProvider>
  )
}

const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools
      }))
    )
  : () => null

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    if (error.status === 404 || error.status === 400) {
      return (
        <AuthProvider>
          <AuthRefreshProvider>
            <LandingLayout>
              <NotFound />
            </LandingLayout>
          </AuthRefreshProvider>
        </AuthProvider>
      )
    }
    message = 'Error'
    details = error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
