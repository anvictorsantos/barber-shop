import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

import type { AdminScope } from '@/lib/admin/context'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { getRevenueSummary } from '@/lib/finance/queries'

import type { PaymentMethod } from '@prisma/client'

const SETTLED_STATUSES = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] as const

export interface RevenuePoint {
  date: string
  label: string
  netCents: number
  grossCents: number
}

export interface FinanceReport {
  summary: Awaited<ReturnType<typeof getRevenueSummary>>
  series: RevenuePoint[]
  methodTotals: { method: PaymentMethod; netCents: number }[]
  recentPayments: {
    id: string
    orderCode: string
    customerName: string
    method: PaymentMethod
    amountCents: number
    refundedCents: number
    paidAtLabel: string
    barberName: string | null
  }[]
  completedAppointments: number
  noShowAppointments: number
  ticketCents: number
}

export interface DashboardData {
  today: string
  todayAppointments: number
  todayCompleted: number
  todayNoShow: number
  awaitingPayment: number
  revenueTodayCents: number
  revenueWeekCents: number
  blockedCustomers: number | null
  nextAppointments: {
    id: string
    timeLabel: string
    customerName: string
    serviceName: string
    barberName: string
  }[]
}

function rangeForDays(days: number): { from: Date; to: Date; dates: string[] } {
  const now = new Date()
  const todayKey = formatInTimeZone(now, BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  const fromKey = format(addDays(parseISO(todayKey), -(days - 1)), 'yyyy-MM-dd')
  const from = fromZonedTime(`${fromKey}T00:00:00`, BUSINESS_TIMEZONE)
  const to = new Date(
    fromZonedTime(`${todayKey}T00:00:00`, BUSINESS_TIMEZONE).getTime() + 24 * 60 * 60 * 1000,
  )

  const dates: string[] = []
  for (let index = 0; index < days; index += 1) {
    dates.push(format(addDays(parseISO(fromKey), index), 'yyyy-MM-dd'))
  }

  return { from, to, dates }
}

export async function getRevenueSeries(
  scope: AdminScope,
  days: number,
): Promise<{ series: RevenuePoint[]; from: Date; to: Date }> {
  const { from, to, dates } = rangeForDays(days)

  const payments = await prisma.payment.findMany({
    where: {
      status: { in: [...SETTLED_STATUSES] },
      paidAt: { gte: from, lt: to },
      ...(scope.barberId ? { appointment: { barberId: scope.barberId } } : {}),
    },
    select: { paidAt: true, amountCents: true, refundedCents: true },
  })

  const buckets = new Map<string, { netCents: number; grossCents: number }>()
  for (const date of dates) buckets.set(date, { netCents: 0, grossCents: 0 })

  for (const payment of payments) {
    if (!payment.paidAt) continue
    const key = formatInTimeZone(payment.paidAt, BUSINESS_TIMEZONE, 'yyyy-MM-dd')
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.grossCents += payment.amountCents
    bucket.netCents += payment.amountCents - payment.refundedCents
  }

  return {
    from,
    to,
    series: dates.map((date) => ({
      date,
      label: format(parseISO(date), 'dd/MM'),
      ...(buckets.get(date) ?? { netCents: 0, grossCents: 0 }),
    })),
  }
}

export async function getFinanceReport(scope: AdminScope, days: number): Promise<FinanceReport> {
  const { from, to, series } = await getRevenueSeries(scope, days)

  const [summary, payments, completedAppointments, noShowAppointments] = await Promise.all([
    getRevenueSummary({ from, to, barberId: scope.barberId }),
    prisma.payment.findMany({
      where: {
        status: { in: [...SETTLED_STATUSES] },
        paidAt: { gte: from, lt: to },
        ...(scope.barberId ? { appointment: { barberId: scope.barberId } } : {}),
      },
      orderBy: { paidAt: 'desc' },
      take: 12,
      select: {
        id: true,
        amountCents: true,
        refundedCents: true,
        method: true,
        paidAt: true,
        order: { select: { code: true, customerName: true } },
        appointment: { select: { barber: { select: { displayName: true } } } },
      },
    }),
    prisma.appointment.count({
      where: {
        status: 'COMPLETED',
        startAt: { gte: from, lt: to },
        ...(scope.barberId ? { barberId: scope.barberId } : {}),
      },
    }),
    prisma.appointment.count({
      where: {
        status: 'NO_SHOW',
        startAt: { gte: from, lt: to },
        ...(scope.barberId ? { barberId: scope.barberId } : {}),
      },
    }),
  ])

  const methodTotals = Object.entries(summary.byMethod)
    .map(([method, netCents]) => ({ method: method as PaymentMethod, netCents }))
    .filter((item) => item.netCents !== 0)
    .sort((a, b) => b.netCents - a.netCents)

  return {
    summary,
    series,
    methodTotals,
    recentPayments: payments.map((payment) => ({
      id: payment.id,
      orderCode: payment.order.code,
      customerName: payment.order.customerName,
      method: payment.method,
      amountCents: payment.amountCents,
      refundedCents: payment.refundedCents,
      paidAtLabel: payment.paidAt
        ? formatInTimeZone(payment.paidAt, BUSINESS_TIMEZONE, 'dd/MM HH:mm')
        : '—',
      barberName: payment.appointment?.barber.displayName ?? null,
    })),
    completedAppointments,
    noShowAppointments,
    ticketCents:
      completedAppointments > 0 ? Math.round(summary.netCents / completedAppointments) : 0,
  }
}

export async function getDashboard(scope: AdminScope): Promise<DashboardData> {
  const { from, to } = rangeForDays(1)
  const week = rangeForDays(7)
  const now = new Date()

  const [todayAppointments, awaitingPayment, revenueToday, revenueWeek, nextRaw, blocked] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          startAt: { gte: from, lt: to },
          ...(scope.barberId ? { barberId: scope.barberId } : {}),
        },
        select: { status: true },
      }),
      prisma.order.count({
        where: {
          status: 'OPEN',
          appointments: {
            some: {
              startAt: { gte: from, lt: to },
              ...(scope.barberId ? { barberId: scope.barberId } : {}),
            },
          },
        },
      }),
      getRevenueSummary({ from, to, barberId: scope.barberId }),
      getRevenueSummary({ from: week.from, to: week.to, barberId: scope.barberId }),
      prisma.appointment.findMany({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          startAt: { gte: now, lt: to },
          ...(scope.barberId ? { barberId: scope.barberId } : {}),
        },
        orderBy: { startAt: 'asc' },
        take: 5,
        select: {
          id: true,
          startAt: true,
          service: { select: { name: true } },
          barber: { select: { displayName: true } },
          customer: { select: { name: true } },
          order: { select: { customerName: true } },
        },
      }),
      scope.role === 'OWNER'
        ? prisma.user.count({ where: { role: 'CUSTOMER', bookingBlocked: true } })
        : Promise.resolve(null),
    ])

  return {
    today: formatInTimeZone(now, BUSINESS_TIMEZONE, 'yyyy-MM-dd'),
    todayAppointments: todayAppointments.length,
    todayCompleted: todayAppointments.filter((item) => item.status === 'COMPLETED').length,
    todayNoShow: todayAppointments.filter((item) => item.status === 'NO_SHOW').length,
    awaitingPayment,
    revenueTodayCents: revenueToday.netCents,
    revenueWeekCents: revenueWeek.netCents,
    blockedCustomers: blocked,
    nextAppointments: nextRaw.map((appointment) => ({
      id: appointment.id,
      timeLabel: formatInTimeZone(appointment.startAt, BUSINESS_TIMEZONE, 'HH:mm'),
      customerName: appointment.customer?.name ?? appointment.order.customerName,
      serviceName: appointment.service.name,
      barberName: appointment.barber.displayName,
    })),
  }
}
