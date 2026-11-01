export interface WhatsAppSender {
  sendOtp(phone: string, code: string): Promise<void>
}
