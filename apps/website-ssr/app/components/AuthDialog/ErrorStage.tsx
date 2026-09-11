import {
  Button,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'

export interface ErrorStageProps {
  error: string
  onTryAgain: () => void
  onCancel?: () => void
}
export function ErrorStage({ error, onTryAgain, onCancel }: ErrorStageProps) {
  const { t } = useTranslation('feedback')

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('auth.verify_failed_title')}</DialogTitle>
        <DialogDescription>{error}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col space-y-2">
        <Button onClick={onTryAgain} className="w-full">
          {t('auth.try_again')}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="w-full">
            {t('auth.cancel')}
          </Button>
        )}
      </div>
    </>
  )
}
