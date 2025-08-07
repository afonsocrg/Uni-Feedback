import { Button, Input } from '@uni-feedback/ui'
import { Check, Edit3, X } from 'lucide-react'
import { useState } from 'react'

interface EditableFieldProps {
  label: string
  value: string
  type?: string
  onSave: (field: string) => void
  disabled?: boolean
}

export function EditableField({
  label,
  value,
  type = 'text',
  onSave,
  disabled = false
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string | null>(value)

  const handleSave = () => {
    onSave(editValue ?? '')
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value) // Reset to original value
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      handleSave()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="space-y-2">
      <dt className="font-medium text-sm">{label}</dt>
      <dd className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              type={type}
              value={editValue ?? ''}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 w-64"
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={disabled}>
              <Check className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
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
