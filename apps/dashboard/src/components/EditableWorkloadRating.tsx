import { Button, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'
import { useState } from 'react'
import { WorkloadRatingSelect } from './WorkloadRatingSelect'

interface EditableWorkloadRatingProps {
  label: string
  value: number | null
  editValue: number | null
  onSave: (v: number | null) => void
  disabled?: boolean
}

export function EditableWorkloadRating({
  label,
  value,
  onSave,
  disabled = false
}: EditableWorkloadRatingProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<number | null>(value)

  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-center gap-2">
        {isEditing ? (
          <>
            <WorkloadRatingSelect
              value={editValue}
              onChange={(value) => setEditValue(value)}
            />
            <Button
              size="sm"
              onClick={() => {
                onSave(editValue)
                setIsEditing(false)
              }}
              disabled={disabled}
            >
              <Check className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setEditValue(value) // Reset to original value
              }}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <>
            {value ? (
              <WorkloadRatingDisplay rating={value} />
            ) : (
              <span className="text-sm text-muted-foreground">
                No workload rating
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </>
        )}
      </dd>
    </div>
  )
}
