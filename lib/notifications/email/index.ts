import { emailSender } from '@/lib/notifications/email/factory'
import {
  renderPasswordResetEmail,
  renderVerificationEmail,
} from '@/lib/notifications/email/templates'

export async function sendVerificationEmail(to: string, name: string, url: string): Promise<void> {
  await emailSender().send({ to, ...renderVerificationEmail(name, to, url) })
}

export async function sendPasswordResetEmail(to: string, name: string, url: string): Promise<void> {
  await emailSender().send({ to, ...renderPasswordResetEmail(name, to, url) })
}
