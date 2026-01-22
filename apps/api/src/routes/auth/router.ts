import { requireSuperuser } from '@middleware'
import { fromIttyRouter } from 'chanfana'
import { AutoRouter, IRequest } from 'itty-router'
import { CreateAccount } from './createAccount'
import { DeleteAccount } from './deleteAccount'
import { GetUserFeedback } from './feedback'
import { ForgotPassword } from './forgotPassword'
import { Invite } from './invite'
import { Login } from './login'
import { Logout } from './logout'
import { GetProfile } from './profile'
import { Refresh } from './refresh'
import { RequestOtp } from './requestOtp'
import { ResetPassword } from './resetPassword'
import { GetUserStats } from './stats'
import { VerifyOtp } from './verifyOtp'

const router = fromIttyRouter(AutoRouter({ base: '/auth' }))

router.post('/login', Login)
router.post('/logout', Logout)
router.post('/refresh', Refresh)
router.post('/forgot-password', ForgotPassword)
router.post('/reset-password', ResetPassword)
router.post('/create-account', CreateAccount)
// @deprecated Magic link routes - kept for backward compatibility
// router.post('/magic-links', RequestMagicLink)
// router.post('/magic-links/use', UseMagicLink)
// router.post('/magic-links/verify', VerifyMagicLink)

// OTP authentication routes
router.post('/otp/request', RequestOtp)
router.post('/otp/verify', VerifyOtp)

router.get('/profile', GetProfile)
router.delete('/profile', DeleteAccount)
router.get('/profile/stats', GetUserStats)
router.get('/profile/feedback', GetUserFeedback)

// Invite route - Wrapped with superuser middleware
class InviteWithAuth extends Invite {
  async handle(request: IRequest, env: any, context: any) {
    const authCheck = await requireSuperuser(request, env, context)
    if (authCheck) return authCheck

    return super.handle(request, env, context)
  }
}
router.post('/invite', InviteWithAuth)

export { router }
