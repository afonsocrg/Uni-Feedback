import { getAllowedOrigins } from '@config'
import { fromIttyRouter } from 'chanfana'
import { cors, Router, withCookies } from 'itty-router'
import { router as adminRouter } from './admin/router'
import { router as authRouter } from './auth/router'
import {
  GetCourse,
  GetCourseFeedback,
  GetCourses,
  SubmitFeedback
} from './courses'
import { GetDegreeCourseGroups, GetDegreeCourses, GetDegrees } from './degrees'
import { GetFaculties, GetFacultyDegrees, GetFacultyDetails } from './faculties'
import { CreateFeedbackDraft, GetFeedbackDraft } from './feedbackDrafts'

const { preflight, corsify } = cors({
  origin: getAllowedOrigins(),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

export const router = fromIttyRouter(
  Router({
    before: [preflight, withCookies],
    finally: [corsify]
  }),
  { docs_url: '/docs' }
)

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
router.get('/courses/:id', GetCourse)
router.get('/courses/:id/feedback', GetCourseFeedback)
router.post('/courses/:id/feedback', SubmitFeedback)

router.post('/feedback-drafts', CreateFeedbackDraft)
router.get('/feedback-drafts/:code', GetFeedbackDraft)

// ---------------------------------------------------------
// Nested routers
// ---------------------------------------------------------
router.all('/auth/*', authRouter as any)
router.all('/admin/*', adminRouter as any)

// 404 for everything else
router.all('*', () =>
  Response.json({ error: 'Route not found' }, { status: 404 })
)
