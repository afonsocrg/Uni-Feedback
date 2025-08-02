import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'

interface SelectableFieldProps {
  field: string
  label: string
  value: string
  options: string[]
  isEditing: boolean
  editValue: string
  onEdit: (field: string, currentValue: string) => void
  onSave: (field: string) => void
  onCancel: () => void
  onChange: (field: string, value: string) => void
  disabled?: boolean
}

export function SelectableField({
  field,
  label,
  value,
  options,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onChange,
  disabled = false
}: SelectableFieldProps) {
  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="text-sm">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Select
              value={editValue}
              onValueChange={(newValue) => onChange(field, newValue)}
              disabled={disabled}
            >
              <SelectTrigger className="w-auto min-w-32">
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => onSave(field)}
              disabled={disabled}
            >
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
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>{value}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(field, value)}
              disabled={disabled}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </dd>
    </div>
  )
}