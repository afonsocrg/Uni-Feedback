import { requireSuperuser } from '@middleware/auth'
import { fromIttyRouter } from 'chanfana'
import { cors, Router, withCookies } from 'itty-router'
import {
  CreateAccount,
  ForgotPassword,
  Invite,
  Login,
  Logout,
  Refresh,
  ResetPassword
} from './auth'
import {
  GetCourse,
  GetCourseFeedback,
  GetCourses,
  SubmitFeedback
} from './courses'
import { GetDegreeCourseGroups, GetDegreeCourses, GetDegrees } from './degrees'
import { GetFaculties, GetFacultyDegrees, GetFacultyDetails } from './faculties'
import { CreateFeedbackDraft, GetFeedbackDraft } from './feedbackDrafts'
import { GetUsers } from './users'

const { preflight, corsify } = cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', // Admin dashboard
    'https://meic-feedback.afonsocrg.com',
    'https://ist-feedback.afonsocrg.com',
    'https://istfeedback.com',
    'https://uni-feedback.com',
    'https://admin.uni-feedback.com'
  ],
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
// Public routes
// ---------------------------------------------------------
router.get('/courses', GetCourses)
router.get('/courses/:id', GetCourse)
router.get('/courses/:id/feedback', GetCourseFeedback)
router.post('/courses/:id/feedback', SubmitFeedback)
router.get('/degrees', GetDegrees)
router.get('/degrees/:id/courseGroups', GetDegreeCourseGroups)
router.get('/degrees/:id/courses', GetDegreeCourses)
router.get('/faculties', GetFaculties)
router.get('/faculties/:id', GetFacultyDetails)
router.get('/faculties/:facultyId/degrees', GetFacultyDegrees)
router.post('/feedback-drafts', CreateFeedbackDraft)
router.get('/feedback-drafts/:code', GetFeedbackDraft)

// ---------------------------------------------------------
// Authentication routes
// ---------------------------------------------------------
router.post('/auth/login', Login)
router.post('/auth/logout', Logout)
router.post('/auth/refresh', Refresh)
router.post('/auth/forgot-password', ForgotPassword)
router.post('/auth/reset-password', ResetPassword)
router.post('/auth/create-account', CreateAccount)

// ---------------------------------------------------------
// Authenticated routes
// ---------------------------------------------------------
router.post('/auth/invite', requireSuperuser, Invite)
router.get('/users', requireSuperuser, GetUsers)

// 404 for everything else
router.all('*', () =>
  Response.json(
    {
      success: false,
      error: 'Route not found'
    },
    { status: 404 }
  )
)
