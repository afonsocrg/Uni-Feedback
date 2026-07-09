import { cn } from '~/utils'

export interface FeedbackHistogramRow {
  label: string
  count: number
}

export interface FeedbackHistogramProps {
  /** Rows in display order: the topmost row comes first. */
  rows: FeedbackHistogramRow[]
  /** Width/alignment of the label column, which differs per histogram. */
  labelClassName?: string
  className?: string
}

/**
 * Google-reviews style breakdown. Bars are scaled against the most-voted row,
 * which is always drawn full width.
 */
export function FeedbackHistogram({
  rows,
  labelClassName,
  className
}: FeedbackHistogramProps) {
  const maxCount = Math.max(...rows.map((r) => r.count))
  if (maxCount === 0) return null

  return (
    <div className={cn('space-y-1', className)}>
      {rows.map((row) => {
        const percentage = (row.count / maxCount) * 100
        return (
          <div key={row.label} className="flex items-center gap-2">
            <span
              className={cn(
                'shrink-0 text-[11px] leading-none text-muted-foreground',
                labelClassName
              )}
            >
              {row.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-muted-foreground/35"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-5 shrink-0 text-right text-[11px] leading-none tabular-nums text-muted-foreground">
              {row.count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
