import { formatInTimeZone } from 'date-fns-tz'
import { sendNotification, setVapidDetails } from 'web-push'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { getServerEnv } from '@/lib/env'
import type { StaffPushKind } from '@/lib/push/windows'

export interface PushResult {
  sent: number
  failed: number
  skipped: boolean
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

function buildMessage(
  kind: StaffPushKind,
  input: { customer: string; service: string; startAt: Date },
) {
  const time = formatInTimeZone(input.startAt, BUSINESS_TIMEZONE, 'HH:mm')
  const when = formatInTimeZone(input.startAt, BUSINESS_TIMEZONE, 'yyyy-MM-dd')

  if (kind === 'NEW_BOOKING') {
    return {
      title: 'Novo agendamento',
      body: `${input.customer} marcou ${input.service} às ${time}`,
      url: `/admin/agenda?date=${when}`,
      tag: `new-${input.startAt.getTime()}`,
    }
  }

  if (kind === 'APPOINTMENT_SOON') {
    return {
      title: 'Cliente chegando',
      body: `${input.customer} · ${input.service} às ${time}`,
      url: `/admin/agenda?date=${when}`,
      tag: `soon-${input.startAt.getTime()}`,
    }
  }

  return {
    title: 'Cliente atrasado',
    body: `${input.customer} ainda não chegou · ${input.service} às ${time}`,
    url: `/admin/agenda?date=${when}`,
    tag: `late-${input.startAt.getTime()}`,
  }
}

/**
 * Notifies the appointment's barber and every owner. `dedupeKey` makes
 * repeated calls (cron ticks, retries) send at most once per kind.
 */
export async function sendStaffPush(
  kind: StaffPushKind,
  appointmentId: string,
): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, skipped: false }
  const env = getServerEnv()
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return { ...result, skipped: true }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      startAt: true,
      service: { select: { name: true } },
      customer: { select: { name: true } },
      order: { select: { customerName: true } },
      barber: { select: { userId: true } },
    },
  })
  if (!appointment) return { ...result, skipped: true }

  let logId: string
  try {
    const log = await prisma.notificationLog.create({
      data: {
        channel: 'PUSH',
        kind,
        status: 'QUEUED',
        appointmentId,
        dedupeKey: `push:${kind}:${appointmentId}`,
      },
      select: { id: true },
    })
    logId = log.id
  } catch (error) {
    if (isUniqueViolation(error)) return { ...result, skipped: true }
    throw error
  }

  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    select: { id: true },
  })
  const userIds = [...new Set([appointment.barber.userId, ...owners.map((owner) => owner.id)])]
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  })

  if (subscriptions.length === 0) {
    await prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'SKIPPED' },
    })
    return { ...result, skipped: true }
  }

  setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)

  const payload = JSON.stringify(
    buildMessage(kind, {
      customer: appointment.customer?.name ?? appointment.order.customerName,
      service: appointment.service.name,
      startAt: appointment.startAt,
    }),
  )

  const expiredIds: string[] = []
  const errors: string[] = []

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
        )
        result.sent += 1
      } catch (error) {
        result.failed += 1
        const statusCode = (error as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) expiredIds.push(subscription.id)
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }),
  )

  if (expiredIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expiredIds } } })
  }

  await prisma.notificationLog.update({
    where: { id: logId },
    data: {
      status: result.sent > 0 ? 'SENT' : 'FAILED',
      sentAt: result.sent > 0 ? new Date() : null,
      error: errors[0]?.slice(0, 500) ?? null,
    },
  })

  return result
}
