import { useTranslation } from 'react-i18next'
import { analytics, type MissingInfoField } from '~/utils/analytics'
import { ERROR_REPORT_EMAIL } from './ReportErrorNote'

/**
 * "Sabes isto? Ajuda-nos a completar", next to a fact we expected and don't
 * have (prds/content_rich_pages.md, "Missing data invites contributions"). The
 * same mailto flow as `ReportErrorNote`, with the field named in the subject.
 * Very subtle on purpose: a gap is never filled with a placeholder, and the
 * prompt must not shout over the data that is there. Several gaps in one place
 * share a single note: pass them all as `field`, and `text` lists them.
 */
export function ContributeNote({
  field,
  text,
  pageName,
  facultySlug,
  degreeSlug,
  className,
  linkText
}: {
  /** One gap, or several sharing this note (named together in the subject) */
  field: MissingInfoField | MissingInfoField[]
  /** What is missing, said plainly ("Língua de ensino: sem informação.") */
  text?: string
  /** For the email subject ("LEIC-A (IST)") */
  pageName: string
  facultySlug?: string | null
  degreeSlug?: string | null
  className?: string
  /** Instead of "Sabes isto? Ajuda-nos a completar", when the ask is specific */
  linkText?: string
}) {
  const { t } = useTranslation('browse')

  const fields = Array.isArray(field) ? field : [field]

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const subject = t('degree_page.contribute.subject', {
      name: pageName,
      field: fields
        .map((f) => t(`degree_page.contribute.field.${f}`))
        .join(', ')
    })
    const body = t('degree_page.contribute.body', { url: window.location.href })
    event.currentTarget.href = `mailto:${ERROR_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    analytics.correction.missingInfoClicked({
      field: fields[0],
      fields,
      facultySlug: facultySlug ?? null,
      degreeSlug: degreeSlug ?? null
    })
  }

  return (
    <p className={`text-sm text-muted-foreground ${className ?? ''}`}>
      {text && <span>{text} </span>}
      <a
        href={`mailto:${ERROR_REPORT_EMAIL}`}
        onClick={handleClick}
        className="underline underline-offset-2 transition-colors hover:text-foreground"
      >
        {linkText ?? t('degree_page.contribute.link')}
      </a>
    </p>
  )
}
