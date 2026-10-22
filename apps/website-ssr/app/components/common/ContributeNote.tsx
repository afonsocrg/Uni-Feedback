import { useTranslation } from 'react-i18next'
import { analytics, type MissingInfoField } from '~/utils/analytics'
import { ERROR_REPORT_EMAIL } from './ReportErrorNote'

/**
 * "Sabes isto? Ajuda-nos a completar", next to a fact we expected and don't
 * have (prds/content_rich_pages.md, "Missing data invites contributions"). The
 * same mailto flow as `ReportErrorNote`, with the field named in the subject.
 * Very subtle on purpose: a gap is never filled with a placeholder, and the
 * prompt must not shout over the data that is there.
 */
export function ContributeNote({
  field,
  text,
  pageName,
  facultySlug,
  degreeSlug,
  className
}: {
  field: MissingInfoField
  /** What is missing, said plainly ("Língua de ensino: sem informação.") */
  text?: string
  /** For the email subject ("LEIC-A (IST)") */
  pageName: string
  facultySlug?: string | null
  degreeSlug?: string | null
  className?: string
}) {
  const { t } = useTranslation('browse')

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const subject = t('degree_page.contribute.subject', {
      name: pageName,
      field: t(`degree_page.contribute.field.${field}`)
    })
    const body = t('degree_page.contribute.body', { url: window.location.href })
    event.currentTarget.href = `mailto:${ERROR_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    analytics.correction.missingInfoClicked({
      field,
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
        {t('degree_page.contribute.link')}
      </a>
    </p>
  )
}
