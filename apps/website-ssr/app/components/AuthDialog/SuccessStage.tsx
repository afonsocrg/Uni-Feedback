import { DialogDescription, DialogHeader, DialogTitle } from '@uni-feedback/ui'
import { Check } from 'lucide-react'

export interface SuccessStageProps {
  title?: string
  description?: string
}
export function SuccessStage({ title, description }: SuccessStageProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title ?? 'Email verified!'}</DialogTitle>
        <DialogDescription>
          {description ?? "You're all set!"}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="size-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="size-8 text-green-600" />
        </div>
      </div>
    </>
  )
}
