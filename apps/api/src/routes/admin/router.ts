import { requireAdmin, requireSuperuser } from '@middleware/auth'
import { fromIttyRouter } from 'chanfana'
import { AutoRouter } from 'itty-router'
import {
  AddFacultyEmailSuffix,
  GetFacultyEmailSuffixes,
  RemoveFacultyEmailSuffix,
  UpdateFaculty
} from './faculties'
import { GetUsers } from './users'

const router = fromIttyRouter(
  AutoRouter({ before: [requireAdmin], base: '/admin' })
)

router.put('/faculties/:id', UpdateFaculty)
router.get('/faculties/:id/email-suffixes', GetFacultyEmailSuffixes)
router.post('/faculties/:id/email-suffixes', AddFacultyEmailSuffix)
router.delete('/faculties/:id/email-suffixes/:suffix', RemoveFacultyEmailSuffix)

router.get('/users', requireSuperuser, GetUsers)

export { router }
