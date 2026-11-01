import type { WhatsAppSender } from '@/lib/notifications/whatsapp/sender'

// Dev adapter: prints the OTP so a local signup works without Meta credentials.
export class ConsoleWhatsAppSender implements WhatsAppSender {
  async sendOtp(_phone: string, code: string): Promise<void> {
    console.info(`[whatsapp] OTP code: ${code}`)
  }
}
