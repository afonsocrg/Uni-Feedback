import { useTranslation } from 'react-i18next'
import { useJourneyDot } from '~/hooks'
import { cn } from '~/utils'

/**
 * The red dot that points at "O meu percurso" until the student first opens
 * their profile. `corner` pins it to an avatar or icon (the parent must be
 * `relative`); `inline` sits at the end of a menu row.
 */
export function JourneyDot({ placement }: { placement: 'corner' | 'inline' }) {
  const { t } = useTranslation('feedback')
  const { showDot } = useJourneyDot()
  if (!showDot) return null

  return (
    <span
      role="status"
      aria-label={t('profile.journey.dot_label')}
      className={cn(
        'block size-2 shrink-0 rounded-full bg-destructive',
        placement === 'corner'
          ? 'absolute -top-0.5 -right-0.5 ring-2 ring-background'
          : 'ml-auto'
      )}
    />
  )
}
