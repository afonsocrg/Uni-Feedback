import { Button } from '@uni-feedback/ui'
import { ArrowLeft, GraduationCap, Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

/**
 * The application shell for the chat.
 *
 * Deliberately not the site layout. A chat is a surface you operate, not a page
 * you read: it owns the viewport, the message list is the only thing that
 * scrolls, and the composer is pinned. Wrapping it in the site header and
 * footer would fight that scroll container and make it read as a page that
 * happens to contain a chat.
 *
 * The cost of leaving the layout is that the normal way back disappears, so the
 * way out has to be part of the chat's own chrome. That is what `BackToSite`
 * is, and why it sits at the top of the sidebar where every chat app puts its
 * logo.
 */
export function ChatShell({
  sidebar,
  children,
  onOpenSidebar
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
  onOpenSidebar: () => void
}) {
  return (
    // dvh, not vh: on mobile browsers vh includes the collapsing address bar,
    // which would push the composer under it.
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar onOpenSidebar={onOpenSidebar} />
        {children}
      </div>
    </div>
  )
}

/** Top of the sidebar: brand, and the way back to the rest of the site. */
export function BackToSite() {
  const { t } = useTranslation('chat')
  const lang = useLang()

  return (
    <div className="flex flex-col gap-1">
      <a
        href={getLocalePath('home', lang)}
        className="flex items-center gap-2 rounded-md px-1 py-1 transition-opacity hover:opacity-80"
      >
        <GraduationCap className="size-6 text-primary" />
        <span className="text-base font-semibold text-foreground">
          Uni Feedback
        </span>
      </a>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 justify-start gap-1.5 px-1 text-muted-foreground"
        asChild
      >
        <a href={getLocalePath('browse', lang)}>
          <ArrowLeft className="size-3.5" />
          {t('back_to_site')}
        </a>
      </Button>
    </div>
  )
}

/** The sidebar is a drawer on mobile, so small screens need a way to open it. */
function MobileBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { t } = useTranslation('chat')
  const lang = useLang()

  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSidebar}
        aria-label={t('open_chats')}
        className="size-9"
      >
        <Menu className="size-5" />
      </Button>
      <a
        href={getLocalePath('home', lang)}
        className="flex items-center gap-1.5"
      >
        <GraduationCap className="size-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Uni Feedback
        </span>
      </a>
    </div>
  )
}
