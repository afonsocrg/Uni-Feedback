import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { Unsubscribe } from './unsubscribe'

const app = new Hono()
const router = fromHono(app, { passthroughErrors: true })

router.post('/unsubscribe', Unsubscribe)

export { router }
