import { Button, EditableStarRating } from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'
import { useState } from 'react'

interface EditableStarRatingFieldProps {
  label: string
  value: number
  onSave: (newValue: number | null) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  labels?: [string, string, string, string, string]
  labelFunction?: (rating: number) => string
  labelPosition?: 'bottom' | 'right'
}

export function EditableStarRatingField({
  label,
  value,
  onSave,
  disabled = false,
  size = 'md',
  labels,
  labelFunction,
  labelPosition = 'right'
}: EditableStarRatingFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<number>(value)

  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-start gap-2">
        <EditableStarRating
          value={isEditing ? editValue : value}
          onChange={isEditing ? setEditValue : () => {}}
          disabled={!isEditing}
          size={size}
          labels={labels}
          labelFunction={labelFunction}
          labelPosition={labelPosition}
        />

        {isEditing ? (
          <>
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
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </dd>
    </div>
  )
}
