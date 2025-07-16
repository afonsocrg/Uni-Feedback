import { MeicFeedbackAPIError } from '@/services/meicFeedbackAPI'
import {
  GiveReviewForm7,
  GiveReviewProps,
  ReviewSubmitSuccess
} from '@components'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useDegreeCourses,
  useFaculties,
  useFacultyDegrees,
  useSelectedFacultyDegree,
  useSubmitFeedback
} from '@hooks'
import { getCurrentSchoolYear } from '@lib/schoolYear'
import { getCourse, getFeedbackDraft } from '@services/meicFeedbackAPI'
import { STORAGE_KEYS } from '@utils'
import posthog from 'posthog-js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { formSchema, requiredFields } from './schema'

export type GiveReviewFormValues = z.infer<typeof formSchema>

export function GiveReview() {
  const navigate = useNavigate()
  const { faculty: contextFaculty, degree: contextDegree } =
    useSelectedFacultyDegree()
  const selectedFacultyId = contextFaculty?.id ?? null
  const selectedDegreeId = contextDegree?.id ?? null
  const submitFeedbackMutation = useSubmitFeedback()
  const { data: faculties } = useFaculties()

  const [searchParams] = useSearchParams()
  const schoolYears = useMemo(
    () => Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )
  const initialValues = useMemo(
    () =>
      getInitialValues(
        searchParams,
        selectedFacultyId,
        selectedDegreeId,
        schoolYears
      ),
    [searchParams, selectedFacultyId, selectedDegreeId, schoolYears]
  )

  // By default, the available courses are the ones from the currently selected degree
  // If the URL specifies a courseId and that course does not exist in the set of selected courses
  // then we want to load all the courses from that degree.
  // If there is no degree selected (1), we set the degree of the selected course as the selected degree
  // (1) WARNING: we have to check if there is no degree selected using the selectedDegreeId
  // property, because when the page is loading, we may have a selected degree, but not a
  // degree object yet!!

  const form = useForm<GiveReviewFormValues, any, GiveReviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: initialValues.email,
      schoolYear: initialValues.schoolYear,
      facultyId: initialValues.facultyId,
      degreeId: initialValues.degreeId,
      courseId: initialValues.courseId,
      rating: initialValues.rating,
      workloadRating: initialValues.workloadRating,
      comment: initialValues.comment
    }
  })

  const formValues = form.watch()
  const localFacultyId = formValues.facultyId
  const localDegreeId = formValues.degreeId

  const { data: localDegrees } = useFacultyDegrees(localFacultyId)
  const { data: localCourses } = useDegreeCourses(localDegreeId)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoadingFormData, setIsLoadingFormData] = useState(false)

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
      setIsLoadingFormData(true)
      ;(async () => {
        try {
          const courseDetails = await getCourse(initialValues.courseId)
          // setLocalDegreeId(courseDetails.degreeId)
          form.setValue('degreeId', courseDetails.degreeId)
          if (courseDetails.degree) {
            form.setValue('facultyId', courseDetails.degree.facultyId)
          }
        } finally {
          setIsLoadingFormData(false)
        }
      })()
    }
  }, [
    form,
    initialValues.courseId,
    localFacultyId,
    localDegreeId,
    localCourses,
    initialValues
  ])

  // Handle feedback draft codes
  const appliedFeedbackDraft = useRef(false)
  useEffect(() => {
    const draftCode = searchParams.get('code')
    if (!draftCode || appliedFeedbackDraft.current) return

    appliedFeedbackDraft.current = true
    setIsLoadingFormData(true)
    ;(async () => {
      try {
        const draftData = await getFeedbackDraftData(draftCode)
        if (draftData) {
          if (draftData.rating) form.setValue('rating', draftData.rating)
          if (draftData.workloadRating)
            form.setValue('workloadRating', draftData.workloadRating)
          if (draftData.comment) form.setValue('comment', draftData.comment)
        }
      } finally {
        setIsLoadingFormData(false)
      }
    })()
  }, [form, searchParams])

  // Check if all required fields are filled
  const isFormValid = useMemo(() => {
    if (!formSchema || requiredFields.length === 0) return true

    return requiredFields.every((field) => {
      const value = formValues[field as keyof typeof formValues]

      // Special handling for different field types
      if (field === 'email') {
        return typeof value === 'string' && value.trim() !== ''
      }
      if (field === 'degreeId') {
        return (
          typeof value === 'number' &&
          value > 0 &&
          localDegrees?.some((d) => d.id === value)
        )
      }
      if (field === 'courseId') {
        return (
          typeof value === 'number' &&
          value > 0 &&
          localCourses?.some((c) => c.id === value)
        )
      }
      if (field === 'rating' || field === 'workloadRating') {
        return typeof value === 'number' && value > 0
      }
      if (field === 'schoolYear') {
        return typeof value === 'number' && value > 0
      }

      // Default check for other fields
      return value !== undefined && value !== null && value !== ''
    })
  }, [formValues, localDegrees, localCourses])

  async function onSubmit(values: GiveReviewFormValues) {
    // Store email and degree id in local storage for next time
    localStorage.setItem(STORAGE_KEYS.FEEDBACK_EMAIL, values.email)
    if (localFacultyId) {
      localStorage.setItem(
        STORAGE_KEYS.FEEDBACK_FACULTY_ID,
        localFacultyId.toString()
      )
    } else {
      console.error('No local faculty id')
    }
    if (localDegreeId) {
      localStorage.setItem(
        STORAGE_KEYS.FEEDBACK_DEGREE_ID,
        localDegreeId.toString()
      )
    } else {
      console.error('No local degree id')
    }

    // Validate that degree belongs to the selected faculty
    if (localFacultyId && localDegrees && values.degreeId) {
      if (!localDegrees.some((d) => d.id === values.degreeId)) {
        form.setError('degreeId', {
          message: 'Please select a degree'
        })
        return
      }
    }

    // Check if courseId is a valid course for the selected degree
    if (!localCourses || !localCourses.some((c) => c.id === values.courseId)) {
      form.setError('courseId', {
        message: 'Please select a course'
      })
      return
    }

    // Validate email suffix against selected faculty
    if (localFacultyId && faculties) {
      const selectedFaculty = faculties.find((f) => f.id === localFacultyId)
      if (
        selectedFaculty?.emailSuffixes &&
        selectedFaculty.emailSuffixes.length > 0
      ) {
        const isValidEmail = selectedFaculty.emailSuffixes.some((suffix) =>
          values.email.endsWith(suffix)
        )
        if (!isValidEmail) {
          form.setError('email', {
            message: 'Please enter your university email address'
          })
          return
        }
      }
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
          schema: formSchema,
          localFacultyId,
          isFormValid,
          isLoadingFormData
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
  selectedFacultyId: number | null,
  selectedDegreeId: number | null,
  schoolYears: number[]
) {
  const email =
    searchParams.get('email') ||
    localStorage.getItem(STORAGE_KEYS.FEEDBACK_EMAIL) ||
    ''
  const schoolYear = (() => {
    const year = Number(searchParams.get('schoolYear'))
    return schoolYears.includes(year) ? year : getCurrentSchoolYear()
  })()

  const facultyId = selectedFacultyId ?? 0
  // Number(localStorage.getItem(STORAGE_KEYS.FEEDBACK_FACULTY_ID))

  const degreeId = selectedDegreeId ?? 0
  // Number(localStorage.getItem(STORAGE_KEYS.FEEDBACK_DEGREE_ID))

  const courseId = Number(searchParams.get('courseId')) || 0
  const rating = getRatingValue(searchParams.get('rating'))
  const workloadRating = getRatingValue(searchParams.get('workloadRating'))
  const comment = decodeURIComponent(searchParams.get('comment') || '')

  return {
    email,
    schoolYear,
    facultyId,
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
function GiveReviewForm({ ...props }: GiveReviewFormProps) {
  return <GiveReviewForm7 {...props} />
  // switch (version) {
  // case '1':
  //   return <GiveReviewForm1 {...props} />
  // case '2':
  //   return <GiveReviewForm2 {...props} />
  // case '3':
  //   return <GiveReviewForm3 {...props} />
  // case '4':
  //   return <GiveReviewForm4 {...props} />
  // case '5':
  //   return <GiveReviewForm5 {...props} />
  // case '6':
  //   return <GiveReviewForm6 {...props} />
  // default:
  //   return <GiveReviewForm7 {...props} />
  // }
}
