import * as Sentry from '@sentry/nextjs'

import {
  parseIgnoreErrors,
  parseSampleRate,
  scrubSentryEvent,
  sentryDataCollection,
} from '@/lib/observability/sentry-options'

const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENV || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || process.env.RENDER_GIT_COMMIT || undefined,
    debug: process.env.SENTRY_DEBUG === 'true',
    dataCollection: sentryDataCollection,
    tracesSampleRate: parseSampleRate(
      process.env.SENTRY_TRACES_SAMPLE_RATE,
      process.env.NODE_ENV === 'production' ? 0.1 : 1,
    ),
    ignoreErrors: parseIgnoreErrors(process.env.SENTRY_IGNORE_ERRORS),
    beforeSend: scrubSentryEvent,
  })
}
