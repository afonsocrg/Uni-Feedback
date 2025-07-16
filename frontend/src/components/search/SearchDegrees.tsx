import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface SearchDegreesProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  availableTypes: string[]
  selectedType: string | null
  setSelectedType: (type: string | null) => void
}

export function SearchDegrees({
  searchQuery,
  setSearchQuery,
  availableTypes,
  selectedType,
  setSelectedType
}: SearchDegreesProps) {
  return (
    <div className="bg-white rounded-xl shadow-md px-6 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="search"
              className="text-xs font-semibold text-gray-500 mb-1"
            >
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name or acronym..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-transparent bg-gray-50 text-gray-700 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col min-w-[120px] w-[140px]">
            <label
              htmlFor="type"
              className="text-xs font-semibold text-gray-500 mb-1"
            >
              Type
            </label>
            <Select
              value={selectedType ?? 'all'}
              onValueChange={(value) =>
                setSelectedType(value === 'all' ? null : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableTypes?.map((type) => (
                  <SelectItem key={type} value={type} className="truncate">
                    {type}
                  </SelectItem>
                )) ?? []}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
