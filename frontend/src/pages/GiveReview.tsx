import { MeicFeedbackAPIError } from '@/services/meicFeedbackAPI'
import {
  GiveReviewForm1,
  GiveReviewForm2,
  GiveReviewForm3,
  GiveReviewForm4,
  // GiveReviewForm5,
  GiveReviewForm6,
  GiveReviewForm7,
  GiveReviewProps,
  ReviewSubmitSuccess
} from '@components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useApp, useDegreeCourses, useSubmitFeedback } from '@hooks'
import { getCurrentSchoolYear } from '@lib/schoolYear'
import { getCourse, getFeedbackDraft } from '@services/meicFeedbackAPI'
import posthog from 'posthog-js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  email: z
    .string()
    .email()
    .refine(
      (email) =>
        email.endsWith('@tecnico.ulisboa.pt') ||
        email.endsWith('@ist.utl.pt') ||
        email.endsWith('@novasbe.pt'),
      'Please enter your university email address'
    ),
  schoolYear: z.number().min(2020).max(3050),
  degreeId: z.number().optional(),
  courseId: z.number(),
  rating: z.number().min(0).max(5),
  workloadRating: z.number().min(0).max(5),
  comment: z.string().min(0).optional()
})

const FEEDBACK_EMAIL_STORAGE_KEY = 'lastFeedbackEmail'
const FEEDBACK_DEGREE_ID_STORAGE_KEY = 'lastFeedbackDegreeId'

export type GiveReviewFormValues = z.infer<typeof formSchema>

export function GiveReview() {
  const navigate = useNavigate()
  const { selectedDegreeId, selectedDegree: contextDegree } = useApp()
  const submitFeedbackMutation = useSubmitFeedback()

  const [searchParams] = useSearchParams()
  const schoolYears = useMemo(
    () => Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )
  const initialValues = useMemo(
    () => getInitialValues(searchParams, selectedDegreeId, schoolYears),
    [searchParams, selectedDegreeId, schoolYears]
  )

  // By default, the available courses are the ones from the currently selected degree
  // If the URL specifies a courseId and that course does not exist in the set of selected courses
  // then we want to load all the courses from that degree.
  // If there is no degree selected (1), we set the degree of the selected course as the selected degree
  // (1) WARNING: we have to check if there is no degree selected using the selectedDegreeId
  // property, because when the page is loading, we may have a selected degree, but not a
  // degree object yet!!
  // const [localDegreeId, setLocalDegreeId] = useState<number | null>(
  //   selectedDegreeId ||
  //     Number(localStorage.getItem(FEEDBACK_DEGREE_ID_STORAGE_KEY)) ||
  //     null
  // )

  const form = useForm<GiveReviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: initialValues.email,
      schoolYear: initialValues.schoolYear,
      degreeId: initialValues.degreeId,
      courseId: initialValues.courseId,
      rating: initialValues.rating,
      workloadRating: initialValues.workloadRating,
      comment: initialValues.comment
    }
  })

  const localDegreeId = form.watch('degreeId')

  const { data: localCourses } = useDegreeCourses(localDegreeId)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const formVersion = searchParams.get('version')
  const selectedCourseId = form.watch('courseId')
  const selectedCourse = useMemo(
    () => localCourses?.find((c) => c.id === selectedCourseId) ?? null,
    [selectedCourseId, localCourses]
  )

  const appliedSearchCourseId = useRef(false)
  useEffect(() => {
    if (
      appliedSearchCourseId.current ||
      !initialValues.courseId ||
      (localCourses &&
        localCourses.find((c) => c.id === initialValues.courseId))
    ) {
      return
    } else {
      appliedSearchCourseId.current = true
      ;(async () => {
        const courseDetails = await getCourse(initialValues.courseId)
        // setLocalDegreeId(courseDetails.degreeId)
        form.setValue('degreeId', courseDetails.degreeId)
      })()
    }
  }, [form, initialValues.courseId, localCourses])

  // Handle feedback draft codes
  const appliedFeedbackDraft = useRef(false)
  useEffect(() => {
    const draftCode = searchParams.get('code')
    if (!draftCode || appliedFeedbackDraft.current) return

    appliedFeedbackDraft.current = true
    ;(async () => {
      const draftData = await getFeedbackDraftData(draftCode)
      if (draftData) {
        if (draftData.rating) form.setValue('rating', draftData.rating)
        if (draftData.workloadRating)
          form.setValue('workloadRating', draftData.workloadRating)
        if (draftData.comment) form.setValue('comment', draftData.comment)
      }
    })()
  }, [form, searchParams])

  async function onSubmit(values: GiveReviewFormValues) {
    // Store email and degree id in local storage for next time
    localStorage.setItem(FEEDBACK_EMAIL_STORAGE_KEY, values.email)
    if (localDegreeId) {
      localStorage.setItem(
        FEEDBACK_DEGREE_ID_STORAGE_KEY,
        localDegreeId.toString()
      )
    } else {
      console.error('No local degree id')
    }

    // Check if courseId is a valid course
    if (!localCourses || !localCourses.some((c) => c.id === values.courseId)) {
      form.setError('courseId', {
        message: 'Please select a valid course'
      })
      return
    }

    setIsSubmitting(true)
    try {
      await submitFeedbackMutation.mutateAsync(values)
      setIsSuccess(true)
      toast.success('Feedback submitted successfully')
      posthog.capture('review_form_submit', {
        courseId: values.courseId,
        degreeId: localDegreeId,
        schoolYear: values.schoolYear,
        rating: values.rating,
        workloadRating: values.workloadRating
      })
    } catch (err) {
      if (err instanceof MeicFeedbackAPIError) {
        toast.error(err.message)
      } else {
        console.error(err)
        toast.error('Failed to submit feedback')
      }
    }

    setIsSubmitting(false)
  }

  if (isSuccess) {
    return (
      <ReviewSubmitSuccess
        selectedCourse={selectedCourse}
        onNewReview={() => {
          setIsSuccess(false)
          form.setValue('courseId', 0)
          form.setValue('workloadRating', 0)
          form.setValue('rating', 0)
          form.setValue('comment', '')
        }}
        onBackToCourses={() => navigate('/')}
      />
    )
  }

  return (
    <>
      <GiveReviewForm
        {...{
          version: formVersion,
          form,
          courses: localCourses ?? [],
          schoolYears,
          isSubmitting,
          onSubmit,
          localDegreeId: localDegreeId ?? null,
          // setLocalDegreeId,
          contextDegree,
          schema: formSchema
        }}
      />
    </>
  )
}

