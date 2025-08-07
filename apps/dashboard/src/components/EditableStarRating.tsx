import { Button, StarRatingWithLabel } from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'

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
  field: string
  label: string
  value: number
  isEditing: boolean
  editValue: number
  onEdit: (field: string, value: number) => void
  onSave: (field: string) => void
  onCancel: () => void
  onChange: (field: string, value: number) => void
  disabled?: boolean
}

export function EditableStarRating({
  field,
  label,
  value,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onChange,
  disabled = false,
  // StarRatingWithLabel props
  size = 'md',
  labels,
  labelFunction,
  labelPosition = 'right'
}: EditableStarRatingProps) {
  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-center gap-2">
        {isEditing ? (
          <>
            <StarRatingWithLabel
              value={editValue}
              onChange={(newValue) => onChange(field, newValue)}
              size={size}
              labels={labels}
              labelFunction={labelFunction}
              displayHover={true}
              labelPosition={labelPosition}
            />
            <Button size="sm" onClick={() => onSave(field)} disabled={disabled}>
              <Check className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
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
              onClick={() => onEdit(field, value)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </>
        )}
      </dd>
    </div>
  )
}
