export interface WhatsAppSender {
  sendOtp(phone: string, code: string): Promise<void>
  sendText(phone: string, text: string): Promise<void>
}
