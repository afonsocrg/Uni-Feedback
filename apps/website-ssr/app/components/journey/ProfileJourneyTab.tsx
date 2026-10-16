import { Skeleton } from '@uni-feedback/ui'
import { Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useJourneyDot } from '~/hooks'
import { useJourney } from '~/hooks/queries'
import { analytics } from '~/utils/analytics'
import { DegreeForm } from './DegreeForm'
import { JourneyDegreeRow } from './JourneyDegreeRow'
import { useDegreeEditor } from './useDegreeEditor'

/**
 * "O meu percurso": the student's degrees.
 *
 * v1 is the degree list only. Each degree is the root that semesters, courses
 * and "por avaliar" will hang under later, which is why it is a tab of its own
 * rather than a field on the identity row.
 */
export function ProfileJourneyTab() {
  const { t } = useTranslation('feedback')
  const { data, isLoading } = useJourney()
  const { showDot, isReady: dotReady, markSeen } = useJourneyDot()
  const editor = useDegreeEditor('profile')
  const tracked = useRef(false)

  // One view event per mount, carrying whether the menu dot was still unseen:
  // that is how we learn whether the dot brings anyone here. Then clear it.
  useEffect(() => {
    if (!data || !dotReady || tracked.current) return
    tracked.current = true
    analytics.journey.viewed({
      degreeCount: data.degrees.length,
      hasInferred: data.inferred !== null,
      fromDot: showDot
    })
    markSeen()
  }, [data, dotReady, showDot, markSeen])

  const degrees = data?.degrees ?? []
  const inferred = data?.inferred ?? null
  const { form } = editor

  const formFor = (key: 'add' | number | 'inferred') =>
    form &&
    ((key === 'add' && form.mode === 'add') ||
      (key === 'inferred' && form.mode === 'inferred') ||
      (form.mode === 'edit' && form.degree.id === key))

  const renderForm = () =>
    form && (
      <DegreeForm
        key={
          form.mode === 'add' ? 'add' : `${form.mode}-${form.degree.degreeId}`
        }
        initial={editor.initialValues(form)}
        submitLabel={
          form.mode === 'edit'
            ? t('profile.journey.save_edit')
            : t('profile.journey.save_add')
        }
        isSubmitting={editor.isBusy}
        error={editor.error}
        onSubmit={editor.submitForm}
        onCancel={editor.cancelForm}
      />
    )

  return (
    <section className="flex flex-col gap-3">
      <p className="max-w-prose text-sm text-muted-foreground">
        {t('profile.journey.why')}
      </p>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="flex flex-col gap-2">
          {degrees.map((degree) =>
            formFor(degree.id as number) ? (
              <div
                key={degree.id}
                className="rounded-lg border border-primaryBlue p-3"
              >
                {renderForm()}
              </div>
            ) : (
              <JourneyDegreeRow
                key={degree.id}
                degree={degree}
                isBusy={editor.isBusy}
                onEdit={() => editor.openForm({ mode: 'edit', degree })}
                onRemove={() => editor.removeDegree(degree, degrees.length - 1)}
              />
            )
          )}

          {inferred &&
            (formFor('inferred') ? (
              <div className="rounded-lg border border-primaryBlue p-3">
                {renderForm()}
              </div>
            ) : (
              <JourneyDegreeRow
                degree={inferred}
                isInferred
                isBusy={editor.isBusy}
                onConfirm={() => editor.confirmInferred(inferred)}
                onEdit={() =>
                  editor.openForm({ mode: 'inferred', degree: inferred })
                }
                onRemove={() => editor.dismissInferred(inferred)}
              />
            ))}

          {formFor('add') ? (
            <div className="flex flex-col gap-3 rounded-lg border-[1.5px] border-dashed border-primaryBlue p-3">
              <p className="text-sm font-semibold">
                {t('profile.journey.add')}
              </p>
              {renderForm()}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => editor.openForm({ mode: 'add' })}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-[1.5px] border-dashed border-border p-3 text-left transition-colors hover:border-primaryBlue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primaryBlue"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primaryBlue">
                <Plus className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {t('profile.journey.add')}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t('profile.journey.add_hint')}
                </span>
              </span>
            </button>
          )}

          {/* Errors from actions outside an open form (confirm, remove). */}
          {editor.error && !form && (
            <p role="alert" className="text-sm text-destructive">
              {editor.error}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
