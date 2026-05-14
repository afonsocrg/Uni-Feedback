import {
  Button,
  Card,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import { isValidEmail } from '@uni-feedback/utils'
import { HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { OtpInputStage } from '~/components/AuthDialog/OtpInputStage'
import type { AuthUser } from '~/context/AuthContext'
import { useAuth, useOtpAuth } from '~/hooks'
import type { Lang } from '~/i18n/config'
import { STORAGE_KEYS } from '~/utils/constants'
import { getLocalePath } from '~/utils/i18n-routes'

export default function LoginPage() {
  const { t, i18n } = useTranslation('feedback')
  const lang = i18n.language as Lang
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setUser } = useAuth()

  const { requestOtp } = useOtpAuth()

  // Extract referral code from URL
  const referralCode = searchParams.get('ref') || undefined

  // Redirect to profile if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(getLocalePath('profile', lang))
    }
  }, [user, navigate, lang])

  // Load saved email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_EMAIL)
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error(t('auth.toast_email_required'))
      return
    }

    setIsLoading(true)

    try {
      const result = await requestOtp({ email, referralCode })

      if (result.success || result.retryAfterSeconds) {
        // Save email to localStorage for next time
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email)
        setShowOtpInput(true)
        toast.success(t('auth.toast_code_sent'))
      } else {
        toast.error(result.error || t('auth.toast_send_failed'))
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('auth.toast_send_failed')
      )
    }

    setIsLoading(false)
  }

  const handleOtpSuccess = (user: AuthUser) => {
    const redirectTo =
      searchParams.get('redirect') || getLocalePath('home', lang)
    setUser(user)
    toast.success(t('auth.toast_logged_in'))
    navigate(redirectTo)
  }

  const handleTryAgain = () => {
    setShowOtpInput(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-xl font-semibold text-center">
            {t('auth.title')}
          </h1>
          {referralCode && (
            <p className="text-sm text-muted-foreground">
              {t('auth.invited', { code: referralCode })}
            </p>
          )}
        </div>

        <Card className="p-6 shadow-lg border-border text-sm">
          {showOtpInput ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">{t('auth.otp_sent')}</p>
                <p className="font-semibold">{email}</p>
              </div>

              <OtpInputStage
                email={email}
                onSuccess={handleOtpSuccess}
                onChangeEmail={handleTryAgain}
                showHeader={false}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    {t('auth.email_label')}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <HelpCircle className="size-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium mb-1">
                            {t('auth.email_required_title')}
                          </p>
                          <p className="text-muted-foreground">
                            {t('auth.email_required_desc')}
                          </p>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="font-medium mb-1">
                            {t('auth.need_help')}
                          </p>
                          <p className="text-muted-foreground">
                            {t('auth.help_desc')}{' '}
                            <a
                              href="mailto:help@uni-feedback.com"
                              className="underline hover:text-foreground transition-colors"
                            >
                              help@uni-feedback.com
                            </a>
                          </p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isValidEmail(email)}
              >
                {isLoading ? t('auth.sending') : t('auth.submit')}
              </Button>
            </form>
          )}
        </Card>

        {/* Terms & Privacy Notice */}
        <p className="text-xs text-center text-muted-foreground px-4">
          {t('auth.terms_prefix')}{' '}
          <a
            href={getLocalePath('terms', lang)}
            className="underline hover:text-foreground transition-colors"
          >
            {t('auth.terms_link')}
          </a>
          {' & '}
          <a
            href={getLocalePath('privacy', lang)}
            className="underline hover:text-foreground transition-colors"
          >
            {t('auth.privacy_link')}
          </a>
        </p>
      </div>
    </div>
  )
}
