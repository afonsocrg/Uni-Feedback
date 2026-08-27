import { cn } from '@uni-feedback/ui'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { useLang } from '~/hooks'
import { useTheme } from '~/providers/ThemeProvider'
import { type NavSurface, analytics } from '~/utils/analytics'
import { getEquivalentPath } from '~/utils/i18n-routes'
import type { ThemePreference } from '~/utils/theme'

/**
 * Theme and language used to sit in the navbar as two separate controls. They
 * are set-once preferences, so they now live inside the surfaces you open on
 * purpose (the account popover, the mobile drawer, the footer). These are the
 * shared inline renderings so all three surfaces show the same thing.
 */

interface SegmentedControlProps<T extends string> {
  /** Rendered as the row label to the left of the segments. */
  label: string
  value: T
  options: { value: T; label: React.ReactNode; title: string }[]
  onSelect: (value: T) => void
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onSelect
}: SegmentedControlProps<T>) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5"
      >
        {options.map((option) => {
          const isActive = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              title={option.title}
              onClick={() => onSelect(option.value)}
              className={cn(
                'inline-flex h-7 min-w-8 cursor-pointer items-center justify-center rounded px-2 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface PreferenceControlProps {
  /** Where this control is rendered, so the events stay distinguishable. */
  surface: NavSurface
  isAuthenticated: boolean
}

export function ThemePreferenceControl({
  surface,
  isAuthenticated
}: PreferenceControlProps) {
  const { t } = useTranslation()
  const { preference, setPreference } = useTheme()

  return (
    <SegmentedControl<ThemePreference>
      label={t('nav.theme')}
      value={preference}
      options={[
        {
          value: 'light',
          label: <Sun className="size-4" />,
          title: t('nav.theme_light')
        },
        {
          value: 'dark',
          label: <Moon className="size-4" />,
          title: t('nav.theme_dark')
        },
        {
          value: 'system',
          label: <Monitor className="size-4" />,
          title: t('nav.theme_system')
        }
      ]}
      onSelect={(value) => {
        if (value === preference) return
        setPreference(value)
        analytics.navigation.preferenceChanged({
          preference: 'theme',
          value,
          surface,
          isAuthenticated
        })
      }}
    />
  )
}

export function LanguagePreferenceControl({
  surface,
  isAuthenticated
}: PreferenceControlProps) {
  const { t } = useTranslation()
  const lang = useLang()
  const location = useLocation()
  const navigate = useNavigate()

  // Switching language means navigating to the equivalent path in the other
  // locale, not flipping a client-side flag: the URL *is* the language.
  const targetPath = getEquivalentPath(
    location.pathname + location.search,
    lang
  )

  return (
    <SegmentedControl
      label={t('nav.language')}
      value={lang}
      options={[
        { value: 'pt', label: 'PT', title: 'Português' },
        { value: 'en', label: 'EN', title: 'English' }
      ]}
      onSelect={(value) => {
        if (value === lang) return
        analytics.navigation.preferenceChanged({
          preference: 'language',
          value,
          surface,
          isAuthenticated
        })
        navigate(targetPath)
      }}
    />
  )
}
