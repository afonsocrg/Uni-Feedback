import { requireAdmin, requireSuperuser } from '@middleware'
import { fromHono } from 'chanfana'
import type { Context, Next } from 'hono'
import { Hono } from 'hono'
import { GetFacultyDetails } from '../faculties'
import { ProcessAudio, SubmitAudioFeedback } from './audioFeedback'
import { GetChatDetails, GetChats, GetChatStats } from './chats'
import {
  CreateCourseGroup,
  // DeleteCourseGroup, // Commented out - users should not be able to delete course groups
  GetCourseGroups,
  UpdateCourseGroup
} from './courseGroups'
import {
  GetAllTerms,
  GetCourseDetails,
  GetCourses,
  UpdateCourse
} from './courses'
import {
  GetDegreeDetails,
  GetDegrees,
  GetDegreeTypes,
  UpdateDegree
} from './degrees'
import {
  AddFacultyEmailSuffix,
  GetFacultyEmailSuffixes,
  RemoveFacultyEmailSuffix,
  UpdateFaculty
} from './faculties'
import {
  ApproveFeedback,
  ExportFeedback,
  GetFeedback,
  GetFeedbackDetails,
  PopulateFeedbackAnalysis,
  RecalculatePoints,
  UnapproveFeedback,
  UpdateFeedback,
  UpdateFeedbackAnalysis
} from './feedback'
import { GenerateCourseReport, GenerateDegreeReport } from './reports'
import { RefreshStats } from './stats'
import { GetDegreeSuggestions } from './suggestions'
import {
  GetUserChatStats,
  GetUserDetails,
  GetUserReferrals,
  GetUsers,
  SearchUsers,
  UpdateUser
} from './users'

const app = new Hono()

app.use('*', async (c, next) => {
  await requireAdmin(c)
  await next()
})

// Accounts are superuser territory: listing, reading, searching and editing
// users, and the per-user feedback, chat and referral views.
const superuserOnly = async (c: Context, next: Next) => {
  await requireSuperuser(c)
  await next()
}
app.use('/users', superuserOnly)
app.use('/users/*', superuserOnly)

const router = fromHono(app, { passthroughErrors: true })

// Faculty routes
router.get('/faculties/:id', GetFacultyDetails)
router.put('/faculties/:id', UpdateFaculty)
router.get('/faculties/:id/email-suffixes', GetFacultyEmailSuffixes)
router.post('/faculties/:id/email-suffixes', AddFacultyEmailSuffix)
router.delete('/faculties/:id/email-suffixes/:suffix', RemoveFacultyEmailSuffix)

// Degree routes
router.get('/degrees', GetDegrees)
router.get('/degrees/types', GetDegreeTypes)
router.get('/degrees/:id', GetDegreeDetails)
router.put('/degrees/:id', UpdateDegree)

// Course Group routes
router.get('/course-groups', GetCourseGroups)
router.post('/course-groups', CreateCourseGroup)
router.put('/course-groups/:id', UpdateCourseGroup)
// router.delete('/course-groups/:id', DeleteCourseGroup) // Commented out - users should not be able to delete course groups

// Course routes
router.get('/courses', GetCourses)
router.get('/courses/terms', GetAllTerms)
router.get('/courses/:id', GetCourseDetails)
router.put('/courses/:id', UpdateCourse)

// Feedback routes
router.get('/feedback', GetFeedback)
router.post('/feedback/export', ExportFeedback) // Has to be registered before `/feedback/:id` to avoid conflicts
router.get('/feedback/:id', GetFeedbackDetails)
router.put('/feedback/:id', UpdateFeedback)
router.post('/feedback/:id/approved', ApproveFeedback)
router.delete('/feedback/:id/approved', UnapproveFeedback)
router.put('/feedback/:id/analysis', UpdateFeedbackAnalysis)
router.post('/feedback/populate-analysis', PopulateFeedbackAnalysis)
router.post('/feedback/recalculate-points', RecalculatePoints)

// Audio Feedback routes
router.post('/audio-feedback/process', ProcessAudio)
router.post('/audio-feedback/submit', SubmitAudioFeedback)

// Chat routes (read-only: transcripts across all users)
router.get('/chats', GetChats)
router.get('/chats/stats', GetChatStats) // Before `/chats/:id`, or the uuid schema rejects it
router.get('/chats/:id', GetChatDetails)

// Suggestions routes
router.get('/suggestions/degrees', GetDegreeSuggestions)

// Report routes
router.post('/reports/course', GenerateCourseReport)
router.post('/reports/degree', GenerateDegreeReport)

// Stats routes
router.post('/stats/refresh', RefreshStats)

// User routes (all superuser-only, see the middleware above)
router.get('/users', GetUsers)
router.get('/users/search', SearchUsers) // Before `/users/:id` so "search" is not parsed as an id
router.get('/users/:id', GetUserDetails)
router.get('/users/:id/referrals', GetUserReferrals)
router.get('/users/:id/chat-stats', GetUserChatStats)
router.put('/users/:id', UpdateUser)

export { router }
