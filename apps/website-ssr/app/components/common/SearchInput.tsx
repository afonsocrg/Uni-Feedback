import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFocus?: () => void
  onBlur?: () => void
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  onFocus,
  onBlur
}: SearchInputProps) {
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted hover:bg-muted focus:bg-background focus:outline-none focus:ring-2 focus:ring-primaryBlue/20 text-base text-foreground transition-all placeholder:text-muted-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  )
}
