import { Badge } from '../shadcn/badge'

// Each chip color maps to a hue in the shared tint scale (see style.css).
// bg + text + border together, so chips theme correctly in light and dark.
const CHIP_COLORS = {
  blue: 'bg-tint-blue text-tint-blue-fg border-tint-blue-border',
  green: 'bg-tint-green text-tint-green-fg border-tint-green-border',
  orange: 'bg-tint-orange text-tint-orange-fg border-tint-orange-border',
  purple: 'bg-tint-purple text-tint-purple-fg border-tint-purple-border',
  red: 'bg-tint-red text-tint-red-fg border-tint-red-border',
  cyan: 'bg-tint-cyan text-tint-cyan-fg border-tint-cyan-border',
  'light-green': 'bg-tint-lime text-tint-lime-fg border-tint-lime-border',
  amber: 'bg-tint-amber text-tint-amber-fg border-tint-amber-border',
  'deep-purple': 'bg-tint-violet text-tint-violet-fg border-tint-violet-border',
  indigo: 'bg-tint-indigo text-tint-indigo-fg border-tint-indigo-border',
  gray: 'bg-tint-gray text-tint-gray-fg border-tint-gray-border'
} as const

export type ChipColor = keyof typeof CHIP_COLORS

/**
 * The assignable hues, in an order where neighbouring entries are also distant
 * hues. Callers colouring a *sequence* (terms along a timeline, say) can walk
 * this and trust that adjacent items stay told apart; `getColorForLabel` cannot
 * promise that, since a hash has no idea what sits next to what. Excludes gray,
 * which is reserved for callers that ask for it by name.
 */
export const CHIP_COLOR_KEYS = Object.keys(CHIP_COLORS).filter(
  (key) => key !== 'gray'
) as ChipColor[]

export const getColorForLabel = (label: string): string => {
  // Create a simple hash of the label to get a consistent index
  const hash = label.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)

  const index = Math.abs(hash) % CHIP_COLOR_KEYS.length
  return CHIP_COLORS[CHIP_COLOR_KEYS[index]]
}

export type ChipSize = 'xs' | 'sm' | 'md' | 'lg'

const CHIP_SIZE_CLASSES = {
  xs: 'text-xs px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
}

interface ChipProps {
  label: string
  className?: string
  color?: ChipColor
  size?: ChipSize
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function Chip({
  label,
  className = '',
  color,
  size = 'sm',
  onClick
}: ChipProps) {
  const colorClass = color ? CHIP_COLORS[color] : getColorForLabel(label)
  const sizeClasses = CHIP_SIZE_CLASSES[size]

  return (
    <Badge
      variant="outline"
      className={`${sizeClasses} ${colorClass} ${className}`}
      onClick={onClick}
    >
      {label}
    </Badge>
  )
}
