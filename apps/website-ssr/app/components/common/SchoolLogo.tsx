import { cn } from '@uni-feedback/ui'
import { getAssetUrl } from '~/utils/assets'

/**
 * A university's or faculty's square logo (its `logo` column, a CDN path), on
 * a neutral tile so transparent logos read in dark mode too. Without a logo,
 * the short name's initials stand in. The image is decorative next to the
 * school's name, so the alt text only names it for when it is shown alone.
 */
export function SchoolLogo({
  logo,
  name,
  shortName,
  size = 'md',
  className
}: {
  logo: string | null
  name: string
  shortName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const box = {
    sm: 'size-9 rounded-md text-xs',
    md: 'size-12 rounded-lg text-sm',
    lg: 'size-16 rounded-xl text-base'
  }[size]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden border border-border font-bold',
        logo ? 'bg-logo-tile' : 'bg-muted text-muted-foreground',
        box,
        className
      )}
    >
      {logo ? (
        <img
          src={getAssetUrl(logo)}
          alt={name}
          loading="lazy"
          className="size-full object-contain"
        />
      ) : (
        <span aria-hidden="true">
          {shortName.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 4)}
        </span>
      )}
    </span>
  )
}
