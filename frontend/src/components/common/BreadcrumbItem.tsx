interface BreadcrumbItemProps {
  children: React.ReactNode
  onClick?: () => void
  isActive?: boolean
}

export function BreadcrumbItem({
  children,
  onClick,
  isActive = false
}: BreadcrumbItemProps) {
  if (isActive) {
    return (
      <span className="flex items-center px-2 py-1 text-istBlue font-medium bg-istBlue/10 rounded">
        {children}
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center px-2 py-1 rounded text-gray-600 hover:text-istBlue hover:bg-istBlue/10 transition-all duration-200 cursor-pointer hover:underline"
    >
      {children}
    </button>
  )
}
