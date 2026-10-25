import type { DegreeType } from '@uni-feedback/db/schema'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import type { Lang } from '~/i18n/config'
import { getFacultyTypePath, isFacultyTypePage } from '~/utils/facultyTypePages'
import { formatEur, formatInt } from '../degree/content'
import type { FeeRange } from './types'

/** Type order on every list */
export const TYPE_ORDER: DegreeType[] = [
  'bachelor',
  'integrated_master',
  'master',
  'minor',
  'postgraduate',
  'phd',
  'other'
]

/** The faculty's type page (`/ist/licenciaturas`); null for `other` */
export function getTypePagePath(
  lang: Lang,
  facultySlug: string,
  type: DegreeType
): string | null {
  return isFacultyTypePage(type)
    ? getFacultyTypePath(lang, facultySlug, type)
    : null
}

/** "697 €" / "825 € a 2 500 €", with the period ("por ano") */
export function useFeeText() {
  const { t } = useTranslation('university')
  const lang = useLang()
  return (range: FeeRange) => {
    const amount =
      range.min === range.max
        ? formatEur(range.min, lang)
        : t('page.fees.range', {
            min: formatEur(range.min, lang),
            max: formatEur(range.max, lang)
          })
    const period = t(`page.fees.per.${range.period}`, {
      defaultValue: range.period
    })
    return `${amount} ${period}`
  }
}

/** "Técnico, Letras e Direito" */
export function useJoinList() {
  const { t } = useTranslation('university')
  return (items: string[]) =>
    items.length <= 1
      ? (items[0] ?? '')
      : `${items.slice(0, -1).join(', ')}${t('page.and')}${items.at(-1)}`
}

/** "19 licenciaturas", "1 mestrado integrado" */
export function useTypeCountLabel() {
  const { t } = useTranslation('browse')
  const lang = useLang()
  return (type: DegreeType, count: number) =>
    `${formatInt(count, lang)} ${(count === 1
      ? t(`degree_page.facts.type.${type}`)
      : t(`degree_types.${type}`)
    ).toLowerCase()}`
}
