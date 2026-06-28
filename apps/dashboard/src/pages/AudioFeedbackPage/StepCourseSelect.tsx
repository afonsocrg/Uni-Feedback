import { useQuery } from '@tanstack/react-query'
import type {
  CourseSearchResult,
  Degree,
  Faculty
} from '@uni-feedback/api-client'
import {
  getFaculties,
  getFacultyDegrees,
  searchCourses
} from '@uni-feedback/api-client'
import {
  Badge,
  Chip,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn
} from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Check, ChevronRight, Loader2, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const ACTIVE_CHIP_STYLE = {
  backgroundColor: '#E3F2FD',
  color: '#23729f',
  borderColor: '#23729f'
}

function buildSchoolYearOptions(current: number): number[] {
  return Array.from({ length: 5 }, (_, i) => current - i)
}

interface FilterChipProps {
  label: string
  options: { value: string; label: string }[]
  selectedValue: string | null
  onValueChange: (value: string | null) => void
  placeholder: string
}

function FilterChip({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder
}: FilterChipProps) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((o) => o.value === selectedValue) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          {selectedValue ? (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 flex items-center gap-1.5"
              style={ACTIVE_CHIP_STYLE}
            >
              <span>{selectedOption?.label ?? placeholder}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onValueChange(null)
                }}
                className="hover:bg-blue-100 rounded-sm p-0.5 transition-colors"
                aria-label={`Clear ${label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ) : (
            <Chip label={placeholder} color="gray" size="sm" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" sideOffset={8}>
        <div className="max-h-[300px] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onValueChange(opt.value)
                setOpen(false)
              }}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors flex items-center justify-between',
                opt.value === selectedValue
                  ? 'bg-blue-50 text-[#23729f] font-medium'
                  : 'text-gray-700'
              )}
            >
              <span>{opt.label}</span>
              {opt.value === selectedValue && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface SearchableFilterChipProps {
  label: string
  options: { value: string; label: string }[]
  selectedValue: string | null
  onValueChange: (value: string | null) => void
  placeholder: string
  searchPlaceholder?: string
}

function SearchableFilterChip({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder,
  searchPlaceholder = 'Search...'
}: SearchableFilterChipProps) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((o) => o.value === selectedValue) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer max-w-full">
          {selectedValue ? (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 flex items-center gap-1.5 max-w-full"
              style={ACTIVE_CHIP_STYLE}
            >
              <span className="truncate">
                {selectedOption?.label ?? placeholder}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onValueChange(null)
                }}
                className="hover:bg-blue-100 rounded-sm p-0.5 transition-colors flex-shrink-0"
                aria-label={`Clear ${label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ) : (
            <Chip label={placeholder} color="gray" size="sm" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          filter={(value, search) => {
            const normalize = (s: string) =>
              s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
            return normalize(value).includes(normalize(search)) ? 1 : 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onValueChange(
                      opt.value === selectedValue ? null : opt.value
                    )
                    setOpen(false)
                  }}
                  className={cn(
                    'cursor-pointer',
                    opt.value === selectedValue &&
                      'bg-blue-50 text-[#23729f] font-medium'
                  )}
                >
                  <span className="flex-1">{opt.label}</span>
                  {opt.value === selectedValue && <Check className="w-4 h-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface StepCourseSelectProps {
  selected: CourseSearchResult | null
  onSelect: (course: CourseSearchResult | null) => void
  schoolYear: number
  onSchoolYearChange: (year: number) => void
  onNext: () => void
}

export function StepCourseSelect({
  onSelect,
  schoolYear,
  onSchoolYearChange,
  onNext
}: StepCourseSelectProps) {
  const currentSchoolYear = getCurrentSchoolYear()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [facultyId, setFacultyId] = useState<number | null>(null)
  const [degreeId, setDegreeId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ['faculties'],
    queryFn: getFaculties,
    staleTime: 5 * 60 * 1000
  })

  const { data: degrees } = useQuery<Degree[]>({
    queryKey: ['faculty-degrees', facultyId],
    queryFn: () => getFacultyDegrees(facultyId!),
    enabled: facultyId !== null,
    staleTime: 5 * 60 * 1000
  })

  const hasFilter = !!(debouncedQuery || facultyId || degreeId)

  const { data: results, isLoading } = useQuery({
    queryKey: ['courses-search', debouncedQuery, facultyId, degreeId],
    queryFn: () =>
      searchCourses({
        q: debouncedQuery || undefined,
        faculty_id: facultyId ?? undefined,
        degree_id: degreeId ?? undefined,
        sort: 'review_count_asc',
        limit: 10
      }),
    enabled: hasFilter,
    staleTime: 30 * 1000
  })

  function handleFacultyChange(id: number | null) {
    setFacultyId(id)
    setDegreeId(null)
  }

  function handleCourseClick(course: CourseSearchResult) {
    onSelect(course)
    onNext()
  }

  const courses = results?.courses ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Select Course</h2>
        <p className="text-sm text-muted-foreground">
          Search for the course the student is reviewing.
        </p>
      </div>

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

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by course name or acronym…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {faculties && faculties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="University"
              placeholder="University"
              options={faculties.map((f) => ({
                value: f.id.toString(),
                label: f.shortName
              }))}
              selectedValue={facultyId?.toString() ?? null}
              onValueChange={(val) =>
                handleFacultyChange(val ? Number(val) : null)
              }
            />
            {facultyId !== null && degrees && degrees.length > 0 && (
              <SearchableFilterChip
                label="Degree"
                placeholder="Degree"
                options={degrees.map((d) => ({
                  value: d.id.toString(),
                  label: `${d.acronym}: ${d.name}`
                }))}
                selectedValue={degreeId?.toString() ?? null}
                onValueChange={(val) => setDegreeId(val ? Number(val) : null)}
                searchPlaceholder="Search degree…"
              />
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {debouncedQuery || facultyId
            ? 'No courses found.'
            : 'Start typing to search for a course.'}
        </p>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className="w-full text-left p-4 rounded-lg border bg-card hover:border-primary hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {course.faculty.shortName} › {course.degree.name}
                  </p>
                  <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                    {course.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {course.acronym}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
