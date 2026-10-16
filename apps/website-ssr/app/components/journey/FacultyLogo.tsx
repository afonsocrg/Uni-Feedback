import { cn } from '~/utils'
import { getAssetUrl } from '~/utils/assets'

/**
 * A university's logo on a white tile, the same treatment as the faculty
 * picker cards: logos are drawn for white, so the tile stays white in dark mode.
 *
 * The full name is the accessible label and tooltip, because the percurso row
 * shows the logo instead of the university name.
 */
export function FacultyLogo({
  logo,
  name,
  shortName,
  size = 'md'
}: {
  logo: string | null | undefined
  name: string
  shortName: string
  size?: 'sm' | 'md'
}) {
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden border border-border bg-white',
        size === 'md' ? 'size-10 rounded-lg p-1' : 'size-5 rounded p-0.5'
      )}
    >
      {logo ? (
        <img
          src={getAssetUrl(logo)}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <span
          className={cn(
            'font-bold text-primaryBlue',
            size === 'md' ? 'text-[11px]' : 'text-[7px]'
          )}
        >
          {shortName.slice(0, 4)}
        </span>
      )}
    </span>
  )
}
