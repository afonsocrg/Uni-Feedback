import { Check, X } from 'lucide-react'

export function TriboolIcon({ value }: { value?: boolean | null }) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground text-sm">--</span>
  }
  return value ? (
    <Check className="h-4 w-4 text-green-600 inline" />
  ) : (
    <X className="h-4 w-4 text-red-600 inline" />
  )
}
