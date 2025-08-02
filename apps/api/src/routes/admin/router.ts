import { requireAdmin, requireSuperuser } from '@middleware/auth'
import { fromIttyRouter } from 'chanfana'
import { AutoRouter } from 'itty-router'
import {
  AddCourseTerm,
  GetAllTerms,
  GetCourseDetails,
  GetCourses,
  GetCourseTerms,
  RemoveCourseTerm,
  UpdateCourse
} from './courses'
import {
  CreateCourseGroup,
  // DeleteCourseGroup, // Commented out - users should not be able to delete course groups
  GetCourseGroups,
  UpdateCourseGroup
} from './courseGroups'
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
import { GetFeedback } from './feedback'
import { GetDegreeSuggestions } from './suggestions'
import { GetUsers } from './users'

const router = fromIttyRouter(
  AutoRouter({ before: [requireAdmin], base: '/admin' })
)

// Faculty routes
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
router.get('/courses/:id/terms', GetCourseTerms)
router.post('/courses/:id/terms', AddCourseTerm)
router.delete('/courses/:id/terms/:term', RemoveCourseTerm)

// Feedback routes
router.get('/feedback', GetFeedback)

// Suggestions routes
router.get('/suggestions/degrees', GetDegreeSuggestions)

// User routes
router.get('/users', requireSuperuser, GetUsers)

export { router }
