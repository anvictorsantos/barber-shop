import { getServerEnv } from '@/lib/env'
import { ConsoleWhatsAppSender } from '@/lib/notifications/whatsapp/console'
import { MetaWhatsAppSender } from '@/lib/notifications/whatsapp/meta'
import type { WhatsAppSender } from '@/lib/notifications/whatsapp/sender'

export function whatsappSender(): WhatsAppSender {
  const env = getServerEnv()

  if (
    env.WHATSAPP_ENABLED &&
    env.WHATSAPP_ACCESS_TOKEN &&
    env.WHATSAPP_PHONE_NUMBER_ID &&
    env.WHATSAPP_TEMPLATE_OTP
  ) {
    return new MetaWhatsAppSender(
      env.WHATSAPP_ACCESS_TOKEN,
      env.WHATSAPP_PHONE_NUMBER_ID,
      env.WHATSAPP_TEMPLATE_OTP,
      env.WHATSAPP_GRAPH_VERSION,
    )
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('WhatsApp credentials and WHATSAPP_TEMPLATE_OTP are required in production')
  }

  return new ConsoleWhatsAppSender()
}
