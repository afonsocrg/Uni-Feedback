import { useTranslation } from 'react-i18next'
import { analytics, type ErrorReportSurface } from '~/utils/analytics'

export const ERROR_REPORT_EMAIL = 'afonso@uni-feedback.com'

/**
 * "Spotted a mistake? Let us know" at the foot of a page whose information we
 * curate (degree descriptions, official data). A mailto for now: if the click
 * rate (error_report_clicked over page views) turns out too low to learn from,
 * this becomes an in-page form (see prds/content_rich_pages.md, "Reporting
 * wrong information"). Muted like MissingItemNote, so it never competes with
 * the listing.
 */
export function ReportErrorNote({
  surface,
  pageName,
  facultySlug,
  degreeSlug,
  align = 'center',
  text,
  size = 'sm'
}: {
  surface: ErrorReportSurface
  /** What the page is about, for the email subject ("LEIC-A (IST)") */
  pageName: string
  facultySlug?: string | null
  degreeSlug?: string | null
  /** 'left' inside a section, next to the data it covers */
  align?: 'center' | 'left'
  /** The question before the link, when the default ("Encontraste algum erro?") is too vague */
  text?: string
  /** 'xs' next to a source line, in its size */
  size?: 'sm' | 'xs'
}) {
  const { t } = useTranslation('browse')

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // The page URL is only known in the browser, so the body is built here
    const subject = t('report_error.subject', { name: pageName })
    const body = t('report_error.body', { url: window.location.href })
    event.currentTarget.href = `mailto:${ERROR_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    analytics.correction.errorReportClicked({
      surface,
      facultySlug: facultySlug ?? null,
      degreeSlug: degreeSlug ?? null
    })
  }

  return (
    <p
      className={`${size === 'xs' ? 'text-xs' : 'text-sm'} text-muted-foreground ${align === 'center' ? 'text-center' : 'text-left'}`}
    >
      <span>{text ?? t('report_error.text')} </span>
      <a
        href={`mailto:${ERROR_REPORT_EMAIL}`}
        onClick={handleClick}
        className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
      >
        {t('report_error.link')}
      </a>
    </p>
  )
}
