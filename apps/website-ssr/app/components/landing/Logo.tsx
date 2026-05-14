import { GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocalePath, type Lang } from '~/utils/i18n-routes'

interface LogoProps {
  variant?: 'desktop' | 'mobile'
}

export function Logo({ variant = 'desktop' }: LogoProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language as Lang

  const iconSize = variant === 'desktop' ? 'size-8' : 'size-7'
  const textSize = variant === 'desktop' ? 'text-xl' : 'text-lg'

  return (
    <a
      href={getLocalePath('home', lang)}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <GraduationCap className={`${iconSize} text-primary`} />
      <span className={`${textSize} font-semibold text-foreground`}>
        Uni Feedback
      </span>
    </a>
  )
}
