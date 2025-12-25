import { GraduationCap } from 'lucide-react'

interface LogoProps {
  variant?: 'desktop' | 'mobile'
}

export function Logo({ variant = 'desktop' }: LogoProps) {
  const iconSize = variant === 'desktop' ? 'size-8' : 'size-7'
  const textSize = variant === 'desktop' ? 'text-xl' : 'text-lg'

  return (
    <a
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <GraduationCap className={`${iconSize} text-primary`} />
      <span className={`${textSize} font-semibold text-foreground`}>
        Uni Feedback
      </span>
    </a>
  )
}
