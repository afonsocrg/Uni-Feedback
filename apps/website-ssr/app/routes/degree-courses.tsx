import { isDiscontinued } from '@uni-feedback/utils'
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { DegreeCoursesPageContent } from '~/components/DegreeCoursesPageContent'
import { formatNumber } from '~/components/degree/content'
import {
  findDegreeBySlugs,
  loadAcademicTerms,
  loadCourseGroups,
  loadDegreeCourses
} from '~/lib/degreeCourses.server'
import { userPreferences } from '~/utils'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import {
  detectLang,
  getCoursePath,
  getDegreeCoursesPath
} from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/degree-courses'

/**
 * A degree's course browser (`/ist/leic-a/cadeiras`, EN `.../courses`): the
 * full listing with search and filters, moved off the degree page when it
 * became "learn about the degree" (prds/content_rich_pages.md, decision 19).
 * Indexed like the degree page, and the page that carries the course ItemList.
 */
export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'browse')
  const lang = detectLang(location.pathname)

  if (!loaderData?.faculty || !loaderData.degree) {
    return buildMeta({
      matches,
      title: 'Page Not Found - Uni Feedback',
      description: 'The requested page was not found.'
    })
  }

  const { faculty, degree, courses, origin } = loaderData
  const params = {
    degreeName: degree.name,
    acronym: degree.acronym,
    faculty: faculty.shortName
  }
  const totalFeedback = courses.reduce(
    (sum, c) => sum + Number(c.totalFeedbackCount),
    0
  )
  const title = t('meta.degree_courses_title', params)
  const description =
    totalFeedback > 0
      ? t('meta.degree_courses_description_reviews', {
          ...params,
          count: totalFeedback,
          n: formatNumber(totalFeedback, lang)
        })
      : t('meta.degree_courses_description', params)

  const hasSlugs = Boolean(faculty.slug && degree.slug)
  const pageUrl = hasSlugs
    ? `${origin}${getDegreeCoursesPath(lang, faculty.slug!, degree.slug!)}`
    : undefined

  // What the degree offers today. Courses no longer taught keep their pages,
  // but are not part of the degree's list.
  const offeredCourses = courses.filter(
    (c) => !isDiscontinued(c.lastTaughtYear)
  )

  const courseList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('courses_page.title', { name: degree.name }),
    ...(pageUrl && { url: pageUrl }),
    numberOfItems: offeredCourses.length,
    itemListElement: offeredCourses.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: course.name,
        courseCode: course.acronym,
        url: `${origin}${getCoursePath(lang, course.id)}`,
        provider: {
          '@type': 'CollegeOrUniversity',
          name: faculty.name
        },
        ...(Number(course.totalFeedbackCount) > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(course.averageRating).toFixed(1),
            reviewCount: course.totalFeedbackCount.toString(),
            bestRating: '5',
            worstRating: '1'
          }
        })
      }
    }))
  }

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: loaderData.university,
      faculty,
      degree,
      current: t('courses_page.breadcrumb')
    }),
    origin,
    pageUrl
  )

  return buildMeta({
    matches,
    title,
    description,
    url: pageUrl,
    structuredData: [courseList, breadcrumbs]
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { faculty, degree, university } = await findDegreeBySlugs(
    request,
    params.facultySlug,
    params.degreeSlug,
    getDegreeCoursesPath
  )

  const [courses, academicTerms, courseGroups] = await Promise.all([
    loadDegreeCourses(degree.id, detectLang(new URL(request.url).pathname)),
    loadAcademicTerms(faculty.id),
    loadCourseGroups(degree.id)
  ])

  return {
    faculty,
    degree,
    university,
    courses,
    academicTerms,
    courseGroups,
    origin: getRequestOrigin(request)
  }
}

export default function DegreeCoursesPage({
  loaderData
}: Route.ComponentProps) {
  const location = useLocation()
  const { faculty, degree } = loaderData

  // This is where a returning student comes back to find a course
  useEffect(() => {
    if (faculty.slug && degree.slug) {
      userPreferences.set({
        lastSelectedFacultySlug: faculty.slug,
        lastSelectedDegreeSlug: degree.slug,
        lastVisitedPath: location.pathname
      })
    }
  }, [faculty.slug, degree.slug, location.pathname])

  return (
    <DegreeCoursesPageContent
      faculty={faculty}
      degree={degree}
      university={loaderData.university}
      courses={loaderData.courses}
      academicTerms={loaderData.academicTerms}
      courseGroups={loaderData.courseGroups}
    />
  )
}
