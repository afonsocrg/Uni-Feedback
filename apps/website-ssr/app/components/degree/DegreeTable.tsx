import { useTranslation } from 'react-i18next'
import { ListingHeader, ListingRow } from '../common/ListingRow'
import type { DegreeListingProps, DegreeWithCounts } from './types'

// Fixed widths from `md` up are what keep the columns lined up between rows and
// with the header, so header and row must always use the same value here.
const COLUMN = {
  courses: 'md:w-24',
  feedback: 'md:w-24'
}

function DegreeRow({
  degree,
  getHref,
  onSelect
}: {
  degree: DegreeWithCounts
} & Pick<DegreeListingProps, 'getHref' | 'onSelect'>) {
  const { t } = useTranslation('browse')

  return (
    <ListingRow
      href={getHref(degree)}
      onClick={() => onSelect(degree)}
      title={degree.name}
      /* No type chip, unlike <DegreeCard>: the name already opens with
         "Mestrado em" / "Licenciatura em", so the chip only repeated it, and a
         colored badge down every row of a long listing is exactly the noise the
         list view exists to avoid. The type still earns its filter chip. */
      meta={
        <span className="text-xs text-muted-foreground">{degree.acronym}</span>
      }
    >
      <div className="flex items-center gap-3 md:gap-4">
        {/* Both counts spell out their unit on mobile, where the desktop column
            headers they'd otherwise lean on are hidden. */}
        <div
          className={`flex-shrink-0 text-xs text-muted-foreground md:text-right ${COLUMN.courses}`}
        >
          <span className="md:hidden">
            {t('browse_section.course_count', { count: degree.courseCount })}
          </span>
          <span className="hidden md:inline">{degree.courseCount}</span>
        </div>
        <div
          className={`flex-shrink-0 text-xs text-muted-foreground md:text-right ${COLUMN.feedback}`}
        >
          <span className="md:hidden">
            {t('browse_section.feedback_count', {
              count: degree.feedbackCount
            })}
          </span>
          <span className="hidden md:inline">{degree.feedbackCount}</span>
        </div>
      </div>
    </ListingRow>
  )
}

export function DegreeTable({
  degrees,
  getHref,
  onSelect
}: DegreeListingProps) {
  const { t } = useTranslation('browse')

  return (
    <div>
      <ListingHeader title={t('faculty_page.column_degree')}>
        <span className={`text-right ${COLUMN.courses}`}>
          {t('faculty_page.column_courses')}
        </span>
        <span className={`text-right ${COLUMN.feedback}`}>
          {t('faculty_page.column_feedback')}
        </span>
      </ListingHeader>
      {degrees.map((degree) => (
        <DegreeRow
          key={degree.id}
          degree={degree}
          getHref={getHref}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
