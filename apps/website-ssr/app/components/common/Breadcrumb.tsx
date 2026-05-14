import type { Course, Degree, Faculty } from '@uni-feedback/db/schema'
import { Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { userPreferences } from '~/utils'
import type { Lang } from '~/utils/i18n-routes'
import {
  getDegreePath,
  getFacultyPath,
  getLocalePath
} from '~/utils/i18n-routes'
import { GenericBreadcrumb, type BreadcrumbItemData } from './GenericBreadcrumb'

interface BreadcrumbProps {
  className?: string
  faculty?: Faculty
  degree?: Degree
  course?: Course
}

export function Breadcrumb({
  className = '',
  faculty,
  degree,
  course
}: BreadcrumbProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang

  const browsePath = getLocalePath('browse', lang)

  const handleHomeClick = () => {
    userPreferences.set({
      lastSelectedFacultySlug: undefined,
      lastSelectedDegreeSlug: undefined,
      lastVisitedPath: browsePath
    })
  }

  const handleFacultyClick = () => {
    userPreferences.set({
      lastSelectedFacultySlug: faculty?.slug ?? undefined,
      lastSelectedDegreeSlug: undefined,
      lastVisitedPath: faculty?.slug
        ? getFacultyPath(lang, faculty.slug)
        : browsePath
    })
  }

  const handleDegreeClick = () => {
    userPreferences.set({
      lastSelectedFacultySlug: faculty?.slug ?? undefined,
      lastSelectedDegreeSlug: degree?.slug ?? undefined,
      lastVisitedPath:
        faculty?.slug && degree?.slug
          ? getDegreePath(lang, faculty.slug, degree.slug)
          : browsePath
    })
  }

  const items: BreadcrumbItemData[] = [
    {
      label: (
        <>
          <Home className="h-3 w-3 mr-1" />
          {t('breadcrumb.select_uni')}
        </>
      ),
      href: browsePath,
      onClick: handleHomeClick
    }
  ]

  if (faculty) {
    items.push({
      label: faculty.shortName,
      href: getFacultyPath(lang, faculty.slug),
      onClick: handleFacultyClick
    })
  }

  if (faculty && degree) {
    items.push({
      label: degree.acronym,
      href: course ? getDegreePath(lang, faculty.slug, degree.slug) : undefined,
      onClick: course ? handleDegreeClick : undefined,
      isActive: !course
    })
  }

  if (faculty && degree && course) {
    items.push({
      label: course.acronym,
      isActive: true
    })
  }

  return <GenericBreadcrumb items={items} className={className} />
}
