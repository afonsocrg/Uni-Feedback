import {
  type JourneyDegree,
  type JourneyDegreeInput,
  MeicFeedbackAPIError
} from '@uni-feedback/api-client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '~/hooks'
import {
  useAddJourneyDegree,
  useDismissInferredDegree,
  useFaculties,
  useRemoveJourneyDegree,
  useUpdateJourneyDegree
} from '~/hooks/queries'
import {
  analytics,
  type JourneyFormMode,
  type JourneySurface
} from '~/utils/analytics'
import type { DegreeFormStep, DegreeFormValues } from './DegreeForm'

/**
 * Which form is open, if any. `inferred` edits the guess before saving it as a
 * new degree; `edit` carries the stored row's id.
 */
export type OpenForm =
  | { mode: 'add' }
  | { mode: 'edit'; degree: JourneyDegree }
  | { mode: 'inferred'; degree: JourneyDegree }
  | null

/**
 * Saving, confirming and dismissing degrees, with the analytics for each.
 *
 * Shared by the profile tab and the chat prompt so both surfaces behave and
 * report identically; only `surface` differs.
 */
export function useDegreeEditor(surface: JourneySurface) {
  const { t } = useTranslation('feedback')
  const { user } = useAuth()
  const { data: faculties = [] } = useFaculties()
  const add = useAddJourneyDegree()
  const update = useUpdateJourneyDegree()
  const remove = useRemoveJourneyDegree()
  const dismiss = useDismissInferredDegree()

  const [form, setForm] = useState<OpenForm>(null)
  const [error, setError] = useState<string | null>(null)

  /** The university of their login email, so most students skip that step. */
  const emailFacultyId =
    faculties.find((f) => f.emailSuffixes?.some((s) => user?.email.endsWith(s)))
      ?.id ?? null

  const initialValues = (open: NonNullable<OpenForm>): DegreeFormValues =>
    open.mode === 'add'
      ? {
          facultyId: emailFacultyId,
          degreeId: null,
          startSchoolYear: null,
          endSchoolYear: null
        }
      : {
          facultyId: open.degree.facultyId,
          degreeId: open.degree.degreeId,
          startSchoolYear: open.degree.startSchoolYear,
          endSchoolYear: open.degree.endSchoolYear
        }

  const openForm = (next: NonNullable<OpenForm>) => {
    setError(null)
    setForm(next)
    analytics.journey.degreeFormOpened({ surface, mode: next.mode })
  }

  const cancelForm = (step: DegreeFormStep) => {
    if (form) {
      analytics.journey.degreeFormCancelled({ surface, mode: form.mode, step })
    }
    setForm(null)
    setError(null)
  }

  const failed = (mode: JourneyFormMode, err: unknown) => {
    const status =
      err instanceof MeicFeedbackAPIError ? (err.status ?? null) : null
    analytics.journey.degreeSaveFailed({ surface, mode, status })
    setError(
      status === 409
        ? t('profile.journey.error_duplicate')
        : status === 400
          ? t('profile.journey.error_years')
          : t('profile.journey.error_generic')
    )
  }

  const submitForm = async (input: JourneyDegreeInput, facultyId: number) => {
    if (!form) return
    const { mode } = form
    try {
      if (form.mode === 'edit' && form.degree.id !== null) {
        await update.mutateAsync({ id: form.degree.id, input })
      } else {
        await add.mutateAsync(input)
      }
      analytics.journey.degreeSaved({
        surface,
        mode,
        degreeId: input.degreeId,
        facultyId,
        hasStartYear: input.startSchoolYear !== null,
        hasEndYear: input.endSchoolYear !== null,
        fromInferred: mode === 'inferred',
        changedInferredDegree:
          form.mode === 'inferred' && form.degree.degreeId !== input.degreeId
      })
      setForm(null)
      setError(null)
      return true
    } catch (err) {
      failed(mode, err)
      return false
    }
  }

  /** "Está certo": save the guess as-is, years included. */
  const confirmInferred = async (degree: JourneyDegree) => {
    const input = {
      degreeId: degree.degreeId,
      startSchoolYear: degree.startSchoolYear,
      endSchoolYear: degree.endSchoolYear
    }
    try {
      await add.mutateAsync(input)
      analytics.journey.inferredConfirmed({
        surface,
        degreeId: degree.degreeId,
        hasStartYear: degree.startSchoolYear !== null
      })
      return true
    } catch (err) {
      failed('inferred', err)
      return false
    }
  }

  /** "Não é o meu curso". */
  const dismissInferred = async (degree: JourneyDegree) => {
    try {
      await dismiss.mutateAsync(undefined)
      analytics.journey.inferredDismissed({
        surface,
        degreeId: degree.degreeId
      })
    } catch {
      setError(t('profile.journey.error_generic'))
    }
  }

  const removeDegree = async (degree: JourneyDegree, remaining: number) => {
    if (degree.id === null) return
    try {
      await remove.mutateAsync(degree.id)
      analytics.journey.degreeRemoved({
        degreeId: degree.degreeId,
        remainingCount: remaining
      })
    } catch {
      setError(t('profile.journey.remove_error'))
    }
  }

  return {
    form,
    error,
    isBusy:
      add.isPending ||
      update.isPending ||
      remove.isPending ||
      dismiss.isPending,
    initialValues,
    openForm,
    cancelForm,
    submitForm,
    confirmInferred,
    dismissInferred,
    removeDegree
  }
}
