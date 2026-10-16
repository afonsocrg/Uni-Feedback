import type { Faculty, JourneyDegreeInput } from '@uni-feedback/api-client'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { Check, ChevronDown } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFaculties, useFacultyDegrees } from '~/hooks/queries'
import { cn } from '~/utils'
import { FacultyLogo } from './FacultyLogo'
import { shortSchoolYear } from './journeyYears'

/** How far back the year pickers go. Covers a PhD after a long break. */
const YEARS_BACK = 15
const NONE = 'none'

export interface DegreeFormValues {
  facultyId: number | null
  degreeId: number | null
  startSchoolYear: number | null
  endSchoolYear: number | null
}

export type DegreeFormStep = 'faculty' | 'degree' | 'years'

interface DegreeFormProps {
  initial: DegreeFormValues
  submitLabel: string
  isSubmitting: boolean
  error: string | null
  onSubmit: (input: JourneyDegreeInput, facultyId: number) => void
  /** Reports how far they got, for the abandonment event. */
  onCancel: (step: DegreeFormStep) => void
}

/** Accent-insensitive match, so "tecnico" finds "Técnico". */
function matches(value: string, search: string) {
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return normalize(value).includes(normalize(search)) ? 1 : 0
}

/**
 * University, then degree, then the two optional years.
 *
 * Only the degree is stored, but the university comes first: it narrows ~150
 * degree names to a handful and avoids "Engenharia Informática, but where?".
 */
