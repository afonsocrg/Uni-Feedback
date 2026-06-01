import { cn } from '../../utils'

function Skeleton({
  className,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export { Skeleton }
