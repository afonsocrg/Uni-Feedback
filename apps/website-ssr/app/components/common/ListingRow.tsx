import type { ReactNode } from 'react'

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
 * The title line holds only the title, so a long one truncates against the row
 * edge rather than against a badge; `meta` is the secondary line (acronym,
 * tags) underneath.
 */
export function ListingRow({
  href,
  onClick,
  title,
  meta,
  children
}: {
  href: string
  onClick?: () => void
  title: string
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex flex-col gap-1.5 border-b border-border px-3 py-3 text-inherit no-underline transition-colors last:border-0 hover:bg-muted/50 hover:no-underline md:flex-row md:items-center md:gap-4 md:py-2"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-foreground">{title}</span>
        {meta && (
          <div className="flex min-w-0 items-center gap-1.5">{meta}</div>
        )}
      </div>
      {children}
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
