import type { WhatsAppSender } from '@/lib/notifications/whatsapp/sender'

// Dev adapter: prints messages so local flows work without Meta credentials.
export class ConsoleWhatsAppSender implements WhatsAppSender {
  async sendOtp(_phone: string, code: string): Promise<void> {
    console.info(`[whatsapp] OTP code: ${code}`)
  }

  async sendText(phone: string, text: string): Promise<void> {
    console.info(`[whatsapp] to=${phone}`)
    console.info(text)
  }
}
