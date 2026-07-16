import { DegreeCard } from './DegreeCard'
import type { DegreeListingProps } from './types'

export function DegreeCardGrid({
  degrees,
  getHref,
  onSelect
}: DegreeListingProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {degrees.map((degree) => (
        <DegreeCard
          key={degree.id}
          degree={degree}
          href={getHref(degree)}
          onClick={() => onSelect(degree)}
        />
      ))}
    </div>
  )
}
