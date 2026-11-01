import * as Sentry from '@sentry/nextjs'

import {
  parseIgnoreErrors,
  parseSampleRate,
  scrubSentryEvent,
  sentryDataCollection,
} from '@/lib/observability/sentry-options'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
const replayEnabled = process.env.NEXT_PUBLIC_SENTRY_REPLAY_ENABLED === 'true'

if (dsn) {
  Sentry.init({
    dsn,
    enabled: true,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',
    dataCollection: sentryDataCollection,
    tracesSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      process.env.NODE_ENV === 'production' ? 0.1 : 1,
    ),
    replaysSessionSampleRate: replayEnabled
      ? parseSampleRate(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0.1)
      : 0,
    replaysOnErrorSampleRate: replayEnabled
      ? parseSampleRate(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 1)
      : 0,
    integrations: replayEnabled
      ? [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })]
      : [],
    ignoreErrors: parseIgnoreErrors(process.env.NEXT_PUBLIC_SENTRY_IGNORE_ERRORS),
    beforeSend: scrubSentryEvent,
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
