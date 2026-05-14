import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import type { Lang } from '~/i18n/config'
import { getEquivalentPath } from '~/utils/i18n-routes'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const lang = i18n.language as Lang
  const targetLang: Lang = lang === 'pt' ? 'en' : 'pt'
  const targetPath = getEquivalentPath(
    location.pathname + location.search,
    lang
  )

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <span
        className={lang === 'pt' ? 'text-foreground' : 'text-muted-foreground'}
      >
        PT
      </span>
      <span className="text-muted-foreground">|</span>
      <Link
        to={targetPath}
        className={
          lang === 'en'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground transition-colors'
        }
        aria-label={`Switch to ${targetLang === 'en' ? 'English' : 'Português'}`}
      >
        EN
      </Link>
    </div>
  )
}
