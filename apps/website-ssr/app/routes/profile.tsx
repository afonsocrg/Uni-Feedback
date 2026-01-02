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
import { AlertTriangle, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRequiredAuth } from '~/hooks'
import { STORAGE_KEYS } from '~/utils/constants'

export function meta() {
  return [
    { title: 'Profile - Uni Feedback' },
    {
      name: 'description',
      content: 'Manage your Uni Feedback account and preferences.'
    }
  ]
}

const deleteAccountSchema = z.object({
  emailConfirmation: z.string().email('Please enter a valid email address')
})

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>

export default function ProfilePage() {
  const { user, logout } = useRequiredAuth()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      emailConfirmation: ''
    }
  })

  // user is guaranteed to exist here due to AuthGuard
  const handleDeleteAccount = async (values: DeleteAccountFormData) => {
    // Verify email matches
    if (values.emailConfirmation !== user.email) {
      form.setError('emailConfirmation', {
        type: 'manual',
        message: 'Email does not match your account email'
      })
      return
    }

    setIsDeleting(true)

    try {
      await deleteAccount()

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER)

      // Close dialog
      setShowDeleteDialog(false)

      // Show success message
      toast.success('Your account has been deleted successfully')

      // Logout (clears cookies) and redirect to landing page
      navigate('/')
      await logout()
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete account. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Profile</h1>

        {/* Profile Information */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="size-10 text-primary" />
            </div>
            <p className="break-all">{user.email}</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-8 border-t">
          <h2 className="text-lg font-semibold text-destructive mb-4">
            Danger Zone
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and anonymize your data. Your
                feedback will be preserved anonymously to help other students.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="sm:flex-shrink-0"
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent
            className="sm:max-w-md"
            onInteractOutside={(e) => {
              // Prevent closing by clicking outside while deleting
              if (isDeleting) e.preventDefault()
            }}
            onEscapeKeyDown={(e) => {
              // Prevent closing with Escape while deleting
              if (isDeleting) e.preventDefault()
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete Account
              </DialogTitle>
              <DialogDescription className="text-sm">
                This action cannot be undone. Your personal information will be
                permanently deleted, but your feedback will remain anonymous to
                help other students.
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
                          Type {user.email} to confirm
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={
                      isDeleting ||
                      form.watch('emailConfirmation') !== user.email
                    }
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
