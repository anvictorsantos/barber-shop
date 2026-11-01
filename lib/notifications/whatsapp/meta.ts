import type { WhatsAppSender } from '@/lib/notifications/whatsapp/sender'

const GRAPH_BASE = 'https://graph.facebook.com'

export class MetaWhatsAppSender implements WhatsAppSender {
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly templateName: string,
    private readonly graphVersion: string,
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const response = await fetch(
      `${GRAPH_BASE}/${this.graphVersion}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/^\+/, ''),
          type: 'template',
          template: {
            name: this.templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: code }],
              },
            ],
          },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200)
      throw new Error(`WhatsApp rejected the OTP (${response.status}): ${detail}`)
    }
  }
}