function getRatingValue(searchValue: string | null) {
  if (!searchValue) return undefined
  const value = Number(searchValue)
  if (isNaN(value)) return undefined
  return 1 <= value && value <= 5 ? value : undefined
}

function getInitialValues(
  searchParams: URLSearchParams,
  selectedDegreeId: number | null,
  schoolYears: number[]
) {
  const email =
    searchParams.get('email') ||
    localStorage.getItem(FEEDBACK_EMAIL_STORAGE_KEY) ||
    ''
  const schoolYear = (() => {
    const year = Number(searchParams.get('schoolYear'))
    return schoolYears.includes(year) ? year : getCurrentSchoolYear()
  })()
  const degreeId = selectedDegreeId ?? 0
  const courseId = Number(searchParams.get('courseId')) || 0
  const rating = getRatingValue(searchParams.get('rating'))
  const workloadRating = getRatingValue(searchParams.get('workloadRating'))
  const comment = decodeURIComponent(searchParams.get('comment') || '')

  return {
    email,
    schoolYear,
    degreeId,
    courseId,
    rating,
    workloadRating,
    comment
  }
}

async function getFeedbackDraftData(code: string) {
  try {
    const data = await getFeedbackDraft(code)
    return {
      rating: data.rating,
      workloadRating: data.workloadRating,
      comment: data.comment || ''
    }
  } catch (error) {
    console.error('Failed to load feedback draft data:', error)
    toast.error('Failed to load feedback draft data')
    return null
  }
}

interface GiveReviewFormProps extends GiveReviewProps {
  version: string | null
}
function GiveReviewForm({ version, ...props }: GiveReviewFormProps) {
  switch (version) {
    case '1':
      return <GiveReviewForm1 {...props} />
    case '2':
      return <GiveReviewForm2 {...props} />
    case '3':
      return <GiveReviewForm3 {...props} />
    case '4':
      return <GiveReviewForm4 {...props} />
    // case '5':
    //   return <GiveReviewForm5 {...props} />
    case '6':
      return <GiveReviewForm6 {...props} />
    default:
      return <GiveReviewForm7 {...props} />
  }
}
