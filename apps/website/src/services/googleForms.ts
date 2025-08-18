import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { CourseDetail } from './meicFeedbackAPI'

export const getCourseNameForForm = (course: CourseDetail): string => {
  return `${course.acronym} - ${course.name}`
}

export const getCourseFeedbackFormUrl = (course: CourseDetail): string => {
  const url = new URL(
    'https://docs.google.com/forms/d/e/1FAIpQLSe3ptJwi8uyQfXI8DUmi03dwRL0m7GJa1bMU_6mJpobmXl8NQ/viewform?usp=pp_url'
  )
  url.searchParams.set(
    'entry.1483270244',
    formatSchoolYearString(getCurrentSchoolYear(), { yearFormat: 'long' })
  )
  url.searchParams.set('entry.742852873', getCourseNameForForm(course))
  return url.toString()
}

export const getEditCourseFormUrl = (
  course: CourseDetail,
  fieldName: string,
  getter: (course: CourseDetail) => string | null
): string => {
  // Doing this with the URL API seems to not be working, so we're doing it manually
  // const url = new URL(
  //   'https://docs.google.com/forms/d/e/1FAIpQLSfsGQ0rvC-AG5Ns-eNRM5C7vqfT-5p7p_d62mw-8245GMwwSg/viewform?usp=pp_url'
  // )

  // url.searchParams.set('entry.392580474', getCourseNameForForm(course))
  // url.searchParams.set('entry.92044763', fieldName)

  // const currentValue = getter(course)
  // if (currentValue) {
  //   url.searchParams.set('entry.457689664', encodeURIComponent(currentValue))
  // }

  let url =
    'https://docs.google.com/forms/d/e/1FAIpQLSfsGQ0rvC-AG5Ns-eNRM5C7vqfT-5p7p_d62mw-8245GMwwSg/viewform?usp=pp_url'

  url += `&entry.392580474=${course.id}`
  url += `&entry.92044763=${fieldName}`

  const currentValue = getter(course)
  if (currentValue) {
    url += `&entry.457689664=${encodeURIComponent(currentValue)}`
  }

  return url.toString()
}

const FORM_DESCRIPTION_FIELD_NAME = "What's+this+course+really+about?"
export const getEditDescriptionFormUrl = (course: CourseDetail): string => {
  return getEditCourseFormUrl(
    course,
    FORM_DESCRIPTION_FIELD_NAME,
    (course) => course.description
  )
}

const FORM_ASSESSMENT_FIELD_NAME = 'Evaluation+Method'
export const getAssessmentFormUrl = (course: CourseDetail): string => {
  return getEditCourseFormUrl(
    course,
    FORM_ASSESSMENT_FIELD_NAME,
    (c) => c.assessment
  )
}

const FORM_BIBLIOGRAPHY_FIELD_NAME = 'Bibliography'
export const getBibliographyFormUrl = (course: CourseDetail): string => {
  return getEditCourseFormUrl(
    course,
    FORM_BIBLIOGRAPHY_FIELD_NAME,
    (c) => c.bibliography
  )
}
