import { requireAuth } from '@middleware'
import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { DeleteAccount } from './deleteAccount'
import { GetUserFeedback } from './feedback'
import { GetFeedbackRecommendations } from './feedbackRecommendations'
import { GetGiveawayDashboard } from './giveaway'
import { DeleteInstagramHandle, SetInstagramHandle } from './instagram'
import {
  AddJourneyDegree,
  DeleteJourneyDegree,
  DismissInferredDegree,
  GetJourney,
  UpdateJourneyDegree
} from './journey'
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
router.get('/giveaway', GetGiveawayDashboard)
router.get('/feedback', GetUserFeedback)
router.get('/feedback-recommendations', GetFeedbackRecommendations)
router.put('/instagram', SetInstagramHandle)
router.delete('/instagram', DeleteInstagramHandle)
router.get('/journey', GetJourney)
router.post('/journey/degrees', AddJourneyDegree)
router.put('/journey/degrees/:id', UpdateJourneyDegree)
router.delete('/journey/degrees/:id', DeleteJourneyDegree)
router.post('/journey/inferred/dismiss', DismissInferredDegree)

export { router }
