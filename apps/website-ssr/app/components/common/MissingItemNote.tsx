/**
 * The "missing something? request it here" note at the foot of a browse page.
 *
 * Deliberately not a `<WarningAlert>`, which these used to be: nothing is
 * wrong, so nothing should be yellow. This is passive footer copy that a
 * student reads only after the listing above it failed them, and it stays
 * muted so the listing keeps their attention. `<WarningAlert>` is reserved for
 * actual warnings, like reviews being out of date.
 */
export function MissingItemNote({
  text,
  linkLabel,
  href
}: {
  /** Omitted when the link alone carries the whole message. */
  text?: string
  linkLabel: string
  href: string
}) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {text && <span>{text} </span>}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
      >
        {linkLabel}
      </a>
    </p>
  )
}
