import { zodResolver } from '@hookform/resolvers/zod'
import { deleteAccount } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@uni-feedback/ui'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLang } from '~/hooks'
import { STORAGE_KEYS } from '~/utils/constants'
import { getLocalePath } from '~/utils/i18n-routes'

type DeleteAccountFormData = {
  emailConfirmation: string
}

/** "Danger zone" with the account deletion flow and its confirmation dialog. */
export function DeleteAccountSection({
  email,
  logout
}: {
  email: string
  logout: () => Promise<void>
}) {
  const { t } = useTranslation('feedback')
  const lang = useLang()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteAccountSchema = z.object({
    emailConfirmation: z.string().email(t('profile.delete_email_invalid'))
  })

  const form = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      emailConfirmation: ''
    }
  })

  const handleDeleteAccount = async (values: DeleteAccountFormData) => {
    if (values.emailConfirmation !== email) {
      form.setError('emailConfirmation', {
        type: 'manual',
        message: t('profile.delete_email_mismatch')
      })
      return
    }

    setIsDeleting(true)

    try {
      await deleteAccount()
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
      setShowDeleteDialog(false)
      toast.success(t('profile.toast_deleted'))
      navigate(getLocalePath('home', lang))
      await logout()
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : t('profile.toast_delete_failed')
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="pt-8 border-t">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-medium mb-1">
            {t('profile.delete_account_btn')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('profile.delete_account_desc')}
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          className="sm:flex-shrink-0"
        >
          {t('profile.delete_account_btn')}
        </Button>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => {
            if (isDeleting) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (isDeleting) e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {t('profile.delete_dialog_title')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t('profile.delete_dialog_desc')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleDeleteAccount)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="emailConfirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      <span className="text-center">
                        {t('profile.delete_confirm_label', {
                          email
                        })}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('profile.delete_confirm_placeholder')}
                        className="text-sm"
                        {...field}
                        disabled={isDeleting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  {t('profile.delete_cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={
                    isDeleting || form.watch('emailConfirmation') !== email
                  }
                >
                  {isDeleting
                    ? t('profile.delete_deleting')
                    : t('profile.delete_confirm_btn')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
