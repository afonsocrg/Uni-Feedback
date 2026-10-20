import { Button, type ButtonProps } from '@uni-feedback/ui'
import { useRef, useState } from 'react'
import { AuthDialog, type AuthDialogProps } from '~/components'
import type { AuthUser } from '~/context/AuthContext'
import { useAuth } from '~/hooks/useAuth'

interface AuthenticatedButtonProps extends ButtonProps {
  /** Props to customize the authentication modal */
  authModalProps?: Pick<
    AuthDialogProps,
    | 'allowedEmailSuffixes'
    | 'universityName'
    | 'title'
    | 'description'
    | 'successTitle'
    | 'successDescription'
    | 'trigger'
  >
  /**
   * Runs before the auth dialog opens. Return false to keep it closed, e.g. so
   * a form can show its errors before asking the user to sign in.
   */
  beforeAuth?: () => boolean | Promise<boolean>
}

/**
 * A button that ensures the user is authenticated before calling onClick.
 * If the user is not authenticated, it shows an authentication dialog first.
 * Once authenticated, it calls the onClick callback.
 *
 * For form submit buttons (type="submit"), it will prevent form submission
 * when not authenticated, and submit the form after successful authentication.
 */
export function AuthenticatedButton({
  onClick,
  type,
  children,
  authModalProps,
  beforeAuth,
  ...props
}: AuthenticatedButtonProps) {
  const { isAuthenticated, setUser } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pendingEventRef = useRef<React.MouseEvent<HTMLButtonElement> | null>(
    null
  )

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isAuthenticated) {
      onClick?.(e)
    } else {
      // Prevent form submission when not authenticated
      e.preventDefault()
      if (beforeAuth && !(await beforeAuth())) return
      // Store the event for later use after authentication
      pendingEventRef.current = e
      setShowAuthDialog(true)
    }
  }

  const handleAuthSuccess = (user: AuthUser) => {
    // Update the auth context with the logged-in user
    setUser(user)
    setShowAuthDialog(false)

    // For submit buttons, trigger form submission after auth
    if (type === 'submit' && buttonRef.current) {
      const form = buttonRef.current.closest('form')
      if (form) {
        form.requestSubmit()
        pendingEventRef.current = null
        return
      }
    }

    // For regular buttons, call onClick with the stored event
    if (pendingEventRef.current) {
      onClick?.(pendingEventRef.current)
      pendingEventRef.current = null
    }
  }

  const handleAuthClose = () => {
    setShowAuthDialog(false)
    pendingEventRef.current = null
  }

  return (
    <>
      <Button ref={buttonRef} onClick={handleClick} type={type} {...props}>
        {children}
      </Button>

      <AuthDialog
        open={showAuthDialog}
        onSuccess={handleAuthSuccess}
        onClose={handleAuthClose}
        {...authModalProps}
      />
    </>
  )
}
