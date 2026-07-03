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
      <span className="flex items-center text-muted-foreground font-medium">
        {children}
      </span>
    )
  }

  if (href) {
    return (
      <Link
        to={href}
        onClick={onClick}
        className="flex items-center hover:text-foreground hover:underline transition-colors"
      >
        {children}
      </Link>
    )
  }

  return <span className="flex items-center">{children}</span>
}
