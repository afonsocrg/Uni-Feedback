import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { HeroSearchBar } from '~/components/landing/HeroSearchBar'
import { useLang, useShowChatEntryPoints } from '~/hooks'
import { analytics, type NotFoundLinkTarget } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'

/**
 * The 404 page. Written for students, not developers, so it never says "404":
 * a search box (most dead links are courses or degrees whose URL changed) and a
 * few shortcuts into the rest of the site.
 */
export function NotFound() {
  const { t } = useTranslation('common')
  const lang = useLang()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const showChatEntryPoints = useShowChatEntryPoints()
  // Arriving straight from a search engine or a shared link, there is nothing
  // to go back to. Known only in the browser, so it starts hidden.
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    analytics.notFound.viewed({ path: pathname })
    setCanGoBack(window.history.length > 1)
  }, [pathname])

  const links: { target: Exclude<NotFoundLinkTarget, 'back'>; href: string }[] =
    [
      { target: 'browse', href: getLocalePath('browse', lang) },
      ...(showChatEntryPoints
        ? [{ target: 'chat' as const, href: getLocalePath('chat', lang) }]
        : []),
      { target: 'home', href: getLocalePath('home', lang) }
    ]

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
          {t('not_found.title')}
        </h1>
        <p className="mt-3 text-muted-foreground text-balance">
          {t('not_found.subtitle')}
        </p>

        <div className="mt-6">
          <HeroSearchBar surface="not_found" />
        </div>

        <nav className="mt-8 text-left border-t border-border divide-y divide-border">
          {links.map(({ target, href }) => (
            <a
              key={target}
              href={href}
              onClick={() => analytics.notFound.linkClicked({ target })}
              className="group flex items-center justify-between gap-4 px-3 py-3.5 hover:bg-muted transition-colors"
            >
              <span className="min-w-0">
                <span className="block font-medium text-foreground">
                  {t(`not_found.links.${target}.label`)}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {t(`not_found.links.${target}.hint`)}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </a>
          ))}
        </nav>

        {canGoBack && (
          <button
            type="button"
            onClick={() => {
              analytics.notFound.linkClicked({ target: 'back' })
              navigate(-1)
            }}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('not_found.go_back')}
          </button>
        )}
      </div>
    </main>
  )
}
