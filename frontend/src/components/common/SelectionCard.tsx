import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { ReactNode } from 'react'

interface SelectionCardProps {
  title: string
  subtitle?: string
  description?: string
  onClick: () => void
  className?: string
  children?: ReactNode
  icon?: ReactNode
}

export function SelectionCard({
  title,
  subtitle,
  description,
  onClick,
  className = '',
  children,
  icon
}: SelectionCardProps) {
  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full ${className}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
        {subtitle && (
          <CardDescription className="text-sm font-medium">
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      {(description || children) && (
        <CardContent>
          {description && (
            <p className="text-sm text-gray-600 transition-colors">
              {description}
            </p>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  )
}
