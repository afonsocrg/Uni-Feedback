import { Link } from 'react-router'

interface BreadcrumbItemProps {
  children: React.ReactNode
  href?: string
  isActive?: boolean
  onClick?: () => void
}

export function BreadcrumbItem({
  children,
  href,
  isActive = false,
  onClick
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
        onClick={onClick}
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