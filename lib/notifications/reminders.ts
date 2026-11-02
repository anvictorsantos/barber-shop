import { prisma } from '@/lib/db/prisma'
import { notifyAppointment } from '@/lib/notifications/dispatch'

const REMINDER_WINDOW_BEFORE_MS = 23 * 60 * 60 * 1000
const REMINDER_WINDOW_AFTER_MS = 25 * 60 * 60 * 1000

export async function sendDueReminders(now = new Date()) {
  const from = new Date(now.getTime() + REMINDER_WINDOW_BEFORE_MS)
  const to = new Date(now.getTime() + REMINDER_WINDOW_AFTER_MS)

  const appointments = await prisma.appointment.findMany({
    where: { status: 'CONFIRMED', startAt: { gte: from, lt: to } },
    select: { id: true },
    orderBy: { startAt: 'asc' },
  })

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const appointment of appointments) {
    const result = await notifyAppointment('REMINDER', appointment.id)
    sent += result.sent
    failed += result.failed
    if (result.skipped) skipped += 1
  }

  return { appointments: appointments.length, sent, failed, skipped }
}
