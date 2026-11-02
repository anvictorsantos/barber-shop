import type { EmailMessage, EmailSender } from '@/lib/notifications/email/sender'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly replyTo?: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(this.replyTo ? { reply_to: this.replyTo } : {}),
        ...(message.attachments?.length
          ? {
              attachments: message.attachments.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.contentBase64,
              })),
            }
          : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200)
      throw new Error(`Resend rejected the email (${response.status}): ${detail}`)
    }
  }
}
