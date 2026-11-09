import { formatInTimeZone } from 'date-fns-tz'
import { cookies } from 'next/headers'

import { resolveAdminScope } from '@/lib/admin/context'
import type { SessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'

import type { Prisma } from '@prisma/client'

export const ADMIN_NOTIFICATIONS_READ_COOKIE = 'admin_notifications_read_at'

export interface AdminNotification {
  id: string
  customerName: string
  serviceName: string
  timeLabel: string
  date: string
}

export async function getAdminNotifications(user: SessionUser): Promise<{
  count: number
  items: AdminNotification[]
}> {
  const scope = await resolveAdminScope(user)
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const readCookie = (await cookies()).get(ADMIN_NOTIFICATIONS_READ_COOKIE)?.value
  const readAt = readCookie ? new Date(readCookie) : null
  const unreadSince = readAt && !Number.isNaN(readAt.getTime()) ? readAt : null

  const where: Prisma.AppointmentWhereInput = {
    status: { in: ['PENDING', 'CONFIRMED'] },
    createdAt: unreadSince ? { gt: unreadSince } : { gte: since },
    ...(scope.barberId ? { barberId: scope.barberId } : {}),
  }

  const [count, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        startAt: true,
        customer: { select: { name: true } },
        order: { select: { customerName: true } },
        service: { select: { name: true } },
      },
    }),
  ])

  return {
    count,
    items: appointments.map((appointment) => ({
      id: appointment.id,
      customerName: appointment.customer?.name ?? appointment.order.customerName,
      serviceName: appointment.service.name,
      timeLabel: formatInTimeZone(appointment.startAt, BUSINESS_TIMEZONE, 'HH:mm'),
      date: formatInTimeZone(appointment.startAt, BUSINESS_TIMEZONE, 'yyyy-MM-dd'),
    })),
  }
}