export function DegreeForm({
  initial,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel
}: DegreeFormProps) {
  const { t } = useTranslation('feedback')
  const id = useId()
  const [values, setValues] = useState(initial)
  const [facultyOpen, setFacultyOpen] = useState(false)
  const [degreeOpen, setDegreeOpen] = useState(false)

  const { data: faculties = [] } = useFaculties()
  const { data: degrees = [] } = useFacultyDegrees(values.facultyId)

  const faculty = faculties.find((f) => f.id === values.facultyId)
  const degree = degrees.find((d) => d.id === values.degreeId)

  const current = getCurrentSchoolYear()
  const years = useMemo(
    () => Array.from({ length: YEARS_BACK + 1 }, (_, i) => current - i),
    [current]
  )
  const endYears = years.filter(
    (y) => values.startSchoolYear === null || y >= values.startSchoolYear
  )

  const step: DegreeFormStep = !values.facultyId
    ? 'faculty'
    : !values.degreeId
      ? 'degree'
      : 'years'

  const pickFaculty = (f: Faculty) => {
    setValues((v) =>
      v.facultyId === f.id ? v : { ...v, facultyId: f.id, degreeId: null }
    )
    setFacultyOpen(false)
    setDegreeOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !values.facultyId ||
      !values.degreeId ||
      values.startSchoolYear === null
    )
      return
    onSubmit(
      {
        degreeId: values.degreeId,
        startSchoolYear: values.startSchoolYear,
        endSchoolYear: values.endSchoolYear
      },
      values.facultyId
    )
  }

  const triggerClass =
    'flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-faculty`}>
            {t('profile.journey.field_university')}
          </Label>
          <Popover open={facultyOpen} onOpenChange={setFacultyOpen}>
            <PopoverTrigger asChild>
              <button
                id={`${id}-faculty`}
                type="button"
                className={triggerClass}
              >
                {faculty ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <FacultyLogo
                      logo={faculty.logo}
                      name={faculty.name}
                      shortName={faculty.shortName}
                      size="sm"
                    />
                    <span className="truncate">{faculty.name}</span>
                  </span>
                ) : (
                  <span className="truncate text-muted-foreground">
                    {t('profile.journey.field_university_placeholder')}
                  </span>
                )}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) min-w-72 p-0"
              align="start"
            >
              <Command filter={matches}>
                <CommandInput
                  placeholder={t('profile.journey.field_university_search')}
                />
                <CommandList>
                  <CommandEmpty>{t('profile.journey.no_results')}</CommandEmpty>
                  <CommandGroup>
                    {faculties.map((f) => (
                      <CommandItem
                        key={f.id}
                        value={`${f.shortName} ${f.name}`}
                        onSelect={() => pickFaculty(f)}
                        className="cursor-pointer gap-2"
                      >
                        <FacultyLogo
                          logo={f.logo}
                          name={f.name}
                          shortName={f.shortName}
                          size="sm"
                        />
                        <span className="flex-1 truncate">{f.name}</span>
                        {f.id === values.facultyId && (
                          <Check className="size-4 text-primaryBlue" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-degree`}>
            {t('profile.journey.field_degree')}
          </Label>
          <Popover open={degreeOpen} onOpenChange={setDegreeOpen}>
            <PopoverTrigger asChild>
              <button
                id={`${id}-degree`}
                type="button"
                disabled={!values.facultyId}
                className={triggerClass}
              >
                <span
                  className={cn('truncate', !degree && 'text-muted-foreground')}
                >
                  {degree
                    ? `${degree.name} (${degree.acronym})`
                    : values.facultyId
                      ? t('profile.journey.field_degree_placeholder')
                      : t('profile.journey.field_degree_pick_university')}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) min-w-72 p-0"
              align="start"
            >
              <Command filter={matches}>
                <CommandInput
                  placeholder={t('profile.journey.field_degree_search')}
                />
                <CommandList>
                  <CommandEmpty>{t('profile.journey.no_results')}</CommandEmpty>
                  <CommandGroup>
                    {degrees.map((d) => (
                      <CommandItem
                        key={d.id}
                        value={`${d.acronym} ${d.name}`}
                        onSelect={() => {
                          setValues((v) => ({ ...v, degreeId: d.id }))
                          setDegreeOpen(false)
                        }}
                        className="cursor-pointer gap-2"
                      >
                        <span className="flex-1">{d.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {d.acronym}
                        </span>
                        {d.id === values.degreeId && (
                          <Check className="size-4 text-primaryBlue" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-3 min-[420px]:grid-cols-2">
        <YearSelect
          id={`${id}-start`}
          label={t('profile.journey.field_start')}
          placeholder={t('profile.journey.year_placeholder')}
          years={years}
          value={values.startSchoolYear}
          onChange={(startSchoolYear) =>
            setValues((v) => ({
              ...v,
              startSchoolYear,
              // An end before the new start would be rejected; drop it.
              endSchoolYear:
                v.endSchoolYear !== null &&
                startSchoolYear !== null &&
                v.endSchoolYear < startSchoolYear
                  ? null
                  : v.endSchoolYear
            }))
          }
        />
        <YearSelect
          id={`${id}-end`}
          label={t('profile.journey.field_end')}
          optional={t('profile.journey.optional')}
          noneLabel={t('profile.journey.year_ongoing')}
          placeholder={t('profile.journey.year_ongoing')}
          years={endYears}
          value={values.endSchoolYear}
          onChange={(endSchoolYear) =>
            setValues((v) => ({ ...v, endSchoolYear }))
          }
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={
            !values.degreeId || values.startSchoolYear === null || isSubmitting
          }
        >
          {submitLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onCancel(step)}
        >
          {t('profile.journey.cancel')}
        </Button>
      </div>
    </form>
  )
}

function YearSelect({
  id,
  label,
  optional,
  noneLabel,
  placeholder,
  years,
  value,
  onChange
}: {
  id: string
  label: string
  /** Omitted for a required field. */
  optional?: string
  /** The "no year" choice; omitted when a year must be picked. */
  noneLabel?: string
  placeholder: string
  years: number[]
  value: number | null
  onChange: (year: number | null) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && (
          <>
            {' '}
            <span className="font-normal text-muted-foreground">
              {optional}
            </span>
          </>
        )}
      </Label>
      <Select
        // '' shows the placeholder until a year is picked.
        value={value !== null ? String(value) : noneLabel ? NONE : ''}
        onValueChange={(v) => onChange(v === NONE ? null : Number(v))}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {noneLabel && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {shortSchoolYear(y)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
