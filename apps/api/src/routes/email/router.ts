import { fromIttyRouter } from 'chanfana'
import { AutoRouter } from 'itty-router'
import { Unsubscribe } from './unsubscribe'

const router = fromIttyRouter(AutoRouter({ base: '/email' }))

router.post('/unsubscribe', Unsubscribe)

export { router }
