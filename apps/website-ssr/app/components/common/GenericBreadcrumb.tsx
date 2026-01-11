import { ChevronRight } from 'lucide-react'
import { BreadcrumbItem } from './BreadcrumbItem'

export interface BreadcrumbItemData {
  label: string
  href?: string
  isActive?: boolean
  onClick?: () => void
}

interface GenericBreadcrumbProps {
  items: BreadcrumbItemData[]
  className?: string
}

export function GenericBreadcrumb({
  items,
  className = ''
}: GenericBreadcrumbProps) {
  return (
    <nav
      className={`flex items-center space-x-1 text-xs text-gray-500 ${className}`}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-3 w-3 text-gray-400 mx-1" />}
          <BreadcrumbItem
            href={item.href}
            isActive={item.isActive}
            onClick={item.onClick}
          >
            {item.label}
          </BreadcrumbItem>
        </div>
      ))}
    </nav>
  )
}
