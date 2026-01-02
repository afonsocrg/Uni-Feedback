import { requireSuperuser } from '@middleware'
import { fromIttyRouter } from 'chanfana'
import { AutoRouter, IRequest } from 'itty-router'
import { CreateAccount } from './createAccount'
import { DeleteAccount } from './deleteAccount'
import { ForgotPassword } from './forgotPassword'
import { Invite } from './invite'
import { Login } from './login'
import { Logout } from './logout'
import { GetProfile } from './profile'
import { Refresh } from './refresh'
import { RequestMagicLink } from './requestMagicLink'
import { ResetPassword } from './resetPassword'
import { UseMagicLink } from './useMagicLink'
import { VerifyMagicLink } from './verifyMagicLink'

const router = fromIttyRouter(AutoRouter({ base: '/auth' }))

router.post('/login', Login)
router.post('/logout', Logout)
router.post('/refresh', Refresh)
router.get('/profile', GetProfile)
router.delete('/profile', DeleteAccount)
router.post('/forgot-password', ForgotPassword)
router.post('/reset-password', ResetPassword)
router.post('/create-account', CreateAccount)
router.post('/magic-links', RequestMagicLink)
router.post('/magic-links/use', UseMagicLink)
router.post('/magic-links/verify', VerifyMagicLink)

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
