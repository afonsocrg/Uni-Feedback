import * as React from 'react'
import { cn } from '../utils/cn'

interface ChipProps {
  label: string
  className?: string
  variant?: 'default' | 'secondary' | 'outline'
  color?: ChipColor
  onClick?: () => void
}

// A set of nice, accessible colors that work well together
const CHIP_COLORS = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  orange:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  purple:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  yellow:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  indigo:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  gray: 'bg-muted text-muted-foreground'
} as const

export type ChipColor = keyof typeof CHIP_COLORS

const getColorForLabel = (label: string): ChipColor => {
  // Create a simple hash of the label to get a consistent index
  const hash = label.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)

  // Get array of color keys and use hash to select one
  const colorKeys = Object.keys(CHIP_COLORS).filter(
    (key) => key !== 'gray'
  ) as ChipColor[]
  const index = Math.abs(hash) % colorKeys.length
  return colorKeys[index]
}

function Chip({
  label,
  className,
  variant = 'default',
  color,
  onClick
}: ChipProps) {
  const selectedColor = color ?? getColorForLabel(label)
  const colorClasses = CHIP_COLORS[selectedColor]

  const baseClasses =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors'

  const variantClasses = {
    default: '',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-input bg-background'
  }

  return (
    <span
      className={cn(
        baseClasses,
        variant === 'default' ? colorClasses : variantClasses[variant],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      {label}
    </span>
  )
}

export { Chip }
