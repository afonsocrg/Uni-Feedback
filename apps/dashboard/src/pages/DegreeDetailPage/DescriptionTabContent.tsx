import { AdminDegreeDetail } from '@uni-feedback/api-client'
import { Button, Markdown } from '@uni-feedback/ui'
import { Edit3 } from 'lucide-react'
import { useState } from 'react'
import { EditDescriptionDialog } from './EditDescriptionDialog'

interface DescriptionTabContentProps {
  degree: AdminDegreeDetail
}
export function DescriptionTabContent({ degree }: DescriptionTabContentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const hasDescription = Boolean(degree.description)

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Degree Description</h3>
          {hasDescription && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Description
            </Button>
          )}
        </div>
        <div className="text-sm">
          {hasDescription ? (
            <div className="border rounded-md p-4 bg-muted/20">
              <Markdown>{degree.description}</Markdown>
            </div>
          ) : (
            <div className="text-center py-8">
              <Edit3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No description provided</h3>
              <p className="text-muted-foreground mt-1">
                Add a description to help students understand this degree
              </p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Add Description
              </Button>
            </div>
          )}
        </div>
      </div>
      <EditDescriptionDialog
        degree={degree}
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
      />
    </>
  )
}
