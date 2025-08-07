import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'
import { useState } from 'react'

interface Option {
  value: string
  label: string
}

interface EditableSelectProps {
  label: string
  value: string | null
  options: Option[]
  placeholder?: string
  onSave: (field: string) => void
  disabled?: boolean
}

export function EditableSelect({
  label,
  value,
  options,
  placeholder = 'Select...',
  onSave,
  disabled = false
}: EditableSelectProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string | null>(value)

  const displayValue =
    options.find((opt) => opt.value === value)?.label || value

  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Select
              value={editValue || ''}
              onValueChange={(newValue) => setEditValue(newValue)}
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
            <Button
              size="sm"
              onClick={() => {
                onSave(editValue || '')
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
            <span className="text-sm">
              {displayValue ||
                (value
                  ? options.find((opt) => opt.value === value)?.label
                  : 'Not set')}
            </span>
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
