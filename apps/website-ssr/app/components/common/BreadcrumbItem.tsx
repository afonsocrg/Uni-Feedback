import { Link } from 'react-router'

interface BreadcrumbItemProps {
  children: React.ReactNode
  href?: string
  isActive?: boolean
}

export function BreadcrumbItem({
  children,
  href,
  isActive = false
}: BreadcrumbItemProps) {
  if (isActive) {
    return (
      <span className="flex items-center px-2 py-1 text-primaryBlue font-medium bg-primaryBlue/10 rounded">
        {children}
      </span>
    )
  }

  if (href) {
    return (
      <Link
        to={href}
        className="flex items-center px-2 py-1 rounded text-gray-600 hover:text-primaryBlue hover:bg-primaryBlue/10 transition-all duration-200 cursor-pointer hover:underline"
      >
        {children}
      </Link>
    )
  }

  return (
    <span className="flex items-center px-2 py-1 text-gray-600">
      {children}
    </span>
  )
}