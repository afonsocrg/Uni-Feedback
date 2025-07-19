import { Button } from '@ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { cn } from '@utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

interface Course {
  id: number
  name: string
  acronym: string
}

interface CourseComboboxProps {
  courses: Course[]
  value: number | undefined
  onChange: (id: number) => void
  disabled?: boolean
}

export function CourseCombobox({
  courses,
  value,
  onChange,
  disabled
}: CourseComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selected = courses.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selected
            ? `${selected.acronym} - ${selected.name}`
            : 'Select a course'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search course..." />
          <CommandEmpty>No course found.</CommandEmpty>
          <CommandGroup>
            {courses.map((course) => (
              <CommandItem
                key={course.id}
                value={course.id.toString()}
                onSelect={() => {
                  onChange(course.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === course.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {course.acronym} - {course.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
