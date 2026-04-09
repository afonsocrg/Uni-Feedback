import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { CreateAccount } from './createAccount'
import { DeleteAccount } from './deleteAccount'
import { GetUserFeedback } from './feedback'
import { GetFeedbackRecommendations } from './feedbackRecommendations'
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

const app = new Hono()
const router = fromHono(app, { passthroughErrors: true })

router.post('/login', Login)
router.post('/logout', Logout)
router.post('/refresh', Refresh)
router.post('/forgot-password', ForgotPassword)
router.post('/reset-password', ResetPassword)
router.post('/create-account', CreateAccount)

// OTP authentication routes
router.post('/otp/request', RequestOtp)
router.post('/otp/verify', VerifyOtp)

router.get('/profile', GetProfile)
router.delete('/profile', DeleteAccount)
router.get('/profile/stats', GetUserStats)
router.get('/profile/feedback', GetUserFeedback)
router.get('/profile/feedback-recommendations', GetFeedbackRecommendations)

router.post('/invite', Invite)

export { router }
