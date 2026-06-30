import type {
  CourseSearchResult,
  DegreeSearchResult,
  FacultySearchResult
} from '@uni-feedback/api-client'
import {
  searchCourses,
  searchDegrees,
  searchFaculties
} from '@uni-feedback/api-client'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getCoursePath, getLocalePath } from '~/utils/i18n-routes'

export function HeroSearchBar() {
  const { t } = useTranslation('landing')
  const lang = useLang()
  const browsePath = getLocalePath('browse', lang)

  const [query, setQuery] = useState('')
  const [courses, setCourses] = useState<CourseSearchResult[]>([])
  const [degrees, setDegrees] = useState<DegreeSearchResult[]>([])
  const [faculties, setFaculties] = useState<FacultySearchResult[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setCourses([])
      setDegrees([])
      setFaculties([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const [coursesRes, degreesRes, facultiesRes] = await Promise.all([
          searchCourses({ q: query, limit: 5 }),
          searchDegrees({ q: query, limit: 3 }),
          searchFaculties({ q: query, limit: 3 })
        ])
        setCourses(
          [...coursesRes.courses].sort((a, b) => b.reviewCount - a.reviewCount)
        )
        setDegrees(degreesRes.degrees)
        setFaculties(facultiesRes.faculties)
        setOpen(true)
      } catch {
        // fail silently
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasResults =
    courses.length > 0 || degrees.length > 0 || faculties.length > 0

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      window.location.href = browsePath
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative z-30 w-full max-w-2xl mx-auto text-left"
    >
      <div className="relative flex items-center">
        <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => hasResults && setOpen(true)}
          placeholder={t('search.placeholder')}
          className="w-full pl-12 pr-4 h-12 text-base font-light rounded-xl border border-input bg-background shadow-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
          aria-label={t('search.aria_label')}
          autoComplete="off"
        />
      </div>

      {open && hasResults && (
        <div className="absolute top-full mt-2 w-full bg-popover text-popover-foreground border rounded-xl shadow-xl z-[200] overflow-hidden">
          {courses.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 text-xs text-semibold text-muted-foreground/70">
                {t('search.tab_courses')}
              </div>
              {courses.map((course) => (
                <a
                  key={course.id}
                  href={getCoursePath(lang, course.id)}
                  className="flex items-center justify-between pl-6 pr-3 py-2.5 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0 mr-3">
                    <span className="text-xs text-muted-foreground block">
                      {course.faculty.shortName} · {course.degree.name}
                    </span>
                    <span className="text-sm font-medium block truncate">
                      {course.name}
                    </span>
                  </div>
                  {course.reviewCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <span className="text-yellow-400">★</span>
                      <span>
                        {course.avgRating ? course.avgRating.toFixed(1) : '–'}
                      </span>
                      <span className="text-muted-foreground/60">
                        ({course.reviewCount})
                      </span>
                    </div>
                  )}
                </a>
              ))}
            </>
          )}

          {degrees.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 text-xs text-muted-foreground/70">
                {t('search.tab_degrees')}
              </div>
              {degrees.map((degree) => {
                const href =
                  degree.faculty.slug && degree.slug
                    ? `/${degree.faculty.slug}/${degree.slug}`
                    : browsePath
                return (
                  <a
                    key={degree.id}
                    href={href}
                    className="flex items-center justify-between pl-6 pr-3 py-2.5 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 mr-3">
                      <span className="text-xs text-muted-foreground block">
                        {degree.faculty.shortName}
                      </span>
                      <span className="text-sm font-medium block truncate">
                        {degree.name}
                      </span>
                    </div>
                    {degree.reviewCount > 0 && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {t('search.reviews_count', {
                          count: degree.reviewCount
                        })}
                      </span>
                    )}
                  </a>
                )
              })}
            </>
          )}

          {faculties.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 text-xs text-muted-foreground/70 border-t">
                {t('search.tab_faculties')}
              </div>
              {faculties.map((faculty) => {
                const href = faculty.slug ? `/${faculty.slug}` : browsePath
                return (
                  <a
                    key={faculty.id}
                    href={href}
                    className="flex items-center justify-between pl-6 pr-3 py-2.5 hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium truncate">
                      {faculty.name}
                    </span>
                    {faculty.reviewCount > 0 && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-3">
                        {t('search.reviews_count', {
                          count: faculty.reviewCount
                        })}
                      </span>
                    )}
                  </a>
                )
              })}
            </>
          )}

          <div className="border-t px-3 py-2.5">
            <a
              href={browsePath}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('search.browse_all')}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
