import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { renderEmailLayout } from '@/lib/notifications/email/templates'
import type { EmailDetail, EmailLink, RenderedEmail } from '@/lib/notifications/email/templates'

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
  calendarLinks?: EmailLink[] | null
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function whenLong(startAt: Date): string {
  return capitalize(
    formatInTimeZone(startAt, BUSINESS_TIMEZONE, "EEEE, d 'de' MMMM 'às' HH:mm", {
      locale: ptBR,
    }),
  )
}

function whenShort(startAt: Date): string {
  return formatInTimeZone(startAt, BUSINESS_TIMEZONE, "dd/MM 'às' HH:mm")
}

function withPeriod(value: string): string {
  const trimmed = value.trim()
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

interface EventCopy {
  subject: string
  title: string
  intro: string
  preheader: string
  footer: string
}

function eventCopy(kind: NotificationKind, context: AppointmentMessageContext): EventCopy | null {
  const short = whenShort(context.startAt)

  switch (kind) {
    case 'BOOKING_CONFIRMATION':
      return {
        subject: `Agendamento confirmado — ${short}`,
        title: 'Agendamento confirmado',
        intro: `Olá, ${context.customerName}. Seu horário está confirmado.`,
        preheader: `${context.serviceName} com ${context.barberName} · ${short}`,
        footer: 'Chegue com 5 minutos de antecedência. Precisa remarcar? Fale com a barbearia.',
      }
    case 'REMINDER':
      return {
        subject: `Lembrete — ${short}`,
        title: 'Lembrete do seu horário',
        intro: `Olá, ${context.customerName}. Seu horário está chegando.`,
        preheader: `${context.serviceName} com ${context.barberName} · ${short}`,
        footer: 'Se não puder comparecer, avise com antecedência.',
      }
    case 'CANCELED':
      return {
        subject: 'Agendamento cancelado',
        title: 'Agendamento cancelado',
        intro: `Olá, ${context.customerName}. Seu horário foi cancelado.${
          context.reason ? ` Motivo: ${withPeriod(context.reason)}` : ''
        }`,
        preheader: `${context.serviceName} de ${short} foi cancelado.`,
        footer: 'Você pode agendar um novo horário quando quiser.',
      }
    case 'RESCHEDULED':
      return {
        subject: `Novo horário — ${short}`,
        title: 'Novo horário confirmado',
        intro: `Olá, ${context.customerName}. Seu horário mudou. O novo horário está abaixo.`,
        preheader: `Novo horário de ${context.serviceName} com ${context.barberName}.`,
        footer: 'Se o novo horário não servir, fale com a barbearia.',
      }
    default:
      return null
  }
}

function appointmentDetails(context: AppointmentMessageContext): EmailDetail[] {
  return [
    { label: 'Serviço', value: context.serviceName },
    { label: 'Profissional', value: context.barberName },
    { label: 'Data', value: whenLong(context.startAt) },
    { label: 'Local', value: `${context.shopName} · ${context.shopAddress}` },
    {
      label: 'Pedido',
      value: context.orderCode.startsWith('#') ? context.orderCode : `#${context.orderCode}`,
    },
  ]
}

function renderAppointmentEmailText(
  context: AppointmentMessageContext,
  copy: EventCopy,
  details: EmailDetail[],
  links: EmailLink[],
): string {
  return [
    context.shopName,
    '',
    copy.title,
    '',
    copy.intro,
    '',
    ...details.map((detail) => `${detail.label}: ${detail.value}`),
    '',
    'Ver detalhes',
    context.orderUrl,
    ...(links.length
      ? ['', 'Adicionar à sua agenda:', ...links.map((link) => `${link.label}: ${link.url}`)]
      : []),
    '',
    copy.footer,
  ].join('\n')
}

export function renderAppointmentEmail(
  kind: NotificationKind,
  context: AppointmentMessageContext,
): RenderedEmail | null {
  const copy = eventCopy(kind, context)
  if (!copy) return null

  const details = appointmentDetails(context)
  const links = context.calendarLinks ?? []

  return {
    subject: copy.subject,
    html: renderEmailLayout(
      {
        preheader: copy.preheader,
        kicker: 'Seu horário',
        title: copy.title,
        body: copy.intro,
        details,
        cta: 'Ver detalhes',
        ...(links.length > 0 ? { links } : {}),
        footer: copy.footer,
      },
      context.orderUrl,
    ),
    text: renderAppointmentEmailText(context, copy, details, links),
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
    `${context.serviceName} com ${context.barberName} · ${whenShort(context.startAt)}`,
    `${context.shopName}, ${context.shopAddress}`,
    context.orderUrl,
  ].join('\n')
}
