import { whatsappSender } from '@/lib/notifications/whatsapp/factory'

export async function sendPhoneOtp(phone: string, code: string): Promise<void> {
  await whatsappSender().sendOtp(phone, code)
}
