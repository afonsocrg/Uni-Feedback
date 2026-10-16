import type { JourneyDegree } from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import { FacultyLogo } from './FacultyLogo'
import { formatJourneyYears } from './journeyYears'

interface JourneyDegreeRowProps {
  degree: JourneyDegree
  /** The one-time guess: same row, plus a badge and a confirm button. */
  isInferred?: boolean
  isBusy?: boolean
  onConfirm?: () => void
  onEdit: () => void
  onRemove: () => void
}

/**
 * One degree in "O meu percurso": logo, degree name, then its years.
 *
 * The university name lives in the logo's label and tooltip rather than on its
 * own line, so the years can sit right under the degree name.
 */
export function JourneyDegreeRow({
  degree,
  isInferred = false,
  isBusy = false,
  onConfirm,
  onEdit,
  onRemove
}: JourneyDegreeRowProps) {
  const { t } = useTranslation('feedback')
  const years = formatJourneyYears(
    t,
    degree.startSchoolYear,
    degree.endSchoolYear
  )
  const label = degree.degreeAcronym || degree.degreeName

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
      <FacultyLogo
        logo={degree.facultyLogo}
        name={degree.facultyName}
        shortName={degree.facultyShortName}
      />
      <div className="min-w-0 flex-[1_1_14rem]">
        <p className="text-sm font-semibold text-foreground">
          {degree.degreeName}
          {isInferred && (
            <span
              title={t('profile.journey.inferred_hint')}
              className="ml-2 inline-block rounded-full border border-tint-amber-border bg-tint-amber px-2 align-[1px] text-[11px] font-semibold text-tint-amber-fg"
            >
              {t('profile.journey.inferred_badge')}
            </span>
          )}
        </p>
        <p
          className={cn(
            'mt-0.5 text-[13px] tabular-nums',
            years.known
              ? 'font-semibold text-primaryBlue'
              : 'text-muted-foreground'
          )}
        >
          {years.text}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        {isInferred && onConfirm && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={onConfirm}
            className="mr-1 border-primaryBlue text-primaryBlue hover:bg-primaryBlue/10 hover:text-primaryBlue"
          >
            <Check className="size-3.5" />
            {t('profile.journey.confirm')}
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={isBusy}
          onClick={onEdit}
          aria-label={t('profile.journey.edit', { name: label })}
          className="size-8 text-muted-foreground"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={isBusy}
          onClick={onRemove}
          aria-label={
            isInferred
              ? t('profile.journey.not_mine')
              : t('profile.journey.remove', { name: label })
          }
          title={isInferred ? t('profile.journey.not_mine') : undefined}
          className="size-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
