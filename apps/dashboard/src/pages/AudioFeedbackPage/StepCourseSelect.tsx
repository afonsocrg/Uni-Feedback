import { useQuery } from '@tanstack/react-query'
import type { CourseSearchResult, Faculty } from '@uni-feedback/api-client'
import { getFaculties, searchCourses } from '@uni-feedback/api-client'
import { Button, Input, Label } from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function buildSchoolYearOptions(current: number): number[] {
  return Array.from({ length: 5 }, (_, i) => current - i)
}

interface StepCourseSelectProps {
  selected: CourseSearchResult | null
  onSelect: (course: CourseSearchResult | null) => void
  schoolYear: number
  onSchoolYearChange: (year: number) => void
  onNext: () => void
}

export function StepCourseSelect({
  selected,
  onSelect,
  schoolYear,
  onSchoolYearChange,
  onNext
}: StepCourseSelectProps) {
  const currentSchoolYear = getCurrentSchoolYear()

  const [facultyId, setFacultyId] = useState<number | null>(null)
  const [query, setQuery] = useState(
    selected ? `${selected.acronym} — ${selected.name}` : ''
  )
  const [results, setResults] = useState<CourseSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ['faculties'],
    queryFn: getFaculties,
    staleTime: 5 * 60 * 1000
  })

  useEffect(() => {
    const trimmed = query.trim()
    if (
      !trimmed ||
      (selected && query === `${selected.acronym} — ${selected.name}`)
    ) {
      setResults([])
      setOpen(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchCourses({
          q: trimmed,
          limit: 8,
          ...(facultyId ? { faculty_id: facultyId } : {})
        })
        setResults(res.courses ?? [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selected, facultyId])

  function handleFacultyChange(id: number | null) {
    setFacultyId(id)
    // Clear course selection and re-trigger search if there's already a query
    onSelect(null)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(course: CourseSearchResult) {
    onSelect(course)
    setQuery(`${course.acronym} — ${course.name}`)
    setOpen(false)
    setResults([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Select Course</h2>
        <p className="text-sm text-muted-foreground">
          Search for the course the student is reviewing.
        </p>
      </div>

      {faculties && faculties.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="faculty">University</Label>
          <select
            id="faculty"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={facultyId ?? ''}
            onChange={(e) =>
              handleFacultyChange(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="">All universities</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.shortName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative" ref={containerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by course name or acronym…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (selected) onSelect(null)
            }}
            autoFocus
          />
        </div>

        {open && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden">
            {results.map((course) => (
              <button
                key={course.id}
                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                onClick={() => handleSelect(course)}
              >
                <div className="font-medium">
                  {course.acronym} — {course.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {course.faculty.shortName} · {course.degree.acronym}
                </div>
              </button>
            ))}
          </div>
        )}

        {open &&
          !loading &&
          results.length === 0 &&
          query.trim().length > 1 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md px-4 py-3 text-sm text-muted-foreground">
              No courses found.
            </div>
          )}
      </div>

      {selected && (
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
          <p className="font-medium">
            {selected.acronym} — {selected.name}
          </p>
          <p className="text-muted-foreground">
            {selected.faculty.shortName} · {selected.degree.name}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="schoolYear">School Year</Label>
        <select
          id="schoolYear"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={schoolYear}
          onChange={(e) => onSchoolYearChange(Number(e.target.value))}
        >
          {buildSchoolYearOptions(currentSchoolYear).map((y) => (
            <option key={y} value={y}>
              {formatSchoolYearString(y)}
            </option>
          ))}
        </select>
      </div>

      <Button className="w-full" disabled={!selected} onClick={onNext}>
        Next
      </Button>
    </div>
  )
}
