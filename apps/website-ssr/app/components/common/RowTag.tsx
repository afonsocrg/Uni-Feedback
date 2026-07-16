/**
 * A small tag on a listing entry's secondary line, next to the acronym.
 *
 * Used for facts that qualify an entry without being its identity: the term a
 * course runs in, or that it is a known elective. Muted and uppercase so a
 * column of them stays quiet enough to repeat down a whole listing.
 */
export function RowTag({ label }: { label: string }) {
  return (
    <span className="flex-shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  )
}
