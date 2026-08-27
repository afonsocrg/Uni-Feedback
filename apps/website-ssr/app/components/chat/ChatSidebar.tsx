import type { ChatSummary } from '@uni-feedback/api-client'
import { Button, cn } from '@uni-feedback/ui'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ChatAccountRow } from './ChatAccountRow'
import { BackToSite } from './ChatShell'

interface ChatSidebarProps {
  chats: ChatSummary[]
  activeChatId: string | null
  /**
   * null means the student has never chosen.
   *
   * Kept as a tri-state so the default can come from CSS rather than JS. Read
   * from localStorage, "unknown" is what the first render always sees, and
   * resolving it in an effect made the sidebar blink shut on every navigation.
   */
  open: boolean | null
  onNewChat: () => void
  onSelect: (chatId: string) => void
  onDelete: (chatId: string) => void
  onClose: () => void
}

export function ChatSidebar({
  chats,
  activeChatId,
  open,
  onNewChat,
  onSelect,
  onDelete,
  onClose
}: ChatSidebarProps) {
  const { t } = useTranslation('chat')

  return (
    <>
      {/* Scrim, and only when the drawer was explicitly opened on a small
          screen. On desktop the sidebar is part of the layout, so there is
          nothing to dismiss. */}
      {open === true && (
        <button
          type="button"
          aria-label={t('close_chats')}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={cn(
          'z-50 w-64 shrink-0 flex-col gap-4 border-r border-border bg-background p-3',
          // Below md it is a drawer: off-canvas, over the conversation.
          // From md up it is part of the layout and stays put.
          'fixed inset-y-0 left-0 transition-transform md:static md:translate-x-0',
          open === null && 'hidden md:flex',
          open === true && 'flex translate-x-0',
          open === false && 'hidden'
        )}
      >
        <BackToSite />

        <Button onClick={onNewChat} className="w-full gap-1.5">
          <Plus className="size-4" />
          {t('new_chat')}
        </Button>

        <div className="flex flex-col gap-px overflow-y-auto">
          {chats.length > 0 && (
            <span className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('recent')}
            </span>
          )}
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                'group flex items-center gap-1 rounded-md px-2 py-1.5',
                chat.id === activeChatId && 'bg-muted'
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(chat.id)}
                className={cn(
                  'flex-1 truncate text-left text-sm text-foreground',
                  chat.id === activeChatId && 'font-medium'
                )}
              >
                {chat.title ?? t('untitled')}
              </button>
              <button
                type="button"
                aria-label={t('delete_chat')}
                title={t('delete_chat')}
                onClick={() => onDelete(chat.id)}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-border pt-2">
          {/* The chat has no site header, so this is the only route to account,
              theme and language. */}
          <ChatAccountRow />
        </div>
      </aside>
    </>
  )
}
