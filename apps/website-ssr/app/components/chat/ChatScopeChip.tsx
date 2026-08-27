import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * Says what the conversation is scoped to.
 *
 * Without this, arriving from "Perguntar sobre AMS" looks like nothing
 * happened: the page loads a blank chat that silently knows about a course the
 * student can see no evidence of. The scope is the reason the entry point is
 * worth having, so it has to be visible.
 *
 * The label is a display hint from the URL, not the scope itself, which is
 * always the id.
 */
export function ChatScopeChip({
  label,
  onClear
}: {
  label: string
  onClear?: () => void
}) {
  const { t } = useTranslation('chat')

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-tint-blue-border bg-tint-blue px-2.5 py-0.5 text-xs text-tint-blue-fg">
      {t('scoped_to', { name: label })}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t('context_remove')}
          className="cursor-pointer opacity-70 hover:opacity-100"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}
