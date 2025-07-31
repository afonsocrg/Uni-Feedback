import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { inviteUser } from '@uni-feedback/api-client'
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
import { Loader2, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess
}: InviteUserDialogProps) {
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: ''
    }
  })

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: (data) => {
      toast.success('User invited successfully!', {
        description: data.message
      })
      form.reset()
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to invite user', {
        description:
          error instanceof Error ? error.message : 'An error occurred'
      })
    }
  })

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(data)
  }

  const handleClose = () => {
    if (!inviteMutation.isPending) {
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to a new admin user. They will receive a
            link to create their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="user@example.com"
                      disabled={inviteMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={inviteMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteMutation.isPending}
                className="w-full sm:w-auto"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
