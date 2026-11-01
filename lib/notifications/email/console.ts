import type { EmailMessage, EmailSender } from '@/lib/notifications/email/sender'

// Dev adapter: prints the body so a local flow works without a provider account.
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.info(`[email] subject="${message.subject}"`)
    console.info(message.text)
  }
}
