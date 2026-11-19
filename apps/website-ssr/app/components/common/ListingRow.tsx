import type { ReactNode } from 'react'
import { cn } from '~/utils'

/**
 * One row of a compact listing (courses on a degree page, degrees on a faculty
 * page).
 *
 * Rows are flex, not a real `<table>`: on mobile each row stacks (title over
 * columns) instead of scrolling sideways, which a table's columns would force.
 * From `md` up the columns line up because each caller gives its own cells a
 * fixed width; a caller that also renders a `ListingHeader` shares those widths
 * with it.
 *
 * The title line holds only the title, which wraps in full rather than
 * truncating (course names are long, and their ends tell "Álgebra Linear" from
 * "Álgebra Linear e Geometria Analítica"); `meta` is the secondary line (tags)
 * underneath, and `footnote` an aside under everything (a muted note).
 *
 * `stacked` is for a row in a narrow column (a semester of the course browser,
 * side by side with the other on desktop), where a single line would leave the
 * title no room: the title gets its own line, and the columns the second one,
 * from the left edge so they line up down the column, with the meta after
 * them from `md` up.
 *
 * `suffix` follows the title in the same line of text, small and muted (a
 * course's acronym), wrapping with it; `quiet` sets the title in the regular weight, and a step
 * smaller on phones, for long listings where big bold names on every row
 * compete with the section headings.
 */
export function ListingRow({
  href,
  onClick,
  title,
  meta,
  stacked = false,
  suffix,
  quiet = false,
  footnote,
  children
}: {
  href: string
  onClick?: () => void
  title: string
  meta?: ReactNode
  stacked?: boolean
  suffix?: ReactNode
  quiet?: boolean
  footnote?: ReactNode
  children: ReactNode
}) {
  const titleLine = (
    <span
      className={cn(
        'min-w-0 break-words text-foreground',
        quiet ? 'text-sm font-normal md:text-base' : 'font-medium'
      )}
    >
      {title}
      {suffix && (
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  )
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1.5 border-b border-border px-3 py-3 text-inherit no-underline transition-colors last:border-0 hover:bg-muted/50 hover:no-underline',
        stacked
          ? 'md:gap-1 md:py-2'
          : 'md:flex-row md:items-center md:gap-4 md:py-2'
      )}
    >
      {stacked ? (
        <>
          {titleLine}
          <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
            {/* The columns first, so the ratings line up whether a row has
                tags or not */}
            <div className="md:order-first">{children}</div>
            {meta && (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 empty:hidden">
                {meta}
              </div>
            )}
          </div>
          {footnote}
        </>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {titleLine}
            {meta && (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 empty:hidden">
                {meta}
              </div>
            )}
            {footnote}
          </div>
          {children}
        </>
      )}
    </a>
  )
}

/**
 * Desktop-only column headers for a run of `ListingRow`s. Hidden on mobile,
 * where rows stack and there are no columns to label.
 */
export function ListingHeader({
  title,
  children
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="hidden items-center gap-4 border-b border-border px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:flex">
      <span className="flex-1">{title}</span>
      {children}
    </div>
  )
}
