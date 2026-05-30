import { Link, useLocation } from 'react-router'
import { useLang } from '~/hooks'
import { getEquivalentPath } from '~/utils/i18n-routes'

export function LanguageSwitcher() {
  const location = useLocation()
  const lang = useLang()
  const targetPath = getEquivalentPath(
    location.pathname + location.search,
    lang
  )

  const active = 'text-foreground'
  const inactive =
    'text-muted-foreground hover:text-foreground transition-colors'

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {lang === 'pt' ? (
        <span className={active}>PT</span>
      ) : (
        <Link
          to={targetPath}
          className={inactive}
          aria-label="Mudar para Português"
        >
          PT
        </Link>
      )}
      <span className="text-muted-foreground">|</span>
      {lang === 'en' ? (
        <span className={active}>EN</span>
      ) : (
        <Link
          to={targetPath}
          className={inactive}
          aria-label="Switch to English"
        >
          EN
        </Link>
      )}
    </div>
  )
}
