import { prisma } from '@/lib/db/prisma'
import { sendStaffPush } from '@/lib/push/send'
import { LOOKBACK_MS, SOON_WINDOW_MS, pushAlertFor } from '@/lib/push/windows'

export async function runPushAlerts(now = new Date()) {
  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'CONFIRMED',
      startAt: {
        gte: new Date(now.getTime() - LOOKBACK_MS),
        lte: new Date(now.getTime() + SOON_WINDOW_MS),
      },
    },
    select: { id: true, startAt: true },
    orderBy: { startAt: 'asc' },
  })

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const appointment of appointments) {
    const kind = pushAlertFor(appointment.startAt, now)
    if (!kind) continue
    const result = await sendStaffPush(kind, appointment.id)
    sent += result.sent
    failed += result.failed
    if (result.skipped) skipped += 1
  }

  return { appointments: appointments.length, sent, failed, skipped }
}
