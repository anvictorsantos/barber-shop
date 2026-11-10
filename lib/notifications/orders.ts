import { notifyAppointment } from '@/lib/notifications/dispatch'
import { getOrderByCode } from '@/lib/orders/queries'
import { sendStaffPush } from '@/lib/push/send'

export async function notifyOrderConfirmation(orderCode: string): Promise<void> {
  const order = await getOrderByCode(orderCode)
  if (!order) return

  for (const appointment of order.appointments) {
    await notifyAppointment('BOOKING_CONFIRMATION', appointment.id)
    await sendStaffPush('NEW_BOOKING', appointment.id)
  }
}
