import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...'
}: SearchInputProps) {
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primaryBlue/20 text-sm text-gray-700 transition-all placeholder:text-gray-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
