import { useDebounced } from '@hooks'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminDegrees,
  type JourneyDegree,
  type JourneyDegreeInput
} from '@uni-feedback/api-client'
import {
  Button,
  Chip,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn
} from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

/** How far back the year pickers go. Older years still show if already saved. */
const YEARS_BACK = 20
const NO_YEAR = 'none'

interface SelectedDegree {
  id: number
  acronym: string
  name: string
  facultyShortName: string
}

interface JourneyDegreeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The entry being edited, or null to add a new one. */
  entry: JourneyDegree | null
  /** Degrees already in the journey, other than `entry`'s. */
  takenDegreeIds: number[]
  isSaving: boolean
  onSave: (input: JourneyDegreeInput) => void
}

function yearOptions(current: number, saved: (number | null)[]): number[] {
  const years = new Set(
    Array.from({ length: YEARS_BACK + 1 }, (_, i) => current - i)
  )
  for (const y of saved) if (y !== null) years.add(y)
  return [...years].sort((a, b) => b - a)
}

/**
 * Add or edit one journey entry: the degree, plus optional start and end
 * school years. The server enforces the year rules (not in the future, end
 * not before start), so this only offers sensible choices.
 */
export function JourneyDegreeDialog({
  open,
  onOpenChange,
  entry,
  takenDegreeIds,
  isSaving,
  onSave
}: JourneyDegreeDialogProps) {
  const [degree, setDegree] = useState<SelectedDegree | null>(null)
  const [startYear, setStartYear] = useState<number | null>(null)
  const [endYear, setEndYear] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 300)

  // Reset the form each time the dialog opens, from the entry being edited
  useEffect(() => {
    if (!open) return
    setDegree(
      entry
        ? {
            id: entry.degreeId,
            acronym: entry.degreeAcronym,
            name: entry.degreeName,
            facultyShortName: entry.facultyShortName
          }
        : null
    )
    setStartYear(entry?.startSchoolYear ?? null)
    setEndYear(entry?.endSchoolYear ?? null)
    setSearch('')
  }, [open, entry])

  const { data, isFetching } = useQuery({
    queryKey: ['admin-degrees', { search: debouncedSearch, limit: 20 }],
    queryFn: () =>
      getAdminDegrees({
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch })
      }),
    enabled: open
  })

  const options = (data?.data ?? []).filter(
    (d) => !takenDegreeIds.includes(d.id)
  )
  const years = yearOptions(getCurrentSchoolYear(), [
    entry?.startSchoolYear ?? null,
    entry?.endSchoolYear ?? null
  ])
  const yearsInvalid =
    startYear !== null && endYear !== null && endYear < startYear

  const yearSelect = (
    id: string,
    value: number | null,
    onChange: (value: number | null) => void,
    emptyLabel: string
  ) => (
    <Select
      value={value === null ? NO_YEAR : String(value)}
      onValueChange={(v) => onChange(v === NO_YEAR ? null : Number(v))}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_YEAR}>{emptyLabel}</SelectItem>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {formatSchoolYearString(y)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit degree' : 'Add degree'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Degree</Label>
            {degree && (
              <div className="flex items-center gap-2 text-sm">
                <Chip label={degree.acronym} />
                <span className="flex-1 truncate">{degree.name}</span>
                <span className="text-xs text-muted-foreground">
                  {degree.facultyShortName}
                </span>
              </div>
            )}
            <Command shouldFilter={false} className="rounded-md border">
              <CommandInput
                placeholder={
                  degree ? 'Search to change degree...' : 'Search degrees...'
                }
                value={search}
                onValueChange={setSearch}
              />
              <CommandList className="max-h-48">
                <CommandEmpty>
                  {isFetching ? 'Searching...' : 'No degrees found.'}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((d) => (
                    <CommandItem
                      key={d.id}
                      value={String(d.id)}
                      onSelect={() =>
                        setDegree({
                          id: d.id,
                          acronym: d.acronym,
                          name: d.name,
                          facultyShortName: d.facultyShortName
                        })
                      }
                      className={cn(
                        'cursor-pointer',
                        d.id === degree?.id && 'font-medium'
                      )}
                    >
                      <Chip label={d.acronym} />
                      <span className="flex-1 truncate">{d.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {d.facultyShortName}
                      </span>
                      {d.id === degree?.id && <Check className="h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journey-start-year">Start year</Label>
              {yearSelect(
                'journey-start-year',
                startYear,
                setStartYear,
                'Unknown'
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="journey-end-year">Last year enrolled</Label>
              {yearSelect(
                'journey-end-year',
                endYear,
                setEndYear,
                'Ongoing or unknown'
              )}
            </div>
          </div>
          {yearsInvalid && (
            <p className="text-sm text-destructive">
              The last year cannot be before the start year
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!degree || yearsInvalid || isSaving}
            onClick={() =>
              degree &&
              onSave({
                degreeId: degree.id,
                startSchoolYear: startYear,
                endSchoolYear: endYear
              })
            }
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
