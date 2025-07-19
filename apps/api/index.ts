import { IRequest } from 'itty-router'

import { ExecutionContext } from '@cloudflare/workers-types'
import { router } from '@routes'

// Global env variable storage
let globalEnv: Env | null = null

// Getter function to access env
export function getEnv(): Env {
  if (!globalEnv) {
    throw new Error('Env not initialized')
  }
  return globalEnv
}

export default {
  fetch: async (request: IRequest, env: Env, ctx: ExecutionContext) => {
    // Set the global env when the worker starts
    globalEnv = env

    return await router.fetch(request, env, ctx)
  }
}
