import { useTranslation } from 'react-i18next'
import type { Lang } from '~/i18n/config'

export function useLang(): Lang {
  const { i18n } = useTranslation()
  return i18n.language as Lang
}
