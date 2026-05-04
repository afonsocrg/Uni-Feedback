import { getAllowedOrigins } from '@config'
import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { router as adminRouter } from './admin/router'
import { router as authRouter } from './auth/router'
import {
  SearchCourses,
  SubmitCorrectionRequest,
  SubmitFeedback
} from './courses'
import { SearchDegrees } from './degrees'
import { router as emailRouter } from './email/router'
import { GetFaculties, GetFacultyDegrees, SearchFaculties } from './faculties'
import {
  AddHelpfulVote,
  CategorizeFeedback,
  DeleteFeedback,
  EditFeedback,
  GetFeedbackForEdit,
  RemoveHelpfulVote,
  ReportFeedback
} from './feedback'
import { router as profileRouter } from './profile/router'
import { NotFoundError, handleError } from './utils'

const app = new Hono()

// Error handling middleware - handles all errors including from chanfana routes
app.onError((err) => {
  console.error('Error caught by Hono middleware:', err)
  return handleError(err)
})

app.use(
  '*',
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
)

const isDev = process.env.NODE_ENV !== 'production'

export { app }

export const router = fromHono(app, {
  docs_url: isDev ? '/docs' : null,
  openapi_url: isDev ? '/openapi.json' : null,
  passthroughErrors: true // Let errors propagate to Hono's onError handler
})

// ---------------------------------------------------------
// Health check
// ---------------------------------------------------------
router.get('/health', () =>
  Response.json({ status: 'ok', timestamp: new Date().toISOString() })
)

// ---------------------------------------------------------
// Public routes
// ---------------------------------------------------------
router.get('/faculties', GetFaculties)
router.get('/faculties/search', SearchFaculties)
router.get('/faculties/:facultyId/degrees', GetFacultyDegrees)

router.get('/courses/search', SearchCourses)
router.get('/degrees/search', SearchDegrees)
router.post('/courses/:id/feedback', SubmitFeedback)
router.post('/courses/:id/correction-requests', SubmitCorrectionRequest)

router.post('/feedback/categorize-preview', CategorizeFeedback)
router.get('/feedback/:id/edit', GetFeedbackForEdit)
router.put('/feedback/:id', EditFeedback)
router.delete('/feedback/:id', DeleteFeedback)
router.post('/feedback/:id/helpful', AddHelpfulVote)
router.delete('/feedback/:id/helpful', RemoveHelpfulVote)
router.post('/feedback/:id/report', ReportFeedback)

// ---------------------------------------------------------
// Nested routers
// ---------------------------------------------------------
router.route('/auth', authRouter)
router.route('/profile', profileRouter)
router.route('/admin', adminRouter)
router.route('/email', emailRouter)

// 404 for everything else
router.all('*', () => {
  throw new NotFoundError('Route not found')
})
