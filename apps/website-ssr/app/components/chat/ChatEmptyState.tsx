import { useTranslation } from 'react-i18next'

interface ChatEmptyStateProps {
  onPick: (question: string) => void
}

const SUGGESTION_KEYS = ['hardest', 'assessment', 'no_exam'] as const

export function ChatEmptyState({ onPick }: ChatEmptyStateProps) {
  const { t } = useTranslation('chat')

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-10">
      <div className="flex max-w-md flex-col gap-2 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {t('empty_title')}
        </h2>
        {/* Saying what it does NOT know is cheaper than a disappointed first
            question: entry grades and applications are the highest-volume real
            demand and we hold none of it. */}
        <p className="text-sm text-muted-foreground">{t('empty_subtitle')}</p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-2">
        {SUGGESTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(t(`suggestions.${key}`))}
            className="cursor-pointer rounded-md border border-border bg-card px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primaryBlue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primaryBlue"
          >
            {t(`suggestions.${key}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
