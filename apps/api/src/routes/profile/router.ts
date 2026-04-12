import { requireAuth } from '@middleware'
import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { DeleteAccount } from './deleteAccount'
import { GetUserFeedback } from './feedback'
import { GetFeedbackRecommendations } from './feedbackRecommendations'
import { GetProfile } from './profile'
import { GetUserStats } from './stats'

const app = new Hono()

app.use('*', async (c, next) => {
  await requireAuth(c)
  await next()
})

const router = fromHono(app, { passthroughErrors: true })

router.get('/', GetProfile)
router.delete('/', DeleteAccount)
router.get('/stats', GetUserStats)
router.get('/feedback', GetUserFeedback)
router.get('/feedback-recommendations', GetFeedbackRecommendations)

export { router }
