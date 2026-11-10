import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NODE_ENV === 'development') {
      // Next dev adds 10+ once('close') listeners per response; they are cleaned up on close, so the warning is noise.
      const { ServerResponse } = await import('node:http')
      ServerResponse.prototype.setMaxListeners(20)
    }

    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
