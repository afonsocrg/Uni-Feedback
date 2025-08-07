import {
  Button,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'
import { WorkloadRatingSelect } from './WorkloadRatingSelect'

interface EditableWorkloadRatingProps {
  field: string
  label: string
  value: number | null
  isEditing: boolean
  editValue: number | null
  onEdit: (field: string, value: number | null) => void
  onSave: (field: string) => void
  onCancel: () => void
  onChange: (field: string, value: number | null) => void
  disabled?: boolean
}

export function EditableWorkloadRating({
  field,
  label,
  value,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onChange,
  disabled = false
}: EditableWorkloadRatingProps) {
  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-center gap-2">
        {isEditing ? (
          <>
            <WorkloadRatingSelect
              value={editValue}
              onChange={(value) => onChange(field, value)}
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
              onClick={() => onEdit(field, value || 3)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </>
        )}
      </dd>
    </div>
  )
}
