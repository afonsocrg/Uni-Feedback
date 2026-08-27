import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFocus?: () => void
  onBlur?: () => void
  /**
   * Sits inside the field, on the right.
   *
   * Inside rather than under it, because the browse pages read as one chain:
   * search, filter, results. A control on its own row between the search and
   * the filters interrupts that chain; a control within the field reads as an
   * alternative to searching, which is what it is.
   */
  trailing?: ReactNode
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  onFocus,
  onBlur,
  trailing
}: SearchInputProps) {
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        className={`w-full pl-10 py-2.5 rounded-lg bg-muted hover:bg-muted focus:bg-background focus:outline-none focus:ring-2 focus:ring-primaryBlue/20 text-base text-foreground transition-all placeholder:text-muted-foreground ${trailing ? 'pr-12 sm:pr-48' : 'pr-4'}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {trailing && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          {trailing}
        </div>
      )}
    </div>
  )
}
