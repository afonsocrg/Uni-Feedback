import { formatSchoolYearString } from '@uni-feedback/utils'
import { useTranslation } from 'react-i18next'
import { RowTag } from '../common/RowTag'

/**
 * "Até 25/26": marks a course that is no longer taught, wherever courses are
 * listed (degree page, search, the feedback course picker). Renders nothing for
 * a course still taught. See `courses.last_taught_year`.
 */
export function LastTaughtTag({
  lastTaughtYear
}: {
  lastTaughtYear: number | null | undefined
}) {
  const { t } = useTranslation('browse')
  if (lastTaughtYear == null) return null
  return (
    <RowTag
      label={t('degree_page.tag_last_taught', {
        year: formatSchoolYearString(lastTaughtYear, { yearFormat: 'short' })
      })}
    />
  )
}
