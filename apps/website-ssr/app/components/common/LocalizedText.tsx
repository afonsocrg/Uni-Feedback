import { Markdown } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import type { Localized } from '~/utils/localizedContent'

/**
 * Long text picked by `pickText`: rendered as markdown, marked with its own
 * language, and, when it fell back to Portuguese on an EN page, followed by a
 * muted "Available in Portuguese only" note.
 */
export function LocalizedText({
  text,
  className
}: {
  text: Localized<string>
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={className}>
      <div lang={text.lang} className="max-w-prose text-foreground">
        <Markdown>{text.value}</Markdown>
      </div>
      {text.fellBack && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t('localized.pt_only')}
        </p>
      )}
    </div>
  )
}
