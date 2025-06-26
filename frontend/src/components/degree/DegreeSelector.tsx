import { SearchDegrees } from '@components'
import { useApp, useFacultyDegrees } from '@hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui'
import { insensitiveMatch } from '@utils'
import { useEffect, useMemo, useState } from 'react'
import { DegreeCard } from './DegreeCard'

interface DegreeSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export function DegreeSelector({ isOpen, onClose }: DegreeSelectorProps) {
  const { selectedFacultyId, setSelectedDegreeId } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: degrees } = useFacultyDegrees(selectedFacultyId)

  const availableTypes = useMemo(() => {
    return [...new Set(degrees?.map((degree) => degree.type))].sort()
  }, [degrees])
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Reset search query when dialog is opened
  // If we do it when the user clicks on a degree, we briefly see
  // all the courses coming back while the dialog is closing.
  // For that reason, this is inside a useEffect.
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  const handleDegreeSelect = (degreeId: number) => {
    setSelectedDegreeId(degreeId)
    onClose()
  }

  const filteredDegrees =
    degrees
      ?.filter((degree) => {
        return insensitiveMatch(`${degree.name} ${degree.acronym}`, searchQuery)
      })
      .filter((degree) => {
        if (selectedType === null) {
          return true
        }
        return degree.type === selectedType
      }) ?? []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[900px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Degree</DialogTitle>
        </DialogHeader>
        <SearchDegrees
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          availableTypes={availableTypes}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
        <div className="flex-1 min-h-0 mt-4 overflow-y-auto">
          {filteredDegrees.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No degrees found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredDegrees.map((degree) => (
                <DegreeCard
                  key={degree.id}
                  degree={degree}
                  onClick={() => handleDegreeSelect(degree.id)}
                  className="min-w-[320px]"
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
