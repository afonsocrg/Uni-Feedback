interface ChipProps {
  label: string
  className?: string
  onClick?: () => void
}

// A set of nice, accessible colors that work well together
const CHIP_COLORS = {
  blue: { bg: '#E3F2FD', text: '#1976D2' },
  green: { bg: '#E8F5E9', text: '#2E7D32' },
  orange: { bg: '#FFF3E0', text: '#E65100' },
  purple: { bg: '#F3E5F5', text: '#7B1FA2' },
  red: { bg: '#FFEBEE', text: '#C62828' },
  cyan: { bg: '#E0F7FA', text: '#00838F' },
  'light-green': { bg: '#F1F8E9', text: '#558B2F' },
  amber: { bg: '#FFF8E1', text: '#F57F17' },
  'deep-purple': { bg: '#EDE7F6', text: '#4527A0' },
  indigo: { bg: '#E8EAF6', text: '#283593' },
  gray: { bg: '#F3F4F6', text: '#6B7280' }
}

export type ChipColor = keyof typeof CHIP_COLORS

const getColorForLabel = (label: string) => {
  // Create a simple hash of the label to get a consistent index
  const hash = label.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)

  // Get array of color keys and use hash to select one
  const colorKeys = Object.keys(CHIP_COLORS).filter(
    (key) => key !== 'gray'
  ) as ChipColor[]
  const index = Math.abs(hash) % colorKeys.length
  return CHIP_COLORS[colorKeys[index]]
}

interface ChipProps {
  label: string
  className?: string
  color?: ChipColor
  onClick?: () => void
}

export function Chip({ label, className = '', color, onClick }: ChipProps) {
  const { bg, text } = color ? CHIP_COLORS[color] : getColorForLabel(label)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: bg, color: text }}
      onClick={onClick}
    >
      {label}
    </span>
  )
}
