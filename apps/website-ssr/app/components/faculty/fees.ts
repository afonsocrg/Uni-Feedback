import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { formatEur } from '../degree/content'
import type { DegreeFeeSummary } from './types'

/** "697 € por ano", "11 900 € pelo curso completo" */
export function useFeeText(): (fee: DegreeFeeSummary) => string {
  const { t } = useTranslation('browse')
  const lang = useLang()
  return (fee) =>
    `${formatEur(fee.amountEur, lang)} ${t(`degree_page.fees.period.${fee.period}`, { defaultValue: '' })}`.trim()
}
