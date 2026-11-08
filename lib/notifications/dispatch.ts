import { formatInTimeZone } from 'date-fns-tz'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import {
  buildAppointmentIcs,
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
} from '@/lib/calendar/ics'
import { prisma } from '@/lib/db/prisma'
import { getServerEnv } from '@/lib/env'
import { emailSender } from '@/lib/notifications/email/factory'
import type { EmailAttachment } from '@/lib/notifications/email/sender'
import { renderEmailLayout } from '@/lib/notifications/email/templates'
import { renderAppointmentEmail, renderAppointmentWhatsApp } from '@/lib/notifications/messages'
import type { AppointmentMessageContext } from '@/lib/notifications/messages'
import { whatsappSender } from '@/lib/notifications/whatsapp/factory'

import type { NotificationChannel, NotificationKind } from '@prisma/client'

export interface DispatchResult {
  sent: number
  failed: number
  skipped: boolean
}

interface LogInput {
  channel: NotificationChannel
  kind: NotificationKind
  appointmentId: string | null
  orderId: string | null
  userId: string | null
  dedupeKey: string | null
  send: () => Promise<void>
  result: DispatchResult
}

const DEDUPED_KINDS = new Set<NotificationKind>(['BOOKING_CONFIRMATION', 'REMINDER', 'CANCELED'])
const WHATSAPP_TEMPLATE_KEYS = {
  BOOKING_CONFIRMATION: 'WHATSAPP_TEMPLATE_CONFIRMATION',
  REMINDER: 'WHATSAPP_TEMPLATE_REMINDER',
  CANCELED: 'WHATSAPP_TEMPLATE_CANCELED',
  RESCHEDULED: 'WHATSAPP_TEMPLATE_RESCHEDULED',
} as const
const CALENDAR_LINK_KINDS = new Set<NotificationKind>([
  'BOOKING_CONFIRMATION',
  'REMINDER',
  'RESCHEDULED',
])
const CALENDAR_ATTACHMENT_KINDS = new Set<NotificationKind>(['BOOKING_CONFIRMATION', 'RESCHEDULED'])

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 500)
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

async function logSend(input: LogInput): Promise<void> {
  let logId: string

  try {
    const log = await prisma.notificationLog.create({
      data: {
        channel: input.channel,
        kind: input.kind,
        status: 'QUEUED',
        appointmentId: input.appointmentId,
        orderId: input.orderId,
        userId: input.userId,
        dedupeKey: input.dedupeKey,
      },
      select: { id: true },
    })
    logId = log.id
  } catch (error) {
    if (isUniqueViolation(error)) {
      input.result.skipped = true
      return
    }
    throw error
  }

  try {
    await input.send()
    await prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'SENT', sentAt: new Date() },
    })
    input.result.sent += 1
  } catch (error) {
    const message = errorMessage(error)
    console.warn(`[notifications] ${input.kind} ${input.channel} falhou: ${message}`)
    await prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'FAILED', error: message },
    })
    input.result.failed += 1
  }
}

async function deliver(
  channel: NotificationChannel,
  contact: string,
  kind: NotificationKind,
  context: AppointmentMessageContext,
  attachments: EmailAttachment[],
): Promise<void> {
  if (channel === 'EMAIL') {
    const message = renderAppointmentEmail(kind, context)
    if (!message) throw new Error(`Tipo de notificação sem e-mail: ${kind}`)
    await emailSender().send({
      to: contact,
      ...message,
      ...(attachments.length > 0 ? { attachments } : {}),
    })
    return
  }

  const message = renderAppointmentWhatsApp(kind, context)
  if (!message) throw new Error(`Tipo de notificação sem WhatsApp: ${kind}`)

  const templateKey = WHATSAPP_TEMPLATE_KEYS[kind as keyof typeof WHATSAPP_TEMPLATE_KEYS]
  const templateName = templateKey ? getServerEnv()[templateKey] : ''

  if (templateName) {
    const when = formatInTimeZone(context.startAt, BUSINESS_TIMEZONE, "dd/MM/yyyy 'às' HH:mm")
    await whatsappSender().sendTemplate(contact, templateName, [
      context.customerName,
      context.serviceName,
      when,
      context.shopName,
    ])
    return
  }

  await whatsappSender().sendText(contact, message)
}

