import { Tooltip } from '@components'
import { Pencil } from 'lucide-react'
import React from 'react'

interface EditableSectionProps {
  title: string
  value: string | null | undefined
  editTooltip: string
  getEditUrl: () => string
  renderContent?: (value: string) => React.ReactNode
  fallback: React.ReactNode
}

export function EditableSection({
  title,
  value,
  editTooltip,
  getEditUrl,
  renderContent,
  fallback
}: EditableSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        {value && (
          <Tooltip content={editTooltip}>
            <button
              onClick={() => window.open(getEditUrl(), '_blank')}
              className="flex items-center justify-center text-gray-400 hover:text-primaryBlue transition-colors"
              aria-label={`Edit ${title.toLowerCase()}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>
      {value ? (
        renderContent ? (
          renderContent(value)
        ) : (
          <p className="text-gray-600">{value}</p>
        )
      ) : (
        fallback
      )}
    </div>
  )
}
