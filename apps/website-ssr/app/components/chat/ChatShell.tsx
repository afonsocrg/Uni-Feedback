import { Button } from '@uni-feedback/ui'
import { GraduationCap, PanelLeft } from 'lucide-react'
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
 * way out is part of the chat's own chrome: in the sidebar when it is open, in
 * the top bar when it is not.
 */
export function ChatShell({
  sidebar,
  children,
  sidebarOpen,
  onToggleSidebar
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  return (
    // dvh, not vh: on mobile browsers vh includes the collapsing address bar,
    // which would push the composer under it.
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} />
        {children}
      </div>
    </div>
  )
}

/**
 * Always present, at every width.
 *
 * The toggle lives here rather than only inside the sidebar, because a control
 * that disappears with the thing it controls cannot bring it back. When the
 * sidebar is collapsed this bar also carries the brand and the way out, which
 * would otherwise vanish with it.
 */
function TopBar({
  sidebarOpen,
  onToggleSidebar
}: {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  const { t } = useTranslation('chat')
  const lang = useLang()

  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? t('close_chats') : t('open_chats')}
        title={sidebarOpen ? t('close_chats') : t('open_chats')}
        aria-expanded={sidebarOpen}
        className="size-9 text-muted-foreground"
      >
        <PanelLeft className="size-5" />
      </Button>

      {!sidebarOpen && (
        <a
          href={getLocalePath('home', lang)}
          title={t('back_to_site')}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
        >
          <GraduationCap className="size-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Uni Feedback
          </span>
        </a>
      )}
    </div>
  )
}

/** Top of the sidebar: brand, and the way back to the rest of the site. */
/**
 * The way back to the site.
 *
 * The logo alone, with no second "back" control beside it. A logo that returns
 * to the home page is the one navigation convention every site shares, so
 * pairing it with an arrow button pointing at the same place was two controls
 * doing one job. The title attribute says so for anyone who hesitates.
 */
export function BackToSite() {
  const { t } = useTranslation('chat')
  const lang = useLang()

  return (
    <a
      href={getLocalePath('home', lang)}
      title={t('back_to_site')}
      className="flex items-center gap-2 rounded-md px-1 py-1 transition-opacity hover:opacity-80"
    >
      <GraduationCap className="size-6 text-primary" />
      <span className="text-base font-semibold text-foreground">
        Uni Feedback
      </span>
    </a>
  )
}
