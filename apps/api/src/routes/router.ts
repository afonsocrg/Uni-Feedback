import { getAllowedOrigins } from '@config'
import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { router as adminRouter } from './admin/router'
import { router as authRouter } from './auth/router'
import {
  GetCourse,
  GetCourseFeedback,
  GetCourses,
  SearchCourses,
  SubmitFeedback
} from './courses'
import { GetDegreeCourseGroups, GetDegreeCourses, GetDegrees } from './degrees'
import { router as emailRouter } from './email/router'
import { GetFaculties, GetFacultyDegrees, GetFacultyDetails } from './faculties'
import {
  AddHelpfulVote,
  CategorizeFeedback,
  DeleteFeedback,
  EditFeedback,
  GetFeedbackForEdit,
  RemoveHelpfulVote,
  ReportFeedback
} from './feedback'
import { CreateFeedbackDraft, GetFeedbackDraft } from './feedbackDrafts'
import { AppError, NotFoundError } from './utils'

const app = new Hono()

// Error handling middleware - handles all errors including from chanfana routes
app.onError((err, c) => {
  console.error('Error caught by Hono middleware:', err)

  if (err instanceof AppError) {
    const body: Record<string, unknown> = { error: err.message }
    if (err.details) {
      Object.assign(body, err.details)
    }
    return c.json(body, err.statusCode)
  }

  // Unknown error - log and return 500
  console.error('Unexpected error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.use(
  '*',
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
)

export const router = fromHono(app, {
  docs_url: '/docs',
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
router.get('/faculties/:id', GetFacultyDetails)
router.get('/faculties/:facultyId/degrees', GetFacultyDegrees)

router.get('/degrees', GetDegrees)
router.get('/degrees/:id/courseGroups', GetDegreeCourseGroups)
router.get('/degrees/:id/courses', GetDegreeCourses)

router.get('/courses', GetCourses)
router.get('/courses/search', SearchCourses)
router.get('/courses/:id', GetCourse)
router.get('/courses/:id/feedback', GetCourseFeedback)
router.post('/courses/:id/feedback', SubmitFeedback)

router.post('/feedback-drafts', CreateFeedbackDraft)
router.get('/feedback-drafts/:code', GetFeedbackDraft)

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
router.route('/admin', adminRouter)
router.route('/email', emailRouter)

// 404 for everything else
router.all('*', () => {
  throw new NotFoundError('Route not found')
})
