import { formatInTimeZone } from 'date-fns-tz'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { renderEmailLayout } from '@/lib/notifications/email/templates'
import type { RenderedEmail } from '@/lib/notifications/email/templates'

import type { NotificationKind } from '@prisma/client'

export interface AppointmentMessageContext {
  customerName: string
  serviceName: string
  barberName: string
  startAt: Date
  shopName: string
  shopAddress: string
  orderCode: string
  orderUrl: string
  reason?: string | null
  calendarUrl?: string | null
}

function whenLabel(startAt: Date): string {
  return formatInTimeZone(startAt, BUSINESS_TIMEZONE, "dd/MM/yyyy 'às' HH:mm")
}

interface EventCopy {
  subject: string
  title: string
  intro: string
  footer: string
}

function eventCopy(kind: NotificationKind, context: AppointmentMessageContext): EventCopy | null {
  const when = whenLabel(context.startAt)

  switch (kind) {
    case 'BOOKING_CONFIRMATION':
      return {
        title: 'Agendamento confirmado',
        intro: `Olá, ${context.customerName}. Seu horário de ${context.serviceName} com ${context.barberName} está confirmado para ${when}.`,
        footer: 'Chegue com 5 minutos de antecedência. Precisa remarcar? Fale com a barbearia.',
        subject: `Agendamento confirmado — ${when}`,
      }
    case 'REMINDER':
      return {
        title: `Lembrete: ${when}`,
        intro: `Oi, ${context.customerName}. Passando para lembrar do seu ${context.serviceName} com ${context.barberName} em ${when}.`,
        footer: 'Se não puder comparecer, avise com antecedência.',
        subject: `Lembrete do seu horário — ${when}`,
      }
    case 'CANCELED':
      return {
        title: 'Agendamento cancelado',
        intro: `Olá, ${context.customerName}. Seu ${context.serviceName} de ${when} foi cancelado.${context.reason ? ` Motivo: ${context.reason}.` : ''}`,
        footer: 'Você pode agendar um novo horário quando quiser.',
        subject: 'Seu agendamento foi cancelado',
      }
    case 'RESCHEDULED':
      return {
        title: 'Agendamento remarcado',
        intro: `Olá, ${context.customerName}. Seu ${context.serviceName} com ${context.barberName} agora é em ${when}.`,
        footer: 'Se o novo horário não servir, fale com a barbearia.',
        subject: `Novo horário — ${when}`,
      }
    default:
      return null
  }
}

export function renderAppointmentEmail(
  kind: NotificationKind,
  context: AppointmentMessageContext,
): RenderedEmail | null {
  const copy = eventCopy(kind, context)
  if (!copy) return null

  const details = `${context.serviceName} com ${context.barberName} · ${whenLabel(context.startAt)}\n${context.shopName} — ${context.shopAddress}`
  const footer = context.calendarUrl
    ? `${copy.footer} Adicionar ao Google Agenda: ${context.calendarUrl}`
    : copy.footer

  return {
    subject: `${copy.subject} — ${context.shopName}`,
    html: renderEmailLayout(copy.title, copy.intro, 'Ver detalhes', context.orderUrl, footer),
    text: [
      context.shopName,
      '',
      copy.title,
      '',
      copy.intro,
      '',
      details,
      '',
      context.orderUrl,
      '',
      footer,
    ].join('\n'),
  }
}

export function renderAppointmentWhatsApp(
  kind: NotificationKind,
  context: AppointmentMessageContext,
): string | null {
  const copy = eventCopy(kind, context)
  if (!copy) return null

  return [
    `${copy.title} — ${context.shopName}`,
    copy.intro,
    `${context.shopName}, ${context.shopAddress}`,
    context.orderUrl,
  ].join('\n')
}
