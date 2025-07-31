import { Button, Input } from '@uni-feedback/ui'
import { Edit3, Save, X } from 'lucide-react'

interface EditableFieldProps {
  field: string
  label: string
  value: string
  type?: string
  isEditing: boolean
  editValue: string
  onEdit: (field: string, value: string) => void
  onSave: (field: string) => void
  onCancel: () => void
  onChange: (field: string, value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  disabled?: boolean
}

export function EditableField({
  field,
  label,
  value,
  type = 'text',
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onChange,
  onKeyDown,
  disabled = false
}: EditableFieldProps) {
  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              type={type}
              value={editValue}
              onChange={(e) => onChange(field, e.target.value)}
              className="h-8 w-64"
              onKeyDown={onKeyDown}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSave(field)}
              disabled={disabled}
            >
              <Save className="h-3 w-3" />
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
            <span className="text-sm">{value}</span>
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