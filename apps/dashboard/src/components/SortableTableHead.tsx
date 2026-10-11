import { cn, TableHead } from '@uni-feedback/ui'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { SortDirection } from '../hooks/useTableSort'

interface SortableTableHeadProps<K extends string> extends Omit<
  ComponentProps<typeof TableHead>,
  'onClick' | 'onToggle' | 'align' | 'children'
> {
  /** The column this header sorts; passed back to `onToggle`. */
  sortKey: K
  /** The column's current direction, or null when it is not the active sort. */
  direction: SortDirection | null
  onToggle: (key: K) => void
  /** Right-align the label (counts, costs). Default left. */
  align?: 'left' | 'right'
  children: React.ReactNode
}

/**
 * A table header that sorts its column. Shows a faint two-way arrow when the
 * column is not sorted, and a solid arrow for the active direction, so the
 * current order is always visible. Pair with `useTableSort`.
 */
export function SortableTableHead<K extends string>({
  sortKey,
  direction,
  onToggle,
  align = 'left',
  className,
  children,
  ...rest
}: SortableTableHeadProps<K>) {
  const Icon =
    direction === 'asc'
      ? ArrowUp
      : direction === 'desc'
        ? ArrowDown
        : ArrowUpDown

  return (
    <TableHead
      aria-sort={
        direction === 'asc'
          ? 'ascending'
          : direction === 'desc'
            ? 'descending'
            : 'none'
      }
      className={cn('p-0', className)}
      {...rest}
    >
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={cn(
          'flex h-full w-full items-center gap-1 px-2 py-2 font-medium hover:text-foreground',
          align === 'right' && 'flex-row-reverse text-right',
          direction ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <span>{children}</span>
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            direction ? 'opacity-100' : 'opacity-40'
          )}
        />
      </button>
    </TableHead>
  )
}
