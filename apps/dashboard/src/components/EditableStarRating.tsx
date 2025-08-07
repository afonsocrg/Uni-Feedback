import { Button, StarRatingWithLabel } from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'
import { useState } from 'react'

interface StarRatingWithLabelProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  labels?: [string, string, string, string, string]
  labelFunction?: (rating: number) => string
  displayHover?: boolean
  labelPosition?: 'bottom' | 'right'
}

interface EditableStarRatingProps
  extends Omit<StarRatingWithLabelProps, 'value' | 'onChange'> {
  label: string
  value: number
  onSave: (newValue: number | null) => void
  disabled?: boolean
}

export function EditableStarRating({
  label,
  value,
  onSave,
  disabled = false,
  // StarRatingWithLabel props
  size = 'md',
  labels,
  labelFunction,
  labelPosition = 'right'
}: EditableStarRatingProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<number | null>(value)

  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-start gap-2">
        {isEditing ? (
          <>
            <StarRatingWithLabel
              value={editValue ?? 0}
              onChange={(newValue) => setEditValue(newValue)}
              size={size}
              labels={labels}
              labelFunction={labelFunction}
              displayHover={true}
              labelPosition={labelPosition}
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
            <StarRatingWithLabel
              value={value}
              size={size}
              labels={labels}
              labelFunction={labelFunction}
              displayHover={false}
              labelPosition={labelPosition}
            />
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
