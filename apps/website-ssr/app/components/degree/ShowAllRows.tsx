import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * Under a year-by-year table cut to its most recent rows: "Mostrar todos os
 * anos (22)" / "Mostrar menos". The table decides how many rows it keeps.
 */
export function ShowAllRows({
  total,
  expanded,
  onToggle
}: {
  total: number
  expanded: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation('browse')
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primaryBlue hover:underline"
    >
      {expanded
        ? t('degree_subpages.admission.table.show_less')
        : t('degree_subpages.admission.table.show_all', { count: total })}
      <ChevronDown
        aria-hidden="true"
        className={expanded ? 'size-4 rotate-180' : 'size-4'}
      />
    </button>
  )
}
