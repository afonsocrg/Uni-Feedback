import type { ChatSummary } from '@uni-feedback/api-client'
import { Button, cn } from '@uni-feedback/ui'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

interface ChatSidebarProps {
  chats: ChatSummary[]
  activeChatId: number | null
  onNewChat: () => void
  onSelect: (chatId: number) => void
  onDelete: (chatId: number) => void
}

export function ChatSidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelect,
  onDelete
}: ChatSidebarProps) {
  const { t } = useTranslation('chat')
  const lang = useLang()

  return (
    <aside className="hidden w-58 shrink-0 flex-col gap-4 border-r border-border bg-muted p-3 md:flex">
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
              chat.id === activeChatId && 'bg-background'
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

      {/* No quota meter. Nothing should count down at a student until they
          actually hit the wall. */}
      <p className="mt-auto border-t border-border pt-2.5 text-xs text-muted-foreground">
        {t('beta_warning')}{' '}
        <a
          href={getLocalePath('browse', lang)}
          className="underline underline-offset-2"
        >
          {t('quota_browse')}
        </a>
      </p>
    </aside>
  )
}
