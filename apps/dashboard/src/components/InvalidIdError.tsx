interface InvalidIdErrorProps {
  entityType: string
}

export function InvalidIdError({ entityType }: InvalidIdErrorProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-lg font-semibold text-destructive">
          Invalid {entityType} ID
        </p>
      </div>
    </div>
  )
}
