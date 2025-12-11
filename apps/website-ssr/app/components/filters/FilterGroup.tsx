import type { ReactNode } from 'react'

interface FilterGroupProps {
  label: string
  children: ReactNode
}

export function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-gray-900 block">{label}</label>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
