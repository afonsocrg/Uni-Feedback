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
    <div className="flex-1">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-transparent bg-white text-gray-700 transition"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
