import './app.css'

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import posthog from 'posthog-js'
import React, { useEffect } from 'react'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from 'react-router'
import { Toaster } from 'sonner'
import { NotFound } from '~/components'
import { userPreferences } from '~/utils'
import type { Route } from './+types/root'

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      gcTime: 1000 * 60 * 60 * 24 // 24 hours for SSR hydration
    }
  }
})

// Create persister only on client side to avoid SSR issues
const persister =
  typeof window !== 'undefined'
    ? createAsyncStoragePersister({
        storage: window.localStorage
      })
    : undefined

export function Layout({ children }: { children: React.ReactNode }) {
  // Inject runtime environment variables for Docker/SSR
  const envScript =
    typeof process !== 'undefined'
      ? `window.ENV = ${JSON.stringify({
          API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3001'
        })};`
      : ''

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
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
  useEffect(() => {
    // Initialize user preferences and handle migration
    userPreferences.initialize()

    // Initialize PostHog (client-side only, disabled in development)
    // if (typeof window !== 'undefined' && !import.meta.env.DEV) {
    if (typeof window !== 'undefined') {
      const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
      const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

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
          defaults: '2025-05-24' // Use 2025 defaults for automatic SPA pageview tracking
        })
        console.log('[PostHog] Successfully initialized')
      } catch (error) {
        console.error('[PostHog] Failed to initialize:', error)
      }
    } else if (import.meta.env.DEV) {
      console.log('[PostHog] Disabled in development mode')
    }
  }, [])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <Toaster position="top-right" richColors />
      <Outlet />
      {import.meta.env.DEV && (
        <React.Suspense fallback={null}>
          {/* @ts-ignore - dynamic import */}
          <ReactQueryDevtools initialIsOpen={false} />
        </React.Suspense>
      )}
    </PersistQueryClientProvider>
  )
}

// Lazy load devtools only in development
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
      return <NotFound />
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