export async function notifyAppointment(
  kind: NotificationKind,
  appointmentId: string,
): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, skipped: false }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: { select: { name: true } },
        barber: { select: { displayName: true } },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            notifyEmail: true,
            notifyWhatsapp: true,
          },
        },
        order: {
          select: {
            id: true,
            code: true,
            publicToken: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
          },
        },
      },
    })

    if (!appointment) return { ...result, skipped: true }

    const email = appointment.customer?.email ?? appointment.order.customerEmail
    const phone = appointment.customer?.phone ?? appointment.order.customerPhone
    if (!email && !phone) return { ...result, skipped: true }

    const shop = await prisma.shop.findFirst({
      select: { name: true, addressLine: true, city: true, state: true, email: true },
    })
    if (!shop) return { ...result, skipped: true }

    const baseUrl = getServerEnv().APP_URL.replace(/\/+$/, '')
    const orderUrl = `${baseUrl}/pedido/${appointment.order.code}?t=${encodeURIComponent(appointment.order.publicToken)}`
    const shopAddress = `${shop.addressLine}, ${shop.city}/${shop.state}`

    const calendarInput = {
      uid: `appointment-${appointment.id}@barbearia-do-luiz`,
      title: `${appointment.service.name} — ${shop.name}`,
      description: `${appointment.service.name} com ${appointment.barber.displayName}`,
      location: `${shop.name}, ${shopAddress}`,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      organizerName: shop.name,
      organizerEmail: shop.email,
    }

    const context: AppointmentMessageContext = {
      customerName: appointment.customer?.name ?? appointment.order.customerName,
      serviceName: appointment.service.name,
      barberName: appointment.barber.displayName,
      startAt: appointment.startAt,
      shopName: shop.name,
      shopAddress,
      orderCode: appointment.order.code,
      orderUrl,
      calendarLinks: CALENDAR_LINK_KINDS.has(kind)
        ? [
            { label: 'Google Agenda', url: buildGoogleCalendarUrl(calendarInput) },
            { label: 'Outlook', url: buildOutlookCalendarUrl(calendarInput) },
          ]
        : null,
    }

    const attachments: EmailAttachment[] =
      CALENDAR_ATTACHMENT_KINDS.has(kind) && email
        ? [
            {
              filename: 'agendamento.ics',
              contentBase64: Buffer.from(buildAppointmentIcs(calendarInput), 'utf8').toString(
                'base64',
              ),
            },
          ]
        : []

    const wantsEmail = appointment.customer?.notifyEmail ?? true
    const wantsWhatsapp = appointment.customer?.notifyWhatsapp ?? true

    const channels: { channel: NotificationChannel; contact: string }[] = []
    if (email && wantsEmail) channels.push({ channel: 'EMAIL', contact: email })
    if (phone && wantsWhatsapp) channels.push({ channel: 'WHATSAPP', contact: phone })

    for (const { channel, contact } of channels) {
      await logSend({
        channel,
        kind,
        appointmentId: appointment.id,
        orderId: appointment.order.id,
        userId: appointment.customer?.id ?? null,
        dedupeKey: DEDUPED_KINDS.has(kind) ? `${kind}:${appointment.id}:${channel}` : null,
        result,
        send: () => deliver(channel, contact, kind, context, attachments),
      })
    }
  } catch (error) {
    console.error('[notifications]', errorMessage(error))
    result.failed += 1
  }

  return result
}

export async function notifyNoShowBlock(userId: string): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, skipped: true }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    })
    if (!user || (!user.email && !user.phone)) return result

    const shop = await prisma.shop.findFirst({
      select: { name: true, whatsapp: true, phone: true },
    })
    const shopName = shop?.name ?? 'Barbearia do Luiz'
    const whatsapp = (shop?.whatsapp ?? shop?.phone ?? '').replace(/\D/g, '')
    const contactUrl = whatsapp ? `https://wa.me/${whatsapp}` : null
    const text = `Olá, ${user.name}. Sua conta está bloqueada para novos agendamentos online por faltas sem aviso. Fale com a ${shopName} para regularizar.`
    const subject = `Agendamentos bloqueados — ${shopName}`
    const footer = 'Se você acha que houve um engano, fale com a barbearia.'
    const cta = contactUrl ? 'Falar com a barbearia' : null
    const html = renderEmailLayout(
      {
        preheader: 'Sua conta está bloqueada para novos agendamentos online.',
        kicker: 'Sua conta',
        title: 'Agendamentos bloqueados',
        body: text,
        ...(cta ? { cta } : {}),
        footer,
      },
      contactUrl,
    )
    const emailText = [text, ...(cta && contactUrl ? ['', cta, contactUrl] : []), '', footer].join(
      '\n',
    )

    result.skipped = false

    const channels: { channel: NotificationChannel; contact: string }[] = []
    if (user.email) channels.push({ channel: 'EMAIL', contact: user.email })
    if (user.phone) channels.push({ channel: 'WHATSAPP', contact: user.phone })

    for (const { channel, contact } of channels) {
      await logSend({
        channel,
        kind: 'NO_SHOW_BLOCK',
        appointmentId: null,
        orderId: null,
        userId: user.id,
        dedupeKey: null,
        result,
        send: async () => {
          if (channel === 'EMAIL') {
            await emailSender().send({ to: contact, subject, text: emailText, html })
          } else {
            const templateName = getServerEnv().WHATSAPP_TEMPLATE_NO_SHOW_BLOCK
            if (templateName) {
              await whatsappSender().sendTemplate(contact, templateName, [user.name, shopName])
            } else {
              await whatsappSender().sendText(contact, text)
            }
          }
        },
      })
    }
  } catch (error) {
    console.error('[notifications]', errorMessage(error))
    result.failed += 1
  }

  return result
}
