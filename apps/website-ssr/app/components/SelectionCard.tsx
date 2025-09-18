import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@uni-feedback/ui'

interface SelectionCardProps {
  title: string
  subtitle?: string
  description?: string
  onClick: () => void
  className?: string
  children?: React.ReactElement
  icon?: React.ReactElement
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
      className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full flex flex-col ${className}`}
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
        <CardContent className="flex-1 flex flex-col">
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
