import { requireSuperuser } from '@middleware'
import { fromIttyRouter } from 'chanfana'
import { AutoRouter, IRequest } from 'itty-router'
import { CreateAccount } from './createAccount'
import { ForgotPassword } from './forgotPassword'
import { Invite } from './invite'
import { Login } from './login'
import { Logout } from './logout'
import { Refresh } from './refresh'
import { RequestMagicLink } from './requestMagicLink'
import { ResetPassword } from './resetPassword'
import { VerifyMagicLink } from './verifyMagicLink'

const router = fromIttyRouter(AutoRouter({ base: '/auth' }))

router.post('/login', Login)
router.post('/logout', Logout)
router.post('/refresh', Refresh)
router.post('/forgot-password', ForgotPassword)
router.post('/reset-password', ResetPassword)
router.post('/create-account', CreateAccount)
router.post('/request-magic-link', RequestMagicLink)
router.post('/verify-magic-link', VerifyMagicLink)

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
