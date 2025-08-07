import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface EditableSelectProps {
  field: string
  label: string
  value: string | null
  options: Option[]
  placeholder?: string
  isEditing: boolean
  editValue: string | null
  onEdit: (field: string, value: string | null) => void
  onSave: (field: string) => void
  onCancel: () => void
  onChange: (field: string, value: string) => void
  disabled?: boolean
  displayValue?: string
}

export function EditableSelect({
  field,
  label,
  value,
  options,
  placeholder = 'Select...',
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onChange,
  disabled = false,
  displayValue
}: EditableSelectProps) {
  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Select
              value={editValue || ''}
              onValueChange={(newValue) => onChange(field, newValue)}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <span className="text-sm">
              {displayValue || (value ? options.find(opt => opt.value === value)?.label : 'Not set')}
            </span>
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