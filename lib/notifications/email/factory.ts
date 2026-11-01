import { getServerEnv } from '@/lib/env'
import { ConsoleEmailSender } from '@/lib/notifications/email/console'
import { ResendEmailSender } from '@/lib/notifications/email/resend'
import type { EmailSender } from '@/lib/notifications/email/sender'

export function emailSender(): EmailSender {
  const env = getServerEnv()

  if (env.EMAIL_ENABLED && env.RESEND_API_KEY && env.EMAIL_FROM) {
    return new ResendEmailSender(
      env.RESEND_API_KEY,
      env.EMAIL_FROM,
      env.EMAIL_REPLY_TO || undefined,
    )
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('RESEND_API_KEY and EMAIL_FROM are required in production')
  }

  return new ConsoleEmailSender()
}
