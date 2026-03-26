import { Settings } from 'lucide-react'
import { useState } from 'react'

const workloadInputTypes = [
  { value: 'scale', label: 'Scale (dumbbells)' },
  { value: 'chips', label: 'Chips (pills)' },
  { value: 'segmented', label: 'Segmented bar' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'list', label: 'List (rows)' }
] as const

export type WorkloadInputType = (typeof workloadInputTypes)[number]['value']

interface WorkloadInputDebugPanelProps {
  value: WorkloadInputType
  onChange: (value: WorkloadInputType) => void
}

export function WorkloadInputDebugPanel({
  value,
  onChange
}: WorkloadInputDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-900">
              Workload Input Type
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {workloadInputTypes.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="radio"
                  name="workload-input-type"
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) =>
                    onChange(e.target.value as WorkloadInputType)
                  }
                  className="size-4 text-primaryBlue focus:ring-primaryBlue"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-primaryBlue text-white rounded-full p-3 shadow-lg hover:bg-primaryBlue/90 transition-colors"
          title="Debug Panel"
        >
          <Settings className="size-5" />
        </button>
      )}
    </div>
  )
}
