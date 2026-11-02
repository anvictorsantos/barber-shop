import type { WhatsAppSender } from '@/lib/notifications/whatsapp/sender'

const GRAPH_BASE = 'https://graph.facebook.com'

export class MetaWhatsAppSender implements WhatsAppSender {
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly templateName: string,
    private readonly graphVersion: string,
  ) {}

  private async post(payload: unknown): Promise<void> {
    const response = await fetch(
      `${GRAPH_BASE}/${this.graphVersion}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200)
      throw new Error(`WhatsApp rejected the message (${response.status}): ${detail}`)
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    await this.post({
      messaging_product: 'whatsapp',
      to: phone.replace(/^\+/, ''),
      type: 'template',
      template: {
        name: this.templateName,
        language: { code: 'pt_BR' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: code }] }],
      },
    })
  }

  async sendText(phone: string, text: string): Promise<void> {
    // Free-form text only reaches users inside the 24h service window; booking alerts
    // need an approved template for business-initiated delivery.
    await this.post({
      messaging_product: 'whatsapp',
      to: phone.replace(/^\+/, ''),
      type: 'text',
      text: { body: text },
    })
  }
}
