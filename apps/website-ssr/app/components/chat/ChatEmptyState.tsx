import { useTranslation } from 'react-i18next'

interface ChatEmptyStateProps {
  onPick: (question: string) => void
  /** Set when the student arrived from a course, degree or faculty page. */
  scopeLabel?: string | null
}

const SUGGESTION_KEYS = ['hardest', 'assessment', 'no_exam'] as const

export function ChatEmptyState({ onPick, scopeLabel }: ChatEmptyStateProps) {
  const { t } = useTranslation('chat')

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-5 py-10">
      <div className="flex max-w-md flex-col gap-2 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {scopeLabel
            ? t('empty_title_scoped', { name: scopeLabel })
            : t('empty_title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('empty_subtitle')}</p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-2">
        {SUGGESTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(t(`suggestions.${key}`))}
            className="cursor-pointer rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primaryBlue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primaryBlue"
          >
            {t(`suggestions.${key}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
