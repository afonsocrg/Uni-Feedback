import { DialogDescription, DialogHeader, DialogTitle } from '@uni-feedback/ui'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface SuccessStageProps {
  title?: string
  description?: string
}
export function SuccessStage({ title, description }: SuccessStageProps) {
  const { t } = useTranslation('feedback')

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title ?? t('auth.success_title')}</DialogTitle>
        <DialogDescription>
          {description ?? t('auth.success_desc')}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="size-16 bg-success/15 rounded-full flex items-center justify-center">
          <Check className="size-8 text-success" />
        </div>
      </div>
    </>
  )
}
